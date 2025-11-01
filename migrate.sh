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

# Run Drizzle migrations with verbose output
echo "Executing: pnpm drizzle-kit push"
pnpm drizzle-kit push 2>&1 || {
  echo "❌ Migration failed with exit code $?"
  echo "Trying alternative method..."
  npx drizzle-kit push 2>&1 || {
    echo "❌ Alternative method also failed"
    echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
    exit 1
  }
}

echo "✅ Migrations completed successfully!"

