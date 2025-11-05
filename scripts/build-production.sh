#!/bin/bash

# QIVO Mining - Production Build Script
# Builds both frontend and backend for production deployment

set -e

echo "========================================="
echo "QIVO Mining - Production Build"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Start time
START_TIME=$(date +%s)

# Check Node version
echo -e "${BLUE}Checking Node.js version...${NC}"
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

if [[ ! $NODE_VERSION =~ ^v(18|20|22) ]]; then
    echo -e "${RED}Error: Node.js 18+ required${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version OK${NC}"
echo ""

# Clean previous builds
echo -e "${BLUE}Cleaning previous builds...${NC}"
rm -rf dist/
rm -rf client/dist/
rm -rf server/dist/
echo -e "${GREEN}✓ Clean completed${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
pnpm install --frozen-lockfile
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Generate Prisma Client
echo -e "${BLUE}Generating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"
echo ""

# Build Frontend
echo -e "${BLUE}Building frontend...${NC}"
cd client
pnpm build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend build completed${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

cd ..
echo ""

# Build Backend
echo -e "${BLUE}Building backend...${NC}"
cd server
pnpm build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend build completed${NC}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi

cd ..
echo ""

# Copy static files
echo -e "${BLUE}Copying static files...${NC}"
mkdir -p dist/public
cp -r client/dist/* dist/public/
echo -e "${GREEN}✓ Static files copied${NC}"
echo ""

# Copy server files
echo -e "${BLUE}Copying server files...${NC}"
cp -r server/dist/* dist/
cp package.json dist/
cp pnpm-lock.yaml dist/
echo -e "${GREEN}✓ Server files copied${NC}"
echo ""

# Create production package.json
echo -e "${BLUE}Creating production package.json...${NC}"
cat > dist/package.json << 'EOF'
{
  "name": "qivo-mining",
  "version": "1.0.0",
  "description": "QIVO Mining - Conformidade Regulatória para Mineração",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "migrate": "prisma migrate deploy"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "@prisma/client": "latest",
    "express": "latest",
    "ioredis": "latest",
    "stripe": "latest",
    "nodemailer": "latest",
    "opossum": "latest",
    "prom-client": "latest"
  }
}
EOF
echo -e "${GREEN}✓ Production package.json created${NC}"
echo ""

# Calculate build size
echo -e "${BLUE}Calculating build size...${NC}"
BUILD_SIZE=$(du -sh dist/ | cut -f1)
echo "Build size: $BUILD_SIZE"
echo ""

# End time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "========================================="
echo -e "${GREEN}Build completed successfully!${NC}"
echo "========================================="
echo ""
echo "Build time: ${DURATION}s"
echo "Build size: $BUILD_SIZE"
echo "Output directory: dist/"
echo ""
echo "Next steps:"
echo "1. Test build: ${BLUE}cd dist && pnpm install --prod && node index.js${NC}"
echo "2. Deploy: ${BLUE}./scripts/deploy-gcp.sh${NC}"
echo ""
