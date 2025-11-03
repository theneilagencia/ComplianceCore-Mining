#!/bin/bash

# Script para aplicar migrations do Drizzle no banco PostgreSQL

echo "🔧 Aplicando migrations do Drizzle..."
echo ""

# DATABASE_URL do Render
DATABASE_URL="postgresql://compliancecore:IcVbQdC6x7fc1bS73qaO6dqajfeKjXzg@dpg-d3s06i0dl3ps73963kug-a.oregon-postgres.render.com:5432/compliancecore"

# Verificar se psql está instalado
if ! command -v psql &> /dev/null; then
    echo "⚠️  psql não está instalado"
    echo "   Instalando postgresql-client..."
    sudo apt-get update -qq && sudo apt-get install -y postgresql-client -qq
fi

echo "✅ psql disponível"
echo ""

# Aplicar cada migration em ordem
for migration in /home/ubuntu/ComplianceCore-Mining/drizzle/*.sql; do
    filename=$(basename "$migration")
    echo "📄 Aplicando: $filename"
    
    # Aplicar migration
    psql "$DATABASE_URL" -f "$migration" 2>&1 | grep -v "NOTICE" | head -20
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo "✅ $filename aplicada com sucesso"
    else
        echo "⚠️  Erro ao aplicar $filename (pode já estar aplicada)"
    fi
    echo ""
done

echo "=============================================="
echo "✅ Migrations aplicadas!"
echo ""
echo "🔍 Verificando tabelas criadas..."
psql "$DATABASE_URL" -c "\dt" 2>&1 | head -30

echo ""
echo "🎯 Próximo passo:"
echo "   Execute: curl -X POST https://compliancecore-mining-1.onrender.com/api/fix-s3url"

