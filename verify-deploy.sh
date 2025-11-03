#!/bin/bash

# 🔍 Verificação de Deploy - ComplianceCore Mining
# Este script verifica se o projeto está pronto para deploy no Render

set -e

echo "🔍 VERIFICAÇÃO DE DEPLOY - ComplianceCore Mining"
echo "================================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASS=0
FAIL=0

# Função de check
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAIL++))
    fi
}

# 1. Verificar arquivos essenciais
echo "📁 Verificando arquivos essenciais..."
[ -f "package.json" ]; check "package.json existe"
[ -f "pnpm-lock.yaml" ]; check "pnpm-lock.yaml existe"
[ -f "build.sh" ]; check "build.sh existe"
[ -f "render.yaml" ]; check "render.yaml existe"
[ -f "vite.config.ts" ]; check "vite.config.ts existe"
[ -f "tsconfig.json" ]; check "tsconfig.json existe"
echo ""

# 2. Verificar scripts no package.json
echo "📦 Verificando scripts no package.json..."
grep -q '"build":' package.json; check "Script 'build' existe"
grep -q '"start":' package.json; check "Script 'start' existe"
grep -q '"dev":' package.json; check "Script 'dev' existe"
echo ""

# 3. Verificar se não há dependências de Python em produção
echo "🐍 Verificando ausência de dependências Python..."
[ ! -f "wsgi.py" ] || echo -e "${YELLOW}⚠${NC} wsgi.py existe (não deve estar na raiz)"
[ ! -f "requirements.txt" ] || echo -e "${YELLOW}⚠${NC} requirements.txt existe (OK se apenas para AI modules)"
[ ! -d "app/" ] || echo -e "${YELLOW}⚠${NC} diretório app/ existe (deveria ter sido removido)"
echo ""

# 4. Verificar render.yaml
echo "☁️  Verificando render.yaml..."
grep -q "runtime: node" render.yaml; check "Runtime configurado como Node"
grep -q "pnpm" render.yaml; check "Build usa pnpm"
grep -q "bash build.sh" render.yaml; check "Build executa build.sh"
grep -q "pnpm run start" render.yaml; check "Start command correto"
echo ""

# 5. Verificar build.sh
echo "🔨 Verificando build.sh..."
[ -x "build.sh" ]; check "build.sh é executável"
grep -q "pnpm build" build.sh; check "build.sh executa pnpm build"
echo ""

# 6. Testar build local
echo "🏗️  Testando build local..."
if command -v pnpm &> /dev/null; then
    echo "   Executando: pnpm build"
    pnpm build > /tmp/build.log 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Build local bem-sucedido"
        ((PASS++))
        
        # Verificar se os arquivos de saída existem
        [ -f "dist/index.js" ]; check "   dist/index.js gerado"
        [ -d "dist/public" ]; check "   dist/public gerado"
    else
        echo -e "${RED}✗${NC} Build local falhou"
        echo "   Veja os detalhes em /tmp/build.log"
        ((FAIL++))
    fi
else
    echo -e "${YELLOW}⚠${NC} pnpm não instalado - pulando teste de build"
fi
echo ""

# 7. Verificar estrutura dist/
echo "📂 Verificando estrutura de output (dist/)..."
if [ -d "dist" ]; then
    [ -f "dist/index.js" ]; check "dist/index.js existe"
    [ -d "dist/public" ]; check "dist/public existe"
    [ -f "dist/public/index.html" ]; check "dist/public/index.html existe"
    
    # Verificar tamanho do bundle
    if [ -f "dist/index.js" ]; then
        SIZE=$(du -h dist/index.js | cut -f1)
        echo -e "${GREEN}ℹ${NC} Tamanho do bundle server: $SIZE"
    fi
else
    echo -e "${YELLOW}⚠${NC} diretório dist/ não existe (execute 'pnpm build')"
fi
echo ""

# 8. Verificar .renderignore
echo "🚫 Verificando .renderignore..."
if [ -f ".renderignore" ]; then
    grep -q "*.py" .renderignore; check ".renderignore ignora arquivos Python"
    grep -q "requirements" .renderignore; check ".renderignore ignora requirements.txt"
else
    echo -e "${YELLOW}⚠${NC} .renderignore não existe (recomendado)"
fi
echo ""

# 9. Verificar variáveis de ambiente necessárias
echo "🔐 Variáveis de ambiente necessárias (devem estar no Render):"
echo "   - NODE_ENV=production"
echo "   - PORT=10000"
echo "   - DATABASE_URL (PostgreSQL)"
echo "   - SESSION_SECRET"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET"
echo "   - GOOGLE_REDIRECT_URI"
echo "   - OPENAI_API_KEY (opcional)"
echo "   - CLOUDINARY_* (opcional)"
echo "   - STRIPE_* (opcional)"
echo ""

# 10. Resumo
echo "================================================"
echo "📊 RESUMO"
echo "================================================"
echo -e "${GREEN}✓ Passou: $PASS testes${NC}"
if [ $FAIL -gt 0 ]; then
    echo -e "${RED}✗ Falhou: $FAIL testes${NC}"
else
    echo -e "${GREEN}✓ Tudo OK!${NC}"
fi
echo ""

# 11. Próximos passos
if [ $FAIL -eq 0 ]; then
    echo "🎉 Projeto pronto para deploy!"
    echo ""
    echo "📋 PRÓXIMOS PASSOS:"
    echo "1. Acesse: https://dashboard.render.com"
    echo "2. Selecione o serviço: qivo-mining"
    echo "3. Vá em: Settings → Build & Deploy"
    echo "4. Configure:"
    echo "   - Environment: Node"
    echo "   - Build Command: npm install -g pnpm@10.4.1 && pnpm install --frozen-lockfile && bash build.sh && (pnpm drizzle-kit push || echo '⚠️ Migrations skipped')"
    echo "   - Start Command: pnpm run start"
    echo "   - Health Check Path: /api/health"
    echo "5. Salve e faça deploy manual"
    echo ""
    echo "Ou veja o guia completo em: RENDER_FIX_GUIDE.md"
else
    echo "⚠️  Corrija os erros acima antes de fazer deploy"
    echo ""
    echo "Veja o guia completo em: RENDER_FIX_GUIDE.md"
fi

exit $FAIL
