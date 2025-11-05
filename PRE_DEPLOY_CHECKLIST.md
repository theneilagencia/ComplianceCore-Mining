# Pre-Deploy Checklist - QIVO Mining

**Data:** 05/11/2025  
**Versão:** 1.0.0  
**Responsável:** _______________  
**Data de Deploy Planejado:** _______________

---

## CHECKLIST OBRIGATÓRIO

### 1. Código e Testes ✅

- [x] Todos os testes passando (402/402)
- [x] Cobertura de código > 90% (91.25%)
- [x] Build de produção sem erros
- [x] Build de produção sem warnings
- [x] Código revisado e aprovado
- [x] Sem vulnerabilidades de segurança conhecidas
- [x] Documentação atualizada

**Status:** APROVADO ✅

---

### 2. Infraestrutura GCP

- [ ] Projeto GCP criado (`qivo-mining-prod`)
- [ ] Billing ativado
- [ ] APIs necessárias habilitadas:
  - [ ] Cloud Build API
  - [ ] Cloud Run API
  - [ ] Container Registry API
  - [ ] Cloud SQL Admin API
  - [ ] Cloud Memorystore API
  - [ ] Secret Manager API
- [ ] Service Account criado
- [ ] Permissões configuradas

**Comandos:**
```bash
gcloud projects create qivo-mining-prod
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
```

---

### 3. Banco de Dados

- [ ] Cloud SQL instance criada
- [ ] Database `qivo_mining_prod` criada
- [ ] Usuário criado com senha forte
- [ ] Backups automáticos configurados
- [ ] Conexão testada
- [ ] Migrations executadas com sucesso
- [ ] Índices criados

**Comandos:**
```bash
gcloud sql instances create qivo-mining-db
./scripts/db-migrate.sh
```

**Connection String:**
```
postgresql://USER:PASSWORD@HOST:5432/qivo_mining_prod?sslmode=require
```

---

### 4. Redis Cache

- [ ] Cloud Memorystore instance criada
- [ ] Tier Standard selecionado (para HA)
- [ ] Conexão testada
- [ ] TTL configurado (24h)
- [ ] Eviction policy configurada (allkeys-lru)

**Comandos:**
```bash
gcloud redis instances create qivo-mining-redis --size=1 --tier=standard
```

**Connection String:**
```
redis://HOST:6379
```

---

### 5. Variáveis de Ambiente

- [ ] `.env.production` criado
- [ ] JWT_SECRET gerado (64+ caracteres)
- [ ] SESSION_SECRET gerado (64+ caracteres)
- [ ] DATABASE_URL configurado
- [ ] REDIS_URL configurado
- [ ] Todos os secrets armazenados no Secret Manager
- [ ] Service Account tem acesso aos secrets

**Comandos:**
```bash
./scripts/setup-env.sh
# Depois, armazenar secrets no Secret Manager
```

**Secrets Obrigatórios:**
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- SESSION_SECRET
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- EMAIL_SERVICE credentials

---

### 6. Stripe

- [ ] Conta Stripe criada e verificada
- [ ] Modo Live ativado
- [ ] Produtos criados:
  - [ ] QIVO Mining - START (US$ 2.500/mês)
  - [ ] QIVO Mining - PRO (US$ 12.500/mês)
  - [ ] QIVO Mining - ENTERPRISE (US$ 35.000/mês)
- [ ] Preços anuais criados (10% desconto)
- [ ] Produtos de relatórios avulsos criados
- [ ] Webhook endpoint configurado
- [ ] Webhook secret copiado
- [ ] Customer Portal habilitado
- [ ] API keys copiadas

**Webhook URL:**
```
https://qivomining.com/api/payment/webhook
```

**Price IDs Necessários:**
- STRIPE_PRICE_START_MONTHLY
- STRIPE_PRICE_START_ANNUAL
- STRIPE_PRICE_PRO_MONTHLY
- STRIPE_PRICE_PRO_ANNUAL
- STRIPE_PRICE_ENTERPRISE_MONTHLY
- STRIPE_PRICE_ENTERPRISE_ANNUAL
- STRIPE_PRICE_REPORT_SIMPLIFIED
- STRIPE_PRICE_REPORT_TECHNICAL
- STRIPE_PRICE_REPORT_ESG

---

### 7. Email Service

- [ ] SendGrid ou Mailgun account criado
- [ ] API key gerado
- [ ] Domínio verificado
- [ ] Email templates criados
- [ ] Email de teste enviado com sucesso

**Configuração SendGrid:**
```bash
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=noreply@qivomining.com
```

---

### 8. Integrações Oficiais

- [ ] ANM API key obtida (opcional)
- [ ] CPRM API key obtida (opcional)
- [ ] IBAMA API key obtida (opcional)
- [ ] ANP API key obtida (opcional)
- [ ] USGS API key obtida (opcional)
- [ ] Copernicus API key obtida (opcional)

**Nota:** Integrações funcionam com fallback para mock se API keys não estiverem configuradas.

---

### 9. OAuth Google (Opcional)

- [ ] Google Cloud Console project criado
- [ ] OAuth consent screen configurado
- [ ] Credenciais OAuth criadas
- [ ] Redirect URI configurada
- [ ] Client ID e Secret copiados

**Redirect URI:**
```
https://api.qivomining.com/api/auth/google/callback
```

---

### 10. Monitoramento

- [ ] Prometheus metrics habilitado
- [ ] Grafana dashboard importado (opcional)
- [ ] Sentry configurado (opcional)
- [ ] Google Cloud Logging habilitado
- [ ] Uptime monitoring configurado
- [ ] Alertas configurados:
  - [ ] CPU > 80%
  - [ ] Memory > 80%
  - [ ] Error rate > 5%
  - [ ] Response time > 1s

---

### 11. DNS e Domínio

- [ ] Domínio `qivomining.com` registrado
- [ ] DNS records configurados:
  - [ ] A record para Cloud Run
  - [ ] CNAME para www
  - [ ] MX records para email (se aplicável)
- [ ] SSL certificate ativo
- [ ] HTTPS funcionando

---

### 12. CI/CD

- [ ] GitHub Actions configurado
- [ ] Secrets do GitHub configurados:
  - [ ] GCP_SA_KEY
  - [ ] DATABASE_URL
  - [ ] Todos os outros secrets
- [ ] Workflow testado
- [ ] Deploy automático funcionando

---

### 13. Segurança

- [ ] Firewall rules configuradas
- [ ] VPC configurado (se aplicável)
- [ ] Rate limiting ativo
- [ ] CORS configurado
- [ ] Helmet.js ativo
- [ ] Scanner de vírus configurado
- [ ] Webhook signature verification ativa
- [ ] Secrets rotacionados (se reutilizados)

---

### 14. Backup e Recovery

- [ ] Backup automático do banco de dados configurado
- [ ] Backup schedule definido (diário às 2 AM)
- [ ] Retention policy configurada (30 dias)
- [ ] Procedimento de restore testado
- [ ] Disaster recovery plan documentado

---

### 15. Performance

- [ ] Índices no banco de dados criados
- [ ] Redis cache configurado
- [ ] Compressão gzip ativa
- [ ] CDN configurado (opcional)
- [ ] Testes de carga executados
- [ ] Performance validada (98% < 250ms)

---

### 16. Documentação

- [ ] README.md atualizado
- [ ] DEPLOYMENT_GUIDE.md revisado
- [ ] REDIS_SETUP.md revisado
- [ ] STRIPE_SETUP.md revisado
- [ ] Runbooks criados
- [ ] Credenciais documentadas (em local seguro)

---

### 17. Testes Finais

- [ ] Health check funcionando
- [ ] Registro de usuário funcionando
- [ ] Login funcionando
- [ ] OAuth Google funcionando (se configurado)
- [ ] Criação de relatório funcionando
- [ ] Checkout Stripe funcionando
- [ ] Webhook Stripe funcionando
- [ ] Email de verificação funcionando
- [ ] Todas as integrações funcionando

---

### 18. Comunicação

- [ ] Equipe de suporte notificada
- [ ] Equipe de vendas notificada
- [ ] Usuários beta notificados (se aplicável)
- [ ] Status page atualizado
- [ ] Anúncio de lançamento preparado

---

## VALIDAÇÃO FINAL

### Smoke Tests

Execute os seguintes testes após o deploy:

```bash
# 1. Health check
curl https://qivomining.com/health

# 2. API health
curl https://qivomining.com/api/health

# 3. Registro
curl -X POST https://qivomining.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234","name":"Test"}'

# 4. Login
curl -X POST https://qivomining.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}'

# 5. Stripe checkout
curl -X POST https://qivomining.com/api/payment/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"plan":"PRO","interval":"monthly"}'
```

---

## APROVAÇÕES

### Técnica

- [ ] Desenvolvedor Backend: _______________
- [ ] Desenvolvedor Frontend: _______________
- [ ] DevOps: _______________
- [ ] QA: _______________

### Negócio

- [ ] Product Manager: _______________
- [ ] CEO/CTO: _______________

---

## PLANO DE ROLLBACK

Em caso de problemas críticos:

```bash
# 1. Rollback Cloud Run
gcloud run services update-traffic qivo-mining \
  --to-revisions PREVIOUS_REVISION=100

# 2. Rollback Database (se necessário)
gcloud sql backups restore BACKUP_ID \
  --backup-instance=qivo-mining-db

# 3. Notificar equipe
# 4. Investigar problema
# 5. Corrigir e re-deploy
```

---

## CONTATOS DE EMERGÊNCIA

**DevOps:** _______________  
**Backend Lead:** _______________  
**Frontend Lead:** _______________  
**Product Manager:** _______________

---

## NOTAS FINAIS

**Data de Preenchimento:** _______________  
**Responsável:** _______________  
**Status:** ☐ PRONTO PARA DEPLOY  

**Observações:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**IMPORTANTE:** Este checklist deve ser 100% completo antes do deploy em produção. Não pule nenhum item crítico.

**Status Final:** ☐ APROVADO PARA DEPLOY
