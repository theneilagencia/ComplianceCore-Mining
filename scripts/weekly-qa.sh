#!/bin/bash

###############################################################################
# QIVO Mining - Weekly QA Script
# 
# Executa verificações completas de qualidade, segurança e funcionalidade
# Uso: ./scripts/weekly-qa.sh
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         QIVO Mining - Weekly QA Automation                ║${NC}"
echo -e "${BLUE}║         $(date '+%Y-%m-%d %H:%M:%S %Z')                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# 1. Environment Check
###############################################################################
echo -e "${BLUE}[1/10]${NC} Verificando ambiente..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado${NC}"
    ((FAILED++))
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
    ((PASSED++))
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não encontrado${NC}"
    ((FAILED++))
else
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
    ((PASSED++))
fi

echo ""

###############################################################################
# 2. Dependencies Check
###############################################################################
echo -e "${BLUE}[2/10]${NC} Verificando dependências..."

cd "$(dirname "$0")/.."

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules não encontrado. Instalando...${NC}"
    npm ci
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
    ((PASSED++))
fi

echo ""

###############################################################################
# 3. TypeScript Check
###############################################################################
echo -e "${BLUE}[3/10]${NC} Verificando TypeScript..."

if npx tsc --noEmit 2>&1 | grep -q "error"; then
    echo -e "${RED}❌ Erros de TypeScript encontrados${NC}"
    ((FAILED++))
else
    echo -e "${GREEN}✅ TypeScript OK${NC}"
    ((PASSED++))
fi

echo ""

###############################################################################
# 4. ESLint Check
###############################################################################
echo -e "${BLUE}[4/10]${NC} Verificando ESLint..."

if npm run lint 2>&1 | grep -q "error"; then
    echo -e "${YELLOW}⚠️  Warnings do ESLint encontrados${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ ESLint OK${NC}"
    ((PASSED++))
fi

echo ""

###############################################################################
# 5. Build Check
###############################################################################
echo -e "${BLUE}[5/10]${NC} Verificando build..."

cd client
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Build failed${NC}"
    ((FAILED++))
fi
cd ..

echo ""

###############################################################################
# 6. Security Audit
###############################################################################
echo -e "${BLUE}[6/10]${NC} Verificando segurança..."

AUDIT_OUTPUT=$(npm audit --audit-level=high 2>&1 || true)

if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
    echo -e "${GREEN}✅ Sem vulnerabilidades críticas${NC}"
    ((PASSED++))
elif echo "$AUDIT_OUTPUT" | grep -q "vulnerabilities"; then
    echo -e "${YELLOW}⚠️  Vulnerabilidades encontradas${NC}"
    echo "$AUDIT_OUTPUT" | grep "vulnerabilities"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ Security audit OK${NC}"
    ((PASSED++))
fi

echo ""

###############################################################################
# 7. Outdated Dependencies
###############################################################################
echo -e "${BLUE}[7/10]${NC} Verificando dependências desatualizadas..."

OUTDATED=$(npm outdated 2>&1 || true)

if [ -z "$OUTDATED" ]; then
    echo -e "${GREEN}✅ Todas as dependências estão atualizadas${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Dependências desatualizadas encontradas${NC}"
    echo "$OUTDATED" | head -5
    ((WARNINGS++))
fi

echo ""

###############################################################################
# 8. Git Status
###############################################################################
echo -e "${BLUE}[8/10]${NC} Verificando Git status..."

if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Mudanças não commitadas encontradas${NC}"
    git status --short
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ Working tree clean${NC}"
    ((PASSED++))
fi

echo ""

###############################################################################
# 9. Production URL Check
###############################################################################
echo -e "${BLUE}[9/10]${NC} Verificando produção..."

PROD_URL="https://qivo-mining.onrender.com"

if curl -s --head "$PROD_URL" | grep "200 OK" > /dev/null; then
    echo -e "${GREEN}✅ Produção online: $PROD_URL${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Produção offline ou erro${NC}"
    ((FAILED++))
fi

echo ""

###############################################################################
# 10. Module Routes Check
###############################################################################
echo -e "${BLUE}[10/10]${NC} Verificando rotas dos módulos..."

ROUTES=(
    "/dashboard"
    "/reports/generate"
    "/reports/create"
    "/reports/export"
    "/reports/regulatory"
    "/reports/audit"
    "/reports/precert"
    "/reports/esg"
    "/reports/valuation"
    "/admin"
    "/subscription"
)

ROUTES_OK=0
ROUTES_FAIL=0

for route in "${ROUTES[@]}"; do
    if grep -q "$route" client/src/App.tsx; then
        ((ROUTES_OK++))
    else
        echo -e "${RED}❌ Rota não encontrada: $route${NC}"
        ((ROUTES_FAIL++))
    fi
done

if [ $ROUTES_FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ Todas as ${#ROUTES[@]} rotas configuradas${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ $ROUTES_FAIL rotas faltando${NC}"
    ((FAILED++))
fi

echo ""

###############################################################################
# Summary
###############################################################################
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    QA SUMMARY                              ║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} ${GREEN}✅ Passed:${NC}   $PASSED                                            ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} ${RED}❌ Failed:${NC}   $FAILED                                            ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} ${YELLOW}⚠️  Warnings:${NC} $WARNINGS                                            ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Exit code
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ QA FAILED - Correções necessárias${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  QA PASSED WITH WARNINGS${NC}"
    exit 0
else
    echo -e "${GREEN}✅ QA PASSED - Tudo OK!${NC}"
    exit 0
fi

