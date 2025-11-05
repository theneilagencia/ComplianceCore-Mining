# QIVO Mining - Production Deployment Guide

**Data:** 05/11/2025  
**Versão:** 1.0  
**Status:** READY FOR PRODUCTION ✅

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Redis Configuration](#redis-configuration)
5. [Stripe Configuration](#stripe-configuration)
6. [Build and Deploy](#build-and-deploy)
7. [Post-Deployment](#post-deployment)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)
10. [Rollback](#rollback)

---

## Prerequisites

### Required Accounts

- [ ] Google Cloud Platform account
- [ ] Stripe account (verified)
- [ ] SendGrid or Mailgun account
- [ ] GitHub account (for CI/CD)

### Required Tools

```bash
# Install Node.js 22+
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm@10.4.1

# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Install Docker (optional, for local testing)
curl -fsSL https://get.docker.com | sh
```

### GCP Project Setup

```bash
# Create project
gcloud projects create qivo-mining-prod --name="QIVO Mining Production"

# Set project
gcloud config set project qivo-mining-prod

# Enable billing
gcloud beta billing projects link qivo-mining-prod \
  --billing-account=YOUR_BILLING_ACCOUNT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com
```

---

## Environment Setup

### Step 1: Generate Environment File

```bash
cd /path/to/qivo-mining
./scripts/setup-env.sh
```

This will create `.env.production` with auto-generated secrets.

### Step 2: Fill Required Values

Edit `.env.production` and fill in:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `SENDGRID_API_KEY` or `MAILGUN_SMTP_*` - Email service credentials

**Optional but Recommended:**
- `GOOGLE_CLIENT_ID` - For OAuth
- `ANM_API_KEY` - For Brazilian mining data
- `CPRM_API_KEY` - For geological data
- `SENTRY_DSN` - For error tracking
- `OPENAI_API_KEY` - For AI analysis

### Step 3: Store Secrets in Google Secret Manager

```bash
# Create secrets from .env.production
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ $key =~ ^#.*$ ]] && continue
  [[ -z $key ]] && continue
  
  # Create secret
  echo -n "$value" | gcloud secrets create $key \
    --data-file=- \
    --replication-policy="automatic"
done < .env.production

# Grant access to Cloud Run service account
PROJECT_NUMBER=$(gcloud projects describe qivo-mining-prod --format="value(projectNumber)")
SERVICE_ACCOUNT="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

for secret in $(gcloud secrets list --format="value(name)"); do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## Database Configuration

### Option 1: Cloud SQL (Recommended)

```bash
# Create Cloud SQL instance
gcloud sql instances create qivo-mining-db \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-7680 \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=100GB \
  --storage-auto-increase \
  --backup-start-time=02:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=03

# Create database
gcloud sql databases create qivo_mining_prod \
  --instance=qivo-mining-db

# Create user
gcloud sql users create qivo_user \
  --instance=qivo-mining-db \
  --password=STRONG_PASSWORD_HERE

# Get connection name
gcloud sql instances describe qivo-mining-db \
  --format="value(connectionName)"

# Connection string format:
# postgresql://qivo_user:PASSWORD@/qivo_mining_prod?host=/cloudsql/CONNECTION_NAME
```

### Option 2: External PostgreSQL

Use any managed PostgreSQL service (AWS RDS, Azure Database, etc.)

**Connection String:**
```
postgresql://USER:PASSWORD@HOST:5432/qivo_mining_prod?sslmode=require
```

### Run Migrations

```bash
# Set DATABASE_URL
export DATABASE_URL="your_database_url_here"

# Run migrations
./scripts/db-migrate.sh
```

---

## Redis Configuration

See [REDIS_SETUP.md](./REDIS_SETUP.md) for detailed instructions.

### Quick Setup (Google Cloud Memorystore)

```bash
# Create Redis instance
gcloud redis instances create qivo-mining-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0 \
  --tier=standard \
  --replica-count=1

# Get connection info
gcloud redis instances describe qivo-mining-redis \
  --region=us-central1 \
  --format="get(host,port)"

# Connection string:
# redis://HOST:PORT
```

---

## Stripe Configuration

See [STRIPE_SETUP.md](./STRIPE_SETUP.md) for detailed instructions.

### Quick Checklist

- [ ] Create products (START, PRO, ENTERPRISE)
- [ ] Create prices (monthly + annual)
- [ ] Create one-time report products
- [ ] Configure webhook endpoint
- [ ] Enable Customer Portal
- [ ] Copy API keys and Price IDs to `.env.production`

---

## Build and Deploy

### Method 1: Manual Deployment

```bash
# 1. Build application
./scripts/build-production.sh

# 2. Deploy to GCP Cloud Run
./scripts/deploy-gcp.sh
```

### Method 2: Automated CI/CD (Recommended)

**Setup GitHub Secrets:**

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add secrets:
   - `GCP_SA_KEY` - Service account JSON key
   - `DATABASE_URL` - Database connection string
   - All other secrets from `.env.production`

**Deploy:**

```bash
# Push to main branch
git push origin main

# GitHub Actions will automatically:
# 1. Run tests
# 2. Security scan
# 3. Build Docker image
# 4. Deploy to Cloud Run
# 5. Run migrations
# 6. Run smoke tests
```

### Method 3: Docker Build (Local Testing)

```bash
# Build Docker image
docker build -t qivo-mining:latest .

# Run locally
docker run -p 8080:8080 \
  --env-file .env.production \
  qivo-mining:latest

# Test
curl http://localhost:8080/health
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe qivo-mining \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)')

# Test health endpoint
curl $SERVICE_URL/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-05T..."}
```

### 2. Configure DNS

**Option A: Custom Domain (Recommended)**

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service qivo-mining \
  --domain qivomining.com \
  --region us-central1

# Get DNS records
gcloud run domain-mappings describe \
  --domain qivomining.com \
  --region us-central1

# Add DNS records to your domain registrar
```

**Option B: Use Cloud Run URL**

Use the generated URL: `https://qivo-mining-xxx-uc.a.run.app`

### 3. Configure Stripe Webhook

```bash
# Update webhook URL in Stripe Dashboard
# URL: https://qivomining.com/api/payment/webhook
# or: https://qivo-mining-xxx-uc.a.run.app/api/payment/webhook
```

### 4. Test Critical Flows

**Authentication:**
```bash
# Register
curl -X POST $SERVICE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234","name":"Test User"}'

# Login
curl -X POST $SERVICE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}'
```

**Stripe Checkout:**
```bash
# Create checkout session
curl -X POST $SERVICE_URL/api/payment/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"plan":"PRO","interval":"monthly"}'
```

### 5. Monitor Initial Traffic

```bash
# View logs
gcloud run logs tail qivo-mining --region us-central1

# Monitor metrics
gcloud run services describe qivo-mining \
  --platform managed \
  --region us-central1
```

---

## Monitoring

### Logs

**View Real-Time Logs:**
```bash
gcloud run logs tail qivo-mining --region us-central1
```

**Search Logs:**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=qivo-mining" \
  --limit 50 \
  --format json
```

### Metrics

**Prometheus Metrics:**
```bash
# Access metrics endpoint
curl $SERVICE_URL/metrics
```

**Grafana Dashboard:**

Import dashboard from `grafana/qivo-mining-dashboard.json`

### Alerts

**Setup Alerts:**

```bash
# CPU usage > 80%
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="QIVO Mining - High CPU" \
  --condition-display-name="CPU > 80%" \
  --condition-threshold-value=0.8 \
  --condition-threshold-duration=300s

# Error rate > 5%
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="QIVO Mining - High Error Rate" \
  --condition-display-name="Error Rate > 5%" \
  --condition-threshold-value=0.05
```

### Uptime Monitoring

```bash
# Create uptime check
gcloud monitoring uptime create qivo-mining-health \
  --resource-type=uptime-url \
  --host=qivomining.com \
  --path=/health \
  --check-interval=60s
```

---

## Troubleshooting

### Service Not Starting

**Symptoms:**
- Service shows "Revision failed"
- Logs show startup errors

**Solutions:**
1. Check environment variables are set correctly
2. Check database connection
3. Check Redis connection
4. Review logs: `gcloud run logs tail qivo-mining`

### Database Connection Failed

**Symptoms:**
```
Error: connect ECONNREFUSED
```

**Solutions:**
1. Check DATABASE_URL is correct
2. Check Cloud SQL instance is running
3. Check Cloud SQL proxy is configured
4. Check firewall rules

### High Latency

**Symptoms:**
- Response times > 1s
- Timeouts

**Solutions:**
1. Check database query performance
2. Check Redis cache hit rate
3. Scale up Cloud Run instances
4. Check external API latency

### Out of Memory

**Symptoms:**
```
Error: JavaScript heap out of memory
```

**Solutions:**
1. Increase memory limit in Cloud Run (currently 2Gi)
2. Check for memory leaks
3. Optimize queries
4. Reduce cache size

---

## Rollback

### Quick Rollback

```bash
# List revisions
gcloud run revisions list \
  --service qivo-mining \
  --region us-central1

# Rollback to previous revision
gcloud run services update-traffic qivo-mining \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

### Database Rollback

```bash
# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=qivo-mining-db \
  --backup-instance=qivo-mining-db
```

---

## Checklist

### Pre-Deployment

- [ ] All tests passing (402/402)
- [ ] Environment variables configured
- [ ] Database created and migrated
- [ ] Redis configured
- [ ] Stripe products created
- [ ] Stripe webhook configured
- [ ] Email service configured
- [ ] Secrets stored in Secret Manager
- [ ] DNS records ready

### Deployment

- [ ] Build successful
- [ ] Docker image pushed
- [ ] Cloud Run service deployed
- [ ] Health check passing
- [ ] Database migrations ran
- [ ] Smoke tests passed

### Post-Deployment

- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Stripe webhook verified
- [ ] Critical flows tested
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Logs accessible
- [ ] Backup configured

---

## Support

**Documentation:**
- [Redis Setup](./REDIS_SETUP.md)
- [Stripe Setup](./STRIPE_SETUP.md)
- [Validation Report](../VALIDACAO_FINAL_100.md)
- [Certification](../CERTIFICACAO_PRODUCAO_100.md)

**GCP Support:**
- Console: https://console.cloud.google.com
- Support: https://cloud.google.com/support

**Internal:**
- Email: devops@qivomining.com
- Slack: #deployment

---

**Status:** READY FOR PRODUCTION ✅  
**Last Updated:** 05/11/2025  
**Version:** 1.0.0
