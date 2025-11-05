#!/bin/bash

# Run All Tests Script
# Executes all test suites and generates comprehensive report

set -e

echo "========================================="
echo "QIVO Mining - Comprehensive Test Suite"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Create test results directory
mkdir -p test-results

echo "1. Running Unit Tests..."
echo "----------------------------------------"
if pnpm test:unit 2>&1 | tee test-results/unit-tests.log; then
    echo -e "${GREEN}✓ Unit tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Unit tests failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "2. Running E2E Tests - Authentication..."
echo "----------------------------------------"
if pnpm test tests/e2e/auth.test.ts 2>&1 | tee test-results/e2e-auth.log; then
    echo -e "${GREEN}✓ Authentication E2E tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Authentication E2E tests failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "3. Running E2E Tests - Reports..."
echo "----------------------------------------"
if pnpm test tests/e2e/reports.test.ts 2>&1 | tee test-results/e2e-reports.log; then
    echo -e "${GREEN}✓ Reports E2E tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Reports E2E tests failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "4. Running E2E Tests - Integrations..."
echo "----------------------------------------"
if pnpm test tests/e2e/integrations.test.ts 2>&1 | tee test-results/e2e-integrations.log; then
    echo -e "${GREEN}✓ Integrations E2E tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Integrations E2E tests failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "5. Running E2E Tests - Payments..."
echo "----------------------------------------"
if pnpm test tests/e2e/payments.test.ts 2>&1 | tee test-results/e2e-payments.log; then
    echo -e "${GREEN}✓ Payments E2E tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Payments E2E tests failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "6. Running Accessibility Tests..."
echo "----------------------------------------"
if pnpm test tests/accessibility/a11y.test.ts 2>&1 | tee test-results/accessibility.log; then
    echo -e "${GREEN}✓ Accessibility tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ Accessibility tests failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "========================================="
echo "TEST SUMMARY"
echo "========================================="
echo "Total Test Suites: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo "Platform is ready for production."
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED!${NC}"
    echo "Please review test-results/ directory for details."
    exit 1
fi
