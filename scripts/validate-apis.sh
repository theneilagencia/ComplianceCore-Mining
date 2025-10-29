#!/bin/bash
# QIVO Mining v1.2.x - API Validation Script
# Testa todas as rotas críticas e gera relatório

set -e

BASE_URL="${1:-https://qivo-mining.onrender.com}"
REPORT_FILE="/tmp/api_validation_report.txt"

echo "🔍 QIVO Mining v1.2.x - API Validation" > "$REPORT_FILE"
echo "========================================" >> "$REPORT_FILE"
echo "Base URL: $BASE_URL" >> "$REPORT_FILE"
echo "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    echo -n "Testing $name... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        echo "✅ $name - HTTP $status" >> "$REPORT_FILE"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $status, expected $expected_status)"
        echo "❌ $name - HTTP $status (expected $expected_status)" >> "$REPORT_FILE"
        ((FAIL++))
    fi
}

echo "📡 Testing API Endpoints..."
echo ""

# Core Health
test_endpoint "Health Check" "$BASE_URL/api/health" 200

# tRPC Endpoints
test_endpoint "tRPC Health" "$BASE_URL/api/trpc/system.health" 200

# Radar Module
test_endpoint "Radar Events" "$BASE_URL/api/radar/events" 401

# Reports Module  
test_endpoint "Reports List" "$BASE_URL/api/reports" 401

# KRCI Audit Module
test_endpoint "KRCI Audit" "$BASE_URL/api/krciaudit/check" 404

# Bridge Module
test_endpoint "Bridge Convert" "$BASE_URL/api/bridge/convert" 404

# Payment/Stripe
test_endpoint "Stripe Checkout" "$BASE_URL/api/payment/checkout" 400
test_endpoint "Stripe One-Time" "$BASE_URL/api/payment/one-time" 400
test_endpoint "Stripe Webhooks" "$BASE_URL/api/stripe/webhooks" 400

# Admin Core
test_endpoint "Admin Stats" "$BASE_URL/api/admin/stats" 401
test_endpoint "Admin Costs" "$BASE_URL/api/admin/costs" 401
test_endpoint "Admin Profit" "$BASE_URL/api/admin/profit" 401

# Frontend Pages
test_endpoint "Homepage" "$BASE_URL/" 200
test_endpoint "Login Page" "$BASE_URL/login" 200
test_endpoint "Dashboard" "$BASE_URL/dashboard" 200

echo ""
echo "========================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "📊 Summary:" >> "$REPORT_FILE"
echo "  Total tests: $((PASS + FAIL))" >> "$REPORT_FILE"
echo "  Passed: $PASS" >> "$REPORT_FILE"
echo "  Failed: $FAIL" >> "$REPORT_FILE"
echo "  Success rate: $(awk "BEGIN {printf \"%.1f\", ($PASS/($PASS+$FAIL))*100}")%" >> "$REPORT_FILE"

echo ""
echo "📊 Summary:"
echo -e "  Total tests: $((PASS + FAIL))"
echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"
echo -e "  Success rate: $(awk "BEGIN {printf \"%.1f\", ($PASS/($PASS+$FAIL))*100}")%"

echo ""
echo "📄 Full report saved to: $REPORT_FILE"

cat "$REPORT_FILE"

exit 0

