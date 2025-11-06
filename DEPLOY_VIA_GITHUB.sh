#!/bin/bash
set -e

echo "🚀 QIVO Mining - Deploy Automático via GitHub"
echo "=============================================="
echo ""

# Configurações
PROJECT_ID="qivo-mining-prod"
REGION="us-central1"
SERVICE_NAME="qivo-mining"
REPO_OWNER="theneilagencia"
REPO_NAME="ComplianceCore-Mining"
BRANCH="main"

echo "📋 Configurações:"
echo "   Project: $PROJECT_ID"
echo "   Region: $REGION"
echo "   Repository: $REPO_OWNER/$REPO_NAME"
echo "   Branch: $BRANCH"
echo ""

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ ERROR: gcloud não está instalado"
    echo "   Instale em: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Configurar projeto
echo "🔧 Configurando projeto..."
gcloud config set project $PROJECT_ID

# Habilitar APIs necessárias
echo "🔌 Habilitando APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Dar permissões ao Cloud Build
echo "🔐 Configurando permissões..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/run.admin" \
    --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser" \
    --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

echo ""
echo "✅ Permissões configuradas!"
echo ""

# Instruções para conectar GitHub
echo "📱 CONECTAR GITHUB AO CLOUD BUILD"
echo "=================================="
echo ""
echo "1. Abra este link no navegador:"
echo "   https://console.cloud.google.com/cloud-build/triggers/connect?project=$PROJECT_ID"
echo ""
echo "2. Clique em 'CONNECT REPOSITORY'"
echo ""
echo "3. Selecione 'GitHub (Cloud Build GitHub App)'"
echo ""
echo "4. Autentique com sua conta GitHub"
echo ""
echo "5. Selecione o repositório: $REPO_OWNER/$REPO_NAME"
echo ""
echo "6. Clique em 'CONNECT'"
echo ""
echo "7. Volte aqui e pressione ENTER quando terminar"
echo ""
read -p "Pressione ENTER após conectar o repositório... "

# Criar trigger de build
echo ""
echo "🎯 Criando trigger de build..."

gcloud builds triggers create github \
    --name="qivo-mining-deploy" \
    --repo-name="$REPO_NAME" \
    --repo-owner="$REPO_OWNER" \
    --branch-pattern="^main$" \
    --build-config="cloudbuild.yaml" \
    --region="global"

echo "✅ Trigger criado!"
echo ""

# Fazer o primeiro build manualmente
echo "🏗️  Iniciando primeiro build..."
echo ""
echo "Executando build do repositório GitHub..."
echo "Isso vai levar 15-20 minutos..."
echo ""

gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions=COMMIT_SHA=manual-deploy \
    --timeout=25m \
    --machine-type=e2-highcpu-8 \
    https://github.com/$REPO_OWNER/$REPO_NAME.git#$BRANCH

echo ""
echo "✅ BUILD CONCLUÍDO!"
echo ""
echo "🌐 Sua aplicação está disponível em:"
echo "   https://qivo-mining-586444405059.us-central1.run.app"
echo ""
echo "📊 Próximos passos:"
echo "   1. Teste a aplicação no navegador"
echo "   2. Configure domínio customizado (opcional)"
echo "   3. Monitore logs: gcloud run services logs read $SERVICE_NAME --region=$REGION"
echo ""
echo "🎉 DEPLOY AUTOMÁTICO CONFIGURADO!"
echo "   Agora todo push na branch 'main' vai fazer deploy automático!"
echo ""
