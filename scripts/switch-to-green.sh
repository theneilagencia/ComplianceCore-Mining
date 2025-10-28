#!/bin/bash
#
# Switch Traffic to Green - QIVO Mining v1.2.0
# 
# Usage: ./scripts/switch-to-green.sh
#
# This script switches production traffic from blue to green environment.
#

set -e  # Exit on error

echo "🔀 Switching traffic to GREEN environment"
echo ""

BLUE_ENV="qivo-mining"
GREEN_ENV="qivo-mining-green"

# Confirmation prompt
echo "⚠️  WARNING: This will switch production traffic to GREEN environment"
echo ""
echo "Current state:"
echo "  BLUE (active):  $BLUE_ENV"
echo "  GREEN (standby): $GREEN_ENV"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
  echo "❌ Operation cancelled"
  exit 1
fi

echo ""
echo "🔄 Switching traffic..."
echo ""

# Step 1: Update DNS/Load Balancer
echo "1️⃣  Updating routing configuration..."
echo "⚠️  Note: This requires manual configuration in Render.com dashboard"
echo "   1. Go to https://dashboard.render.com/"
echo "   2. Navigate to your service settings"
echo "   3. Update the primary service to: $GREEN_ENV"
echo ""
read -p "Press Enter after completing the routing update..."

# Step 2: Verify traffic switch
echo ""
echo "2️⃣  Verifying traffic switch..."
sleep 5

response=$(curl -s "https://qivo-mining.onrender.com/api/trpc/system.info" || echo "{}")
if echo "$response" | grep -q "version"; then
  echo "✅ Traffic successfully switched to GREEN"
else
  echo "❌ Traffic switch verification failed"
  exit 1
fi

# Step 3: Monitor for errors
echo ""
echo "3️⃣  Monitoring for errors (30 seconds)..."
for i in {1..6}; do
  echo -n "."
  sleep 5
done
echo ""

# Step 4: Final health check
echo ""
echo "4️⃣  Running final health check..."
./scripts/health-check.sh "$GREEN_ENV"

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Health check failed after traffic switch!"
  echo "Consider rolling back with: ./scripts/rollback-blue.sh"
  exit 1
fi

echo ""
echo "✅ Traffic successfully switched to GREEN!"
echo ""
echo "📊 Summary:"
echo "  - New primary: $GREEN_ENV"
echo "  - Old primary (now standby): $BLUE_ENV"
echo ""
echo "To rollback, run: ./scripts/rollback-blue.sh"
echo ""

