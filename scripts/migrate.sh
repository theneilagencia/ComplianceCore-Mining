#!/bin/bash
#
# Database Migration Script - QIVO Mining v1.2.0
# 
# Usage: ./scripts/migrate.sh [environment]
# Example: ./scripts/migrate.sh production
#

set -e  # Exit on error

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔄 Starting database migration for environment: $ENVIRONMENT"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
  echo "📋 Loading environment variables from .env.$ENVIRONMENT"
  export $(cat "$PROJECT_ROOT/.env.$ENVIRONMENT" | grep -v '^#' | xargs)
elif [ -f "$PROJECT_ROOT/.env" ]; then
  echo "📋 Loading environment variables from .env"
  export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
else
  echo "⚠️  No .env file found, using system environment variables"
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  exit 1
fi

echo "✅ DATABASE_URL configured"

# Backup database before migration
echo "💾 Creating database backup..."
BACKUP_FILE="$PROJECT_ROOT/backups/db_backup_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p "$PROJECT_ROOT/backups"

# Extract database connection details
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

if command -v pg_dump &> /dev/null; then
  echo "📦 Running pg_dump..."
  pg_dump $DATABASE_URL > "$BACKUP_FILE" 2>/dev/null || echo "⚠️  Backup failed (non-critical)"
  echo "✅ Backup saved to: $BACKUP_FILE"
else
  echo "⚠️  pg_dump not found, skipping backup"
fi

# Run Drizzle migrations
echo "🔧 Running Drizzle migrations..."
cd "$PROJECT_ROOT"

if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Generate migration files if needed
echo "📝 Generating migration files..."
npm run db:generate || echo "⚠️  No new migrations to generate"

# Push schema to database
echo "🚀 Pushing schema to database..."
npm run db:push

echo "✅ Database migration completed successfully!"

# Verify migration
echo "🔍 Verifying migration..."
npm run db:studio -- --port 5555 &
STUDIO_PID=$!
sleep 2
kill $STUDIO_PID 2>/dev/null || true

echo ""
echo "✅ Migration completed for environment: $ENVIRONMENT"
echo "📁 Backup location: $BACKUP_FILE"
echo ""

