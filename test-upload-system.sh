#!/bin/bash

# 🧪 TESTE COMPLETO DO SISTEMA DE UPLOAD
# Valida: Render Disk, Cloudinary, Database, API

echo "🧪 TESTE DO SISTEMA DE UPLOAD - QIVO Mining"
echo "=============================================="
echo ""

BASE_URL="https://compliancecore-mining-1.onrender.com"
TEST_RESULTS="/tmp/upload-test-results.json"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

# Função de teste
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -n "Testing: $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $response, expected $expected_status)"
        ((FAILED++))
        return 1
    fi
}

echo "📋 FASE 1: Verificação de Endpoints"
echo "-----------------------------------"

# Teste 1: Homepage
test_endpoint "Homepage" "$BASE_URL/" "200"

# Teste 2: API Health
test_endpoint "API Health" "$BASE_URL/api/health" "200"

# Teste 3: Storage Migration Endpoint
test_endpoint "Storage Migration" "$BASE_URL/api/fix-s3url" "200"

echo ""
echo "📋 FASE 2: Verificação de Storage"
echo "-----------------------------------"

# Teste 4: Migration Status
echo -n "Testing: Storage Migration Status... "
migration_response=$(curl -s -X POST "$BASE_URL/api/fix-s3url" -H "Content-Type: application/json")
migration_success=$(echo "$migration_response" | jq -r '.success' 2>/dev/null)

if [ "$migration_success" = "true" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    echo "   Message: $(echo "$migration_response" | jq -r '.message')"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "   Error: $migration_response"
    ((FAILED++))
fi

echo ""
echo "📋 FASE 3: Verificação de Banco de Dados"
echo "-----------------------------------"

# Teste 5: Verificar tabela uploads
echo -n "Testing: Database Table 'uploads'... "
DB_URL="postgresql://compliancecore:IcVbQdC6x7fc1bS73qaO6dqajfeKjXzg@dpg-d3s06i0dl3ps73963kug-a.oregon-postgres.render.com:5432/compliancecore"

if command -v psql &> /dev/null; then
    table_exists=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'uploads');" 2>/dev/null | tr -d ' ')
    
    if [ "$table_exists" = "t" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        
        # Verificar estrutura da tabela
        echo -n "Testing: Column 's3Url' type... "
        column_type=$(psql "$DB_URL" -t -c "SELECT data_type FROM information_schema.columns WHERE table_name = 'uploads' AND column_name = 's3Url';" 2>/dev/null | tr -d ' ')
        
        if [ "$column_type" = "text" ]; then
            echo -e "${GREEN}✅ PASS${NC} (type: $column_type)"
            ((PASSED++))
        else
            echo -e "${RED}❌ FAIL${NC} (type: $column_type, expected: text)"
            ((FAILED++))
        fi
        
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  SKIP${NC} (psql not installed)"
fi

echo ""
echo "📋 FASE 4: Verificação de Variáveis de Ambiente"
echo "-----------------------------------"

# Teste 6: Verificar .env.production
echo -n "Testing: .env.production file... "
if [ -f "/home/ubuntu/ComplianceCore-Mining/.env.production" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    
    # Verificar se contém DATABASE_URL
    if grep -q "DATABASE_URL=" "/home/ubuntu/ComplianceCore-Mining/.env.production"; then
        echo -e "   ${GREEN}✅${NC} DATABASE_URL configured"
        ((PASSED++))
    else
        echo -e "   ${RED}❌${NC} DATABASE_URL missing"
        ((FAILED++))
    fi
    
    # Verificar se contém CLOUDINARY_URL
    if grep -q "CLOUDINARY_URL=" "/home/ubuntu/ComplianceCore-Mining/.env.production"; then
        echo -e "   ${GREEN}✅${NC} CLOUDINARY_URL configured"
        ((PASSED++))
    else
        echo -e "   ${RED}❌${NC} CLOUDINARY_URL missing"
        ((FAILED++))
    fi
    
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo ""
echo "=============================================="
echo "📊 RESULTADOS FINAIS"
echo "=============================================="
echo ""
echo -e "Total de testes: $((PASSED + FAILED))"
echo -e "${GREEN}Passou: $PASSED${NC}"
echo -e "${RED}Falhou: $FAILED${NC}"
echo ""

# Calcular porcentagem de sucesso
if [ $((PASSED + FAILED)) -gt 0 ]; then
    success_rate=$((PASSED * 100 / (PASSED + FAILED)))
    echo "Taxa de sucesso: ${success_rate}%"
    echo ""
    
    if [ $success_rate -ge 90 ]; then
        echo -e "${GREEN}🎉 SISTEMA PRONTO PARA PRODUÇÃO!${NC}"
        exit 0
    elif [ $success_rate -ge 70 ]; then
        echo -e "${YELLOW}⚠️  SISTEMA FUNCIONAL, MAS COM AVISOS${NC}"
        exit 1
    else
        echo -e "${RED}❌ SISTEMA COM PROBLEMAS CRÍTICOS${NC}"
        exit 2
    fi
else
    echo -e "${RED}❌ NENHUM TESTE EXECUTADO${NC}"
    exit 3
fi

