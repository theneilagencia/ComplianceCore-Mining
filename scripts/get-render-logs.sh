#!/bin/bash

# Script para buscar logs do Render
# Uso: ./scripts/get-render-logs.sh [RENDER_API_KEY]

SERVICE_ID="srv-d3sk5h1r0fns738ibdg0"
API_KEY="${1:-$RENDER_API_KEY}"

if [ -z "$API_KEY" ]; then
  echo "❌ ERRO: RENDER_API_KEY não fornecida"
  echo ""
  echo "Uso:"
  echo "  ./scripts/get-render-logs.sh YOUR_API_KEY"
  echo "  ou"
  echo "  export RENDER_API_KEY=YOUR_API_KEY"
  echo "  ./scripts/get-render-logs.sh"
  echo ""
  echo "📖 Como obter a API Key:"
  echo "  1. Acesse: https://dashboard.render.com/"
  echo "  2. Account Settings → API Keys"
  echo "  3. Create API Key"
  exit 1
fi

echo "🔍 Buscando logs do serviço qivo-mining..."
echo "Service ID: $SERVICE_ID"
echo ""

# Buscar logs recentes
echo "📋 Últimos logs (últimos 5 minutos):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

curl -s -H "Authorization: Bearer $API_KEY" \
  "https://api.render.com/v1/services/$SERVICE_ID/logs?limit=100" | \
  jq -r '.[] | "\(.timestamp) [\(.level)] \(.message)"' 2>/dev/null || \
  echo "⚠️ Erro ao buscar logs ou jq não instalado"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Buscar status do último deploy
echo "📦 Status do último deploy:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DEPLOY_INFO=$(curl -s -H "Authorization: Bearer $API_KEY" \
  "https://api.render.com/v1/services/$SERVICE_ID/deploys?limit=1")

echo "$DEPLOY_INFO" | jq -r '.[0] | "ID: \(.id)\nStatus: \(.status)\nCommit: \(.commit.id)\nMessage: \(.commit.message)\nCreated: \(.createdAt)\nFinished: \(.finishedAt)"' 2>/dev/null || \
  echo "⚠️ Erro ao buscar deploy info"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Dica: Para ver logs em tempo real, acesse:"
echo "   https://dashboard.render.com/web/$SERVICE_ID/logs"
