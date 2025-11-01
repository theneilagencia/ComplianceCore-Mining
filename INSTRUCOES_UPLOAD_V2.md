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
