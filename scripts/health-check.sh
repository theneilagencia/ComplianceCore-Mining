#!/bin/bash
#
# Health Check Script - QIVO Mining v1.2.0
# 
# Usage: ./scripts/health-check.sh [environment]
# Example: ./scripts/health-check.sh qivo-mining-green
#

set -e  # Exit on error

ENVIRONMENT=${1:-qivo-mining}
BASE_URL="https://${ENVIRONMENT}.onrender.com"

echo "🏥 Running health checks for: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo ""

# Function to check endpoint
check_endpoint() {
  local endpoint=$1
  local expected_status=${2:-200}
  local description=$3
  
  echo -n "  Checking $description... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" || echo "000")
  
  if [ "$response" = "$expected_status" ]; then
    echo "✅ OK ($response)"
    return 0
  else
    echo "❌ FAILED (got $response, expected $expected_status)"
    return 1
  fi
}

# Track failures
FAILED=0

# 1. Basic health check
echo "1️⃣  Basic Health Checks:"
check_endpoint "/" "200" "Homepage" || ((FAILED++))
check_endpoint "/api/health" "200" "API Health" || ((FAILED++))
check_endpoint "/api/trpc/system.health" "200" "tRPC Health" || ((FAILED++))
echo ""

# 2. Authentication endpoints
echo "2️⃣  Authentication Endpoints:"
check_endpoint "/api/auth/me" "401" "Auth endpoint (unauthenticated)" || ((FAILED++))
check_endpoint "/login" "200" "Login page" || ((FAILED++))
echo ""

# 3. Static assets
echo "3️⃣  Static Assets:"
check_endpoint "/favicon.ico" "200" "Favicon" || ((FAILED++))
check_endpoint "/manifest.json" "200" "PWA Manifest" || ((FAILED++))
check_endpoint "/sw.js" "200" "Service Worker" || ((FAILED++))
echo ""

# 4. API endpoints (public)
echo "4️⃣  Public API Endpoints:"
check_endpoint "/api/trpc/system.info" "200" "System info" || ((FAILED++))
echo ""

# 5. Database connectivity
echo "5️⃣  Database Connectivity:"
echo -n "  Checking database connection... "
db_check=$(curl -s "$BASE_URL/api/trpc/system.health" | grep -o '"database":"connected"' || echo "")
if [ -n "$db_check" ]; then
  echo "✅ Connected"
else
  echo "❌ FAILED"
  ((FAILED++))
fi
echo ""

# 6. Response time check
echo "6️⃣  Response Time Check:"
echo -n "  Measuring response time... "
start_time=$(date +%s%N)
curl -s -o /dev/null "$BASE_URL/"
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 3000 ]; then
  echo "✅ ${response_time}ms (< 3s)"
else
  echo "⚠️  ${response_time}ms (> 3s, slow)"
  ((FAILED++))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
  echo "✅ All health checks passed!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo "❌ $FAILED health check(s) failed!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi

