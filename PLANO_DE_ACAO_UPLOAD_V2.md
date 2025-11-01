# 📋 Plano de Ação Técnico: Refatoração do Sistema de Upload (v1.3)

**Prioridade:** 1 (Alta)  
**Data:** 01 de Novembro de 2025  
**Autor:** Manus AI

---

## 🎯 Objetivo

Substituir o atual sistema de upload de 3 etapas (`initiate` → `uploadFile` → `complete`) por um **endpoint único e atômico**. Isso resolverá o problema de falha na criação de registros no banco de dados, eliminará condições de corrida e simplificará drasticamente o código do frontend e do backend.

##  diagnosing Problema Atual

O fluxo de upload está distribuído em três chamadas de API distintas:

1.  **`initiate`**: Cria as entradas nas tabelas `uploads` e `reports` no banco de dados.
2.  **`uploadFile`**: Envia o arquivo para o storage (Render Disk/Cloudinary).
3.  **`complete`**: Atualiza o registro do `upload` com a URL do arquivo (`s3Url`) e dispara o parsing.

O erro `update "uploads" set "s3Url" = ... where "uploads"."id" = ...` ocorre porque a primeira etapa (`initiate`) falha silenciosamente em criar o registro no banco, fazendo com que a terceira etapa (`complete`) tente atualizar uma linha que não existe.

## 💡 Arquitetura Proposta: Upload Atômico

Criaremos um novo endpoint que executa todas as operações necessárias em uma **única transação**, garantindo que o sistema nunca fique em um estado inconsistente.

**Fluxo do Novo Endpoint (`uploadAndProcessReport`):**

1.  O frontend envia o arquivo (em base64) e seus metadados em uma única requisição.
2.  O backend recebe a requisição.
3.  O arquivo é enviado para o storage (Render Disk/Cloudinary).
4.  Uma **transação de banco de dados** é iniciada:
    a. O registro na tabela `uploads` é criado, já com o status `completed` e a `s3Url` correta.
    b. O registro na tabela `reports` é criado com o status `parsing`.
5.  A transação é concluída (commit).
6.  O processo de parsing do documento é iniciado de forma assíncrona.
7.  O backend retorna uma resposta de sucesso imediata para o frontend com os IDs gerados.

![Diagrama do Novo Fluxo de Upload](https://i.imgur.com/8g7zY3E.png)

---

## 🛠️ Plano de Implementação Passo a Passo

### **Passo 1: Criar o Novo Endpoint no Backend**

Vamos criar um novo arquivo de rota para encapsular a nova lógica, mantendo o código antigo para referência durante a transição.

**1.1. Crie o arquivo `server/modules/technical-reports/routers/uploadsV2.ts`:**

```bash
# Navegue até o diretório do projeto
cd /home/ubuntu/ComplianceCore-Mining

# Crie o novo arquivo de rota
touch server/modules/technical-reports/routers/uploadsV2.ts
```

**1.2. Adicione o seguinte código ao arquivo `uploadsV2.ts`:**

Este código define o novo endpoint `uploadAndProcessReport`.

```typescript
import { z } from "zod";
import { randomUUID } from "crypto";
import { router, protectedProcedure } from "../../../_core/trpc";
import { uploads, reports } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "../../../storage-hybrid";
import { parseAndNormalize, saveNormalizedToS3 } from "../services/parsing";

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

      if (!ctx.user || !ctx.user.id || !ctx.user.tenantId) {
        throw new Error(`Invalid user context`);
      }

      const uploadId = `upl_${randomUUID()}`;
      const reportId = `rpt_${randomUUID()}`;
      const s3Key = `tenants/${ctx.user.tenantId}/uploads/${uploadId}/${input.fileName}`;

      // 1. Fazer upload do arquivo para o storage
      const buffer = Buffer.from(input.fileData, "base64");
      const storageResult = await storagePut(s3Key, buffer, input.fileType);

      // 2. Executar inserções no banco de dados dentro de uma transação
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

      // 3. Iniciar o parsing de forma assíncrona (não bloquear a resposta)
      // O 'await' aqui é para o caso do parsing ser rápido, mas em produção
      // idealmente isso seria uma background job.
      (async () => {
        try {
          const parsingResult = await parseAndNormalize(
            buffer.toString(), // Idealmente, baixar do storage, mas buffer é ok por agora
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

        } catch (error) {
          console.error(`[Parsing Assíncrono Falhou] Report ID: ${reportId}`, error);
          // Atualizar status do report para 'failed'
          await db.update(reports).set({ status: "failed" }).where(eq(reports.id, reportId));
        }
      })();

      // 4. Retornar sucesso imediato para o frontend
      return {
        uploadId,
        reportId,
        s3Url: storageResult.url,
      };
    }),
});
```

**1.3. Integre o novo router no tRPC principal.**

Abra o arquivo que agrega todos os routers (provavelmente `server/routers.ts` ou `server/modules/technical-reports/router.ts`) e adicione o `uploadsV2Router`.

*Exemplo para `server/modules/technical-reports/router.ts`:*

```typescript
// ... outras importações
import { uploadsRouter } from "./routers/uploads";
import { uploadsV2Router } from "./routers/uploadsV2"; // <-- Adicionar import

export const technicalReportsRouter = router({
  uploads: uploadsRouter,
  uploadsV2: uploadsV2Router, // <-- Adicionar nova rota
  // ... outros routers
});
```

---

### **Passo 2: Refatorar o Componente Frontend**

Agora, vamos modificar o modal de upload para usar o novo endpoint unificado.

**2.1. Edite o arquivo `client/src/modules/technical-reports/components/UploadModal.tsx`:**

Substitua as três chamadas `useMutation` por uma única e simplifique a função `handleUpload`.

```diff
--- a/client/src/modules/technical-reports/components/UploadModal.tsx
+++ b/client/src/modules/technical-reports/components/UploadModal.tsx
@@ -28,11 +28,8 @@
   const [reportId, setReportId] = useState<string | null>(null);
 
   const utils = trpc.useUtils();
 
-  const initiateUpload = trpc.technicalReports.uploads.initiate.useMutation();
-  const uploadFile = trpc.technicalReports.uploads.uploadFile.useMutation();
-  const completeUpload = trpc.technicalReports.uploads.complete.useMutation();
+  const uploadAndProcess = trpc.technicalReports.uploadsV2.uploadAndProcessReport.useMutation();
 
   const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
     e.preventDefault();
@@ -56,54 +53,38 @@
 
     try {
       setUploading(true);
-
-      // Iniciar upload
-      const initResult = await initiateUpload.mutateAsync({
-        fileName: file.name,
-        fileSize: file.size,
-        fileType: file.type || "application/pdf",
-      });
-
-      setUploadId(initResult.uploadId);
-      setReportId(initResult.reportId);
-
-      toast.success("Upload iniciado", {
-        description: `Arquivo: ${file.name}`,
-      });
-
-      // Converter arquivo para base64
       const fileData = await new Promise<string>((resolve, reject) => {
         const reader = new FileReader();
         reader.onload = () => {
           const base64 = (reader.result as string).split(",")[1];
           resolve(base64);
         };
         reader.onerror = reject;
         reader.readAsDataURL(file);
       });
 
-      // Upload real para S3
-      const uploadResult = await uploadFile.mutateAsync({
-        uploadId: initResult.uploadId,
-        fileData,
-        fileName: file.name,
-        contentType: file.type || "application/pdf",
-      });
-
-      const s3Url = uploadResult.s3Url;
-
-      // Completar upload e iniciar parsing
-      setParsing(true);
-      setUploading(false);
-
-      toast.info("Analisando arquivo...", {
-        description: "Isso pode levar alguns segundos",
-      });
-
-      const completeResult = await completeUpload.mutateAsync({
-        uploadId: initResult.uploadId,
-        s3Url: s3Url,
-        fileContent: undefined, // Backend vai baixar do S3 real
+      toast.info("Enviando e processando arquivo...", {
+        description: file.name,
+      });
+
+      const result = await uploadAndProcess.mutateAsync({
+        fileName: file.name,
+        fileSize: file.size,
+        fileType: file.type || "application/pdf",
+        fileData,
       });
 
-      setParsing(false);
+      setUploading(false);
+      setReportId(result.reportId);
 
       // Invalidar queries
       utils.technicalReports.generate.list.invalidate();
       utils.technicalReports.uploads.list.invalidate();
 
-      if (completeResult.status === "needs_review") {
-        toast.warning("Revisão necessária", {
-          description: `${completeResult.summary.uncertainFields} campos precisam de validação`,
-          action: {
-            label: "Revisar agora",
-            onClick: () => {
-              onClose();
-              setLocation(`/reports/${completeResult.reportId}/review`);
-            },
-          },
-        });
-      } else {
-        toast.success("Relatório pronto!", {
-          description: "O relatório está pronto para auditoria",
-        });
-      }
+      toast.success("Processamento iniciado!", {
+        description: `O relatório ${file.name} está sendo analisado. Você será notificado quando estiver pronto.`,
+      });
 
       // Fechar modal após 2 segundos
       setTimeout(() => {

```

---

### **Passo 3: Depreciação do Código Antigo**

Após validar que o novo fluxo funciona perfeitamente, podemos remover o código legado.

**Ações:**

1.  **Excluir Endpoints Antigos:** Remova as mutações `initiate`, `uploadFile` e `complete` do arquivo `server/modules/technical-reports/routers/uploads.ts`.
2.  **Limpar Frontend:** Remova completamente as chamadas `useMutation` que não são mais usadas no `UploadModal.tsx`.
3.  **(Opcional) Excluir Rota Antiga:** Se o arquivo `uploads.ts` ficar vazio, remova-o e sua referência no router principal.

---

### **Passo 4: Testes e Validação**

**4.1. Teste Manual via Interface:**

1.  Execute a aplicação (`pnpm dev`).
2.  Acesse a interface de upload.
3.  Selecione um arquivo PDF e clique em "Iniciar Upload".
4.  **Observe:** O processo deve ser mais rápido e a resposta, imediata.

**4.2. Verificação no Banco de Dados:**

Conecte-se ao banco de dados PostgreSQL e verifique se os registros foram criados corretamente.

```sql
-- Conecte-se ao banco de dados do Render via psql

-- Verifique o último registro na tabela 'uploads'
SELECT * FROM uploads ORDER BY "createdAt" DESC LIMIT 1;

-- Verifique o registro correspondente na tabela 'reports'
SELECT * FROM reports ORDER BY "createdAt" DESC LIMIT 1;
```

**O que esperar:**
-   Na tabela `uploads`, o `status` deve ser `completed` e a coluna `s3Url` deve estar preenchida.
-   Na tabela `reports`, o `status` deve ser `parsing` (ou `needs_review`/`ready_for_audit` se o parsing já terminou).

**4.3. Verificação no Storage:**

-   **Render Disk:** Se `USE_RENDER_DISK=true`, acesse o shell do serviço no Render e verifique se o arquivo existe em `/var/data/uploads/tenants/...`.
-   **Cloudinary:** Acesse o painel do Cloudinary e verifique se o arquivo foi salvo na pasta correspondente.

---

##  timelines e Recursos

-   **Tempo Estimado:** 2-4 horas de desenvolvimento e teste.
-   **Recursos Necessários:** Acesso ao código-fonte, permissão para deploy no Render, acesso ao banco de dados.

Este plano de ação, quando executado, resolverá a causa raiz do problema de upload e tornará o sistema mais robusto e manutenível para o futuro.

