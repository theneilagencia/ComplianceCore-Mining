#!/bin/bash

# Script para suspender o serviço legado jorc-intelligence
# Uso: ./scripts/suspend-legacy-service.sh [RENDER_API_KEY]

LEGACY_SERVICE_ID="srv-XXXXX"  # Substitua pelo ID real do jorc-intelligence
API_KEY="${1:-$RENDER_API_KEY}"

if [ -z "$API_KEY" ]; then
  echo "❌ ERRO: RENDER_API_KEY não fornecida"
  echo ""
  echo "Uso:"
  echo "  ./scripts/suspend-legacy-service.sh YOUR_API_KEY"
  echo "  ou"
  echo "  export RENDER_API_KEY=YOUR_API_KEY"
  echo "  ./scripts/suspend-legacy-service.sh"
  echo ""
  echo "📖 Como obter a API Key:"
  echo "  1. Acesse: https://dashboard.render.com/"
  echo "  2. Account Settings → API Keys"
  echo "  3. Create API Key"
  echo ""
  echo "⚠️  ALTERNATIVA MAIS FÁCIL:"
  echo "  1. Acesse: https://dashboard.render.com"
  echo "  2. Selecione o serviço 'jorc-intelligence'"
  echo "  3. Settings → Suspend Service"
  exit 1
fi

echo "🔍 Listando serviços..."
echo ""

# Listar todos os serviços para encontrar o ID
SERVICES=$(curl -s -H "Authorization: Bearer $API_KEY" \
  "https://api.render.com/v1/services")

echo "$SERVICES" | jq -r '.[] | select(.name | contains("jorc")) | "ID: \(.id)\nNome: \(.name)\nTipo: \(.type)\nStatus: \(.suspended)\n"' 2>/dev/null || \
  echo "⚠️ Erro ao listar serviços ou jq não instalado"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Para suspender manualmente:"
echo "  1. Copie o ID do serviço acima"
echo "  2. Execute:"
echo "     curl -X POST \\"
echo "       -H 'Authorization: Bearer \$RENDER_API_KEY' \\"
echo "       'https://api.render.com/v1/services/SERVICE_ID/suspend'"
echo ""
echo "⚠️  OU use o dashboard (mais fácil):"
echo "  https://dashboard.render.com → jorc-intelligence → Settings → Suspend"
