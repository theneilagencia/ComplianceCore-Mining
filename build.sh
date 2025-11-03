#!/bin/bash
set -e

echo "🔧 ComplianceCore Mining™ - Build Script v2.0"
echo "=============================================="
echo "Environment: ${NODE_ENV:-production}"
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"
echo ""

# Build start time
BUILD_START=$(date +%s)

# Optimize Node.js memory and performance
export NODE_OPTIONS="--max-old-space-size=3072 --experimental-vm-modules"
export NODE_ENV="${NODE_ENV:-production}"

# Validate environment
echo "🔍 Validating environment..."
if [ -z "$DATABASE_URL" ] && [ -z "$DB_URL" ]; then
  echo "⚠️  Warning: DATABASE_URL not set, migrations may fail"
fi

# Install dependencies with frozen lockfile
echo "📦 Installing dependencies..."
if [ -f "pnpm-lock.yaml" ]; then
  pnpm install --frozen-lockfile --prefer-offline
else
  echo "⚠️  Warning: pnpm-lock.yaml not found, running regular install"
  pnpm install
fi

# Clean old build artifacts
echo "🧹 Cleaning old build..."
rm -rf dist/
rm -rf .vite-cache/ 2>/dev/null || true

# Build client (Vite)
echo "🎨 Building client..."
BUILD_CLIENT_START=$(date +%s)
pnpm vite build
BUILD_CLIENT_END=$(date +%s)
BUILD_CLIENT_TIME=$((BUILD_CLIENT_END - BUILD_CLIENT_START))
echo "✅ Client built in ${BUILD_CLIENT_TIME}s"

# Build server (esbuild)
echo "🚀 Building server..."
BUILD_SERVER_START=$(date +%s)
node esbuild.config.js
BUILD_SERVER_END=$(date +%s)
BUILD_SERVER_TIME=$((BUILD_SERVER_END - BUILD_SERVER_START))
echo "✅ Server built in ${BUILD_SERVER_TIME}s"

# Validate build outputs
echo "🔍 Validating build outputs..."
if [ ! -f "dist/public/index.html" ]; then
  echo "❌ ERROR: Client build failed - dist/public/index.html not found"
  exit 1
fi
if [ ! -f "dist/index.js" ]; then
  echo "❌ ERROR: Server build failed - dist/index.js not found"
  exit 1
fi
echo "✅ Build outputs validated"

# Run database migrations (production only, with error handling)
if [ "$NODE_ENV" = "production" ]; then
  echo "🗄️  Running database migrations..."
  if bash migrate.sh; then
    echo "✅ Migrations completed successfully"
  else
    echo "⚠️  Warning: Migrations failed or skipped (non-blocking)"
    echo "   This is acceptable if database is already up to date"
  fi
else
  echo "⏭️  Skipping migrations (not production environment)"
fi

# Build summary
BUILD_END=$(date +%s)
BUILD_TOTAL_TIME=$((BUILD_END - BUILD_START))

echo ""
echo "✅ Build completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Build Summary:"
echo "   Total time: ${BUILD_TOTAL_TIME}s"
echo "   Client: ${BUILD_CLIENT_TIME}s"
echo "   Server: ${BUILD_SERVER_TIME}s"
echo "   Node.js: $(node --version)"
echo "   Environment: ${NODE_ENV:-production}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

