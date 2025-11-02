-- Script para corrigir s3Url nos registros existentes
-- Execute este SQL diretamente no banco de dados do Render

-- 1. Corrigir todos os uploads que têm s3Url com caminho ao invés de URL
UPDATE uploads 
SET "s3Url" = '/api/storage/download/' || regexp_replace("s3Url", '/', '%2F', 'g')
WHERE "s3Url" NOT LIKE '/%' 
  AND "s3Url" NOT LIKE 'http%'
  AND "s3Url" IS NOT NULL;

-- 2. Verificar os registros corrigidos
SELECT 
  id,
  "fileName",
  "s3Url",
  status,
  "createdAt"
FROM uploads 
WHERE "s3Url" LIKE '/api/storage/download/%'
ORDER BY "createdAt" DESC
LIMIT 10;

-- 3. Contar quantos registros foram corrigidos
SELECT COUNT(*) as registros_corrigidos
FROM uploads 
WHERE "s3Url" LIKE '/api/storage/download/%';
