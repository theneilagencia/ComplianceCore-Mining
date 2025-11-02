#!/bin/bash
# ============================================
# QIVO - Verificação de Unificação Flask
# ============================================

echo "🔍 Verificando Unificação Flask..."
echo ""

# 1️⃣ Verificar se FastAPI ainda existe no código
echo "1️⃣ Buscando referências a FastAPI em app/modules/..."
FASTAPI_REFS=$(grep -r "from fastapi\|import fastapi\|APIRouter" app/modules/ 2>/dev/null || echo "")

if [ -z "$FASTAPI_REFS" ]; then
    echo "   ✅ Nenhuma referência a FastAPI encontrada"
else
    echo "   ⚠️  FastAPI ainda presente:"
    echo "$FASTAPI_REFS"
fi
echo ""

# 2️⃣ Verificar se Flask está importado corretamente
echo "2️⃣ Verificando imports Flask..."
FLASK_RADAR=$(grep "from flask import" app/modules/radar/routes.py 2>/dev/null)
FLASK_BRIDGE=$(grep "from flask import" app/modules/bridge/routes.py 2>/dev/null)

if [ -n "$FLASK_RADAR" ] && [ -n "$FLASK_BRIDGE" ]; then
    echo "   ✅ Flask importado em radar e bridge"
else
    echo "   ❌ Flask NÃO importado corretamente"
fi
echo ""

# 3️⃣ Testar importação do app
echo "3️⃣ Testando importação do Flask app..."
python3 -c "from app import app; print('   ✅ Flask app importado com sucesso')" 2>&1
echo ""

# 4️⃣ Verificar blueprints registrados
echo "4️⃣ Verificando blueprints registrados..."
python3 << 'EOF' 2>&1
from app import app
blueprints = list(app.blueprints.keys())
required = ['radar', 'bridge']
missing = [bp for bp in required if bp not in blueprints]

if missing:
    print(f"   ⚠️  Blueprints faltando: {missing}")
else:
    print(f"   ✅ Blueprints registrados: {blueprints}")
EOF
echo ""

# 5️⃣ Verificar rotas disponíveis
echo "5️⃣ Listando rotas Flask registradas..."
python3 << 'EOF' 2>&1
from app import app
radar_routes = [rule.rule for rule in app.url_map.iter_rules() if 'radar' in rule.rule]
bridge_routes = [rule.rule for rule in app.url_map.iter_rules() if 'bridge' in rule.rule]

print(f"   📡 Radar: {len(radar_routes)} rotas")
for route in sorted(radar_routes)[:5]:
    print(f"      - {route}")

print(f"   🌉 Bridge: {len(bridge_routes)} rotas")
for route in sorted(bridge_routes)[:5]:
    print(f"      - {route}")
EOF
echo ""

# 6️⃣ Verificar status do deploy no Render
echo "6️⃣ Verificando status do deploy Render..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://qivo-mining.onrender.com/ 2>/dev/null)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ Render respondendo (HTTP $HTTP_STATUS)"
else
    echo "   ⚠️  Render status: HTTP $HTTP_STATUS"
fi
echo ""

# ============================================
# RESUMO FINAL
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$FASTAPI_REFS" ]; then
    echo "✅ FastAPI removido com sucesso"
else
    echo "❌ FastAPI ainda presente no código"
fi

python3 -c "from app import app; print('✅ Flask app funcional')" 2>/dev/null || echo "❌ Erro ao importar Flask app"

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Render deploy OK"
else
    echo "⚠️  Render aguardando deploy (status: $HTTP_STATUS)"
fi

echo ""
echo "🔗 URLs de teste:"
echo "   https://qivo-mining.onrender.com/api/radar/health"
echo "   https://qivo-mining.onrender.com/api/bridge/health"
echo ""
