# 🚀 Deploy QIVO Mining via GitHub - Guia Manual

Este guia mostra como fazer deploy da aplicação **diretamente do GitHub** usando a interface do Google Cloud.

## ✅ Pré-requisitos

- Repositório: `theneilagencia/ComplianceCore-Mining`
- Projeto GCP: `qivo-mining-prod`
- Secrets já criados no Secret Manager

---

## 📋 Passo 1: Conectar GitHub ao Cloud Build

### 1.1. Abrir Cloud Build Triggers

Acesse: https://console.cloud.google.com/cloud-build/triggers?project=qivo-mining-prod

### 1.2. Conectar Repositório

1. Clique em **"CREATE TRIGGER"**
2. Clique em **"CONNECT REPOSITORY"**
3. Selecione **"GitHub (Cloud Build GitHub App)"**
4. Clique em **"CONTINUE"**
5. Autentique com sua conta GitHub
6. Selecione o repositório: **theneilagencia/ComplianceCore-Mining**
7. Marque a checkbox "I understand..."
8. Clique em **"CONNECT"**
9. Clique em **"DONE"** (não crie trigger ainda)

---

## 📋 Passo 2: Configurar Permissões do Cloud Build

### 2.1. Abrir IAM

Acesse: https://console.cloud.google.com/iam-admin/iam?project=qivo-mining-prod

### 2.2. Adicionar Permissões

1. Encontre a conta de serviço: `[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com`
2. Clique no ícone de **lápis (editar)**
3. Clique em **"ADD ANOTHER ROLE"**
4. Adicione as seguintes roles:
   - `Cloud Run Admin`
   - `Service Account User`
   - `Secret Manager Secret Accessor`
5. Clique em **"SAVE"**

---

## 📋 Passo 3: Fazer Build Manual via Cloud Build

### 3.1. Abrir Cloud Build

Acesse: https://console.cloud.google.com/cloud-build/builds?project=qivo-mining-prod

### 3.2. Executar Build Manual

1. Clique em **"SUBMIT BUILD"** (botão no topo)
2. Em **"Source"**, selecione **"Repository"**
3. Em **"Repository"**, selecione: `github_theneilagencia_compliancecore-mining`
4. Em **"Branch"**, digite: `main`
5. Em **"Cloud Build configuration file location"**, digite: `cloudbuild.yaml`
6. Em **"Advanced"**:
   - **Machine type**: `E2_HIGHCPU_8`
   - **Disk size**: `100 GB`
   - **Timeout**: `1800s` (30 minutos)
7. Clique em **"SUBMIT"**

### 3.3. Aguardar Build

- O build vai levar **15-20 minutos**
- Você pode acompanhar o progresso na tela
- Quando terminar, vai aparecer **"SUCCESS"** em verde

---

## 📋 Passo 4: Verificar Deploy

### 4.1. Abrir Cloud Run

Acesse: https://console.cloud.google.com/run?project=qivo-mining-prod

### 4.2. Verificar Serviço

1. Clique no serviço **"qivo-mining"**
2. Copie a URL (deve ser algo como: `https://qivo-mining-586444405059.us-central1.run.app`)
3. Abra a URL no navegador
4. Verifique se a aplicação está funcionando

---

## 📋 Passo 5: Criar Trigger Automático (Opcional)

Se quiser que o deploy aconteça **automaticamente** a cada push na branch `main`:

### 5.1. Criar Trigger

Acesse: https://console.cloud.google.com/cloud-build/triggers?project=qivo-mining-prod

1. Clique em **"CREATE TRIGGER"**
2. Configure:
   - **Name**: `qivo-mining-auto-deploy`
   - **Event**: `Push to a branch`
   - **Repository**: `github_theneilagencia_compliancecore-mining`
   - **Branch**: `^main$`
   - **Configuration**: `Cloud Build configuration file (yaml or json)`
   - **Location**: `cloudbuild.yaml`
3. Em **"Advanced"**:
   - **Machine type**: `E2_HIGHCPU_8`
   - **Timeout**: `1800s`
4. Clique em **"CREATE"**

Pronto! Agora todo push na branch `main` vai fazer deploy automático! 🎉

---

## 🔍 Troubleshooting

### Build falhou?

1. Verifique os logs do build
2. Verifique se todas as permissões foram configuradas
3. Verifique se os secrets existem no Secret Manager

### Aplicação não abre?

1. Verifique os logs do Cloud Run:
   ```bash
   gcloud run services logs read qivo-mining --region=us-central1 --limit=50
   ```
2. Verifique se as variáveis de ambiente estão configuradas
3. Verifique se os secrets estão acessíveis

### Erro de permissão?

1. Verifique se a conta de serviço do Cloud Build tem as roles necessárias
2. Verifique se o Cloud Run tem acesso aos secrets

---

## ✅ Checklist Final

- [ ] Repositório GitHub conectado ao Cloud Build
- [ ] Permissões configuradas no IAM
- [ ] Build manual executado com sucesso
- [ ] Aplicação acessível na URL do Cloud Run
- [ ] Trigger automático criado (opcional)

---

## 🎯 URLs Importantes

- **Cloud Build**: https://console.cloud.google.com/cloud-build/builds?project=qivo-mining-prod
- **Cloud Run**: https://console.cloud.google.com/run?project=qivo-mining-prod
- **IAM**: https://console.cloud.google.com/iam-admin/iam?project=qivo-mining-prod
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager?project=qivo-mining-prod
- **Aplicação**: https://qivo-mining-586444405059.us-central1.run.app

---

## 📞 Suporte

Se tiver problemas, verifique:
1. Logs do Cloud Build
2. Logs do Cloud Run
3. Configurações de permissões no IAM
4. Secrets no Secret Manager

**Boa sorte! 🚀**
