#!/bin/bash
set -e

# Adicionar gcloud ao PATH se não estiver
if ! command -v gcloud &> /dev/null; then
  if [ -f "$HOME/google-cloud-sdk/bin/gcloud" ]; then
    export PATH="$HOME/google-cloud-sdk/bin:$PATH"
  fi
fi

# Verificar se gcloud está disponível
if ! command -v gcloud &> /dev/null; then
  echo "❌ ERRO: gcloud não encontrado!"
  echo "   Instale o Google Cloud SDK ou adicione ao PATH"
  exit 1
fi

# Verificar se o ambiente foi fornecido
if [ -z "$1" ]; then
  echo "❌ ERRO: Ambiente não especificado!"
  echo ""
  echo "Uso: ./deploy.sh <env>"
  echo ""
  echo "Ambientes disponíveis:"
  echo "  dev      - Ambiente de desenvolvimento"
  echo "  staging  - Ambiente de staging"
  echo "  prd      - Ambiente de produção"
  echo ""
  echo "Exemplo: ./deploy.sh dev"
  exit 1
fi

ENV=$1

# Validar ambiente
if [[ ! "$ENV" =~ ^(dev|staging|prd)$ ]]; then
  echo "❌ ERRO: Ambiente inválido: $ENV"
  echo "   Ambientes válidos: dev, staging, prd"
  exit 1
fi

# Configurações baseadas no ambiente
PROJECT_ID="qivo-mining-prod"
SERVICE_NAME="qivo-mining-${ENV}"
REGION="southamerica-east1"

# Configurar NODE_ENV baseado no ambiente
case $ENV in
  dev)
    NODE_ENV="development"
    echo "🚀 Deploying QIVO Mining Backend to DEV environment..."
    ;;
  staging)
    NODE_ENV="staging"
    echo "🚀 Deploying QIVO Mining Backend to STAGING environment..."
    ;;
  prd)
    NODE_ENV="production"
    echo "🚀 Deploying QIVO Mining Backend to PRODUCTION environment..."
    ;;
esac

# Função para configurar permissões GCS
setup_gcs_permissions() {
  local ENV=$1
  local SERVICE_NAME="qivo-mining-${ENV}"
  local REGION="southamerica-east1"
  local PROJECT_ID="qivo-mining-prod"
  
  echo ""
  echo "🔐 Configurando permissões GCS para Service Account..."
  
  # Obter email do Service Account do Cloud Run
  SERVICE_ACCOUNT=$(gcloud run services describe ${SERVICE_NAME} \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --format="value(spec.template.spec.serviceAccountName)" 2>/dev/null)
  
  # Se não tiver Service Account customizado, usar o padrão do Compute Engine
  if [ -z "$SERVICE_ACCOUNT" ] || [ "$SERVICE_ACCOUNT" = "null" ]; then
    PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)" 2>/dev/null)
    if [ -z "$PROJECT_NUMBER" ]; then
      echo "   ⚠️  Não foi possível obter PROJECT_NUMBER, pulando configuração de permissões"
      return 0
    fi
    SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
    echo "   Usando Service Account padrão: ${SERVICE_ACCOUNT}"
  else
    echo "   Service Account encontrado: ${SERVICE_ACCOUNT}"
  fi
  
  # Adicionar permissão para gerar URLs assinadas
  echo "   Adicionando permissão iam.serviceAccountTokenCreator..."
  gcloud iam service-accounts add-iam-policy-binding ${SERVICE_ACCOUNT} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/iam.serviceAccountTokenCreator" \
    --project=${PROJECT_ID} \
    --quiet 2>/dev/null && {
      echo "   ✅ Permissão adicionada com sucesso"
    } || {
      # Se falhar, pode ser que já existe - não é erro crítico
      echo "   ⚠️  Permissão já existe ou erro ao adicionar (pode ser ignorado se já configurado)"
    }
  
  echo "✅ Permissões GCS configuradas"
}

# Gerar timestamp único para forçar rebuild sem cache
BUILD_TIMESTAMP=$(date -u +%Y%m%d%H%M%S)
echo "$BUILD_TIMESTAMP" > .build-timestamp
echo "📅 Build timestamp: $BUILD_TIMESTAMP (forçando rebuild sem cache)"

# Gerar tag única para forçar nova imagem (evita cache do Cloud Run)
IMAGE_TAG="${BUILD_TIMESTAMP}"
IMAGE_NAME_WITH_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${IMAGE_TAG}"
echo "🏷️  Usando tag única: ${IMAGE_TAG} (forçando nova imagem)"
echo "📦 Service name: ${SERVICE_NAME}"
echo "🌍 Environment: ${NODE_ENV}"

# Verificar se .gcloudignore não está ignorando arquivos importantes
echo ""
echo "🔍 Verificando .gcloudignore:"
if grep -q "^src/" .gcloudignore 2>/dev/null; then
  echo "   ⚠️  WARNING: src/ está sendo ignorado pelo .gcloudignore!"
  echo "   Isso pode causar problemas. Verifique o arquivo .gcloudignore"
else
  echo "   ✅ src/ NÃO está sendo ignorado (ok)"
fi

# Build da imagem Docker (usando código local)
echo ""
echo "📦 Building Docker image (usando código local)..."
echo "   IMPORTANTE: O gcloud builds submit envia o código LOCAL para o Cloud Build"
echo "   O código que você vê aqui será o código usado no build"
echo "   Os logs do build serão exibidos em tempo real abaixo:"
echo "   Este build vai FORÇAR recompilação do código (cache invalidado)"
echo ""

# Executar build usando cloudbuild.yaml (que tem --no-cache)
echo "   Iniciando build usando cloudbuild.yaml (--no-cache forçado)..."
echo "   Isso vai garantir que o código local seja usado SEM cache!"
echo ""

# IMPORTANTE: gcloud builds submit SEM --source envia o código LOCAL
# Usar substituições para passar a tag única e o ambiente
gcloud builds submit \
  . \
  --config cloudbuild.yaml \
  --substitutions=_IMAGE_TAG=${IMAGE_TAG},_SERVICE_NAME=${SERVICE_NAME},_NODE_ENV=${NODE_ENV} \
  --project ${PROJECT_ID}

BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Build falhou com código de saída: $BUILD_EXIT_CODE"
  echo "   Verifique os logs acima ou em: https://console.cloud.google.com/cloud-build/builds?project=${PROJECT_ID}"
  exit 1
fi

# Capturar o ID do último build para referência
BUILD_ID=$(gcloud builds list --project ${PROJECT_ID} --limit=1 --format="value(id)" 2>/dev/null || echo "")

if [ -n "$BUILD_ID" ]; then
  echo ""
  echo "✅ Build e Deploy concluídos! ID: $BUILD_ID"
  echo "   O cloudbuild.yaml já fez o deploy automaticamente para o Cloud Run"
  echo "   Ver detalhes em: https://console.cloud.google.com/cloud-build/builds/${BUILD_ID}?project=${PROJECT_ID}"
else
  echo ""
  echo "✅ Build e Deploy concluídos!"
  echo "   O cloudbuild.yaml já fez o deploy automaticamente para o Cloud Run"
  echo "   Ver builds em: https://console.cloud.google.com/cloud-build/builds?project=${PROJECT_ID}"
fi

# Aguardar um pouco para garantir que a revisão foi criada
echo ""
echo "⏳ Aguardando criação da revisão..."
sleep 5

# Migrar 100% do tráfego para a última revisão
echo ""
echo "🔄 Migrando 100% do tráfego para a última revisão..."
gcloud run services update-traffic ${SERVICE_NAME} \
  --to-latest \
  --region=${REGION} \
  --project=${PROJECT_ID}

TRAFFIC_EXIT_CODE=$?

if [ $TRAFFIC_EXIT_CODE -eq 0 ]; then
  echo "   ✅ Tráfego migrado com sucesso para a última revisão"
else
  echo "   ⚠️  Aviso: Não foi possível migrar o tráfego automaticamente"
  echo "   Você pode fazer manualmente com:"
  echo "   gcloud run services update-traffic ${SERVICE_NAME} --to-latest --region=${REGION} --project=${PROJECT_ID}"
fi

# Configurar permissões GCS após deploy bem-sucedido
setup_gcs_permissions ${ENV}

echo ""
echo "✅ Deployment complete!"
echo "🔗 URL: https://${SERVICE_NAME}-586444405059.${REGION}.run.app"
echo "📝 Para verificar os logs do Cloud Run:"
echo "   gcloud run services logs read ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --limit=50"

