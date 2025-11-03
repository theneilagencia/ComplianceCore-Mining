#!/bin/bash

# Script para configurar webhook do Render no GitHub
# Execute este script no seu computador local (não no sandbox)

echo "🚀 Configurando webhook do Render no GitHub..."
echo ""

# Configurar webhook
gh api repos/theneilagencia/ComplianceCore-Mining/hooks -X POST \
  -f name='web' \
  -f active=true \
  -F 'config[url]=https://api.render.com/deploy/srv-d33kl5h1ofns738ibdg0?key=kXmr1ywPUYc' \
  -F 'config[content_type]=json' \
  -f events[]='push'

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Webhook configurado com sucesso!"
  echo ""
  echo "🎯 Próximos passos:"
  echo "1. Faça um commit vazio para testar: git commit --allow-empty -m 'test: trigger deploy' && git push"
  echo "2. Aguarde 5-8 minutos para o deploy completar"
  echo "3. Acesse https://compliancecore-mining-1.onrender.com para validar"
else
  echo ""
  echo "❌ Erro ao configurar webhook!"
  echo ""
  echo "📋 Configure manualmente:"
  echo "1. Acesse: https://github.com/theneilagencia/ComplianceCore-Mining/settings/hooks"
  echo "2. Clique em 'Add webhook'"
  echo "3. Payload URL: https://api.render.com/deploy/srv-d33kl5h1ofns738ibdg0?key=kXmr1ywPUYc"
  echo "4. Content type: application/json"
  echo "5. Events: Just the push event"
  echo "6. Active: ✓"
  echo "7. Clique em 'Add webhook'"
fi

