# 🔧 CONFIGURAÇÃO EXATA DO RENDER - Blueprint para Manual/Recriação

## ⚠️ SITUAÇÃO ATUAL
O serviço `qivo-mining` existente tem configuração Python/Flask hardcoded no dashboard que **IGNORA** o render.yaml.

## ✅ SOLUÇÃO DEFINITIVA: USE ESTE BLUEPRINT

---

## 📋 BLUEPRINT - CONFIGURAÇÃO MANUAL

Copie e cole EXATAMENTE estas configurações no dashboard do Render:

### **🔹 General Settings**
```
Service Name: qivo-mining
Region: Oregon (or closest to you)
Branch: main
Root Directory: (leave blank or ".")
```

### **🔹 Build & Deploy**

**Environment:**
```
Node
```

**Build Command:** (copie linha completa)
```bash
npm install -g pnpm@10.4.1 && pnpm install --frozen-lockfile && bash build.sh && (pnpm drizzle-kit push || echo "⚠️ Migrations skipped")
```

**Start Command:**
```bash
pnpm run start
```

**Auto-Deploy:**
```
Yes (enabled for branch: main)
```

### **🔹 Health & Alerts**

**Health Check Path:**
```
/api/health
```

**Health Check Grace Period:**
```
60 seconds
```

---

## 🔐 ENVIRONMENT VARIABLES

Configure TODAS estas variáveis (vá em Settings → Environment):

### **Required (Obrigatórias)**
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=<your-postgres-url>
SESSION_SECRET=<your-secret-key>
```

### **Authentication (Google OAuth)**
```bash
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://qivo-mining.onrender.com/auth/google/callback
```

### **AI & Processing (OpenAI)**
```bash
OPENAI_API_KEY=<your-openai-key>
```

### **Storage (Cloudinary)**
```bash
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

### **Payment (Stripe)**
```bash
STRIPE_SECRET_KEY=<your-stripe-secret>
STRIPE_PUBLISHABLE_KEY=<your-stripe-public>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
```

### **Optional (Opcional)**
```bash
REDIS_URL=<your-redis-url>
ENABLE_SIGMINE=false
ENABLE_MAPBIOMAS=false
ENABLE_GFW=false
```

---

## 🚀 INSTRUÇÕES DE DEPLOY

### **Opção 1: Atualizar Serviço Existente**

1. Dashboard → `qivo-mining` → **Settings**
2. **Build & Deploy** → Edite:
   - Build Command: (copie do blueprint acima)
   - Start Command: `pnpm run start`
3. **Environment** → Verifique se `Node` está selecionado
4. **Health & Alerts** → Health Check Path: `/api/health`
5. **Save Changes** (botão no final da página)
6. **Manual Deploy** → Deploy latest commit

### **Opção 2: Recriar Serviço (Recomendado se Opção 1 falhar)**

#### **A. Salvar Environment Variables Atuais**
1. Dashboard → `qivo-mining` → Settings → Environment
2. **Copie TODAS** as variáveis (faça backup!)
3. Salve em arquivo seguro

#### **B. Deletar Serviço Antigo**
1. Dashboard → `qivo-mining` → Settings
2. Role até **Danger Zone**
3. **Delete Web Service**
4. Digite `qivo-mining` para confirmar
5. Confirme exclusão

#### **C. Criar Novo Serviço**
1. Dashboard → **New +** → **Web Service**
2. **Connect a repository** → GitHub
3. Selecione: `theneilagencia/ComplianceCore-Mining`
4. Clique **Connect**

#### **D. Configurar (use este blueprint)**

**Basic Settings:**
- Name: `qivo-mining`
- Region: Oregon
- Branch: `main`
- Root Directory: (deixe vazio)
- **Environment: NODE** ⚠️ IMPORTANTE!

**Build Settings:**
- Build Command: (copie do blueprint acima)
- Start Command: `pnpm run start`

**Plan:**
- Free (ou seu plano atual)

**Advanced:**
- Auto-Deploy: Yes
- Health Check Path: `/api/health`

5. **Add Environment Variables** (cole todas do backup)
6. Clique **Create Web Service**

---

## ✅ VERIFICAÇÃO PÓS-DEPLOY

### **1. Logs do Build (devem mostrar):**
```bash
==> Using Node.js version 25.1.0
==> Running build command 'npm install -g pnpm@10.4.1 && ...'

added 1 packages in 2s
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +1234
+++++++++++++++++++++++++++++++++++++++++++++
✓ 1234 packages installed

🎨 Building client...
✓ built in 3.5s

🚀 Building server...
dist/index.js  586.0kb
⚡ Done in 15ms

🗄️  Running database migrations...
✓ Migrations applied

✅ Build completed successfully!
```

### **2. Logs do Start (devem mostrar):**
```bash
==> Running 'pnpm run start'

> compliancecore-mining@1.2.1 start /opt/render/project/src
> NODE_ENV=production node dist/index.js

🚀 Server starting...
✅ Database connected
✅ CORS configured
✅ All routes registered
✅ Server listening on port 10000
```

### **3. Health Check:**
```bash
curl https://qivo-mining.onrender.com/api/health
# Deve retornar:
{"status":"ok","timestamp":"2025-11-03T15:20:00.000Z","uptime":123}
```

### **4. Frontend:**
```bash
curl https://qivo-mining.onrender.com/
# Deve retornar: HTML da aplicação React
```

---

## ❌ ERROS COMUNS E SOLUÇÕES

### **Erro: "gunicorn: command not found"**
- **Causa**: Start command ainda é Python
- **Solução**: Altere Start Command para `pnpm run start`

### **Erro: "pnpm: command not found"**
- **Causa**: Build command não instalou pnpm
- **Solução**: Verifique se build command começa com `npm install -g pnpm@10.4.1 &&`

### **Erro: "Cannot find module 'express'"**
- **Causa**: Dependências não instaladas
- **Solução**: Adicione `pnpm install --frozen-lockfile &&` no build command

### **Erro: "ENOENT: no such file or directory 'dist/index.js'"**
- **Causa**: Build não executou corretamente
- **Solução**: Adicione `bash build.sh &&` no build command

### **Erro: Build em Python continua aparecendo**
- **Causa**: Environment ainda configurado como Python
- **Solução**: Mude Environment para **Node** nas configurações

---

## 🎯 CHECKLIST FINAL (ANTES DE DEPLOY)

Antes de clicar em "Create Web Service" ou "Save Changes":

- [ ] Environment = **Node** (NÃO Python)
- [ ] Build Command = linha completa do blueprint (com pnpm)
- [ ] Start Command = `pnpm run start`
- [ ] Health Check Path = `/api/health`
- [ ] Todas as environment variables configuradas
- [ ] Auto-Deploy = Yes
- [ ] Branch = main
- [ ] Region selecionada

---

## 📞 SUPORTE

Se após seguir este blueprint o deploy AINDA falhar:

1. **Captura de tela** das configurações (Settings → Build & Deploy)
2. **Logs completos** do deploy (clique em "View Logs")
3. **Contate suporte Render**: https://render.com/docs/support
4. **Mencione**:
   - "Serviço migrou de Python/Flask para Node.js/TypeScript"
   - "Dashboard ignora render.yaml"
   - "Preciso forçar Node.js runtime"

---

## 📝 COMANDOS ÚTEIS

### **Verificar localmente antes de deploy:**
```bash
./verify-deploy.sh
```

### **Build local (deve passar):**
```bash
pnpm install
pnpm build
pnpm start
```

### **Testar health check localmente:**
```bash
curl http://localhost:10000/api/health
```

---

**ÚLTIMA ATUALIZAÇÃO**: 2025-11-03  
**COMMIT**: 9bd3347  
**STATUS**: Blueprint pronto - aguardando configuração manual
