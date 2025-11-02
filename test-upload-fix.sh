#!/bin/bash
# Script para testar a correção do upload localmente

echo "🔧 TESTE DA CORREÇÃO DE UPLOAD"
echo "================================"
echo ""

# 1. Iniciar servidor backend
echo "📦 Iniciando servidor backend na porta 5001..."
pkill -9 node 2>/dev/null
sleep 2

cd /Users/viniciusguimaraes/Documents/GITHUB/ComplianceCore-Mining

# Iniciar servidor em background
NODE_ENV=development pnpm exec tsx watch server/_core/index.ts > /tmp/server.log 2>&1 &
SERVER_PID=$!

echo "⏳ Aguardando servidor iniciar..."
sleep 5

# Verificar se servidor está rodando
if lsof -i:5001 > /dev/null 2>&1; then
  echo "✅ Servidor rodando na porta 5001"
else
  echo "❌ ERRO: Servidor não iniciou na porta 5001"
  cat /tmp/server.log
  exit 1
fi

# 2. Iniciar frontend Vite
echo ""
echo "🎨 Iniciando frontend Vite na porta 5173..."
cd client
pnpm dev > /tmp/vite.log 2>&1 &
VITE_PID=$!

echo "⏳ Aguardando Vite iniciar..."
sleep 5

# Verificar se Vite está rodando
if lsof -i:5173 > /dev/null 2>&1; then
  echo "✅ Vite rodando na porta 5173"
else
  echo "❌ ERRO: Vite não iniciou na porta 5173"
  cat /tmp/vite.log
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

echo ""
echo "================================"
echo "✅ AMBIENTE DE TESTE PRONTO!"
echo "================================"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔌 Backend:  http://localhost:5001"
echo ""
echo "📋 INSTRUÇÕES:"
echo "1. Abra http://localhost:5173 no navegador"
echo "2. Faça login"
echo "3. Teste o upload de um arquivo PDF"
echo "4. Observe os logs do servidor em /tmp/server.log"
echo ""
echo "Para parar os servidores:"
echo "  kill $SERVER_PID $VITE_PID"
echo ""
echo "Para ver logs do servidor:"
echo "  tail -f /tmp/server.log"
echo ""
echo "Para ver logs do Vite:"
echo "  tail -f /tmp/vite.log"
