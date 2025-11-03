#!/bin/bash
# Pre-build script to ensure pnpm is available
set -e

echo "🔧 Pre-build: Installing pnpm"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if pnpm is already installed
if command -v pnpm &> /dev/null; then
    echo "✅ pnpm already installed: $(pnpm --version)"
else
    echo "📦 Installing pnpm globally..."
    npm install -g pnpm@10.4.1
    echo "✅ pnpm installed: $(pnpm --version)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Now run the actual build
echo "🚀 Running build.sh..."
bash build.sh
