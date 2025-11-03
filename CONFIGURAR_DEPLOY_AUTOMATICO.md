# 🚀 CONFIGURAR DEPLOY AUTOMÁTICO NO RENDER

**Problema:** O Render não está fazendo deploy automático quando você faz push no GitHub.

**Solução:** Configurar o webhook do Render no GitHub manualmente.

---

## 📋 PASSO A PASSO

### **1. Acesse o Render Dashboard**
https://dashboard.render.com

### **2. Encontre o Serviço Correto**
- Procure por: **`qivo-mining`** (Node.js)
- **NÃO use** o serviço Python (antigo/descontinuado)

### **3. Ative Auto-Deploy**
1. Clique no serviço `qivo-mining`
2. Vá em: **Settings** (Configurações)
3. Procure por: **"Auto-Deploy"**
4. Certifique-se de que está: **✅ Enabled (Yes)**
5. Branch: **`main`**

### **4. Reconecte o GitHub (Se Necessário)**
1. Ainda em Settings
2. Procure por: **"GitHub"** ou **"Source Control"**
3. Clique em: **"Reconnect"** ou **"Authorize"**
4. Autorize o Render a acessar o repositório

### **5. Teste o Deploy Manual**
1. Volte para a página principal do serviço
2. Clique em: **"Manual Deploy"**
3. Selecione: **"Deploy latest commit"** (commit `c3a7754`)
4. Aguarde 5-8 minutos

---

## ✅ VALIDAÇÃO

Após o deploy, teste:
1. Acesse: https://qivo-mining.onrender.com/api/health
2. Confirme: `"status": "healthy"`
3. Teste o upload de PDF

---

## 🔧 TROUBLESHOOTING

### **Se o deploy continuar falhando:**

1. **Verifique o serviço correto:**
   - Nome: `qivo-mining`
   - Runtime: **Node.js** (não Python!)
   - Start Command: `pnpm run start`

2. **Verifique os logs:**
   - Dashboard → Serviço → Logs
   - Procure por erros de build

3. **Verifique as variáveis de ambiente:**
   - Todas as variáveis do `render.yaml` devem estar configuradas

---

## 📝 NOTAS

- O serviço Python antigo deve ser **desativado** ou **deletado**
- Apenas o serviço `qivo-mining` (Node.js) deve estar ativo
- O webhook será configurado automaticamente após reconectar o GitHub

---

**Após configurar, me avise e eu te ajudo a validar!** 🚀

