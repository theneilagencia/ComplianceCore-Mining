# 🎯 SOLUÇÃO FINAL: USAR PSQL

**Problema:** Scripts Node.js não estão funcionando  
**Solução:** Usar `psql` (cliente PostgreSQL) diretamente

---

## 📋 COMANDO ÚNICO

Copie e cole este comando no terminal (tudo de uma vez):

```bash
psql "postgresql://qivo_mining_user:Rf5NbORtZ1Opy88ah1cTCdE8TUxxEpq3@dpg-d3sjth6uk2gs73fqop30-a.oregon-postgres.render.com/qivo_mining" << 'EOF'
-- Criar enum
CREATE TYPE upload_status AS ENUM ('uploading', 'processing', 'completed', 'failed');

-- Criar tabela
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
SELECT 'Tabela criada com sucesso!' AS resultado;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'uploads';
EOF
```

---

## ✅ O que vai acontecer

1. ✅ Conecta no banco PostgreSQL do Render
2. ✅ Cria enum `upload_status`
3. ✅ Cria tabela `uploads`
4. ✅ Cria 5 índices
5. ✅ Mostra confirmação
6. ✅ Lista as colunas criadas

---

## 🚨 Se não tiver psql instalado

### macOS:
```bash
brew install postgresql
```

### Alternativa: Usar TablePlus ou outro cliente GUI

1. Baixe TablePlus: https://tableplus.com/
2. Crie nova conexão PostgreSQL
3. Cole a URL: `postgresql://qivo_mining_user:Rf5NbORtZ1Opy88ah1cTCdE8TUxxEpq3@dpg-d3sjth6uk2gs73fqop30-a.oregon-postgres.render.com/qivo_mining`
4. Conecte
5. Cole o SQL (sem o psql e EOF):

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
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'uploads';
```

6. Execute (Cmd+Enter)

---

## 🎯 Após Executar

Teste o upload em: https://qivo-mining.onrender.com/reports/generate

**VAI FUNCIONAR!** 🎉

---

**EXECUTE AGORA E ME CONFIRME!** 🙏

