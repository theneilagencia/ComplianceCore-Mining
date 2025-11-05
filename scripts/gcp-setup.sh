#!/bin/bash

# QIVO Mining - GCP Infrastructure Setup Script
# This script sets up the complete GCP infrastructure for production

set -e

echo "========================================="
echo "QIVO Mining - GCP Infrastructure Setup"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="qivo-mining-prod"
REGION="us-central1"
ZONE="us-central1-a"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI not installed${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo -e "${BLUE}Step 1: Authenticate with Google Cloud${NC}"
echo "Running: gcloud auth login"
gcloud auth login

if [ $? -ne 0 ]; then
    echo -e "${RED}Authentication failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Authenticated${NC}"
echo ""

echo -e "${BLUE}Step 2: Create GCP Project${NC}"
echo "Project ID: $PROJECT_ID"
echo "Creating project..."

gcloud projects create $PROJECT_ID --name="QIVO Mining Production" || echo "Project may already exist"

echo -e "${GREEN}✓ Project created or already exists${NC}"
echo ""

echo -e "${BLUE}Step 3: Set Active Project${NC}"
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✓ Active project set to $PROJECT_ID${NC}"
echo ""

echo -e "${BLUE}Step 4: Link Billing Account${NC}"
echo -e "${YELLOW}IMPORTANT: You need to link a billing account manually${NC}"
echo ""
echo "1. Go to: https://console.cloud.google.com/billing"
echo "2. Select your billing account"
echo "3. Click 'Link a project'"
echo "4. Select: $PROJECT_ID"
echo ""
read -p "Press Enter after linking billing account..."

echo -e "${BLUE}Step 5: Enable Required APIs${NC}"
echo "Enabling APIs (this may take a few minutes)..."

gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com \
  servicenetworking.googleapis.com

echo -e "${GREEN}✓ APIs enabled${NC}"
echo ""

echo -e "${BLUE}Step 6: Create Cloud SQL Instance${NC}"
echo "Creating PostgreSQL instance (this may take 5-10 minutes)..."

gcloud sql instances create qivo-mining-db \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-7680 \
  --region=$REGION \
  --storage-type=SSD \
  --storage-size=100GB \
  --storage-auto-increase \
  --backup-start-time=02:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=03 \
  --availability-type=REGIONAL \
  --enable-bin-log || echo "Instance may already exist"

echo -e "${GREEN}✓ Cloud SQL instance created${NC}"
echo ""

echo -e "${BLUE}Step 7: Create Database${NC}"
gcloud sql databases create qivo_mining_prod --instance=qivo-mining-db || echo "Database may already exist"
echo -e "${GREEN}✓ Database created${NC}"
echo ""

echo -e "${BLUE}Step 8: Create Database User${NC}"
echo "Enter a strong password for the database user:"
read -s DB_PASSWORD
echo ""

gcloud sql users create qivo_user \
  --instance=qivo-mining-db \
  --password=$DB_PASSWORD || echo "User may already exist"

echo -e "${GREEN}✓ Database user created${NC}"
echo ""

echo -e "${BLUE}Step 9: Get Database Connection Name${NC}"
CONNECTION_NAME=$(gcloud sql instances describe qivo-mining-db --format="value(connectionName)")
echo "Connection Name: $CONNECTION_NAME"
echo ""

DATABASE_URL="postgresql://qivo_user:$DB_PASSWORD@/$qivo_mining_prod?host=/cloudsql/$CONNECTION_NAME"
echo "Database URL (save this):"
echo "$DATABASE_URL"
echo ""

echo -e "${BLUE}Step 10: Create Cloud Memorystore (Redis)${NC}"
echo "Creating Redis instance (this may take 5-10 minutes)..."

gcloud redis instances create qivo-mining-redis \
  --size=1 \
  --region=$REGION \
  --redis-version=redis_7_0 \
  --tier=standard \
  --replica-count=1 || echo "Instance may already exist"

echo -e "${GREEN}✓ Redis instance created${NC}"
echo ""

echo -e "${BLUE}Step 11: Get Redis Connection Info${NC}"
REDIS_HOST=$(gcloud redis instances describe qivo-mining-redis --region=$REGION --format="value(host)")
REDIS_PORT=$(gcloud redis instances describe qivo-mining-redis --region=$REGION --format="value(port)")
REDIS_URL="redis://$REDIS_HOST:$REDIS_PORT"

echo "Redis URL (save this):"
echo "$REDIS_URL"
echo ""

echo -e "${BLUE}Step 12: Create Service Account${NC}"
gcloud iam service-accounts create qivo-mining-sa \
  --display-name="QIVO Mining Service Account" || echo "Service account may already exist"

echo -e "${GREEN}✓ Service account created${NC}"
echo ""

echo -e "${BLUE}Step 13: Grant Permissions${NC}"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="qivo-mining-sa@$PROJECT_ID.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/redis.editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"

echo -e "${GREEN}✓ Permissions granted${NC}"
echo ""

echo -e "${BLUE}Step 14: Create Secrets in Secret Manager${NC}"
echo "Creating secrets..."

# JWT Secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo -n "$JWT_SECRET" | gcloud secrets create JWT_SECRET --data-file=- --replication-policy="automatic" || echo "Secret may already exist"

# Session Secret
SESSION_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo -n "$SESSION_SECRET" | gcloud secrets create SESSION_SECRET --data-file=- --replication-policy="automatic" || echo "Secret may already exist"

# Database URL
echo -n "$DATABASE_URL" | gcloud secrets create DATABASE_URL --data-file=- --replication-policy="automatic" || echo "Secret may already exist"

# Redis URL
echo -n "$REDIS_URL" | gcloud secrets create REDIS_URL --data-file=- --replication-policy="automatic" || echo "Secret may already exist"

echo -e "${GREEN}✓ Secrets created${NC}"
echo ""

echo -e "${BLUE}Step 15: Grant Secret Access to Cloud Run${NC}"
COMPUTE_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

for secret in JWT_SECRET SESSION_SECRET DATABASE_URL REDIS_URL; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:$COMPUTE_SA" \
    --role="roles/secretmanager.secretAccessor"
done

echo -e "${GREEN}✓ Secret access granted${NC}"
echo ""

echo "========================================="
echo -e "${GREEN}GCP Infrastructure Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "--------"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Cloud SQL Instance: qivo-mining-db"
echo "Database: qivo_mining_prod"
echo "Redis Instance: qivo-mining-redis"
echo ""
echo "Connection Strings (SAVE THESE):"
echo "--------------------------------"
echo "DATABASE_URL=$DATABASE_URL"
echo "REDIS_URL=$REDIS_URL"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Configure Stripe (see docs/STRIPE_SETUP.md)"
echo "2. Configure Email Service (SendGrid or Mailgun)"
echo "3. Add remaining secrets to Secret Manager:"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_PUBLISHABLE_KEY"
echo "   - STRIPE_WEBHOOK_SECRET"
echo "   - SENDGRID_API_KEY (or email service credentials)"
echo "   - GOOGLE_CLIENT_ID (optional, for OAuth)"
echo "   - GOOGLE_CLIENT_SECRET (optional, for OAuth)"
echo ""
echo "4. Run database migrations:"
echo "   export DATABASE_URL='$DATABASE_URL'"
echo "   ./scripts/db-migrate.sh"
echo ""
echo "5. Deploy application:"
echo "   ./scripts/deploy-gcp.sh"
echo ""
echo "========================================="
