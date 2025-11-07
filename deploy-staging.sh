#!/bin/bash
set -e

echo "🚀 Deploying QIVO Mining to STAGING environment..."

# Configurações
PROJECT_ID="qivo-mining-prod"
SERVICE_NAME="qivo-mining-staging"
REGION="southamerica-east1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

# Build da imagem Docker
echo "📦 Building Docker image..."
gcloud builds submit \
  --tag ${IMAGE_NAME} \
  --project ${PROJECT_ID}

# Deploy no Cloud Run
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=staging" \
  --set-env-vars "DEPLOY_VERSION=staging-$(date +%s)" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest" \
  --set-secrets "JWT_SECRET=JWT_SECRET:latest" \
  --set-secrets "SESSION_SECRET=SESSION_SECRET:latest" \
  --set-secrets "GOOGLE_OAUTH_CLIENT_ID=GOOGLE_OAUTH_CLIENT_ID:latest" \
  --set-secrets "GOOGLE_OAUTH_CLIENT_SECRET=GOOGLE_OAUTH_CLIENT_SECRET:latest" \
  --set-secrets "STRIPE_PUBLISHABLE_KEY=STRIPE_PUBLISHABLE_KEY:latest" \
  --set-secrets "STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest" \
  --set-secrets "GCP_SA_KEY=gcp-sa-key:latest" \
  --set-env-vars "GCS_BUCKET=qivo-mining-staging-reports" \
  --project ${PROJECT_ID}

echo "✅ Staging deployment complete!"
echo "🔗 URL: https://${SERVICE_NAME}-586444405059.${REGION}.run.app"
