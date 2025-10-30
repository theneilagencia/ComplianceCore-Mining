#!/bin/bash
set -e

echo "🔧 ComplianceCore Mining™ - Optimized Build Script"
echo "=========================================="

# Limitar memória do Node.js para evitar out of memory
export NODE_OPTIONS="--max-old-space-size=4096"

# FORÇA LIMPEZA COMPLETA - Remove cache e node_modules
echo "🧹 Cleaning cache and node_modules..."
rm -rf node_modules/ || true
rm -rf .pnpm-store/ || true

echo "📦 Installing dependencies (clean install)..."
pnpm install --frozen-lockfile --no-optional

echo "🧹 Cleaning old build..."
rm -rf dist/

echo "🎨 Building client..."
pnpm vite build

echo "🚀 Building server..."
pnpm esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"

