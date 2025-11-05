#!/bin/bash

# QIVO Mining - Database Migration Script
# Runs Prisma migrations on production database

set -e

echo "========================================="
echo "QIVO Mining - Database Migration"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    echo "Please set DATABASE_URL in .env.production or as environment variable"
    exit 1
fi

echo "Database URL: ${DATABASE_URL%%@*}@***"
echo ""

# Confirm production migration
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${YELLOW}WARNING: You are about to run migrations on PRODUCTION database!${NC}"
    read -p "Are you sure you want to continue? (yes/NO) " -r
    echo
    if [[ ! $REPLY = "yes" ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Run migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations completed successfully${NC}"
else
    echo -e "${RED}✗ Migrations failed${NC}"
    exit 1
fi

# Generate Prisma Client
echo ""
echo "Generating Prisma Client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma Client generated${NC}"
else
    echo -e "${RED}✗ Prisma Client generation failed${NC}"
    exit 1
fi

# Create indexes
echo ""
echo "Creating performance indexes..."
npx prisma db execute --file server/migrations/001_create_indexes.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Indexes created${NC}"
else
    echo -e "${YELLOW}⚠ Index creation failed (may already exist)${NC}"
fi

echo ""
echo "========================================="
echo "Database migration completed!"
echo "========================================="
