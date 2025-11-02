#!/bin/bash

# Script para manter o servidor rodando
# Ignora interrupções acidentais e reconecta automaticamente

echo "🚀 Iniciando servidor ComplianceCore-Mining..."
echo "📍 URL: http://localhost:5001"
echo ""
echo "⚠️  Os erros de API (GFW, SIGMINE, MapBiomas) são normais e NÃO afetam o upload!"
echo ""
echo "✅ Para parar o servidor, feche esta janela ou pressione Ctrl+C"
echo ""

# Executa o servidor
cd "$(dirname "$0")"
pnpm dev
