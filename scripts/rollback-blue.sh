#!/bin/bash
#
# Rollback to Blue - QIVO Mining v1.2.0
# 
# Usage: ./scripts/rollback-blue.sh
#
# This script rolls back production traffic from green to blue environment.
#

set -e  # Exit on error

echo "⏪ Rolling back to BLUE environment"
echo ""

BLUE_ENV="qivo-mining"
GREEN_ENV="qivo-mining-green"

# Confirmation prompt
echo "⚠️  WARNING: This will rollback production traffic to BLUE environment"
echo ""
echo "Current state:"
echo "  GREEN (active):  $GREEN_ENV"
echo "  BLUE (standby): $BLUE_ENV"
echo ""
read -p "Are you sure you want to rollback? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
  echo "❌ Rollback cancelled"
  exit 1
fi

echo ""
echo "🔄 Rolling back traffic..."
echo ""

# Step 1: Update DNS/Load Balancer
echo "1️⃣  Updating routing configuration..."
echo "⚠️  Note: This requires manual configuration in Render.com dashboard"
echo "   1. Go to https://dashboard.render.com/"
echo "   2. Navigate to your service settings"
echo "   3. Update the primary service to: $BLUE_ENV"
echo ""
read -p "Press Enter after completing the routing update..."

# Step 2: Verify rollback
echo ""
echo "2️⃣  Verifying rollback..."
sleep 5

response=$(curl -s "https://qivo-mining.onrender.com/api/trpc/system.info" || echo "{}")
if echo "$response" | grep -q "version"; then
  echo "✅ Traffic successfully rolled back to BLUE"
else
  echo "❌ Rollback verification failed"
  exit 1
fi

# Step 3: Health check
echo ""
echo "3️⃣  Running health check on BLUE..."
./scripts/health-check.sh "$BLUE_ENV"

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Health check failed on BLUE!"
  echo "CRITICAL: Both environments may be unhealthy"
  exit 1
fi

echo ""
echo "✅ Rollback completed successfully!"
echo ""
echo "📊 Summary:"
echo "  - Primary (restored): $BLUE_ENV"
echo "  - Standby: $GREEN_ENV"
echo ""
echo "You can investigate issues in GREEN and redeploy when ready."
echo ""

