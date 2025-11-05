#!/bin/bash

# QIVO Mining - GCP Cloud Run Deployment Script
# Deploys the application to Google Cloud Run

set -e

echo "========================================="
echo "QIVO Mining - GCP Cloud Run Deployment"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"qivo-mining-prod"}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="qivo-mining"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI not installed${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if logged in
echo -e "${BLUE}Checking GCP authentication...${NC}"
gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Not logged in to GCP${NC}"
    echo "Run: gcloud auth login"
    exit 1
fi

echo -e "${GREEN}✓ Authenticated${NC}"
echo ""

# Set project
echo -e "${BLUE}Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✓ Project set to $PROJECT_ID${NC}"
echo ""

# Enable required APIs
echo -e "${BLUE}Enabling required APIs...${NC}"
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com

echo -e "${GREEN}✓ APIs enabled${NC}"
echo ""

# Build Docker image
echo -e "${BLUE}Building Docker image...${NC}"
gcloud builds submit --tag $IMAGE_NAME

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built${NC}"
else
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi

echo ""

# Deploy to Cloud Run
echo -e "${BLUE}Deploying to Cloud Run...${NC}"

# Confirm deployment
echo -e "${YELLOW}WARNING: You are about to deploy to PRODUCTION!${NC}"
read -p "Continue? (yes/NO) " -r
echo

if [[ ! $REPLY = "yes" ]]; then
    echo "Deployment cancelled."
    exit 1
fi

gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 1 \
  --port 8080 \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest" \
  --set-secrets "REDIS_URL=REDIS_URL:latest" \
  --set-secrets "JWT_SECRET=JWT_SECRET:latest" \
  --set-secrets "STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest" \
  --set-secrets "STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment successful${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi

echo ""

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo "========================================="
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "========================================="
echo ""
echo "Service URL: $SERVICE_URL"
echo ""
echo "Next steps:"
echo "1. Test health check: ${BLUE}curl $SERVICE_URL/health${NC}"
echo "2. Update DNS: Point qivomining.com to $SERVICE_URL"
echo "3. Configure Stripe webhook: $SERVICE_URL/api/payment/webhook"
echo "4. Monitor logs: ${BLUE}gcloud run logs tail $SERVICE_NAME --region $REGION${NC}"
echo ""
