#!/bin/bash
# QIVO Mining v1.2.0 - Smoke Tests
# Validates critical endpoints in production

set -e

BASE_URL="${1:-https://qivo-mining.onrender.com}"
FAILED=0
TOTAL=0

echo "🧪 QIVO Mining v1.2.0 - Smoke Tests"
echo "Testing: $BASE_URL"
echo "========================================"
echo ""

# Test function
test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status="${3:-200}"
  
  TOTAL=$((TOTAL + 1))
  echo -n "[$TOTAL] Testing $name... "
  
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
  
  if [ "$status" = "$expected_status" ]; then
    echo "✅ PASS ($status)"
  else
    echo "❌ FAIL (expected $expected_status, got $status)"
    FAILED=$((FAILED + 1))
  fi
}

# Frontend Tests
echo "📱 Frontend Tests"
echo "---"
test_endpoint "Homepage" "$BASE_URL/"
test_endpoint "Login Page" "$BASE_URL/login"
test_endpoint "Register Page" "$BASE_URL/register"
test_endpoint "Pricing Page" "$BASE_URL/pricing"
echo ""

# API Health Checks
echo "🏥 Health Check APIs"
echo "---"
test_endpoint "System Health" "$BASE_URL/api/health"
test_endpoint "tRPC Health" "$BASE_URL/api/trpc/system.health"
echo ""

# Admin APIs (will return 401 without auth, which is expected)
echo "🔐 Admin APIs (Auth Required)"
echo "---"
test_endpoint "Admin Stats" "$BASE_URL/api/admin/stats" "401"
test_endpoint "Admin Users" "$BASE_URL/api/admin/users" "401"
test_endpoint "Admin Costs" "$BASE_URL/api/admin/costs" "401"
test_endpoint "Admin Profit" "$BASE_URL/api/admin/profit" "401"
test_endpoint "Admin Revenue" "$BASE_URL/api/admin/revenue" "401"
test_endpoint "Admin Subscriptions" "$BASE_URL/api/admin/subscriptions" "401"
echo ""

# Payment APIs (will return 400/401 without proper payload, which is expected)
echo "💳 Payment APIs"
echo "---"
test_endpoint "Stripe Checkout" "$BASE_URL/api/payment/checkout" "400"
test_endpoint "Stripe One-Time" "$BASE_URL/api/payment/one-time" "400"
echo ""

# Static Assets
echo "📦 Static Assets"
echo "---"
test_endpoint "Qivo Logo" "$BASE_URL/assets/logo-Qivo.png"
test_endpoint "Favicon" "$BASE_URL/favicon.ico"
echo ""

# Summary
echo "========================================"
echo "📊 Test Summary"
echo "---"
echo "Total Tests: $TOTAL"
echo "Passed: $((TOTAL - FAILED))"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "✅ All smoke tests passed!"
  exit 0
else
  echo "❌ $FAILED test(s) failed"
  exit 1
fi

