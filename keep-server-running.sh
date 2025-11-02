#!/bin/bash

# Script para manter o servidor rodando mesmo se você fechar o terminal
# Usa nohup para rodar em background verdadeiro

cd "$(dirname "$0")"

# Matar qualquer processo anterior
echo "🧹 Limpando processos anteriores..."
pkill -f "tsx watch server/_core/index.ts" 2>/dev/null || true

# Aguardar um pouco
sleep 2

# Iniciar servidor em background com nohup
echo "🚀 Iniciando servidor em background..."
nohup pnpm dev > server.log 2>&1 &
SERVER_PID=$!

echo "✅ Servidor iniciado!"
echo "📝 PID: $SERVER_PID"
echo "📋 Logs salvos em: server.log"
echo ""
echo "Para ver os logs em tempo real:"
echo "  tail -f server.log"
echo ""
echo "Para parar o servidor:"
echo "  kill $SERVER_PID"
echo "  ou"
echo "  pkill -f 'tsx watch server'"
echo ""
echo "⏳ Aguardando servidor inicializar..."
sleep 5

# Verificar se está rodando
if lsof -i:5001 > /dev/null 2>&1; then
  echo "✅ Servidor rodando na porta 5001!"
  echo "🌐 Acesse: http://localhost:5001"
else
  echo "⚠️ Servidor pode não ter iniciado. Verifique server.log"
  tail -20 server.log
fi
