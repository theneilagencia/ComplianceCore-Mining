# 🚨 RENDER DEPLOY FIX - Bad Gateway 502

## ❌ PROBLEMA IDENTIFICADO

**Erro:** Bad Gateway (502)  
**Request ID:** 9980b824692cdd8e-PDX  
**Causa Raiz:** `render.yaml` configurado incorretamente para Python/Flask em vez de Node.js/Express

---

## 🔍 DIAGNÓSTICO

### **1. Configuração Incorreta no render.yaml**

**ANTES (❌ ERRADO):**
```yaml
services:
  - type: web
    name: qivo-backend
    env: python                # ERRADO: Projeto é Node.js!
    plan: free
    buildCommand: |
      pip install --upgrade pip
      pip install -r requirements.txt
      flask db upgrade || true
    startCommand: gunicorn wsgi:app -b 0.0.0.0:10000
```

**Problema:**
- Render tentava rodar o projeto como Python/Flask
- `wsgi.py` existe mas é apenas para o módulo de IA
- Backend principal é Node.js/Express (server/_core/index.ts)
- Build não executava `pnpm install` nem `bash build.sh`
- Start command tentava executar Gunicorn em vez de Node

### **2. Arquitetura do Projeto**

```
ComplianceCore-Mining/
├── server/_core/index.ts    ← Backend PRINCIPAL (Node.js/Express)
├── client/                  ← Frontend (React/Vite)
├── wsgi.py                  ← Backend SECUNDÁRIO (Python/Flask - apenas IA)
├── package.json             ← Dependências Node.js
├── requirements.txt         ← Dependências Python (apenas para IA)
└── build.sh                 ← Script de build
```

### **3. Fluxo de Build Correto**

```bash
# 1. Instalar pnpm
npm install -g pnpm@10.4.1

# 2. Instalar dependências
pnpm install --frozen-lockfile

# 3. Build (client + server)
bash build.sh
  ├── pnpm vite build         → dist/public/
  └── pnpm esbuild            → dist/index.js

# 4. Start
pnpm run start                → node dist/index.js
```

---

## ✅ CORREÇÕES APLICADAS

### **1. Arquivo render.yaml Corrigido**

**DEPOIS (✅ CORRETO):**
```yaml
# ===============================
# 🚀 ComplianceCore Mining™ - Render Deploy
# ===============================
# Node.js/Express + React/Vite Full Stack Application

services:
  - type: web
    name: compliancecore-mining
    runtime: node
    env: node                    # ✅ CORRETO: Node.js
    plan: free
    region: oregon
    branch: main
    rootDir: .

    buildCommand: |
      echo "Installing pnpm..."
      npm install -g pnpm@10.4.1
      echo "Installing dependencies..."
      pnpm install --frozen-lockfile
      echo "Running build script..."
      bash build.sh

    startCommand: pnpm run start  # ✅ node dist/index.js

    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: SESSION_SECRET
        sync: false
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: GOOGLE_REDIRECT_URI
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_PUBLISHABLE_KEY
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
      - key: REDIS_URL
        sync: false
```

### **2. Dockerfile Atualizado**

```dockerfile
FROM node:22-alpine

# Install bash and pnpm
RUN apk add --no-cache bash
RUN npm install -g pnpm@10.4.1

# Set working directory
WORKDIR /app

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN bash build.sh              # ✅ Usa build.sh

# Expose port (Render uses PORT env var)
EXPOSE 10000                   # ✅ Porta do Render

# Start application
CMD ["pnpm", "run", "start"]   # ✅ node dist/index.js
```

---

## 📋 CHECKLIST DE DEPLOY NO RENDER

### **1. Configuração do Serviço**

No Render Dashboard (https://dashboard.render.com/):

1. **Criar/Atualizar Web Service:**
   - Name: `compliancecore-mining`
   - Runtime: **Node**
   - Build Command: `npm install -g pnpm@10.4.1 && pnpm install --frozen-lockfile && bash build.sh`
   - Start Command: `pnpm run start`
   - Branch: `main`

2. **Environment Variables (CRÍTICO):**

   ```bash
   # Obrigatórias
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://user:pass@host:5432/db
   SESSION_SECRET=your-session-secret-min-32-chars
   
   # Autenticação
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=https://compliancecore-mining.onrender.com/api/auth/google/callback
   
   # OpenAI
   OPENAI_API_KEY=sk-proj-your-key
   
   # Cloudinary (Storage)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Stripe (Pagamentos)
   STRIPE_SECRET_KEY=sk_live_your-key
   STRIPE_PUBLISHABLE_KEY=pk_live_your-key
   STRIPE_WEBHOOK_SECRET=whsec_your-secret
   
   # Redis (Cache - opcional)
   REDIS_URL=redis://user:pass@host:6379
   ```

3. **Health Check Path:**
   - Path: `/api/system/health`
   - Expected Status: 200

### **2. Configuração do Banco de Dados**

1. **Criar PostgreSQL Database no Render:**
   - Name: `compliancecore-mining-db`
   - Plan: Free (256MB)
   - Region: Oregon (mesmo do web service)

2. **Copiar DATABASE_URL:**
   - Format: `postgresql://user:pass@dpg-xxxxx.oregon-postgres.render.com/dbname`
   - Adicionar nas Environment Variables do web service

3. **Migrations:**
   - Executam automaticamente durante o build (via `bash build.sh`)
   - Se falhar, rodar manualmente: `bash migrate.sh`

### **3. Persistent Disk (Upload de Arquivos)**

1. **Criar Disk:**
   - Name: `compliancecore-mining-disk`
   - Size: 1GB (free tier)
   - Mount Path: `/var/data/uploads`

2. **Adicionar ao Web Service:**
   - Web Service → Settings → Disks
   - Attach disk criado
   - Mount path: `/var/data/uploads`

3. **Environment Variables:**
   ```bash
   USE_RENDER_DISK=true
   RENDER_DISK_PATH=/var/data/uploads
   ```

---

## 🔧 COMANDOS PARA DEPLOY

### **Commit e Push das Correções**

```bash
# 1. Verificar status
git status

# 2. Adicionar arquivos corrigidos
git add render.yaml Dockerfile

# 3. Commit
git commit -m "fix: correct render.yaml for Node.js deployment"

# 4. Push para main (trigger deploy automático)
git push origin main
```

### **Monitorar Deploy no Render**

```bash
# Acessar logs em tempo real:
# https://dashboard.render.com/web/srv-*/logs

# Ou via CLI:
render logs -f
```

---

## 🧪 TESTES PÓS-DEPLOY

### **1. Health Check**

```bash
# Backend health
curl https://compliancecore-mining.onrender.com/api/system/health

# Esperado:
{
  "status": "healthy",
  "uptime": 123,
  "timestamp": "2025-11-02T..."
}
```

### **2. Frontend**

```bash
# Página inicial
curl https://compliancecore-mining.onrender.com/

# Deve retornar HTML do React app
```

### **3. Autenticação**

```bash
# Google OAuth callback
# https://compliancecore-mining.onrender.com/api/auth/google/callback
```

### **4. Upload de Arquivos**

```bash
# Criar relatório com upload
# POST https://compliancecore-mining.onrender.com/api/trpc/technicalReports.uploads.uploadFile
```

---

## 🚨 TROUBLESHOOTING

### **Erro: "Application failed to respond"**

**Causa:** Servidor não está ouvindo na porta correta

**Solução:**
```typescript
// server/_core/index.ts
const port = parseInt(process.env.PORT || "10000"); // ✅ Usa PORT do Render
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### **Erro: "Build failed"**

**Causa:** Dependências não instaladas ou build.sh falhou

**Solução:**
```bash
# Verificar logs de build no Render
# Garantir que pnpm está instalado:
npm install -g pnpm@10.4.1

# Testar build localmente:
bash build.sh
```

### **Erro: "Database connection failed"**

**Causa:** DATABASE_URL incorreta ou database não criada

**Solução:**
1. Verificar DATABASE_URL no Render Dashboard
2. Testar conexão: `psql $DATABASE_URL`
3. Rodar migrations: `bash migrate.sh`

### **Erro: "CORS policy blocked"**

**Causa:** CORS não configurado para URL do Render

**Solução:**
```typescript
// server/_core/index.ts
const allowedOrigins = [
  'https://compliancecore-mining.onrender.com', // ✅ Adicionar
  'http://localhost:5173'
];
```

### **Erro: "File upload failed"**

**Causa:** Render Disk não montado ou RENDER_DISK_PATH incorreto

**Solução:**
1. Criar Persistent Disk no Render
2. Mount path: `/var/data/uploads`
3. Environment variable: `RENDER_DISK_PATH=/var/data/uploads`

---

## 📊 MÉTRICAS DE SUCESSO

### **Build Time**
- Target: < 5 minutos
- Atual (local): ~1 minuto

### **Startup Time**
- Target: < 30 segundos
- Health check deve responder em 200ms

### **Memory Usage**
- Free Plan: 512MB RAM
- Esperado: ~300-400MB

### **Response Time**
- API: < 500ms
- Frontend: < 2s (first load)

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Commit e Push** das correções
2. ⏳ **Aguardar Deploy** automático no Render
3. ⏳ **Verificar Logs** de build e startup
4. ⏳ **Testar Health Check** e endpoints
5. ⏳ **Configurar Environment Variables** necessárias
6. ⏳ **Testar Upload** e geração de relatórios
7. ⏳ **Validar Banco de Dados** e migrations

---

## 📝 NOTAS

### **Python Backend (wsgi.py)**
- Usado apenas para processamento de IA
- Não precisa ser deployado separadamente
- Pode ser chamado localmente via subprocess se necessário

### **Render Free Plan Limitations**
- Sleep após 15 minutos de inatividade
- Cold start: ~30 segundos
- 512MB RAM limit
- 750 horas/mês grátis

### **Alternativas de Deploy**
- **Vercel:** Apenas frontend (não suporta backend Node.js completo)
- **Railway:** Similar ao Render, mais caro
- **Fly.io:** Mais complexo, melhor performance
- **Render:** ✅ Escolha atual (melhor custo-benefício)

---

**Versão:** 1.0.0  
**Data:** 02/11/2025  
**Autor:** ComplianceCore Mining Team  
**Status:** ✅ Correções aplicadas, aguardando deploy
