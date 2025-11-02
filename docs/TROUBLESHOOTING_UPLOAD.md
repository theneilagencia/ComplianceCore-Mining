# 🔧 Troubleshooting: Upload System

## Problema: "s3Key expected string, received undefined"

### Causa Raiz
O sistema de upload requer **pelo menos um storage backend** configurado. Se nenhum storage estiver disponível, o `storagePut()` lança erro e o upload falha silenciosamente.

### Diagnóstico

**Erro típico no console do navegador:**
```
Invalid input: expected string, received undefined at path ["s3Key"]
```

**Erro típico no backend:**
```
No storage backend available. Configure RENDER_DISK_PATH, CLOUDINARY, or BUILT_IN_FORGE credentials.
```

### Soluções

#### Opção 1: Render Disk (Desenvolvimento Local) ✅ RECOMENDADO

**Para desenvolvimento local:**

1. Criar diretório de uploads:
```bash
mkdir -p ./uploads
```

2. Adicionar ao `.env.local`:
```env
RENDER_DISK_PATH=/caminho/absoluto/para/uploads
# Exemplo: /Users/seu-usuario/projeto/uploads
```

3. Reiniciar servidor:
```bash
pnpm dev
```

**Para Render.com:**

1. Configurar Render Disk no dashboard:
   - Ir em Settings → Disks
   - Adicionar disk: `/var/data` (ou caminho customizado)
   - Size: 1GB mínimo

2. Adicionar variável de ambiente:
```env
RENDER_DISK_PATH=/var/data/uploads
```

#### Opção 2: Cloudinary (URLs Públicas) 🌐

1. Criar conta em https://cloudinary.com (grátis até 25GB)

2. Obter credenciais no Dashboard → Settings

3. Adicionar ao `.env.local`:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

4. Reiniciar servidor

**Vantagens:**
- URLs públicas permanentes
- CDN global (rápido)
- Transformações de imagem/PDF
- Grátis até 25GB

#### Opção 3: Built-in Forge (AWS S3) ☁️

1. Configurar credenciais AWS:
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

2. Reiniciar servidor

**Vantagens:**
- Controle total do storage
- Escalável
- Integração com AWS

#### Opção 4: Híbrido (RECOMENDADO PRODUÇÃO) 🚀

Combina Render Disk (persistência) + Cloudinary/Forge (URLs públicas):

```env
# Storage local
RENDER_DISK_PATH=/var/data/uploads

# Storage público (escolher um)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Vantagens:**
- Redundância
- URLs públicas
- Backup local
- Melhor performance

### Verificação

1. **Verificar storage disponível:**

Execute no terminal do servidor:
```bash
curl http://localhost:5000/api/storage/status
```

Resposta esperada:
```json
{
  "status": "ok",
  "providers": {
    "renderDisk": {
      "available": true,
      "path": "/var/data/uploads"
    },
    "cloudinary": {
      "available": true,
      "configured": true
    },
    "forge": {
      "available": false
    }
  },
  "strategy": "hybrid-cloudinary"
}
```

2. **Testar upload manual:**

```bash
# Criar arquivo de teste
echo "test content" > test.txt

# Upload via API
curl -X POST http://localhost:5000/api/uploads/test \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.txt",
    "contentType": "text/plain",
    "fileData": "dGVzdCBjb250ZW50"
  }'
```

3. **Verificar logs do servidor:**

Buscar por:
```
📦 Using HYBRID storage (Render Disk + Cloudinary)
[UploadFile] Upload result: {"key":"...","url":"...","provider":"..."}
```

### Checklist de Troubleshooting

- [ ] Pelo menos um storage está configurado (Render Disk, Cloudinary ou Forge)
- [ ] Variáveis de ambiente estão no `.env.local` (dev) ou Render Dashboard (prod)
- [ ] Servidor foi reiniciado após configurar variáveis
- [ ] Diretório `RENDER_DISK_PATH` existe e tem permissões de escrita
- [ ] `/api/storage/status` retorna `status: "ok"`
- [ ] Console do navegador mostra logs `[Upload] File uploaded: {...}`
- [ ] Backend mostra logs `[UploadFile] Upload result: {...}`

### Prevenção

O sistema agora valida a resposta do upload no frontend:

```tsx
// Validar resposta do upload
if (!uploadResult || !uploadResult.s3Url || !uploadResult.s3Key) {
  throw new Error(
    `Upload incompleto: ${JSON.stringify(uploadResult)}. ` +
    'Verifique se o storage está configurado.'
  );
}
```

Isso garante mensagens de erro claras ao usuário.

### Referências

- **Storage Híbrido:** `server/storage-hybrid.ts`
- **Upload Router:** `server/modules/technical-reports/routers/uploads.ts`
- **Frontend:** `client/src/modules/technical-reports/components/UploadModal.tsx`
- **Configuração:** `.env.example` linhas 180-210

---

**Última atualização:** $(date)
**Status:** ✅ Documentado e corrigido
