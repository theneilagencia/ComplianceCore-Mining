#!/bin/bash
set -e

# Script de deploy SEM Cloud Build
# Faz build local da imagem Docker e push direto para Container Registry
# Uso: ./deploy-local.sh <env>
# Ambientes: dev, staging, prd

# Verificar se o ambiente foi fornecido
if [ -z "$1" ]; then
  echo "❌ ERRO: Ambiente não especificado!"
  echo ""
  echo "Uso: ./deploy-local.sh <env>"
  echo ""
  echo "Ambientes disponíveis:"
  echo "  dev      - Ambiente de desenvolvimento"
  echo "  staging  - Ambiente de staging"
  echo "  prd      - Ambiente de produção"
  echo ""
  echo "Exemplo: ./deploy-local.sh dev"
  exit 1
fi

ENV=$1

# Validar ambiente
if [[ ! "$ENV" =~ ^(dev|staging|prd)$ ]]; then
  echo "❌ ERRO: Ambiente inválido: $ENV"
  echo "   Ambientes válidos: dev, staging, prd"
  exit 1
fi

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
  echo "❌ ERRO: Docker não encontrado!"
  echo "   Instale o Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

# Verificar se gcloud está disponível
if ! command -v gcloud &> /dev/null; then
  if [ -f "$HOME/google-cloud-sdk/bin/gcloud" ]; then
    export PATH="$HOME/google-cloud-sdk/bin:$PATH"
  fi
fi

if ! command -v gcloud &> /dev/null; then
  echo "❌ ERRO: gcloud não encontrado!"
  echo "   Instale o Google Cloud SDK ou adicione ao PATH"
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
    echo "🚀 Deploying QIVO Mining Backend to DEV environment (build local)..."
    ;;
  staging)
    NODE_ENV="staging"
    echo "🚀 Deploying QIVO Mining Backend to STAGING environment (build local)..."
    ;;
  prd)
    NODE_ENV="production"
    echo "🚀 Deploying QIVO Mining Backend to PRODUCTION environment (build local)..."
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
echo "📅 Build timestamp: $BUILD_TIMESTAMP"

# Gerar tag única
IMAGE_TAG="${BUILD_TIMESTAMP}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${IMAGE_TAG}"
IMAGE_NAME_LATEST="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "🏷️  Image tag: ${IMAGE_TAG}"
echo "📦 Service name: ${SERVICE_NAME}"
echo "🌍 Environment: ${NODE_ENV}"
echo ""

# Autenticar Docker no GCP
echo "🔐 Autenticando Docker no GCP..."
gcloud auth configure-docker --quiet --project ${PROJECT_ID}

# Build da imagem Docker LOCALMENTE
echo ""
echo "📦 Building Docker image localmente..."
echo "   Dockerfile: Dockerfile.backend"
echo "   Context: . (diretório atual)"
echo ""

docker build \
  --no-cache \
  -f Dockerfile.backend \
  -t ${IMAGE_NAME} \
  -t ${IMAGE_NAME_LATEST} \
  .

BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Build Docker falhou com código de saída: $BUILD_EXIT_CODE"
  exit 1
fi

echo ""
echo "✅ Docker image built successfully!"

# Push da imagem para Container Registry
echo ""
echo "📤 Pushing image to Container Registry..."
echo "   ${IMAGE_NAME}"
echo "   ${IMAGE_NAME_LATEST}"
echo ""

docker push ${IMAGE_NAME}
docker push ${IMAGE_NAME_LATEST}

PUSH_EXIT_CODE=$?

if [ $PUSH_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Push da imagem falhou com código de saída: $PUSH_EXIT_CODE"
  exit 1
fi

echo ""
echo "✅ Image pushed successfully!"

# Deploy no Cloud Run
echo ""
echo "🚀 Deploying to Cloud Run..."
echo "   Service: ${SERVICE_NAME}"
echo "   Region: ${REGION}"
echo "   Image: ${IMAGE_NAME}"
echo ""

gcloud run deploy ${SERVICE_NAME} \
  --image=${IMAGE_NAME} \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=10 \
  --memory=4Gi \
  --cpu=2 \
  --timeout=300 \
  --port=10000 \
  --vpc-connector=qivo-vpc-connector \
  --vpc-egress=private-ranges-only \
  --set-env-vars=NODE_ENV=${NODE_ENV} \
  --set-secrets=DATABASE_URL=compliancecore-db-url:latest,OPENAI_API_KEY=openai-api-key:latest,SESSION_SECRET=session-secret:latest,JWT_SECRET=jwt-secret:latest,SIGMINE_API_KEY=sigmine-api-key:latest,MAPBIOMAS_API_KEY=mapbiomas-api-key:latest \
  --project=${PROJECT_ID}

DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Deploy falhou com código de saída: $DEPLOY_EXIT_CODE"
  exit 1
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
echo ""
echo "💡 Dica: Para usar este script, adicione ao package.json:"
echo "   \"deploy:local:dev\": \"bash deploy-local.sh dev\""
echo "   \"deploy:local:staging\": \"bash deploy-local.sh staging\""
echo "   \"deploy:local:prd\": \"bash deploy-local.sh prd\""

