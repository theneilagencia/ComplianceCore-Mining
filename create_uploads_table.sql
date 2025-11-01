-- SQL para criar tabela uploads manualmente no PostgreSQL do Render
-- Execute este SQL diretamente no banco de dados

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

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_uploads_reportId ON uploads("reportId");
CREATE INDEX IF NOT EXISTS idx_uploads_tenantId ON uploads("tenantId");
CREATE INDEX IF NOT EXISTS idx_uploads_userId ON uploads("userId");
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_createdAt ON uploads("createdAt");

-- Verificar se tabela foi criada
SELECT table_name FROM information_schema.tables WHERE table_name = 'uploads';

