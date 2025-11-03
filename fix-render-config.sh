#!/bin/bash

# 🔧 Script de Configuração do Render - QIVO Mining
# Data: 3 de novembro de 2025

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 QIVO Mining - Render Configuration Fix"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  IMPORTANTE: Este projeto é Node.js, NÃO Python!${NC}"
echo ""

echo -e "${BLUE}📋 Configuração CORRETA do Render:${NC}"
echo ""

echo -e "${GREEN}Build Command:${NC}"
cat << 'EOF'
echo "🚀 QIVO Mining - Node.js Build v2.0" && \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" && \
node --version && npm --version && \
if ! command -v pnpm &> /dev/null; then npm install -g pnpm@10.4.1; fi && \
pnpm --version && \
pnpm install --frozen-lockfile --prefer-offline && \
bash build.sh && \
if [ "$NODE_ENV" = "production" ]; then pnpm drizzle-kit push || echo "⚠️ Migrations skipped"; fi && \
echo "✅ Build completed successfully"
EOF

echo ""
echo -e "${GREEN}Start Command:${NC}"
cat << 'EOF'
echo "🚀 Starting QIVO Mining Server" && \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" && \
echo "Environment: $NODE_ENV" && \
echo "Node version: $(node --version)" && \
echo "Port: $PORT" && \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" && \
node dist/index.js
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}📝 Passos para configurar no Render Dashboard:${NC}"
echo ""
echo "1. Acesse: https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0/settings"
echo ""
echo "2. Na seção 'Build & Deploy':"
echo "   - Runtime: ${GREEN}Node${NC}"
echo "   - Build Command: ${GREEN}Cole o comando acima${NC}"
echo "   - Start Command: ${GREEN}node dist/index.js${NC}"
echo ""
echo "3. Clique em 'Save Changes'"
echo ""
echo "4. Faça um novo deploy manual ou push para main"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${BLUE}🔍 Verificando render.yaml local...${NC}"
echo ""

if [ -f "render.yaml" ]; then
    if grep -q "runtime: node" render.yaml; then
        echo -e "${GREEN}✅ render.yaml está correto (runtime: node)${NC}"
    else
        echo -e "${RED}❌ render.yaml tem runtime incorreto${NC}"
        exit 1
    fi
    
    if grep -q "bash build.sh" render.yaml; then
        echo -e "${GREEN}✅ render.yaml usa build.sh${NC}"
    else
        echo -e "${YELLOW}⚠️  render.yaml não usa build.sh${NC}"
    fi
    
    if grep -q "node dist/index.js" render.yaml; then
        echo -e "${GREEN}✅ render.yaml usa start correto${NC}"
    else
        echo -e "${YELLOW}⚠️  render.yaml tem start command diferente${NC}"
    fi
else
    echo -e "${RED}❌ render.yaml não encontrado!${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${GREEN}✅ Script concluído!${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Configure o Render Dashboard manualmente (link acima)"
echo "2. Ou faça commit e push (o Render pode sincronizar render.yaml)"
echo "3. Aguarde o novo deploy"
echo "4. Verifique os logs: render logs qivo-mining --tail"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
