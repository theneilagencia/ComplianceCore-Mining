#!/bin/bash
set -e

echo "🗄️  Database Migration Script"
echo "=============================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, skipping migrations"
  echo "   This is expected in local development"
  exit 0
fi

echo "✅ DATABASE_URL detected"
echo "📊 Running database migrations..."

# Run Drizzle migrations
pnpm drizzle-kit push --force

echo "✅ Migrations completed successfully!"

