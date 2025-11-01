# 🎯 CONFIGURAÇÃO DEFINITIVA - DATABASE_URL

## ⚠️ PROBLEMA

O erro `getaddrinfo ENOTFOUND` acontece porque a DATABASE_URL está **incompleta**.

---

## ✅ SOLUÇÃO DEFINITIVA

### **Opção 1: Via Render Dashboard** (RECOMENDADO - 1 minuto)

1. Acesse: https://dashboard.render.com
2. Clique em **"ComplianceCore-Mining-1"** (Docker, status verde)
3. Clique em **"Environment"** (menu lateral)
4. Encontre a variável **`DATABASE_URL`**
5. **Cole este valor:**

```
postgresql://compliancecore:IcVbQdC6x7fc1bS73qaO6dqajfeKjXzg@dpg-d3s06i0dl3ps73963kug-a.oregon-postgres.render.com:5432/compliancecore
```

6. Clique em **"Save Changes"**
7. Aguarde redeploy (2-3 min)

---

### **Opção 2: Via Render CLI** (se tiver instalado)

```bash
render env set DATABASE_URL="postgresql://compliancecore:IcVbQdC6x7fc1bS73qaO6dqajfeKjXzg@dpg-d3s06i0dl3ps73963kug-a.oregon-postgres.render.com:5432/compliancecore" --service=ComplianceCore-Mining-1
```

---

### **Opção 3: Via Render Shell** (no próprio serviço)

1. Render Dashboard → ComplianceCore-Mining-1 → **Shell**
2. Execute:

```bash
export DATABASE_URL='postgresql://compliancecore:IcVbQdC6x7fc1bS73qaO6dqajfeKjXzg@dpg-d3s06i0dl3ps73963kug-a.oregon-postgres.render.com:5432/compliancecore'
```

⚠️ **ATENÇÃO:** Esta opção é temporária! Use a Opção 1 para configuração permanente.

---

## 🔍 VERIFICAR SE FUNCIONOU

Após configurar, execute:

```bash
curl -X POST https://compliancecore-mining-1.onrender.com/api/fix-s3url
```

**Resultado esperado:**

```json
{
  "success": true,
  "message": "Migration completed successfully"
}
```

**OU**

```json
{
  "success": true,
  "message": "Column s3Url is already TEXT, no migration needed"
}
```

---

## 📋 TODAS AS VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Copie todas estas variáveis para o Render:

```bash
DATABASE_URL=postgresql://compliancecore:IcVbQdC6x7fc1bS73qaO6dqajfeKjXzg@dpg-d3s06i0dl3ps73963kug-a.oregon-postgres.render.com:5432/compliancecore
CLOUDINARY_URL=cloudinary://276945786524848:IBQ_PDAbUFruzOZyvOQZ-bVP_nY@dt8pglfip
USE_RENDER_DISK=true
RENDER_DISK_PATH=/var/data/uploads
```

---

## 🎯 DEPOIS DE CONFIGURAR

1. ✅ Aguarde redeploy terminar (status "Deployed")
2. ✅ Execute migration: `POST /api/fix-s3url`
3. ✅ Teste upload em: https://compliancecore-mining-1.onrender.com/reports/generate
4. 🎉 **SUCESSO!**

---

## 🆘 TROUBLESHOOTING

### **Erro: "getaddrinfo ENOTFOUND"**
- DATABASE_URL está incompleta
- Verifique se tem `.oregon-postgres.render.com` no final

### **Erro: "Connection refused"**
- Banco de dados está offline
- Verifique status do `compliancecore-db`

### **Erro: "Authentication failed"**
- Senha incorreta na DATABASE_URL
- Copie novamente do Render Dashboard

---

**Arquivo de referência criado em:**
`/home/ubuntu/ComplianceCore-Mining/.env.render`

