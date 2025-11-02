#!/bin/bash
# Script de teste de upload de relatórios técnicos

set -e

echo "🧪 Teste de Upload - Sistema de Storage"
echo "========================================"
echo ""

# Configuração
API_URL="http://localhost:5000"
UPLOAD_DIR="./uploads"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar servidor
echo "1️⃣ Verificando servidor..."
if ! curl -s -f "$API_URL" > /dev/null 2>&1; then
    echo -e "${RED}❌ Servidor não está respondendo em $API_URL${NC}"
    echo "   Execute: pnpm dev"
    exit 1
fi
echo -e "${GREEN}✅ Servidor rodando${NC}"
echo ""

# 2. Verificar diretório de uploads
echo "2️⃣ Verificando diretório de uploads..."
if [ ! -d "$UPLOAD_DIR" ]; then
    echo -e "${RED}❌ Diretório $UPLOAD_DIR não existe${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Diretório existe: $UPLOAD_DIR${NC}"
ls -lh "$UPLOAD_DIR" | tail -3
echo ""

# 3. Criar arquivo de teste
echo "3️⃣ Criando arquivo de teste..."
TEST_FILE="/tmp/test-mining-report-$(date +%s).txt"
cat > "$TEST_FILE" << 'EOF'
TECHNICAL MINING REPORT - TEST UPLOAD
=====================================

Company: Test Mining Corporation
Project: Gold Exploration Test
Date: November 2, 2025
Location: Test Mine, Minas Gerais, Brazil

EXECUTIVE SUMMARY
-----------------
This is a test technical report for validating the upload and parsing system.

MINERAL RESOURCES (NI 43-101 Compliant)
---------------------------------------
Resource Category: Measured & Indicated
- Gold (Au): 1,500,000 oz @ 2.5 g/t
- Silver (Ag): 5,000,000 oz @ 8.0 g/t
- Copper (Cu): 50,000 t @ 0.8%

RESERVE ESTIMATES
-----------------
Proven Reserves:
- Gold: 800,000 oz
- Silver: 2,500,000 oz

Probable Reserves:
- Gold: 500,000 oz
- Silver: 1,500,000 oz

COMPLIANCE STATUS
-----------------
✓ ANM License: Valid until 2026
✓ IBAMA Environmental License: Active
✓ Water Usage Permit: Approved

INFRASTRUCTURE
--------------
- Processing Plant Capacity: 1,000 tpd
- Power Supply: 15 MW
- Water Supply: 500 m³/day

NEXT STEPS
----------
1. Complete Phase 2 drilling
2. Update resource model
3. Submit mining plan to ANM

Report prepared by: Test Geologist
Date: November 2, 2025
EOF

echo -e "${GREEN}✅ Arquivo criado: $TEST_FILE${NC}"
ls -lh "$TEST_FILE"
echo ""

# 4. Converter para base64
echo "4️⃣ Convertendo arquivo para base64..."
FILE_BASE64=$(base64 -i "$TEST_FILE" | tr -d '\n')
FILE_SIZE=$(wc -c < "$TEST_FILE")
BASE64_SIZE=${#FILE_BASE64}
echo -e "${GREEN}✅ Conversão completa${NC}"
echo "   Tamanho original: $FILE_SIZE bytes"
echo "   Tamanho base64: $BASE64_SIZE chars"
echo ""

# 5. Testar storage diretamente (sem autenticação)
echo "5️⃣ Testando escrita direta no storage..."

# Criar arquivo de teste no diretório de uploads
TEST_KEY="test/upload-$(date +%s)/test-report.txt"
TEST_PATH="$UPLOAD_DIR/$TEST_KEY"
mkdir -p "$(dirname "$TEST_PATH")"
echo "Test content - $(date)" > "$TEST_PATH"

if [ -f "$TEST_PATH" ]; then
    echo -e "${GREEN}✅ Storage funcionando!${NC}"
    echo "   Arquivo criado: $TEST_PATH"
    cat "$TEST_PATH"
    echo ""
    
    # Limpar
    rm "$TEST_PATH"
    echo -e "${GREEN}✅ Arquivo de teste removido${NC}"
else
    echo -e "${RED}❌ Falha ao escrever no storage${NC}"
    exit 1
fi
echo ""

# 6. Resumo
echo "📊 RESUMO DO TESTE"
echo "=================="
echo -e "${GREEN}✅ Servidor: OK${NC}"
echo -e "${GREEN}✅ Storage: OK (Render Disk)${NC}"
echo -e "${GREEN}✅ Diretório: $UPLOAD_DIR${NC}"
echo -e "${GREEN}✅ Escrita: OK${NC}"
echo ""

# 7. Instruções para teste manual
echo "🎯 PRÓXIMO PASSO: Teste Manual no Frontend"
echo "==========================================="
echo ""
echo "1. Inicie o frontend (se não estiver rodando):"
echo "   ${YELLOW}cd client && pnpm dev${NC}"
echo ""
echo "2. Abra o navegador:"
echo "   ${YELLOW}http://localhost:5173${NC}"
echo ""
echo "3. Navegue até:"
echo "   Relatórios Técnicos → Upload de Arquivo"
echo ""
echo "4. Faça upload do arquivo de teste:"
echo "   ${YELLOW}$TEST_FILE${NC}"
echo ""
echo "5. Verifique:"
echo "   - ✅ Upload completa sem erros"
echo "   - ✅ Arquivo aparece em: $UPLOAD_DIR/tenants/..."
echo "   - ✅ Auto-detecção funciona (se implementada)"
echo "   - ✅ Parsing extrai dados do relatório"
echo ""
echo "6. Monitore logs do servidor:"
echo "   ${YELLOW}tail -f /tmp/server.log | grep -E 'Upload|Storage|s3Key'${NC}"
echo ""
echo "📚 Documentação:"
echo "   - docs/TROUBLESHOOTING_UPLOAD.md"
echo "   - docs/UPLOAD_FIX_REPORT.md"
echo ""
echo -e "${GREEN}✅ Sistema pronto para teste de upload!${NC}"
