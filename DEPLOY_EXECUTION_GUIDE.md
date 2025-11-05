# QIVO Mining - Guia Executivo de Deploy em Produção

**Data:** 05/11/2025  
**Versão:** 1.0.0  
**Tempo Estimado:** 5-6 horas  
**Responsável:** _______________

---

## IMPORTANTE: LEIA ANTES DE COMEÇAR

Este guia contém **comandos prontos para execução** que irão criar a infraestrutura real no Google Cloud Platform e fazer o deploy da aplicação em produção.

**Pré-requisitos Obrigatórios:**
- Conta Google Cloud ativa
- Billing configurado e ativo
- gcloud CLI instalado e atualizado
- Acesso de administrador ao projeto
- Conta Stripe verificada
- Conta SendGrid ou Mailgun ativa

**Custo Estimado Mensal:**
- Cloud SQL: ~US$ 150/mês
- Cloud Run: ~US$ 50-200/mês (baseado em uso)
- Redis: ~US$ 50/mês
- Total: ~US$ 250-400/mês

---

## FASE 1: CONFIGURAÇÃO INICIAL DO GCP (2-3 horas)

### 1.1 Instalar gcloud CLI (se necessário)

```bash
# Linux/macOS
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Verificar instalação
gcloud version
```

### 1.2 Executar Script Automatizado de Setup

```bash
cd /path/to/qivo-mining
./scripts/gcp-setup.sh
```

**O que este script faz:**
1. Autentica com Google Cloud
2. Cria projeto `qivo-mining-prod`
3. Habilita APIs necessárias
4. Cria Cloud SQL instance (PostgreSQL 15)
5. Cria database `qivo_mining_prod`
6. Cria usuário do banco
7. Cria Cloud Memorystore (Redis)
8. Cria Service Account
9. Configura permissões
10. Cria secrets (JWT, SESSION, DATABASE_URL, REDIS_URL)

**Tempo:** 15-20 minutos

**IMPORTANTE:** Salve as connection strings exibidas no final:
```
DATABASE_URL=postgresql://qivo_user:PASSWORD@/qivo_mining_prod?host=/cloudsql/CONNECTION_NAME
REDIS_URL=redis://HOST:PORT
```

### 1.3 Verificar Infraestrutura Criada

```bash
# Verificar projeto
gcloud config get-value project

# Verificar Cloud SQL
gcloud sql instances list

# Verificar Redis
gcloud redis instances list --region=us-central1

# Verificar secrets
gcloud secrets list
```

**Checklist:**
- [ ] Projeto `qivo-mining-prod` criado
- [ ] Cloud SQL instance `qivo-mining-db` ativo
- [ ] Redis instance `qivo-mining-redis` ativo
- [ ] 4 secrets criados (JWT_SECRET, SESSION_SECRET, DATABASE_URL, REDIS_URL)
- [ ] Connection strings salvas

---

## FASE 2: CONFIGURAÇÃO DO STRIPE (1 hora)

### 2.1 Acessar Stripe Dashboard

1. Acesse: https://dashboard.stripe.com
2. Ative modo **Live** (toggle no canto superior direito)

### 2.2 Criar Produtos de Assinatura

**Produto 1: QIVO Mining - START**
```
Nome: QIVO Mining - START
Descrição: Plano inicial para pequenas operações
Tipo: Recurring
```

Preços:
- Mensal: US$ 2.500,00
- Anual: US$ 27.000,00 (10% desconto)

**Produto 2: QIVO Mining - PRO**
```
Nome: QIVO Mining - PRO
Descrição: Plano profissional para operações médias
Tipo: Recurring
```

Preços:
- Mensal: US$ 12.500,00
- Anual: US$ 135.000,00 (10% desconto)

**Produto 3: QIVO Mining - ENTERPRISE**
```
Nome: QIVO Mining - ENTERPRISE
Descrição: Plano enterprise para grandes operações
Tipo: Recurring
```

Preços:
- Mensal: US$ 35.000,00
- Anual: US$ 378.000,00 (10% desconto)

### 2.3 Criar Produtos de Relatórios Avulsos

**Produto 4: Relatório Simplificado**
```
Nome: Relatório Técnico Simplificado
Preço: US$ 2.800,00
Tipo: One-time
```

**Produto 5: Relatório Técnico Completo**
```
Nome: Relatório Técnico Completo
Preço: US$ 6.800,00
Tipo: One-time
```

**Produto 6: Relatório ESG Integrado**
```
Nome: Relatório ESG Integrado
Preço: US$ 12.800,00
Tipo: One-time
```

### 2.4 Copiar Price IDs

Após criar cada preço, copie o Price ID (começa com `price_`):

```bash
# Salvar em arquivo temporário
cat > /tmp/stripe-prices.txt << EOF
STRIPE_PRICE_START_MONTHLY=price_xxx
STRIPE_PRICE_START_ANNUAL=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_ANNUAL=price_xxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxx
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_xxx
STRIPE_PRICE_REPORT_SIMPLIFIED=price_xxx
STRIPE_PRICE_REPORT_TECHNICAL=price_xxx
STRIPE_PRICE_REPORT_ESG=price_xxx
EOF
```

### 2.5 Configurar Webhook

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em "Add endpoint"
3. URL: `https://qivomining.com/api/payment/webhook` (atualizar após deploy)
4. Eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copiar **Signing secret** (começa com `whsec_`)

### 2.6 Habilitar Customer Portal

1. Acesse: https://dashboard.stripe.com/settings/billing/portal
2. Ative o Customer Portal
3. Configure opções:
   - ✅ Cancelar assinatura
   - ✅ Atualizar plano
   - ✅ Atualizar método de pagamento
   - ✅ Ver histórico de faturas

### 2.7 Copiar API Keys

1. Acesse: https://dashboard.stripe.com/apikeys
2. Copiar:
   - **Publishable key** (começa com `pk_live_`)
   - **Secret key** (começa com `sk_live_`)

### 2.8 Armazenar Secrets no GCP

```bash
# Stripe Secret Key
echo -n "sk_live_xxx" | gcloud secrets create STRIPE_SECRET_KEY \
  --data-file=- --replication-policy="automatic"

# Stripe Publishable Key
echo -n "pk_live_xxx" | gcloud secrets create STRIPE_PUBLISHABLE_KEY \
  --data-file=- --replication-policy="automatic"

# Stripe Webhook Secret
echo -n "whsec_xxx" | gcloud secrets create STRIPE_WEBHOOK_SECRET \
  --data-file=- --replication-policy="automatic"

# Price IDs (cada um separadamente)
echo -n "price_xxx" | gcloud secrets create STRIPE_PRICE_START_MONTHLY \
  --data-file=- --replication-policy="automatic"

# Repetir para todos os 9 Price IDs...

# Grant access to Cloud Run
PROJECT_NUMBER=$(gcloud projects describe qivo-mining-prod --format="value(projectNumber)")
COMPUTE_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

for secret in STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET \
              STRIPE_PRICE_START_MONTHLY STRIPE_PRICE_START_ANNUAL \
              STRIPE_PRICE_PRO_MONTHLY STRIPE_PRICE_PRO_ANNUAL \
              STRIPE_PRICE_ENTERPRISE_MONTHLY STRIPE_PRICE_ENTERPRISE_ANNUAL \
              STRIPE_PRICE_REPORT_SIMPLIFIED STRIPE_PRICE_REPORT_TECHNICAL \
              STRIPE_PRICE_REPORT_ESG; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:$COMPUTE_SA" \
    --role="roles/secretmanager.secretAccessor"
done
```

**Checklist:**
- [ ] 3 produtos de assinatura criados
- [ ] 3 produtos de relatórios criados
- [ ] 9 Price IDs copiados
- [ ] Webhook configurado
- [ ] Customer Portal habilitado
- [ ] API keys copiadas
- [ ] Secrets armazenados no GCP

---

## FASE 3: CONFIGURAÇÃO DO EMAIL SERVICE (30 minutos)

### Opção A: SendGrid (Recomendado)

**3.1 Criar Conta**
1. Acesse: https://signup.sendgrid.com
2. Complete o cadastro
3. Verifique email

**3.2 Criar API Key**
1. Settings → API Keys
2. Create API Key
3. Nome: "QIVO Mining Production"
4. Permissões: Full Access
5. Copiar API key (começa com `SG.`)

**3.3 Verificar Domínio**
1. Settings → Sender Authentication
2. Authenticate Your Domain
3. Adicionar DNS records no seu registrador
4. Aguardar verificação (pode levar até 48h)

**3.4 Armazenar Secret**
```bash
echo -n "SG.xxx" | gcloud secrets create SENDGRID_API_KEY \
  --data-file=- --replication-policy="automatic"

echo -n "noreply@qivomining.com" | gcloud secrets create EMAIL_FROM \
  --data-file=- --replication-policy="automatic"

# Grant access
gcloud secrets add-iam-policy-binding SENDGRID_API_KEY \
  --member="serviceAccount:$COMPUTE_SA" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding EMAIL_FROM \
  --member="serviceAccount:$COMPUTE_SA" \
  --role="roles/secretmanager.secretAccessor"
```

### Opção B: Mailgun

**3.1 Criar Conta**
1. Acesse: https://signup.mailgun.com
2. Complete o cadastro

**3.2 Adicionar Domínio**
1. Sending → Domains → Add New Domain
2. Domínio: `mg.qivomining.com`
3. Adicionar DNS records

**3.3 Copiar Credenciais**
1. Domain Settings
2. Copiar:
   - SMTP hostname
   - SMTP username
   - SMTP password

**3.4 Armazenar Secrets**
```bash
echo -n "smtp.mailgun.org" | gcloud secrets create MAILGUN_SMTP_HOST \
  --data-file=- --replication-policy="automatic"

echo -n "587" | gcloud secrets create MAILGUN_SMTP_PORT \
  --data-file=- --replication-policy="automatic"

echo -n "postmaster@mg.qivomining.com" | gcloud secrets create MAILGUN_SMTP_USER \
  --data-file=- --replication-policy="automatic"

echo -n "password" | gcloud secrets create MAILGUN_SMTP_PASS \
  --data-file=- --replication-policy="automatic"
```

**Checklist:**
- [ ] Conta de email criada
- [ ] API key ou SMTP credentials copiadas
- [ ] Domínio verificado (ou em processo)
- [ ] Secrets armazenados no GCP

---

## FASE 4: EXECUTAR MIGRATIONS (15 minutos)

### 4.1 Conectar ao Cloud SQL

```bash
# Opção 1: Via Cloud SQL Proxy (Recomendado)
gcloud sql instances describe qivo-mining-db --format="value(connectionName)"
# Resultado: qivo-mining-prod:us-central1:qivo-mining-db

# Baixar Cloud SQL Proxy
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
chmod +x cloud_sql_proxy

# Iniciar proxy (em terminal separado)
./cloud_sql_proxy -instances=qivo-mining-prod:us-central1:qivo-mining-db=tcp:5432

# Opção 2: Via IP público (menos seguro)
gcloud sql instances patch qivo-mining-db --assign-ip
```

### 4.2 Executar Migrations

```bash
# Definir DATABASE_URL
export DATABASE_URL="postgresql://qivo_user:PASSWORD@localhost:5432/qivo_mining_prod"

# Executar script de migrations
cd /path/to/qivo-mining
./scripts/db-migrate.sh
```

**Saída esperada:**
```
✓ Prisma schema validated
✓ Migrations applied: 5
✓ Indexes created: 12
✓ Database ready
```

### 4.3 Verificar Migrations

```bash
# Conectar ao banco
psql "$DATABASE_URL"

# Verificar tabelas
\dt

# Verificar índices
\di

# Sair
\q
```

**Checklist:**
- [ ] Cloud SQL Proxy funcionando
- [ ] Migrations executadas com sucesso
- [ ] Índices criados
- [ ] Tabelas verificadas

---

## FASE 5: DEPLOY DA APLICAÇÃO (30 minutos)

### 5.1 Configurar GitHub Secrets (para CI/CD)

1. Acesse: https://github.com/YOUR_ORG/qivo-mining/settings/secrets/actions
2. Adicionar secrets:

```
GCP_PROJECT_ID = qivo-mining-prod
GCP_SA_KEY = (JSON da service account)
```

Para obter GCP_SA_KEY:
```bash
# Criar key da service account
gcloud iam service-accounts keys create key.json \
  --iam-account=qivo-mining-sa@qivo-mining-prod.iam.gserviceaccount.com

# Copiar conteúdo do arquivo key.json e colar no GitHub Secret
cat key.json
```

### 5.2 Opção A: Deploy Manual

```bash
cd /path/to/qivo-mining

# Build
./scripts/build-production.sh

# Deploy
./scripts/deploy-gcp.sh
```

**Tempo:** 10-15 minutos

### 5.3 Opção B: Deploy Automático (GitHub Actions)

```bash
# Fazer push para main
git push origin main

# Acompanhar deploy
# GitHub → Actions → Deploy to Production
```

**Tempo:** 15-20 minutos

### 5.4 Verificar Deploy

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe qivo-mining \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)')

echo "Service URL: $SERVICE_URL"

# Test health endpoint
curl $SERVICE_URL/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-05T..."}
```

**Checklist:**
- [ ] Build concluído sem erros
- [ ] Deploy concluído sem erros
- [ ] Service URL obtida
- [ ] Health check retorna 200 OK

---

## FASE 6: CONFIGURAÇÃO PÓS-DEPLOY (1 hora)

### 6.1 Configurar DNS

**Opção A: Cloud DNS (Recomendado)**

```bash
# Criar zona DNS
gcloud dns managed-zones create qivomining-com \
  --dns-name="qivomining.com." \
  --description="QIVO Mining Production"

# Obter name servers
gcloud dns managed-zones describe qivomining-com \
  --format="value(nameServers)"

# Atualizar name servers no registrador do domínio
# (GoDaddy, Namecheap, etc.)

# Criar record set
gcloud dns record-sets transaction start --zone=qivomining-com

# Adicionar A record para Cloud Run
# (Obter IP do Load Balancer após mapping)
gcloud run domain-mappings create \
  --service qivo-mining \
  --domain qivomining.com \
  --region us-central1

# Completar transaction
gcloud dns record-sets transaction execute --zone=qivomining-com
```

**Opção B: DNS Externo**

Adicionar records no seu provedor DNS:
```
Type: CNAME
Name: @
Value: ghs.googlehosted.com
TTL: 3600

Type: CNAME
Name: www
Value: qivomining.com
TTL: 3600
```

### 6.2 Configurar SSL

```bash
# SSL é automático com Cloud Run
# Aguardar propagação DNS (pode levar até 48h)

# Verificar SSL
curl -I https://qivomining.com

# Deve retornar 200 OK com certificado válido
```

### 6.3 Atualizar Webhook do Stripe

1. Acesse: https://dashboard.stripe.com/webhooks
2. Editar endpoint
3. Atualizar URL: `https://qivomining.com/api/payment/webhook`
4. Salvar

### 6.4 Testar Webhook

```bash
# Stripe CLI (para testes)
stripe listen --forward-to https://qivomining.com/api/payment/webhook

# Trigger test event
stripe trigger checkout.session.completed
```

### 6.5 Configurar Monitoramento

**Uptime Check:**
```bash
gcloud monitoring uptime create qivo-mining-health \
  --resource-type=uptime-url \
  --host=qivomining.com \
  --path=/health \
  --check-interval=60s
```

**Alertas:**
```bash
# CPU > 80%
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="QIVO Mining - High CPU" \
  --condition-display-name="CPU > 80%" \
  --condition-threshold-value=0.8 \
  --condition-threshold-duration=300s

# Error rate > 5%
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="QIVO Mining - High Error Rate" \
  --condition-display-name="Error Rate > 5%" \
  --condition-threshold-value=0.05
```

**Checklist:**
- [ ] DNS configurado
- [ ] SSL ativo
- [ ] Webhook Stripe atualizado
- [ ] Webhook testado
- [ ] Uptime monitoring ativo
- [ ] Alertas configurados

---

## FASE 7: TESTES DE VALIDAÇÃO (30 minutos)

### 7.1 Smoke Tests

```bash
# Execute script de validação
./scripts/post-deploy-validation.sh
```

### 7.2 Testes Manuais

**Registro:**
```bash
curl -X POST https://qivomining.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test@1234",
    "name":"Test User"
  }'
```

**Login:**
```bash
curl -X POST https://qivomining.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test@1234"
  }'
```

**Checkout:**
```bash
curl -X POST https://qivomining.com/api/payment/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "plan":"PRO",
    "interval":"monthly"
  }'
```

### 7.3 Testes de Interface

1. Acesse: https://qivomining.com
2. Testar:
   - [ ] Landing page carrega
   - [ ] Registro funciona
   - [ ] Login funciona
   - [ ] Dashboard carrega
   - [ ] Criação de relatório funciona
   - [ ] Checkout Stripe funciona
   - [ ] Customer Portal funciona

**Checklist:**
- [ ] Todos os smoke tests passaram
- [ ] Registro funciona
- [ ] Login funciona
- [ ] Checkout funciona
- [ ] Interface responsiva
- [ ] Performance < 3s

---

## FASE 8: GO-LIVE (15 minutos)

### 8.1 Checklist Final

- [ ] Infraestrutura GCP configurada
- [ ] Stripe configurado
- [ ] Email service configurado
- [ ] Migrations executadas
- [ ] Aplicação deployada
- [ ] DNS configurado
- [ ] SSL ativo
- [ ] Webhook funcionando
- [ ] Monitoramento ativo
- [ ] Testes passando

### 8.2 Comunicação

**Equipe:**
- [ ] Notificar equipe de suporte
- [ ] Notificar equipe de vendas
- [ ] Notificar stakeholders

**Usuários:**
- [ ] Enviar email de lançamento
- [ ] Atualizar status page
- [ ] Publicar anúncio

### 8.3 Monitoramento Inicial

```bash
# Monitorar logs em tempo real
gcloud run logs tail qivo-mining --region us-central1

# Monitorar métricas
# Acesse: https://console.cloud.google.com/run/detail/us-central1/qivo-mining/metrics
```

---

## ROLLBACK (Se Necessário)

### Rollback Rápido

```bash
# Listar revisões
gcloud run revisions list \
  --service qivo-mining \
  --region us-central1

# Rollback para revisão anterior
gcloud run services update-traffic qivo-mining \
  --to-revisions PREVIOUS_REVISION=100 \
  --region us-central1
```

### Rollback de Database

```bash
# Listar backups
gcloud sql backups list --instance=qivo-mining-db

# Restore
gcloud sql backups restore BACKUP_ID \
  --backup-instance=qivo-mining-db
```

---

## CONTATOS DE EMERGÊNCIA

**DevOps:** _______________  
**Backend Lead:** _______________  
**Frontend Lead:** _______________  
**Product Manager:** _______________

---

## CONCLUSÃO

**Parabéns! A plataforma QIVO Mining está em produção!**

**Próximos Passos:**
1. Monitorar logs e métricas nas primeiras 24h
2. Coletar feedback de usuários
3. Iterar com melhorias
4. Escalar conforme necessário

---

**Data de Execução:** _______________  
**Responsável:** _______________  
**Status:** ☐ CONCLUÍDO COM SUCESSO

**Observações:**
_______________________________________________
_______________________________________________
_______________________________________________
