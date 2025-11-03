# 🚨 CORREÇÃO URGENTE: Site Redirecionando para Vercel

**Data:** 02 de Novembro de 2025  
**Problema:** Todas as URLs estão redirecionando para o Vercel (versão antiga) em vez do Render

---

## 🔍 Diagnóstico

**Sintoma:**
- `qivo-mining.onrender.com` → Redireciona para Vercel
- `compliancecore-mining-1.onrender.com` → Redireciona para Vercel
- Safari e Chrome mostram página em branco ou versão antiga

**Causa Raiz:**
Há um **redirect configurado** no Render ou no DNS que está enviando todo o tráfego para o Vercel.

---

## ✅ SOLUÇÃO IMEDIATA

### **Opção 1: Acessar Diretamente o Backend (Temporário)**

Enquanto corrigimos o redirect, você pode acessar o backend diretamente:

```
https://compliancecore-mining-1.onrender.com/api/health
```

Isso deve retornar JSON se o servidor estiver funcionando.

### **Opção 2: Remover Redirect no Render Dashboard**

1. **Acesse:** https://dashboard.render.com
2. **Entre no serviço:** `ComplianceCore-Mining-1`
3. **Vá em:** Settings → Redirects/Rewrites
4. **Procure por:** Qualquer regra que redirecione para Vercel
5. **Delete** todas as regras de redirect
6. **Salve** as alterações

### **Opção 3: Verificar Custom Domain**

1. No Render Dashboard → `ComplianceCore-Mining-1`
2. Vá em: Settings → Custom Domains
3. **Remova** qualquer domínio customizado que aponte para Vercel
4. Use apenas a URL padrão do Render: `compliancecore-mining-1.onrender.com`

---

## 🔧 Correção no Código (Se o Problema Persistir)

Se o redirect está vindo do código, precisamos verificar:

### **1. Verificar `render.yaml`**

```bash
cd /home/ubuntu/ComplianceCore-Mining
cat render.yaml | grep -i redirect
```

Se houver algo como:
```yaml
redirects:
  - source: /*
    destination: https://vercel.com/...
```

**Delete essa seção inteira.**

### **2. Verificar `vercel.json`**

```bash
cat vercel.json | grep -i redirect
```

Se houver redirects configurados, **comente ou delete**.

### **3. Verificar Código do Express**

Procure por redirects no código:

```bash
grep -r "redirect.*vercel" server/
grep -r "window.location.*vercel" client/
```

Se encontrar algo, me avise para eu corrigir.

---

## 🚀 Após Corrigir

1. **Faça um novo deploy manual** no Render Dashboard
2. **Aguarde 3-5 minutos**
3. **Teste novamente:**
   - Chrome: `https://compliancecore-mining-1.onrender.com`
   - Safari: `https://compliancecore-mining-1.onrender.com`

4. **Limpe o cache do navegador:**
   - Chrome: Cmd+Shift+Delete → Limpar cache
   - Safari: Safari → Limpar Histórico → Tudo

---

## 📞 Se Nada Funcionar

**Me envie:**

1. Screenshot da aba "Settings → Redirects/Rewrites" do Render
2. Screenshot da aba "Settings → Custom Domains" do Render
3. Conteúdo do arquivo `render.yaml` (se existir)
4. Resultado do comando:
   ```bash
   curl -I https://compliancecore-mining-1.onrender.com
   ```

---

## 🎯 URL Correta para Usar

**SEMPRE use:**
```
https://compliancecore-mining-1.onrender.com
```

**NÃO use:**
- ❌ qivo-mining.onrender.com
- ❌ qivo-mining.vercel.app
- ❌ Qualquer URL do Vercel

---

**Preparado por:** Manus AI  
**Prioridade:** CRÍTICA  
**Tempo Estimado de Correção:** 5-10 minutos

