#!/bin/bash
set -e

echo "🔧 ComplianceCore Mining™ - Build Script"
echo "=========================================="

# Limitar memória do Node.js para evitar out of memory
export NODE_OPTIONS="--max-old-space-size=4096"

echo "📦 Installing dependencies..."
pnpm install

echo "🧹 Cleaning old build..."
rm -rf dist/

echo "🎨 Building client..."
pnpm vite build

echo "🚀 Building server..."
pnpm esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"

