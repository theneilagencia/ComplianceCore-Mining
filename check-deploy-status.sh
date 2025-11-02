#!/bin/bash

echo "🔍 Verificando Status do Deploy - qivo-mining.onrender.com"
echo "==========================================================="
echo ""

URL="https://qivo-mining.onrender.com"

echo "1️⃣ Testando conectividade..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
echo "   Status HTTP: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Servidor respondendo"
elif [ "$HTTP_CODE" = "502" ]; then
  echo "   ⏳ Servidor reiniciando (deploy em andamento)"
elif [ "$HTTP_CODE" = "503" ]; then
  echo "   ⏳ Serviço temporariamente indisponível"
else
  echo "   ❌ Erro: $HTTP_CODE"
fi

echo ""
echo "2️⃣ Testando API de health..."
HEALTH=$(curl -s "$URL/api/health" 2>&1)
if echo "$HEALTH" | grep -q "ok\|healthy\|success"; then
  echo "   ✅ API funcionando"
else
  echo "   ⚠️  API não respondeu ou erro: $HEALTH"
fi

echo ""
echo "3️⃣ Verificando assets..."
curl -s -I "$URL/assets/" | grep -E "HTTP|content-type" | head -2

echo ""
echo "4️⃣ Timestamp do deploy..."
LAST_MODIFIED=$(curl -s -I "$URL" | grep -i "last-modified")
echo "   $LAST_MODIFIED"

echo ""
echo "5️⃣ Headers do servidor..."
curl -s -I "$URL" | grep -E "x-powered-by|server|rndr-id"

echo ""
echo "================================"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Deploy parece estar OK!"
  echo "Se houver erro no navegador:"
  echo "  1. Limpe o cache (Ctrl+Shift+R)"
  echo "  2. Abra em aba anônima"
  echo "  3. Aguarde 2-3 minutos e recarregue"
elif [ "$HTTP_CODE" = "502" ] || [ "$HTTP_CODE" = "503" ]; then
  echo "⏳ Deploy ainda em andamento..."
  echo "Aguarde 5-10 minutos e execute novamente:"
  echo "  ./check-deploy-status.sh"
else
  echo "❌ Há um problema com o deploy"
  echo "Verifique o Render Dashboard:"
  echo "  https://dashboard.render.com"
fi
echo "================================"
