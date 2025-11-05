#!/bin/bash

# Script de Teste da Integração Stripe - QIVO Mining
# Este script valida a configuração e funcionalidade básica do Stripe

set -e

echo "=========================================="
echo "TESTE DA INTEGRAÇÃO STRIPE - QIVO MINING"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar variável de ambiente
check_env() {
  local var_name=$1
  local var_value="${!var_name}"
  
  if [ -z "$var_value" ]; then
    echo -e "${RED}✗${NC} $var_name não configurada"
    return 1
  else
    # Mostrar apenas primeiros 10 caracteres
    local preview="${var_value:0:10}..."
    echo -e "${GREEN}✓${NC} $var_name configurada ($preview)"
    return 0
  fi
}

# Carregar variáveis de ambiente
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo -e "${GREEN}✓${NC} Arquivo .env carregado"
else
  echo -e "${YELLOW}⚠${NC} Arquivo .env não encontrado. Usando variáveis de ambiente do sistema."
fi

echo ""
echo "1. VERIFICANDO VARIÁVEIS DE AMBIENTE"
echo "-------------------------------------"

ENV_OK=true

check_env "STRIPE_SECRET_KEY" || ENV_OK=false
check_env "STRIPE_PUBLISHABLE_KEY" || ENV_OK=false
check_env "STRIPE_WEBHOOK_SECRET" || ENV_OK=false

# Verificar se são chaves de teste ou produção
if [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
  echo -e "${YELLOW}⚠${NC} Usando chaves de TESTE (não produção)"
elif [[ "$STRIPE_SECRET_KEY" == sk_live_* ]]; then
  echo -e "${GREEN}✓${NC} Usando chaves de PRODUÇÃO"
fi

echo ""
echo "2. VERIFICANDO PRICE IDs CONFIGURADOS"
echo "--------------------------------------"

check_env "STRIPE_PRICE_PRO_MONTHLY" || echo -e "${YELLOW}⚠${NC} Usando fallback hardcoded"
check_env "STRIPE_PRICE_PRO_ANNUAL" || echo -e "${YELLOW}⚠${NC} Usando fallback hardcoded"
check_env "STRIPE_PRICE_ENTERPRISE_MONTHLY" || echo -e "${YELLOW}⚠${NC} Usando fallback hardcoded"
check_env "STRIPE_PRICE_ENTERPRISE_ANNUAL" || echo -e "${YELLOW}⚠${NC} Usando fallback hardcoded"

echo ""
echo "3. TESTANDO CONEXÃO COM STRIPE API"
echo "-----------------------------------"

# Testar conexão com Stripe usando curl
STRIPE_TEST=$(curl -s -u "${STRIPE_SECRET_KEY}:" https://api.stripe.com/v1/balance)

if echo "$STRIPE_TEST" | grep -q "available"; then
  echo -e "${GREEN}✓${NC} Conexão com Stripe API bem-sucedida"
  
  # Extrair saldo disponível
  AVAILABLE=$(echo "$STRIPE_TEST" | grep -o '"amount":[0-9]*' | head -1 | cut -d':' -f2)
  CURRENCY=$(echo "$STRIPE_TEST" | grep -o '"currency":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "  Saldo disponível: $((AVAILABLE / 100)) $CURRENCY"
else
  echo -e "${RED}✗${NC} Falha na conexão com Stripe API"
  echo "$STRIPE_TEST"
  exit 1
fi

echo ""
echo "4. VERIFICANDO PRODUTOS NO STRIPE"
echo "----------------------------------"

# Listar produtos
PRODUCTS=$(curl -s -u "${STRIPE_SECRET_KEY}:" https://api.stripe.com/v1/products?limit=10)

if echo "$PRODUCTS" | grep -q "QIVO"; then
  echo -e "${GREEN}✓${NC} Produtos QIVO encontrados no Stripe"
  
  # Contar produtos
  PRODUCT_COUNT=$(echo "$PRODUCTS" | grep -o '"id":"prod_' | wc -l)
  echo -e "  Total de produtos: $PRODUCT_COUNT"
else
  echo -e "${YELLOW}⚠${NC} Nenhum produto QIVO encontrado no Stripe"
  echo -e "  ${YELLOW}→${NC} Você precisa criar os produtos manualmente no Stripe Dashboard"
fi

echo ""
echo "5. VERIFICANDO PREÇOS NO STRIPE"
echo "--------------------------------"

# Listar preços
PRICES=$(curl -s -u "${STRIPE_SECRET_KEY}:" https://api.stripe.com/v1/prices?limit=20)

PRICE_COUNT=$(echo "$PRICES" | grep -o '"id":"price_' | wc -l)
echo -e "  Total de preços configurados: $PRICE_COUNT"

# Verificar se os price IDs hardcoded existem
if [ -n "$STRIPE_PRICE_PRO_MONTHLY" ]; then
  PRICE_CHECK=$(curl -s -u "${STRIPE_SECRET_KEY}:" "https://api.stripe.com/v1/prices/${STRIPE_PRICE_PRO_MONTHLY}")
  if echo "$PRICE_CHECK" | grep -q '"id"'; then
    AMOUNT=$(echo "$PRICE_CHECK" | grep -o '"unit_amount":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✓${NC} PRO Monthly: $((AMOUNT / 100)) USD"
  else
    echo -e "${RED}✗${NC} PRO Monthly: Price ID inválido"
  fi
fi

echo ""
echo "6. VERIFICANDO WEBHOOKS"
echo "-----------------------"

# Listar webhook endpoints
WEBHOOKS=$(curl -s -u "${STRIPE_SECRET_KEY}:" https://api.stripe.com/v1/webhook_endpoints)

WEBHOOK_COUNT=$(echo "$WEBHOOKS" | grep -o '"id":"we_' | wc -l)
echo -e "  Total de webhooks configurados: $WEBHOOK_COUNT"

if [ $WEBHOOK_COUNT -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Webhooks configurados"
  
  # Verificar se há webhook para nossa URL
  if echo "$WEBHOOKS" | grep -q "qivo-mining"; then
    echo -e "${GREEN}✓${NC} Webhook para QIVO Mining encontrado"
  else
    echo -e "${YELLOW}⚠${NC} Webhook para QIVO Mining não encontrado"
  fi
else
  echo -e "${YELLOW}⚠${NC} Nenhum webhook configurado"
  echo -e "  ${YELLOW}→${NC} Configure webhook em: https://dashboard.stripe.com/webhooks"
fi

echo ""
echo "7. RESUMO DA VALIDAÇÃO"
echo "----------------------"

if [ "$ENV_OK" = true ]; then
  echo -e "${GREEN}✓${NC} Variáveis de ambiente: OK"
else
  echo -e "${RED}✗${NC} Variáveis de ambiente: FALTANDO"
fi

echo -e "${GREEN}✓${NC} Conexão com Stripe API: OK"

if [ $PRODUCT_COUNT -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Produtos configurados: OK"
else
  echo -e "${YELLOW}⚠${NC} Produtos configurados: PENDENTE"
fi

if [ $PRICE_COUNT -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Preços configurados: OK"
else
  echo -e "${YELLOW}⚠${NC} Preços configurados: PENDENTE"
fi

if [ $WEBHOOK_COUNT -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Webhooks configurados: OK"
else
  echo -e "${YELLOW}⚠${NC} Webhooks configurados: PENDENTE"
fi

echo ""
echo "=========================================="
echo "PRÓXIMOS PASSOS:"
echo "=========================================="
echo ""
echo "1. Configure produtos no Stripe Dashboard:"
echo "   https://dashboard.stripe.com/products"
echo ""
echo "2. Configure preços para cada produto:"
echo "   - QIVO Mining - Start: US$ 2.500/mês"
echo "   - QIVO Mining - Pro: US$ 12.500/mês (+ anual com 10% off)"
echo "   - QIVO Mining - Enterprise: US$ 18.900/mês (+ anual com 10% off)"
echo ""
echo "3. Configure webhook endpoint:"
echo "   URL: https://qivo-mining-kfw7vgq5xa-rj.a.run.app/api/payment/webhook"
echo "   Eventos: checkout.session.completed, customer.subscription.updated,"
echo "            customer.subscription.deleted, invoice.payment_failed"
echo ""
echo "4. Teste o fluxo de checkout manualmente"
echo ""
echo "=========================================="
