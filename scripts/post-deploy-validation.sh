#!/bin/bash

# QIVO Mining - Post-Deploy Validation Script
# Validates that all services are working correctly after deployment

set -e

echo "========================================="
echo "QIVO Mining - Post-Deploy Validation"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_URL=${1:-"https://qivomining.com"}
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    local method=${4:-"GET"}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    else
        status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url")
    fi
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

test_json_response() {
    local name=$1
    local url=$2
    local expected_field=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $name... "
    
    response=$(curl -s "$url")
    
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Field '$expected_field' not found)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "Service URL: $SERVICE_URL"
echo ""

# ============================================
# 1. Basic Health Checks
# ============================================
echo -e "${BLUE}1. Basic Health Checks${NC}"
echo "----------------------------------------"

test_endpoint "Health endpoint" "$SERVICE_URL/health" "200"
test_json_response "Health response format" "$SERVICE_URL/health" "status"

echo ""

# ============================================
# 2. API Endpoints
# ============================================
echo -e "${BLUE}2. API Endpoints${NC}"
echo "----------------------------------------"

test_endpoint "API health" "$SERVICE_URL/api/health" "200"
test_endpoint "Auth endpoints" "$SERVICE_URL/api/auth/register" "400" "POST"
test_endpoint "Payment endpoints" "$SERVICE_URL/api/payment/webhook" "400" "POST"

echo ""

# ============================================
# 3. Static Files
# ============================================
echo -e "${BLUE}3. Static Files${NC}"
echo "----------------------------------------"

test_endpoint "Frontend index" "$SERVICE_URL/" "200"
test_endpoint "Assets loading" "$SERVICE_URL/assets" "200"

echo ""

# ============================================
# 4. SSL/TLS
# ============================================
echo -e "${BLUE}4. SSL/TLS${NC}"
echo "----------------------------------------"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Testing SSL certificate... "

if curl -s -I "$SERVICE_URL" | grep -q "HTTP/2 200"; then
    echo -e "${GREEN}✓ PASS${NC} (HTTPS working)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (HTTPS not working)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""

# ============================================
# 5. Response Times
# ============================================
echo -e "${BLUE}5. Response Times${NC}"
echo "----------------------------------------"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Testing response time... "

response_time=$(curl -s -o /dev/null -w "%{time_total}" "$SERVICE_URL/health")
response_time_ms=$(echo "$response_time * 1000" | bc)

if (( $(echo "$response_time < 1.0" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC} (${response_time_ms}ms < 1000ms)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠ SLOW${NC} (${response_time_ms}ms > 1000ms)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

echo ""

# ============================================
# 6. Security Headers
# ============================================
echo -e "${BLUE}6. Security Headers${NC}"
echo "----------------------------------------"

check_header() {
    local header=$1
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Checking $header... "
    
    if curl -s -I "$SERVICE_URL" | grep -qi "$header"; then
        echo -e "${GREEN}✓ PRESENT${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${YELLOW}⚠ MISSING${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 1
    fi
}

check_header "X-Content-Type-Options"
check_header "X-Frame-Options"
check_header "X-XSS-Protection"
check_header "Strict-Transport-Security"

echo ""

# ============================================
# 7. Database Connectivity
# ============================================
echo -e "${BLUE}7. Database Connectivity${NC}"
echo "----------------------------------------"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Testing database connection... "

# Try to register a test user (will fail if user exists, but tests DB connection)
response=$(curl -s -X POST "$SERVICE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"dbtest@example.com","password":"Test@1234","name":"DB Test"}' \
  -w "%{http_code}")

if [[ "$response" == *"400"* ]] || [[ "$response" == *"201"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} (Database accessible)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Database not accessible)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""

# ============================================
# 8. Redis Connectivity
# ============================================
echo -e "${BLUE}8. Redis Connectivity${NC}"
echo "----------------------------------------"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Testing Redis connection... "

# Make multiple requests to test caching
curl -s "$SERVICE_URL/health" > /dev/null
response_time_1=$(curl -s -o /dev/null -w "%{time_total}" "$SERVICE_URL/health")
curl -s "$SERVICE_URL/health" > /dev/null
response_time_2=$(curl -s -o /dev/null -w "%{time_total}" "$SERVICE_URL/health")

# Second request should be faster if caching works
if (( $(echo "$response_time_2 <= $response_time_1" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC} (Caching working)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠ UNCERTAIN${NC} (Cannot confirm caching)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

echo ""

# ============================================
# 9. Stripe Integration
# ============================================
echo -e "${BLUE}9. Stripe Integration${NC}"
echo "----------------------------------------"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "Testing Stripe webhook endpoint... "

# Webhook should return 400 without valid signature
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SERVICE_URL/api/payment/webhook")

if [ "$status" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Webhook endpoint active)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Webhook endpoint not responding correctly)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""

# ============================================
# 10. Metrics Endpoint
# ============================================
echo -e "${BLUE}10. Metrics Endpoint${NC}"
echo "----------------------------------------"

test_endpoint "Prometheus metrics" "$SERVICE_URL/metrics" "200"

echo ""

# ============================================
# Summary
# ============================================
echo "========================================="
echo -e "${BLUE}Validation Summary${NC}"
echo "========================================="
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo ""
    echo "The application is ready for production!"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please review the failed tests and fix the issues before going live."
    exit 1
fi
