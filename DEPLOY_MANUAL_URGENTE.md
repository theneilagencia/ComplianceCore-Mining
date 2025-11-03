# 🚨 DEPLOY MANUAL URGENTE - QIVO Mining

**Data:** 02 de Novembro de 2025  
**Problema:** Deploy automático não está configurado no Render  
**Solução:** Deploy manual via Dashboard

---

## ✅ **CORREÇÕES APLICADAS (Aguardando Deploy)**

1. ✅ **Transação atômica no upload** (commit `d64653d`)
   - Corrige erro: `update "uploads" where id = ...`
   - Garante consistência no banco de dados

2. ✅ **Rate limit aumentado** (commit `951bb2e`)
   - Corrige erro: `"Muitas tentativas de login"`
   - Limite aumentado de 5 para 100 tentativas

---

## 🚀 **PASSO A PASSO PARA DEPLOY MANUAL**

### **1. Acesse o Render Dashboard**

```
https://dashboard.render.com
```

### **2. Encontre o Serviço Correto**

**Nome do serviço:** `qivo-mining`

**Como identificar:**
- ✅ Runtime: Node
- ✅ Build command: `pnpm install && bash build.sh`
- ✅ Start command: `pnpm run start`
- ❌ **NÃO use** serviços Python/Flask

### **3. Faça o Deploy Manual**

1. Clique no serviço `qivo-mining`
2. No topo da página, clique em: **"Manual Deploy"**
3. Selecione:
   - Branch: **main**
   - Commit: **951bb2e** (ou o mais recente)
4. Clique em: **"Deploy commit"**

### **4. Aguarde o Deploy**

- ⏱️ Tempo estimado: **5-8 minutos**
- 📊 Acompanhe os logs na tela
- ✅ Aguarde aparecer: **"Deploy live"**

---

## 🧪 **VALIDAÇÃO APÓS DEPLOY**

### **1. Limpar Cache do Navegador**

```bash
# Chrome
Cmd + Shift + Delete
Selecione: "Cookies e dados de sites"
Período: "Última hora"
Clique: "Limpar dados"
```

### **2. Testar Login**

1. Acesse: `https://qivo-mining.onrender.com`
2. Clique em: **"Entrar"**
3. Faça login com suas credenciais
4. **Deve funcionar sem erro de rate limit!**

### **3. Testar Upload**

1. Vá em: **"AI Report Generator"** ou **"Gerar Relatório"**
2. Clique em: **"Upload de Arquivo"**
3. Selecione um PDF (ex: JORC_Report_ALG_Feb2021_Final.pdf)
4. Clique em: **"Iniciar Upload"**
5. **Deve funcionar sem erro!**

### **4. Verificar no Banco de Dados**

Se você tiver acesso ao PostgreSQL:

```sql
-- Verificar último upload
SELECT id, "fileName", status, "createdAt" 
FROM uploads 
ORDER BY "createdAt" DESC 
LIMIT 1;

-- Verificar último report
SELECT id, title, status, "createdAt" 
FROM reports 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

**Resultado esperado:**
- ✅ Status do upload: `uploading` ou `completed`
- ✅ Status do report: `parsing` ou `completed`
- ✅ Ambos os registros existem no banco

---

## 📊 **CHECKLIST DE VALIDAÇÃO**

- [ ] Deploy manual executado no Render Dashboard
- [ ] Deploy concluído com sucesso (logs mostram "Deploy live")
- [ ] Cache do navegador limpo
- [ ] Login funciona sem erro de rate limit
- [ ] Upload de PDF funciona sem erro
- [ ] Registros criados no banco de dados
- [ ] Arquivo salvo no storage (Render Disk ou Cloudinary)

---

## 🔧 **SE AINDA NÃO FUNCIONAR**

### **Opção 1: Verificar Logs do Render**

1. No Dashboard do Render, vá em: **Logs**
2. Procure por erros relacionados a:
   - `Database connection`
   - `Transaction failed`
   - `Upload error`
3. Me envie os logs se encontrar erros

### **Opção 2: Verificar Variáveis de Ambiente**

1. No Dashboard do Render, vá em: **Environment**
2. Verifique se estas variáveis estão configuradas:
   - ✅ `DATABASE_URL`
   - ✅ `SESSION_SECRET`
   - ✅ `CLOUDINARY_CLOUD_NAME`
   - ✅ `CLOUDINARY_API_KEY`
   - ✅ `CLOUDINARY_API_SECRET`

### **Opção 3: Forçar Rebuild Completo**

1. No Dashboard do Render, vá em: **Settings**
2. Role até: **Danger Zone**
3. Clique em: **"Clear build cache & deploy"**
4. Confirme a ação

---

## 📞 **SUPORTE**

Se após seguir todos os passos o problema persistir:

1. **Me envie:**
   - Screenshot dos logs do deploy
   - Screenshot do erro no navegador (se houver)
   - Resultado da query SQL (se tiver acesso)

2. **Informações úteis:**
   - URL do serviço: `https://qivo-mining.onrender.com`
   - Último commit: `951bb2e`
   - Correções aplicadas: Transação atômica + Rate limit

---

## 🎯 **RESUMO**

**O que está pronto:**
- ✅ Código corrigido no GitHub
- ✅ Transação atômica implementada
- ✅ Rate limit ajustado

**O que falta:**
- ⏳ Deploy manual no Render Dashboard
- ⏳ Validação do upload funcionando

**Tempo estimado total:** 10-15 minutos

---

**Preparado por:** Manus AI  
**Prioridade:** CRÍTICA  
**Status:** Aguardando deploy manual

