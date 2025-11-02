#!/bin/bash

# Script de diagnóstico e inicialização segura do servidor
# Captura erros e mantém logs detalhados

echo "🔧 Modo de Diagnóstico Ativado"
echo "================================"
echo ""

# Limpar processos anteriores
echo "🧹 Limpando processos anteriores..."
pkill -f "tsx watch server/_core/index.ts" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
sleep 2

# Criar arquivo de log com timestamp
LOG_FILE="server-crash-$(date +%Y%m%d_%H%M%S).log"

echo "📝 Logs serão salvos em: $LOG_FILE"
echo ""
echo "🚀 Iniciando servidor com monitoramento de erros..."
echo ""

# Função para capturar crash
trap 'echo "❌ SERVIDOR CRASHOU! Verifique $LOG_FILE"; exit 1' ERR

# Iniciar servidor com logs detalhados
NODE_ENV=development \
NODE_OPTIONS="--trace-warnings --unhandled-rejections=strict" \
pnpm dev 2>&1 | tee "$LOG_FILE" &

SERVER_PID=$!
echo "✅ Servidor iniciado com PID: $SERVER_PID"
echo ""

# Monitorar por 10 segundos
for i in {1..10}; do
  sleep 1
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo ""
    echo "❌ SERVIDOR CRASHOU após $i segundos!"
    echo ""
    echo "📋 Últimas 30 linhas do log:"
    tail -30 "$LOG_FILE"
    echo ""
    echo "🔍 Procurando por erros críticos:"
    grep -i "error\|fatal\|crash\|exception" "$LOG_FILE" | tail -10
    exit 1
  fi
  echo -n "."
done

echo ""
echo ""
echo "✅ Servidor ainda está rodando após 10 segundos!"
echo ""
echo "🌐 Testando porta 5001..."
if lsof -i:5001 > /dev/null 2>&1; then
  echo "✅ Servidor escutando na porta 5001"
  echo "🌍 URL: http://localhost:5001"
else
  echo "⚠️ Porta 5001 não está aberta. Servidor pode estar em outra porta."
fi

echo ""
echo "📊 Status do processo:"
ps -p $SERVER_PID -o pid,comm,%cpu,%mem,etime

echo ""
echo "💡 Para ver logs em tempo real:"
echo "   tail -f $LOG_FILE"
echo ""
echo "💡 Para parar o servidor:"
echo "   kill $SERVER_PID"
