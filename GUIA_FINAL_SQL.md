# 🎯 GUIA FINAL: EXECUTAR SQL NO BANCO DE DADOS

**Situação:** Não consigo acessar o Shell do Render via navegador  
**Solução:** Você precisa executar o SQL manualmente

---

## 📋 PASSO A PASSO COMPLETO

### 1️⃣ Acessar Banco de Dados

1. Abra seu navegador
2. Acesse: **https://dashboard.render.com/**
3. Faça login se necessário
4. Na lista de serviços, clique em **`qivo-mining-db`** (PostgreSQL 17)
5. No menu lateral esquerdo, clique em **"Shell"**

### 2️⃣ Executar SQL

Copie e cole este SQL no terminal:

```sql
CREATE TYPE upload_status AS ENUM ('uploading', 'processing', 'completed', 'failed');

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

CREATE INDEX IF NOT EXISTS idx_uploads_reportId ON uploads("reportId");
CREATE INDEX IF NOT EXISTS idx_uploads_tenantId ON uploads("tenantId");
CREATE INDEX IF NOT EXISTS idx_uploads_userId ON uploads("userId");
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_createdAt ON uploads("createdAt");

SELECT 'Tabela criada com sucesso!' AS resultado;
```

### 3️⃣ Verificar Sucesso

Você deve ver mensagens como:
```
CREATE TYPE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
     resultado
------------------------
 Tabela criada com sucesso!
(1 row)
```

### 4️⃣ Testar Upload

1. Acesse: **https://qivo-mining.onrender.com/reports/generate**
2. Faça login
3. Faça upload de um arquivo
4. **SUCESSO!** 🎉

---

## 🚨 Se houver erro "type already exists"

Se aparecer erro dizendo que o tipo `upload_status` já existe, execute este SQL alternativo:

```sql
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

CREATE INDEX IF NOT EXISTS idx_uploads_reportId ON uploads("reportId");
CREATE INDEX IF NOT EXISTS idx_uploads_tenantId ON uploads("tenantId");
CREATE INDEX IF NOT EXISTS idx_uploads_userId ON uploads("userId");
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_createdAt ON uploads("createdAt");
```

---

## ✅ Após Executar

1. ✅ Tabela `uploads` criada
2. ✅ Índices criados para performance
3. ✅ Upload vai funcionar!

---

## 📊 Resumo da Jornada

Depois de **8 commits** e **múltiplas correções**, chegamos à solução final:

1. ✅ Render configurado corretamente
2. ✅ UUIDs implementados
3. ✅ Logging detalhado adicionado
4. ✅ drizzle-kit movido para dependencies
5. ⏳ **FALTA APENAS:** Criar tabela manualmente

---

**EXECUTE O SQL AGORA E ME CONFIRME SE FUNCIONOU!** 🙏

Após executar, teste o upload e me diga o resultado!

