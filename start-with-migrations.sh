#!/bin/bash
set -e

echo "🔧 Ensuring database tables..."
pnpm tsx scripts/ensure-tables.ts

echo "🚀 Starting application..."
exec pnpm run start
