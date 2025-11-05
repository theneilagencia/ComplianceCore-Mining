#!/bin/bash

# QIVO Mining - Environment Setup Script
# This script helps set up environment variables for production

set -e

echo "========================================="
echo "QIVO Mining - Environment Setup"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ -f .env.production ]; then
    echo -e "${YELLOW}Warning: .env.production already exists${NC}"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Copy example file
echo "Copying .env.production.example to .env.production..."
cp .env.production.example .env.production

echo -e "${GREEN}✓ .env.production created${NC}"
echo ""

# Generate secrets
echo "Generating secure secrets..."

# JWT Secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env.production
echo -e "${GREEN}✓ JWT_SECRET generated${NC}"

# Session Secret
SESSION_SECRET=$(openssl rand -base64 64 | tr -d '\n')
sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" .env.production
echo -e "${GREEN}✓ SESSION_SECRET generated${NC}"

echo ""
echo "========================================="
echo "Next Steps:"
echo "========================================="
echo ""
echo "1. Edit .env.production and fill in the following values:"
echo ""
echo "   ${YELLOW}Required:${NC}"
echo "   - DATABASE_URL"
echo "   - REDIS_URL"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_PUBLISHABLE_KEY"
echo "   - STRIPE_WEBHOOK_SECRET"
echo "   - EMAIL_SERVICE credentials"
echo ""
echo "   ${YELLOW}Optional but recommended:${NC}"
echo "   - GOOGLE_CLIENT_ID (for OAuth)"
echo "   - ANM_API_KEY (for Brazilian mining data)"
echo "   - CPRM_API_KEY (for geological data)"
echo "   - SENTRY_DSN (for error tracking)"
echo "   - OPENAI_API_KEY (for AI analysis)"
echo ""
echo "2. Store sensitive values in Google Secret Manager:"
echo "   ${GREEN}gcloud secrets create qivo-env-production --data-file=.env.production${NC}"
echo ""
echo "3. Never commit .env.production to Git!"
echo ""
echo "4. Validate configuration:"
echo "   ${GREEN}./scripts/validate-env.sh${NC}"
echo ""
echo "========================================="
