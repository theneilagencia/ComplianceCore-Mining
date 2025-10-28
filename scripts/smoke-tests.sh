#!/bin/bash
#
# Smoke Tests Script - QIVO Mining v1.2.0
# 
# Usage: ./scripts/smoke-tests.sh [environment]
# Example: ./scripts/smoke-tests.sh qivo-mining-green
#

set -e  # Exit on error

ENVIRONMENT=${1:-qivo-mining}
BASE_URL="https://${ENVIRONMENT}.onrender.com"

echo "🧪 Running smoke tests for: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo ""

# Track failures
FAILED=0

# Function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local description=$3
  local expected_pattern=$4
  
  echo -n "  Testing $description... "
  
  response=$(curl -s -X "$method" "$BASE_URL$endpoint")
  
  if echo "$response" | grep -q "$expected_pattern"; then
    echo "✅ PASS"
    return 0
  else
    echo "❌ FAIL"
    echo "    Expected pattern: $expected_pattern"
    echo "    Got: ${response:0:100}..."
    return 1
  fi
}

# 1. System endpoints
echo "1️⃣  System Endpoints:"
test_endpoint "GET" "/api/trpc/system.info" "System info" '"version"' || ((FAILED++))
test_endpoint "GET" "/api/trpc/system.health" "System health" '"status":"ok"' || ((FAILED++))
echo ""

# 2. Authentication flow
echo "2️⃣  Authentication Flow:"
test_endpoint "GET" "/login" "Login page" "QIVO Mining" || ((FAILED++))
test_endpoint "GET" "/register" "Register page" "Create" || ((FAILED++))
echo ""

# 3. Module availability
echo "3️⃣  Module Availability:"
test_endpoint "GET" "/dashboard" "Dashboard" "Dashboard\|Login" || ((FAILED++))
test_endpoint "GET" "/reports/generate" "Generate Report" "Generate\|Login" || ((FAILED++))
test_endpoint "GET" "/reports/audit" "KRCI Audit" "KRCI\|Audit\|Login" || ((FAILED++))
test_endpoint "GET" "/reports/esg" "ESG Reporting" "ESG\|Login" || ((FAILED++))
test_endpoint "GET" "/reports/valuation" "Valuation" "Valuation\|Login" || ((FAILED++))
echo ""

# 4. API integrations status
echo "4️⃣  API Integrations:"
echo -n "  Checking integrations status... "
integrations=$(curl -s "$BASE_URL/api/trpc/integrations.getStatus" || echo "{}")
if echo "$integrations" | grep -q "ibama"; then
  echo "✅ Available"
else
  echo "⚠️  Not available (non-critical)"
fi
echo ""

# 5. Billing integration
echo "5️⃣  Billing Integration:"
echo -n "  Checking Stripe status... "
billing=$(curl -s "$BASE_URL/api/trpc/billing.getStatus" || echo "{}")
if echo "$billing" | grep -q "enabled\|mock"; then
  echo "✅ Available"
else
  echo "⚠️  Not available (non-critical)"
fi
echo ""

# 6. Storage integration
echo "6️⃣  Storage Integration:"
echo -n "  Checking S3 status... "
storage=$(curl -s "$BASE_URL/api/trpc/storage.getStatus" || echo "{}")
if echo "$storage" | grep -q "bucket\|mock"; then
  echo "✅ Available"
else
  echo "⚠️  Not available (non-critical)"
fi
echo ""

# 7. PWA features
echo "7️⃣  PWA Features:"
test_endpoint "GET" "/manifest.json" "PWA Manifest" '"name":"QIVO Mining"' || ((FAILED++))
test_endpoint "GET" "/sw.js" "Service Worker" "Service Worker" || ((FAILED++))
echo ""

# 8. i18n support
echo "8️⃣  Internationalization:"
echo -n "  Checking i18n support... "
homepage=$(curl -s "$BASE_URL/")
if echo "$homepage" | grep -q "pt\|en\|es\|fr"; then
  echo "✅ Available"
else
  echo "⚠️  Not detected (non-critical)"
fi
echo ""

# 9. Dark mode support
echo "9️⃣  Dark Mode:"
echo -n "  Checking dark mode support... "
if echo "$homepage" | grep -q "dark\|theme"; then
  echo "✅ Available"
else
  echo "⚠️  Not detected (non-critical)"
fi
echo ""

# 10. Performance check
echo "🔟 Performance Check:"
echo -n "  Measuring page load time... "
start_time=$(date +%s%N)
curl -s -o /dev/null "$BASE_URL/"
end_time=$(date +%s%N)
load_time=$(( (end_time - start_time) / 1000000 ))

if [ $load_time -lt 5000 ]; then
  echo "✅ ${load_time}ms (< 5s)"
elif [ $load_time -lt 10000 ]; then
  echo "⚠️  ${load_time}ms (5-10s, acceptable)"
else
  echo "❌ ${load_time}ms (> 10s, too slow)"
  ((FAILED++))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
  echo "✅ All smoke tests passed!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo "❌ $FAILED smoke test(s) failed!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi

