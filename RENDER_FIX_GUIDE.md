# 🚨 GUIA DE CORREÇÃO: Deploy Render - Erro Python/Gunicorn

## ❌ **Problema Atual**

O Render está executando comandos Python/Flask antigos:
```bash
Build: pip install --upgrade pip; pip install -r requirements.txt; flask db upgrade
Start: gunicorn wsgi:app -b 0.0.0.0:10000
```

**Mas o projeto agora é 100% Node.js/TypeScript!**

---

## 🔍 **Causa Raiz**

O serviço `qivo-mining` no dashboard do Render tem **configuração manual antiga** que sobrescreve o `render.yaml`.

---

## ✅ **SOLUÇÃO 1: Configuração Manual no Dashboard (Recomendado)**

### **Passo a Passo:**

1. **Acesse**: https://dashboard.render.com
2. **Login** com sua conta
3. **Selecione**: O serviço `qivo-mining`
4. **Vá para**: `Settings` (menu lateral esquerdo)
5. **Clique**: `Build & Deploy` (seção)

### **Configurações Corretas:**

```yaml
Environment: Node

Build Command:
npm install -g pnpm@10.4.1 && pnpm install --frozen-lockfile && bash build.sh && (pnpm drizzle-kit push || echo "⚠️ Migrations skipped")

Start Command:
pnpm run start

Health Check Path:
/api/health

Auto-Deploy: Yes (branch: main)
```

6. **Role até o final** e clique em **"Save Changes"**
7. **Trigger manual deploy**: Clique em "Manual Deploy" → "Deploy latest commit"

---

## ✅ **SOLUÇÃO 2: Recriar Serviço do Zero (Alternativa)**

Se a Solução 1 não funcionar:

### **A. Deletar Serviço Antigo**
1. Dashboard → `qivo-mining` → Settings
2. Role até **"Danger Zone"**
3. Clique **"Delete Web Service"**
4. Confirme digitando o nome

### **B. Criar Novo Serviço**
1. Dashboard → **"New +"** → **"Web Service"**
2. **Connect repository**: `theneilagencia/ComplianceCore-Mining`
3. **Configure**:
   - **Name**: `qivo-mining`
   - **Region**: Oregon (or closest)
   - **Branch**: `main`
   - **Root Directory**: `.` (leave blank)
   - **Runtime**: **Node**
   - **Build Command**: (copiar da Solução 1)
   - **Start Command**: `pnpm run start`
   - **Plan**: Free
4. **Advanced Settings**:
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: Yes
5. **Environment Variables**: (copiar do serviço antigo antes de deletar)
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<seu-valor>
   SESSION_SECRET=<seu-valor>
   GOOGLE_CLIENT_ID=<seu-valor>
   GOOGLE_CLIENT_SECRET=<seu-valor>
   GOOGLE_REDIRECT_URI=<seu-valor>
   OPENAI_API_KEY=<seu-valor>
   CLOUDINARY_CLOUD_NAME=<seu-valor>
   CLOUDINARY_API_KEY=<seu-valor>
   CLOUDINARY_API_SECRET=<seu-valor>
   STRIPE_SECRET_KEY=<seu-valor>
   STRIPE_PUBLISHABLE_KEY=<seu-valor>
   STRIPE_WEBHOOK_SECRET=<seu-valor>
   ```
6. **Create Web Service**

---

## 🔍 **Verificação Pós-Deploy**

Após o deploy bem-sucedido, verifique:

### **1. Logs do Build** (devem mostrar):
```bash
==> Using Node.js version 25.1.0
==> Running build command 'npm install -g pnpm@10.4.1 && ...'
Installing pnpm...
Installing dependencies...
Running build script...
✓ built in 3.5s
🚀 Building server...
✅ Build completed successfully!
```

### **2. Logs do Start** (devem mostrar):
```bash
==> Running 'pnpm run start'
🚀 Server starting on port 10000...
✅ Database connected
✅ Server ready at http://localhost:10000
```

### **3. Health Check**:
```bash
curl https://qivo-mining.onrender.com/api/health
# Deve retornar: {"status":"ok","timestamp":"..."}
```

### **4. Frontend**:
```bash
curl https://qivo-mining.onrender.com/
# Deve retornar: HTML da aplicação React
```

---

## ⚠️ **Se Ainda Houver Erro**

### **Erro: "pnpm: command not found"**
- **Causa**: Build command não instalou pnpm
- **Solução**: Adicione `npm install -g pnpm@10.4.1 &&` no início do build command

### **Erro: "Cannot find module 'express'"**
- **Causa**: Dependências não instaladas
- **Solução**: Verifique se `pnpm install --frozen-lockfile` está no build command

### **Erro: "ENOENT: no such file or directory 'dist/index.js'"**
- **Causa**: Build não executou corretamente
- **Solução**: Verifique se `bash build.sh` está no build command

### **Erro: "Port 10000 is already in use"**
- **Causa**: Variável PORT não configurada
- **Solução**: Adicione `PORT=10000` nas environment variables

---

## 📝 **Checklist Final**

Antes de fazer deploy:
- [ ] Render dashboard: Build Command correto (Node.js, não Python)
- [ ] Render dashboard: Start Command = `pnpm run start`
- [ ] Render dashboard: Environment = Node
- [ ] Render dashboard: Health Check Path = `/api/health`
- [ ] Todas as environment variables configuradas
- [ ] Auto-Deploy habilitado para branch `main`
- [ ] Último commit pushed: `0102b50`

---

## 🎯 **Por Que Isso Aconteceu?**

1. **Migração Flask → Node.js**: O projeto originalmente era Flask (Python)
2. **Configuração legada**: O Render manteve settings antigos do dashboard
3. **render.yaml ignorado**: Dashboard settings têm prioridade sobre render.yaml
4. **Arquivos Python residuais**: `.py` files fazem Render detectar Python runtime

**Solução definitiva**: Configuração manual no dashboard ou recriação do serviço.

---

## 📞 **Suporte**

Se nada funcionar, entre em contato com suporte do Render:
- https://render.com/docs/support
- Mencione que o projeto **migrou de Python/Flask para Node.js/TypeScript**
- Peça para **limpar cache** e **forçar detecção de runtime**
