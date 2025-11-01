#!/bin/bash

# ============================================================================
# Script para executar migration no banco de dados
# ============================================================================

set -e  # Parar em caso de erro

echo "🔧 Preparando para executar migration..."
echo ""

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erro: DATABASE_URL não está configurada"
  echo ""
  echo "Configure a variável de ambiente DATABASE_URL com a connection string do PostgreSQL"
  echo "Exemplo: export DATABASE_URL='postgresql://user:password@host:port/database'"
  exit 1
fi

echo "✅ DATABASE_URL configurada"
echo ""

# Executar migration
echo "🚀 Executando migration..."
echo ""

npx tsx run-migration.ts

echo ""
echo "✅ Migration concluída!"

