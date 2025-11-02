#!/bin/bash
# Script de diagnóstico do sistema de storage

echo "🔍 Diagnóstico do Sistema de Storage"
echo "===================================="
echo ""

# 1. Verificar variáveis de ambiente
echo "📋 Variáveis de Ambiente:"
echo "-------------------------"
if [ -f .env.local ]; then
  echo "✅ .env.local encontrado"
  grep -E "RENDER_DISK_PATH|CLOUDINARY_|AWS_" .env.local | while read line; do
    key=$(echo $line | cut -d'=' -f1)
    echo "  ✓ $key"
  done
else
  echo "⚠️ .env.local não encontrado"
fi
echo ""

# 2. Verificar diretório de uploads
echo "📁 Diretório de Uploads:"
echo "------------------------"
if [ -d "./uploads" ]; then
  echo "✅ ./uploads existe"
  ls -lh ./uploads | tail -n +2 | wc -l | xargs echo "  Arquivos:"
  du -sh ./uploads | awk '{print "  Tamanho: " $1}'
else
  echo "⚠️ ./uploads não existe"
  echo "  Execute: mkdir -p ./uploads"
fi
echo ""

# 3. Verificar processo do servidor
echo "🚀 Servidor:"
echo "------------"
if lsof -ti:5000 > /dev/null 2>&1; then
  echo "✅ Servidor rodando na porta 5000"
  PID=$(lsof -ti:5000)
  echo "  PID: $PID"
  ps -p $PID -o etime= | xargs echo "  Uptime:"
else
  echo "⚠️ Servidor não está rodando"
  echo "  Execute: pnpm dev"
fi
echo ""

# 4. Testar endpoint de status (se servidor rodando)
if lsof -ti:5000 > /dev/null 2>&1; then
  echo "🔌 Endpoint /api/storage/status:"
  echo "--------------------------------"
  
  # Tentar buscar status
  RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:5000/api/storage/status 2>/dev/null)
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Status: $HTTP_CODE OK"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  elif [ "$HTTP_CODE" = "404" ]; then
    echo "⚠️ Status: $HTTP_CODE - Endpoint não implementado"
  else
    echo "❌ Status: $HTTP_CODE"
    echo "$BODY"
  fi
  echo ""
fi

# 5. Resumo e recomendações
echo "📊 Resumo:"
echo "----------"
HAS_ENV=0
HAS_DIR=0
HAS_SERVER=0

[ -f .env.local ] && HAS_ENV=1
[ -d ./uploads ] && HAS_DIR=1
lsof -ti:5000 > /dev/null 2>&1 && HAS_SERVER=1

if [ $HAS_ENV -eq 1 ] && [ $HAS_DIR -eq 1 ] && [ $HAS_SERVER -eq 1 ]; then
  echo "✅ Sistema configurado corretamente"
  echo ""
  echo "🧪 Teste o upload:"
  echo "  1. Abra http://localhost:5173"
  echo "  2. Vá em Relatórios Técnicos"
  echo "  3. Clique em 'Upload de Arquivo'"
  echo "  4. Selecione um PDF de teste"
  echo "  5. Verifique console do navegador e do servidor"
else
  echo "⚠️ Ações necessárias:"
  [ $HAS_ENV -eq 0 ] && echo "  ❌ Criar .env.local com RENDER_DISK_PATH"
  [ $HAS_DIR -eq 0 ] && echo "  ❌ Criar diretório: mkdir -p ./uploads"
  [ $HAS_SERVER -eq 0 ] && echo "  ❌ Iniciar servidor: pnpm dev"
  
  if [ $HAS_SERVER -eq 1 ] && [ $HAS_ENV -eq 1 ]; then
    echo ""
    echo "  ⚠️ IMPORTANTE: Reinicie o servidor para carregar .env.local"
    echo "     Ctrl+C no terminal do servidor e execute 'pnpm dev' novamente"
  fi
fi

echo ""
echo "📚 Documentação: docs/TROUBLESHOOTING_UPLOAD.md"
echo "===================================="
