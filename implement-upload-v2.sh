#!/bin/bash

# Script de Implementação: Upload V2
# Automatiza a criação do novo sistema de upload atômico

set -e  # Sair em caso de erro

echo "🚀 Iniciando implementação do Upload V2..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório base do projeto
PROJECT_DIR="/home/ubuntu/ComplianceCore-Mining"
cd "$PROJECT_DIR"

echo -e "${BLUE}📁 Diretório de trabalho: $PROJECT_DIR${NC}"
echo ""

# Passo 1: Criar backup do código atual
echo -e "${YELLOW}📦 Passo 1: Criando backup do código atual...${NC}"
BACKUP_DIR="backups/upload-v2-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp server/modules/technical-reports/routers/uploads.ts "$BACKUP_DIR/"
cp client/src/modules/technical-reports/components/UploadModal.tsx "$BACKUP_DIR/"
echo -e "${GREEN}✅ Backup criado em: $BACKUP_DIR${NC}"
echo ""

# Passo 2: Criar novo arquivo de rota uploadsV2.ts
echo -e "${YELLOW}📝 Passo 2: Criando server/modules/technical-reports/routers/uploadsV2.ts...${NC}"
cat > server/modules/technical-reports/routers/uploadsV2.ts << 'EOF'
import { z } from "zod";
import { randomUUID } from "crypto";
import { router, protectedProcedure } from "../../../_core/trpc";
import { uploads, reports } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "../../../storage-hybrid";
import { parseAndNormalize, saveNormalizedToS3 } from "../services/parsing";

/**
 * Upload V2: Sistema de upload atômico e unificado
 * Substitui o fluxo de 3 etapas por uma única transação
 */
export const uploadsV2Router = router({
  /**
   * Endpoint unificado para upload e processamento de relatórios.
   * Recebe o arquivo em base64, salva no storage, cria os registros no banco
   * em uma única transação e inicia o parsing de forma assíncrona.
   */
  uploadAndProcessReport: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
        fileData: z.string(), // Arquivo em base64
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) throw new Error("Database not available");

      console.log('[Upload V2] Starting unified upload');
      console.log('[Upload V2] User:', ctx.user?.email);
      console.log('[Upload V2] File:', input.fileName, `(${input.fileSize} bytes)`);

      if (!ctx.user || !ctx.user.id || !ctx.user.tenantId) {
        throw new Error(`Invalid user context`);
      }

      const uploadId = `upl_${randomUUID()}`;
      const reportId = `rpt_${randomUUID()}`;
      const s3Key = `tenants/${ctx.user.tenantId}/uploads/${uploadId}/${input.fileName}`;

      console.log('[Upload V2] Generated IDs:', { uploadId, reportId });

      // 1. Fazer upload do arquivo para o storage
      console.log('[Upload V2] Uploading to storage...');
      const buffer = Buffer.from(input.fileData, "base64");
      const storageResult = await storagePut(s3Key, buffer, input.fileType);
      console.log('[Upload V2] Storage URL:', storageResult.url);

      // 2. Executar inserções no banco de dados dentro de uma transação
      console.log('[Upload V2] Creating database records...');
      await db.transaction(async (tx) => {
        // 2a. Criar registro na tabela 'uploads'
        await tx.insert(uploads).values({
          id: uploadId,
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          reportId,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.fileType,
          s3Url: storageResult.url, // URL final do arquivo
          status: "completed", // Já nasce completo
          createdAt: new Date(),
          completedAt: new Date(),
        });

        // 2b. Criar registro na tabela 'reports'
        await tx.insert(reports).values({
          id: reportId,
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          sourceType: "external",
          standard: "JORC_2012", // Placeholder, será detectado no parsing
          title: input.fileName,
          status: "parsing", // Inicia em modo de parsing
          s3OriginalUrl: storageResult.url,
        });
      });

      console.log('[Upload V2] Database records created successfully');

      // 3. Iniciar o parsing de forma assíncrona (não bloquear a resposta)
      (async () => {
        try {
          console.log('[Upload V2] Starting async parsing...');
          const parsingResult = await parseAndNormalize(
            buffer.toString(),
            input.fileType,
            reportId,
            ctx.user.tenantId
          );

          const normalizedUrl = await saveNormalizedToS3(
            parsingResult.normalized,
            ctx.user.tenantId,
            reportId
          );

          // Atualizar o report com o resultado do parsing
          await db.update(reports).set({
              detectedStandard: parsingResult.summary.detectedStandard as any,
              standard: parsingResult.summary.detectedStandard as any,
              status: (parsingResult.status === "needs_review" ? "needs_review" : "ready_for_audit") as any,
              s3NormalizedUrl: normalizedUrl,
              parsingSummary: parsingResult.summary,
            }).where(eq(reports.id, reportId));

          console.log('[Upload V2] Parsing completed successfully');
        } catch (error) {
          console.error(`[Upload V2] Parsing failed for report ${reportId}:`, error);
          // Atualizar status do report para 'failed'
          await db.update(reports).set({ status: "failed" }).where(eq(reports.id, reportId));
        }
      })();

      // 4. Retornar sucesso imediato para o frontend
      console.log('[Upload V2] Returning success response');
      return {
        uploadId,
        reportId,
        s3Url: storageResult.url,
      };
    }),
});
EOF
echo -e "${GREEN}✅ Arquivo uploadsV2.ts criado${NC}"
echo ""

# Passo 3: Adicionar rota ao router principal
echo -e "${YELLOW}🔗 Passo 3: Integrando uploadsV2Router ao router principal...${NC}"
ROUTER_FILE="server/modules/technical-reports/router.ts"

# Verificar se o import já existe
if grep -q "uploadsV2Router" "$ROUTER_FILE"; then
  echo -e "${BLUE}ℹ️  Import já existe em $ROUTER_FILE${NC}"
else
  # Adicionar import após o import de uploadsRouter
  sed -i '/import { uploadsRouter }/a import { uploadsV2Router } from "./routers/uploadsV2";' "$ROUTER_FILE"
  echo -e "${GREEN}✅ Import adicionado${NC}"
fi

# Verificar se a rota já está registrada
if grep -q "uploadsV2:" "$ROUTER_FILE"; then
  echo -e "${BLUE}ℹ️  Rota já registrada em $ROUTER_FILE${NC}"
else
  # Adicionar rota após uploads:
  sed -i '/uploads: uploadsRouter,/a \  uploadsV2: uploadsV2Router,' "$ROUTER_FILE"
  echo -e "${GREEN}✅ Rota registrada${NC}"
fi
echo ""

# Passo 4: Criar novo componente UploadModalV2.tsx
echo -e "${YELLOW}🎨 Passo 4: Criando UploadModalV2.tsx...${NC}"
cat > client/src/modules/technical-reports/components/UploadModalV2.tsx << 'EOF'
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UploadModalV2Props {
  open: boolean;
  onClose: () => void;
}

export default function UploadModalV2({ open, onClose }: UploadModalV2Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const uploadAndProcess = trpc.technicalReports.uploadsV2.uploadAndProcessReport.useMutation();

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    try {
      setUploading(true);

      // Converter arquivo para base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      toast.info("Enviando e processando arquivo...", {
        description: file.name,
      });

      // Chamada única ao backend
      const result = await uploadAndProcess.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/pdf",
        fileData,
      });

      setUploading(false);
      setReportId(result.reportId);

      // Invalidar queries
      utils.technicalReports.generate.list.invalidate();
      utils.technicalReports.uploads.list.invalidate();

      toast.success("Processamento iniciado!", {
        description: `O relatório ${file.name} está sendo analisado. Você será notificado quando estiver pronto.`,
      });

      // Fechar modal após 2 segundos
      setTimeout(() => {
        onClose();
        setFile(null);
        setReportId(null);
      }, 2000);
    } catch (error: any) {
      setUploading(false);
      toast.error("Erro no upload", {
        description: error.message || "Tente novamente",
      });
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setReportId(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload de Relatório Externo (V2)</DialogTitle>
          <DialogDescription>
            Faça upload de relatórios em PDF, DOCX, XLSX, CSV ou ZIP para análise automática
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
            >
              <input
                type="file"
                id="file-upload-v2"
                className="hidden"
                accept=".pdf,.docx,.xlsx,.csv,.zip"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload-v2" className="cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  Arraste um arquivo ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  Formatos aceitos: PDF, DOCX, XLSX, CSV, ZIP
                </p>
                <p className="text-xs text-gray-400 mt-2">Tamanho máximo: 50MB</p>
              </label>
            </div>
          ) : (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {uploading && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#2f2c79] h-2 rounded-full transition-all duration-300 animate-pulse"
                        style={{ width: "75%" }}
                      />
                    </div>
                    <span className="text-sm text-gray-400">Processando...</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Enviando e analisando arquivo...
                  </p>
                </div>
              )}

              {reportId && !uploading && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Upload concluído
                      </p>
                      <p className="text-xs text-green-700">ID: {reportId}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Upload V2 - Melhorias:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Upload atômico em uma única requisição</li>
                  <li>Processamento assíncrono mais rápido</li>
                  <li>Menos pontos de falha</li>
                  <li>Melhor tratamento de erros</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? "Processando..." : "Iniciar Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
EOF
echo -e "${GREEN}✅ UploadModalV2.tsx criado${NC}"
echo ""

# Passo 5: Criar arquivo de instruções de uso
echo -e "${YELLOW}📖 Passo 5: Criando instruções de uso...${NC}"
cat > INSTRUCOES_UPLOAD_V2.md << 'EOF'
# 📖 Instruções de Uso: Upload V2

## ✅ Implementação Concluída

Os seguintes arquivos foram criados/modificados:

1. **Backend:**
   - `server/modules/technical-reports/routers/uploadsV2.ts` (NOVO)
   - `server/modules/technical-reports/router.ts` (MODIFICADO)

2. **Frontend:**
   - `client/src/modules/technical-reports/components/UploadModalV2.tsx` (NOVO)

3. **Backup:**
   - Código original salvo em `backups/upload-v2-YYYYMMDD-HHMMSS/`

## 🧪 Como Testar

### Opção A: Testar o Novo Componente (Recomendado)

1. Substitua o import no arquivo que usa o UploadModal:

```typescript
// Antes:
import UploadModal from "@/modules/technical-reports/components/UploadModal";

// Depois:
import UploadModal from "@/modules/technical-reports/components/UploadModalV2";
```

2. Execute a aplicação:

```bash
cd /home/ubuntu/ComplianceCore-Mining
pnpm dev
```

3. Acesse a interface e teste o upload de um PDF.

### Opção B: Testar via API (curl)

```bash
# 1. Obter token de autenticação (faça login na interface e copie do DevTools)
TOKEN="seu_token_aqui"

# 2. Converter arquivo para base64
FILE_BASE64=$(base64 -w 0 /caminho/para/arquivo.pdf)

# 3. Fazer requisição
curl -X POST https://compliancecore-mining-1.onrender.com/api/trpc/technicalReports.uploadsV2.uploadAndProcessReport \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"fileName\": \"test.pdf\",
    \"fileSize\": 1024,
    \"fileType\": \"application/pdf\",
    \"fileData\": \"$FILE_BASE64\"
  }"
```

## ✅ Validação

Após o upload, verifique:

1. **Banco de Dados:**
```sql
SELECT * FROM uploads ORDER BY "createdAt" DESC LIMIT 1;
SELECT * FROM reports ORDER BY "createdAt" DESC LIMIT 1;
```

2. **Storage:**
   - Render Disk: `/var/data/uploads/tenants/.../`
   - Cloudinary: Painel web

## 🗑️ Remover Código Antigo (Após Validação)

Quando confirmar que o V2 funciona:

```bash
# Remover endpoints antigos do uploads.ts
# (Manter apenas os endpoints de listagem e status, se necessário)

# Remover UploadModal.tsx antigo
rm client/src/modules/technical-reports/components/UploadModal.tsx

# Renomear V2 para versão principal
mv client/src/modules/technical-reports/components/UploadModalV2.tsx \
   client/src/modules/technical-reports/components/UploadModal.tsx
```

## 📞 Suporte

Em caso de problemas, consulte os logs:

```bash
# Logs do Render
gh api /services/srv-xxx/logs

# Logs locais
pnpm dev
```
EOF
echo -e "${GREEN}✅ Instruções criadas em INSTRUCOES_UPLOAD_V2.md${NC}"
echo ""

# Resumo final
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ IMPLEMENTAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📁 Arquivos criados:${NC}"
echo "   - server/modules/technical-reports/routers/uploadsV2.ts"
echo "   - client/src/modules/technical-reports/components/UploadModalV2.tsx"
echo "   - INSTRUCOES_UPLOAD_V2.md"
echo ""
echo -e "${BLUE}📦 Backup salvo em:${NC}"
echo "   - $BACKUP_DIR/"
echo ""
echo -e "${YELLOW}⚠️  PRÓXIMOS PASSOS:${NC}"
echo "   1. Revise o código gerado"
echo "   2. Execute 'pnpm dev' para testar localmente"
echo "   3. Faça commit e push para deploy no Render"
echo "   4. Teste via interface web"
echo "   5. Valide no banco de dados"
echo "   6. Após validação, remova código antigo"
echo ""
echo -e "${BLUE}📖 Leia INSTRUCOES_UPLOAD_V2.md para mais detalhes${NC}"
echo ""

