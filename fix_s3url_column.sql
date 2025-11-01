-- ============================================================================
-- MIGRATION: Fix s3Url column in uploads table
-- ============================================================================
-- Problema: Coluna s3Url pode ter limite de caracteres (VARCHAR)
-- Solução: Alterar para TEXT (sem limite)
-- ============================================================================

-- Verificar tipo atual da coluna
SELECT 
  column_name, 
  data_type, 
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'uploads' 
  AND column_name = 's3Url';

-- Alterar coluna s3Url para TEXT (sem limite de caracteres)
ALTER TABLE uploads 
ALTER COLUMN "s3Url" TYPE TEXT;

-- Verificar se a alteração foi aplicada
SELECT 
  column_name, 
  data_type, 
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'uploads' 
  AND column_name = 's3Url';

-- ============================================================================
-- SUCESSO! Coluna s3Url agora aceita URLs de qualquer tamanho
-- ============================================================================

