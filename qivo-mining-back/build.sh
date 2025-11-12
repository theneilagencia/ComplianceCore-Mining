#!/bin/bash
set -e

echo "🔧 QIVO Mining Backend - Build Script"
echo "====================================="
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

# Clean old build artifacts (aggressive)
echo "🧹 Cleaning old build..."
rm -rf dist/
rm -rf .esbuild/ 2>/dev/null || true
# Limpar qualquer cache do esbuild
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
echo "✅ Build cache cleared (incluindo cache do esbuild)"

# Build server (esbuild)
echo "🚀 Building server..."
BUILD_SERVER_START=$(date +%s)
node esbuild.config.js
BUILD_SERVER_END=$(date +%s)
BUILD_SERVER_TIME=$((BUILD_SERVER_END - BUILD_SERVER_START))
echo "✅ Server built in ${BUILD_SERVER_TIME}s"

# Validate build outputs
echo "🔍 Validating build outputs..."
if [ ! -f "dist/index.js" ]; then
  echo "❌ ERROR: Server build failed - dist/index.js not found"
  exit 1
fi
echo "✅ Build outputs validated"

# Build summary
BUILD_END=$(date +%s)
BUILD_TOTAL_TIME=$((BUILD_END - BUILD_START))

echo ""
echo "✅ Build completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Build Summary:"
echo "   Total time: ${BUILD_TOTAL_TIME}s"
echo "   Server: ${BUILD_SERVER_TIME}s"
echo "   Node.js: $(node --version)"
echo "   Environment: ${NODE_ENV:-production}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

