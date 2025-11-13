#!/bin/bash
set -e

# Script para executar backend local usando secrets do GCP Secret Manager
# Uso: ./dev-local.sh [env]
# env: dev, staging, prd (default: prd)

ENV=${1:-prd}
PROJECT_ID="qivo-mining-prod"

echo "🔐 QIVO Mining Backend - Local Development com Secrets do GCP"
echo "=============================================================="
echo "Environment: ${ENV}"
echo "Project: ${PROJECT_ID}"
echo ""

# Verificar se gcloud está instalado e autenticado
if ! command -v gcloud &> /dev/null; then
  echo "❌ ERRO: gcloud CLI não encontrado!"
  echo "   Instale: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# Verificar autenticação
echo "🔍 Verificando autenticação GCP..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
  echo "❌ ERRO: Não autenticado no GCP!"
  echo "   Execute: gcloud auth login"
  exit 1
fi

# Configurar projeto
echo "📦 Configurando projeto: ${PROJECT_ID}"
gcloud config set project ${PROJECT_ID} > /dev/null 2>&1

# Mapeamento de secrets (nome do secret -> variável de ambiente)
declare -A SECRETS=(
  ["compliancecore-db-url"]="DATABASE_URL"
  ["openai-api-key"]="OPENAI_API_KEY"
  ["session-secret"]="SESSION_SECRET"
  ["jwt-secret"]="JWT_SECRET"
  ["sigmine-api-key"]="SIGMINE_API_KEY"
  ["mapbiomas-api-key"]="MAPBIOMAS_API_KEY"
)

# Arquivo temporário para variáveis de ambiente
ENV_FILE=$(mktemp)
trap "rm -f ${ENV_FILE}" EXIT

echo ""
echo "📥 Buscando secrets do GCP Secret Manager..."
echo ""

# Buscar cada secret e adicionar ao arquivo de env
for SECRET_NAME in "${!SECRETS[@]}"; do
  ENV_VAR="${SECRETS[$SECRET_NAME]}"
  
  echo -n "   🔑 ${ENV_VAR}... "
  
  # Buscar secret do GCP
  SECRET_VALUE=$(gcloud secrets versions access latest --secret="${SECRET_NAME}" --project="${PROJECT_ID}" 2>/dev/null)
  
  if [ $? -eq 0 ] && [ -n "$SECRET_VALUE" ]; then
    # Adicionar ao arquivo de env (escapando caracteres especiais)
    echo "export ${ENV_VAR}='${SECRET_VALUE}'" >> "${ENV_FILE}"
    echo "✅"
  else
    echo "❌ (não encontrado ou sem permissão)"
    echo "   ⚠️  Aviso: ${ENV_VAR} não será definido"
  fi
done

# Verificar se pelo menos DATABASE_URL foi carregado
if ! grep -q "export DATABASE_URL=" "${ENV_FILE}"; then
  echo ""
  echo "❌ ERRO: DATABASE_URL não foi carregado!"
  echo "   Verifique se você tem permissão para acessar os secrets:"
  echo "   gcloud secrets list --project=${PROJECT_ID}"
  exit 1
fi

# Adicionar outras variáveis de ambiente necessárias
echo "" >> "${ENV_FILE}"
echo "# Outras variáveis de ambiente" >> "${ENV_FILE}"
echo "export NODE_ENV=development" >> "${ENV_FILE}"
echo "export PORT=${PORT:-3000}" >> "${ENV_FILE}"

# Mostrar resumo
echo ""
echo "✅ Secrets carregados com sucesso!"
echo ""
echo "📋 Variáveis de ambiente carregadas:"
grep "^export" "${ENV_FILE}" | sed 's/export /   - /' | sed "s/='.*'/=***/" 
echo ""

# Perguntar se quer continuar (opcional - pode pular com variável de ambiente)
if [ "${SKIP_PROMPT}" != "true" ]; then
  read -p "🚀 Iniciar servidor local? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado pelo usuário"
    exit 0
  fi
fi

echo ""
echo "🚀 Iniciando servidor local..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""

# Carregar variáveis de ambiente e executar o servidor
source "${ENV_FILE}"
exec pnpm dev

