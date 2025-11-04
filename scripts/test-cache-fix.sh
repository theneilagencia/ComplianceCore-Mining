#!/bin/bash

# 🧪 Script de Teste - Cache Fix v1.2.1
# Valida se as correções de cache foram aplicadas corretamente

set -e

RENDER_URL="https://qivo-mining.onrender.com"
EXPECTED_SW_VERSION="qivo-v1.2.1-fix"

echo "🔍 Testando correções de cache no Qivo Mining..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de teste
test_passed() {
  echo -e "${GREEN}✅ PASSOU:${NC} $1"
}

test_failed() {
  echo -e "${RED}❌ FALHOU:${NC} $1"
  echo -e "${YELLOW}   Detalhes: $2${NC}"
}

test_warning() {
  echo -e "${YELLOW}⚠️  AVISO:${NC} $1"
}

echo "1️⃣  Verificando se app está online..."
if curl -s -o /dev/null -w "%{http_code}" "$RENDER_URL" | grep -q "200\|302"; then
  test_passed "App está online"
else
  test_failed "App não está acessível" "URL: $RENDER_URL"
  exit 1
fi

echo ""
echo "2️⃣  Verificando versão do Service Worker..."
SW_VERSION=$(curl -s "$RENDER_URL/sw.js" | grep -o "qivo-v[0-9]\+\.[0-9]\+\.[0-9]\+-[a-z]\+" | head -1)
if [ "$SW_VERSION" = "$EXPECTED_SW_VERSION" ]; then
  test_passed "Service Worker na versão correta: $SW_VERSION"
else
  test_failed "Service Worker desatualizado" "Esperado: $EXPECTED_SW_VERSION, Encontrado: $SW_VERSION"
fi

echo ""
echo "3️⃣  Verificando estratégia de cache no SW..."
if curl -s "$RENDER_URL/sw.js" | grep -q "networkFirstNoCacheStrategy"; then
  test_passed "networkFirstNoCacheStrategy encontrada no SW"
else
  test_failed "networkFirstNoCacheStrategy não encontrada" "SW pode estar usando cache agressivo"
fi

echo ""
echo "4️⃣  Verificando headers HTTP do index.html..."
HTML_CACHE=$(curl -s -I "$RENDER_URL" | grep -i "cache-control" | head -1)
if echo "$HTML_CACHE" | grep -qi "no-cache\|no-store"; then
  test_passed "HTML com headers anti-cache"
  echo "   Headers: $HTML_CACHE"
else
  test_warning "HTML pode estar com cache habilitado"
  echo "   Headers: ${HTML_CACHE:-Não encontrado}"
fi

echo ""
echo "5️⃣  Verificando se Umami está desabilitado..."
if curl -s "$RENDER_URL" | grep -q 'src="/umami.js"' | grep -v "<!--"; then
  test_failed "Umami ainda ativo no HTML" "Pode causar erro 'Unexpected token'"
else
  test_passed "Umami desabilitado (comentado)"
fi

echo ""
echo "6️⃣  Verificando headers de assets JS..."
# Pegar primeiro asset JS do HTML
JS_FILE=$(curl -s "$RENDER_URL" | grep -o '/assets/[^"]*\.js' | head -1)
if [ -n "$JS_FILE" ]; then
  JS_CACHE=$(curl -s -I "$RENDER_URL$JS_FILE" | grep -i "cache-control" | head -1)
  if echo "$JS_CACHE" | grep -qi "no-cache\|no-store"; then
    test_passed "Assets JS com headers anti-cache"
    echo "   File: $JS_FILE"
    echo "   Headers: $JS_CACHE"
  else
    test_failed "Assets JS sem headers anti-cache" "Headers: ${JS_CACHE:-Não encontrado}"
  fi
else
  test_warning "Não foi possível encontrar asset JS para testar"
fi

echo ""
echo "7️⃣  Verificando headers de assets CSS..."
CSS_FILE=$(curl -s "$RENDER_URL" | grep -o '/assets/[^"]*\.css' | head -1)
if [ -n "$CSS_FILE" ]; then
  CSS_CACHE=$(curl -s -I "$RENDER_URL$CSS_FILE" | grep -i "cache-control" | head -1)
  if echo "$CSS_CACHE" | grep -qi "no-cache\|no-store"; then
    test_passed "Assets CSS com headers anti-cache"
    echo "   File: $CSS_FILE"
    echo "   Headers: $CSS_CACHE"
  else
    test_failed "Assets CSS sem headers anti-cache" "Headers: ${CSS_CACHE:-Não encontrado}"
  fi
else
  test_warning "Não foi possível encontrar asset CSS para testar"
fi

echo ""
echo "8️⃣  Verificando se SW está registrado..."
if curl -s "$RENDER_URL" | grep -q "serviceWorker.register"; then
  test_passed "Service Worker registration encontrado no código"
else
  test_warning "Service Worker registration não encontrado (pode estar em bundle)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏁 Testes concluídos!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Se todos os testes passaram: ✅ Deploy OK!"
echo "   2. Se algum falhou: verificar logs do Render"
echo "   3. Testar manualmente no navegador:"
echo "      - Limpar cache (DevTools → Application → Clear site data)"
echo "      - Hard reload (Ctrl+Shift+R)"
echo "      - Verificar console: [SW] Install event - Version: $EXPECTED_SW_VERSION"
echo ""
echo "📚 Documentação completa: docs/CACHE_FIX_GUIDE.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
