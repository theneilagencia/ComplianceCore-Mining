#!/bin/bash

# 🎯 SCRIPT DE CONFIGURAÇÃO AUTOMÁTICA
# Execute este script no Render Shell para configurar tudo automaticamente

echo "🚀 ComplianceCore-Mining - Setup Automático"
echo "=============================================="
echo ""

# Detectar se está rodando no Render
if [ -z "$RENDER" ]; then
    echo "⚠️  ATENÇÃO: Este script deve ser executado no Render Shell!"
    echo ""
    echo "📋 Como executar:"
    echo "   1. Acesse: https://dashboard.render.com"
    echo "   2. Clique em: ComplianceCore-Mining-1"
    echo "   3. Clique em: Shell (menu lateral)"
    echo "   4. Execute: curl -sSL https://raw.githubusercontent.com/theneilagencia/ComplianceCore-Mining/main/setup-render-env.sh | bash"
    echo ""
    exit 1
fi

echo "✅ Detectado ambiente Render"
echo ""

# Configurar DATABASE_URL
echo "🔧 Configurando DATABASE_URL..."
export DATABASE_URL="postgresql://compliancecore:IcVbQdC6x7fc1bS73qaO6dqajfeKjXzg@dpg-d3s06i0dl3ps73963kug-a.oregon-postgres.render.com:5432/compliancecore"
echo "✅ DATABASE_URL configurada"
echo ""

# Testar conexão com banco
echo "🔍 Testando conexão com banco de dados..."
if command -v psql &> /dev/null; then
    psql "$DATABASE_URL" -c "SELECT version();" &> /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Conexão com banco OK"
    else
        echo "⚠️  Não foi possível conectar ao banco (pode ser normal se psql não estiver instalado)"
    fi
else
    echo "ℹ️  psql não disponível, pulando teste de conexão"
fi
echo ""

# Executar migration
echo "🔧 Executando migration..."
if [ -f "/opt/render/project/src/server/routes/fix-s3url.ts" ]; then
    echo "✅ Endpoint de migration encontrado"
    echo "ℹ️  Execute manualmente: curl -X POST http://localhost:3000/api/fix-s3url"
else
    echo "⚠️  Endpoint de migration não encontrado"
fi
echo ""

# Verificar Cloudinary
echo "🔍 Verificando Cloudinary..."
if [ -n "$CLOUDINARY_URL" ]; then
    echo "✅ CLOUDINARY_URL configurada"
else
    echo "⚠️  CLOUDINARY_URL não configurada"
    echo "   Configure: CLOUDINARY_URL=cloudinary://276945786524848:IBQ_PDAbUFruzOZyvOQZ-bVP_nY@dt8pglfip"
fi
echo ""

# Verificar Render Disk
echo "🔍 Verificando Render Disk..."
if [ -d "/var/data/uploads" ]; then
    echo "✅ Render Disk montado em /var/data/uploads"
    ls -lah /var/data/uploads
else
    echo "⚠️  Render Disk não encontrado"
    echo "   Configure: Persistent Disk em /var/data/uploads"
fi
echo ""

# Resumo
echo "=============================================="
echo "📊 RESUMO DA CONFIGURAÇÃO"
echo "=============================================="
echo ""
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "CLOUDINARY_URL: ${CLOUDINARY_URL:0:50}..."
echo "USE_RENDER_DISK: $USE_RENDER_DISK"
echo "RENDER_DISK_PATH: $RENDER_DISK_PATH"
echo ""
echo "✅ Setup concluído!"
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "   1. Reinicie o serviço (Render faz automaticamente)"
echo "   2. Execute migration: curl -X POST https://compliancecore-mining-1.onrender.com/api/fix-s3url"
echo "   3. Teste upload em: https://compliancecore-mining-1.onrender.com/reports/generate"
echo ""

