#!/bin/bash

# QIVO Mining - Deploy Simples para Mac
# Apenas arraste este arquivo para o Terminal e pressione Enter

clear
echo "🚀 Iniciando deploy automático do QIVO Mining..."
echo ""

# Ir para diretório do projeto
cd "$(dirname "$0")"

# Copiar credenciais
echo "📋 Copiando credenciais..."
cp "/Users/viniciusguimaraes/Library/CloudStorage/OneDrive-Pessoal/DOCUMENTOS/EMPRESAS/16.QIVO/INFRA/qivo-app-oauth-d1b0006bd945.json" .

if [ ! -f "qivo-app-oauth-d1b0006bd945.json" ]; then
    echo "❌ Erro: Arquivo de credenciais não encontrado!"
    echo "Por favor, copie manualmente o arquivo para a pasta do projeto."
    exit 1
fi

echo "✅ Credenciais copiadas"
echo ""

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo "⚠️  gcloud CLI não está instalado"
    echo ""
    echo "Instalando automaticamente..."
    echo ""
    
    # Baixar e instalar gcloud
    curl https://sdk.cloud.google.com > /tmp/install_gcloud.sh
    bash /tmp/install_gcloud.sh --disable-prompts --install-dir=$HOME
    
    # Adicionar ao PATH
    echo 'export PATH="$HOME/google-cloud-sdk/bin:$PATH"' >> ~/.zshrc
    source ~/.zshrc
    
    echo "✅ gcloud CLI instalado"
    echo ""
fi

# Executar script principal
echo "🚀 Iniciando deploy..."
echo ""
./DEPLOY_AUTOMATICO_COMPLETO.sh

echo ""
echo "✅ CONCLUÍDO!"
echo ""
echo "Pressione qualquer tecla para fechar..."
read -n 1
