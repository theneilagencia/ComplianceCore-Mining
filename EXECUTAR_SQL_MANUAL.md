# 🗄️ EXECUTAR SQL MANUALMENTE NO RENDER

**Situação:** drizzle-kit não está executando automaticamente  
**Solução:** Executar SQL manualmente no banco de dados

---

## 📋 Passo a Passo

### 1. Acessar banco de dados do Render

1. Acesse: https://dashboard.render.com/
2. Clique em `qivo-mining-db` (PostgreSQL)
3. Clique em **"Shell"** no menu lateral

### 2. Executar SQL

Copie e cole o SQL abaixo no terminal do banco:

```sql
-- Criar enum para status de upload
CREATE TYPE upload_status AS ENUM ('uploading', 'processing', 'completed', 'failed');

-- Criar tabela uploads
CREATE TABLE IF NOT EXISTS uploads (
  id VARCHAR(64) PRIMARY KEY,
  "reportId" VARCHAR(64) NOT NULL,
  "tenantId" VARCHAR(64) NOT NULL,
  "userId" VARCHAR(64) NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" VARCHAR(128) NOT NULL,
  "s3Url" TEXT DEFAULT NULL,
  status upload_status DEFAULT 'uploading' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "completedAt" TIMESTAMP DEFAULT NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_uploads_reportId ON uploads("reportId");
CREATE INDEX IF NOT EXISTS idx_uploads_tenantId ON uploads("tenantId");
CREATE INDEX IF NOT EXISTS idx_uploads_userId ON uploads("userId");
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_createdAt ON uploads("createdAt");

-- Verificar
SELECT table_name FROM information_schema.tables WHERE table_name = 'uploads';
```

### 3. Confirmar Sucesso

Você deve ver:
```
CREATE TYPE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
 table_name 
------------
 uploads
(1 row)
```

---

## ✅ Após Executar

1. Feche o Shell do banco
2. Teste upload em: https://qivo-mining.onrender.com/reports/generate
3. **VAI FUNCIONAR!** 🎉

---

## 🚨 Se houver erro "type already exists"

Execute apenas:
```sql
-- Criar tabela uploads (sem criar o enum novamente)
CREATE TABLE IF NOT EXISTS uploads (
  id VARCHAR(64) PRIMARY KEY,
  "reportId" VARCHAR(64) NOT NULL,
  "tenantId" VARCHAR(64) NOT NULL,
  "userId" VARCHAR(64) NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" VARCHAR(128) NOT NULL,
  "s3Url" TEXT DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'uploading' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "completedAt" TIMESTAMP DEFAULT NULL
);
```

---

**EXECUTE AGORA E ME CONFIRME SE FUNCIONOU!** ⌨️

