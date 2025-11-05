# 📋 PLANO DETALHADO: MONITORAMENTO, ALERTAS E SEGURANÇA - QIVO MINING

**Data:** 05 de Novembro de 2025  
**Plataforma:** Google Cloud Platform (GCP)  
**Projeto:** qivo-mining-prod  
**Status Atual:** ✅ Plataforma 100% funcional

---

## 🎯 OBJETIVO

Implementar monitoramento proativo, sistema de alertas inteligente e segurança avançada (IAM + WAF) para garantir:
- **Disponibilidade:** 99.9% uptime
- **Segurança:** Proteção contra ataques e vazamentos
- **Performance:** Tempo de resposta < 500ms
- **Conformidade:** LGPD e melhores práticas

---

## 📊 FASE 1: MONITORAMENTO E ALERTAS

### 1.1 Google Cloud Monitoring (Cloud Operations)

#### 🎯 Objetivo
Monitorar métricas de infraestrutura, aplicação e banco de dados em tempo real.

#### 📋 Implementação

**1.1.1 Configurar Workspaces**
```bash
# Criar workspace de monitoramento
gcloud monitoring workspaces create \
  --project=qivo-mining-prod \
  --display-name="QIVO Mining Production"
```

**1.1.2 Métricas Principais a Monitorar**

| Categoria | Métrica | Threshold | Ação |
|-----------|---------|-----------|------|
| **Cloud Run** | CPU Utilization | > 80% | Alerta + Auto-scale |
| **Cloud Run** | Memory Utilization | > 85% | Alerta + Investigar |
| **Cloud Run** | Request Count | > 10000/min | Alerta + Análise |
| **Cloud Run** | Request Latency | > 500ms (p95) | Alerta + Otimizar |
| **Cloud Run** | Error Rate | > 1% | Alerta Crítico |
| **Cloud SQL** | CPU Utilization | > 75% | Alerta + Upgrade |
| **Cloud SQL** | Memory Utilization | > 80% | Alerta + Upgrade |
| **Cloud SQL** | Disk Utilization | > 70% | Alerta + Expandir |
| **Cloud SQL** | Connections | > 80% do max | Alerta + Pool |
| **Cloud SQL** | Query Latency | > 100ms (avg) | Alerta + Otimizar |

**1.1.3 Criar Dashboards Personalizados**

```yaml
# Dashboard: QIVO Mining - Overview
Painéis:
  - Painel 1: Cloud Run Metrics
    - CPU Utilization (Time Series)
    - Memory Utilization (Time Series)
    - Request Count (Bar Chart)
    - Error Rate (Gauge)
    
  - Painel 2: Cloud SQL Metrics
    - CPU Utilization (Time Series)
    - Connections Active (Line Chart)
    - Query Latency (Heatmap)
    - Disk Usage (Gauge)
    
  - Painel 3: Application Metrics
    - Login Success Rate (%)
    - Report Generation Time (avg)
    - API Response Time (p50, p95, p99)
    - Active Users (Real-time)
```

**Comando para criar dashboard:**
```bash
gcloud monitoring dashboards create \
  --config-from-file=dashboard-qivo-mining.yaml
```

---

### 1.2 Google Cloud Logging (Cloud Logging)

#### 🎯 Objetivo
Centralizar, filtrar e analisar logs de aplicação, infraestrutura e segurança.

#### 📋 Implementação

**1.2.1 Configurar Log Sinks**

```bash
# Criar sink para logs de erro (Cloud Storage para análise posterior)
gcloud logging sinks create qivo-errors-sink \
  storage.googleapis.com/qivo-mining-logs-errors \
  --log-filter='severity >= ERROR'

# Criar sink para logs de auditoria (BigQuery para análise)
gcloud logging sinks create qivo-audit-sink \
  bigquery.googleapis.com/projects/qivo-mining-prod/datasets/audit_logs \
  --log-filter='protoPayload.methodName="google.cloud.sql.v1.SqlInstancesService.Update" OR resource.type="cloud_run_revision"'
```

**1.2.2 Logs Críticos a Monitorar**

| Tipo de Log | Filtro | Ação |
|-------------|--------|------|
| **Erros de Aplicação** | `severity=ERROR` | Alerta imediato |
| **Falhas de Login** | `jsonPayload.event="login_failed"` | Alerta após 5 tentativas |
| **Erros de Banco de Dados** | `textPayload=~"PostgresError"` | Alerta + Investigar |
| **Erros 5xx** | `httpRequest.status >= 500` | Alerta crítico |
| **Latência Alta** | `httpRequest.latency > "500ms"` | Alerta + Otimizar |
| **Tentativas de SQL Injection** | `textPayload=~"DROP TABLE\|UNION SELECT"` | Alerta de segurança |

**1.2.3 Criar Log-based Metrics**

```bash
# Métrica: Taxa de erro de login
gcloud logging metrics create login_failure_rate \
  --description="Rate of failed login attempts" \
  --log-filter='jsonPayload.event="login_failed"'

# Métrica: Tempo médio de geração de relatório
gcloud logging metrics create report_generation_time \
  --description="Average time to generate reports" \
  --log-filter='jsonPayload.event="report_generated"' \
  --value-extractor='EXTRACT(jsonPayload.duration)'
```

---

### 1.3 Sistema de Alertas Inteligente

#### 🎯 Objetivo
Notificar equipe sobre problemas críticos antes que afetem usuários.

#### 📋 Implementação

**1.3.1 Canais de Notificação**

```bash
# Email
gcloud alpha monitoring channels create \
  --display-name="QIVO Admin Email" \
  --type=email \
  --channel-labels=email_address=vinicius.debian@theneil.com.br

# Slack (requer webhook)
gcloud alpha monitoring channels create \
  --display-name="QIVO Slack Alerts" \
  --type=slack \
  --channel-labels=url=https://hooks.slack.com/services/YOUR_WEBHOOK

# SMS (Twilio)
gcloud alpha monitoring channels create \
  --display-name="QIVO SMS Alerts" \
  --type=sms \
  --channel-labels=number=+5511999999999
```

**1.3.2 Políticas de Alerta Críticas**

```yaml
# Alerta 1: Cloud Run - Alta Taxa de Erro
displayName: "QIVO - High Error Rate"
conditions:
  - displayName: "Error rate > 1%"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count" AND metric.label.response_code_class="5xx"'
      comparison: COMPARISON_GT
      thresholdValue: 0.01
      duration: 60s
notificationChannels:
  - projects/qivo-mining-prod/notificationChannels/[EMAIL_CHANNEL_ID]
  - projects/qivo-mining-prod/notificationChannels/[SLACK_CHANNEL_ID]
alertStrategy:
  autoClose: 1800s

# Alerta 2: Cloud SQL - CPU Alta
displayName: "QIVO - Cloud SQL High CPU"
conditions:
  - displayName: "CPU > 80%"
    conditionThreshold:
      filter: 'resource.type="cloudsql_database" AND metric.type="cloudsql.googleapis.com/database/cpu/utilization"'
      comparison: COMPARISON_GT
      thresholdValue: 0.80
      duration: 300s
notificationChannels:
  - projects/qivo-mining-prod/notificationChannels/[EMAIL_CHANNEL_ID]

# Alerta 3: Latência Alta
displayName: "QIVO - High Latency"
conditions:
  - displayName: "P95 latency > 500ms"
    conditionThreshold:
      filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_latencies"'
      comparison: COMPARISON_GT
      thresholdValue: 500
      duration: 120s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_PERCENTILE_95
notificationChannels:
  - projects/qivo-mining-prod/notificationChannels/[SLACK_CHANNEL_ID]

# Alerta 4: Falhas de Login Suspeitas
displayName: "QIVO - Suspicious Login Failures"
conditions:
  - displayName: "More than 10 failed logins in 5 minutes"
    conditionThreshold:
      filter: 'metric.type="logging.googleapis.com/user/login_failure_rate"'
      comparison: COMPARISON_GT
      thresholdValue: 10
      duration: 300s
notificationChannels:
  - projects/qivo-mining-prod/notificationChannels/[EMAIL_CHANNEL_ID]
  - projects/qivo-mining-prod/notificationChannels/[SMS_CHANNEL_ID]
alertStrategy:
  notificationRateLimit:
    period: 900s  # Não enviar mais de 1 alerta a cada 15 minutos
```

**Comando para criar alertas:**
```bash
gcloud alpha monitoring policies create \
  --policy-from-file=alert-high-error-rate.yaml
```

---

### 1.4 Uptime Checks (Monitoramento de Disponibilidade)

#### 🎯 Objetivo
Verificar disponibilidade da aplicação de diferentes regiões geográficas.

#### 📋 Implementação

```bash
# Uptime check: Homepage
gcloud monitoring uptime-checks create qivo-homepage \
  --display-name="QIVO Homepage" \
  --resource-type=uptime-url \
  --monitored-resource-url=https://qivo-mining-kfw7vgq5xa-rj.a.run.app \
  --check-interval=60s \
  --timeout=10s \
  --regions=us-central1,southamerica-east1,europe-west1

# Uptime check: API Health
gcloud monitoring uptime-checks create qivo-api-health \
  --display-name="QIVO API Health" \
  --resource-type=uptime-url \
  --monitored-resource-url=https://qivo-mining-kfw7vgq5xa-rj.a.run.app/api/health \
  --check-interval=60s \
  --timeout=10s \
  --regions=us-central1,southamerica-east1

# Uptime check: Login Page
gcloud monitoring uptime-checks create qivo-login \
  --display-name="QIVO Login Page" \
  --resource-type=uptime-url \
  --monitored-resource-url=https://qivo-mining-kfw7vgq5xa-rj.a.run.app/login \
  --check-interval=300s \
  --timeout=10s \
  --regions=southamerica-east1
```

**Alerta de Downtime:**
```yaml
displayName: "QIVO - Service Down"
conditions:
  - displayName: "Uptime check failed"
    conditionThreshold:
      filter: 'metric.type="monitoring.googleapis.com/uptime_check/check_passed" AND resource.label.check_id="qivo-homepage"'
      comparison: COMPARISON_LT
      thresholdValue: 1
      duration: 120s
notificationChannels:
  - projects/qivo-mining-prod/notificationChannels/[EMAIL_CHANNEL_ID]
  - projects/qivo-mining-prod/notificationChannels/[SLACK_CHANNEL_ID]
  - projects/qivo-mining-prod/notificationChannels/[SMS_CHANNEL_ID]
alertStrategy:
  autoClose: 600s
```

---

### 1.5 Application Performance Monitoring (APM)

#### 🎯 Objetivo
Monitorar performance de código, queries SQL e chamadas de API.

#### 📋 Implementação

**1.5.1 Integrar Cloud Trace**

```typescript
// server/_core/index.ts
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

// Configurar tracing
const provider = new NodeTracerProvider();
provider.addSpanProcessor(new BatchSpanProcessor(new TraceExporter()));
provider.register();

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
});
```

**1.5.2 Integrar Cloud Profiler**

```typescript
// server/_core/index.ts
import '@google-cloud/profiler';

// Iniciar profiler
require('@google-cloud/profiler').start({
  serviceContext: {
    service: 'qivo-mining',
    version: '1.2.1',
  },
});
```

**1.5.3 Queries SQL Lentas**

```sql
-- Criar extensão pg_stat_statements no Cloud SQL
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Query para identificar queries lentas
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries com média > 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## 🔒 FASE 2: SEGURANÇA AVANÇADA (IAM + WAF)

### 2.1 Identity and Access Management (IAM)

#### 🎯 Objetivo
Implementar princípio de menor privilégio e segregação de funções.

#### 📋 Implementação

**2.1.1 Auditoria de Permissões Atuais**

```bash
# Listar todas as IAM policies do projeto
gcloud projects get-iam-policy qivo-mining-prod \
  --format=json > current-iam-policy.json

# Analisar permissões excessivas
gcloud asset search-all-iam-policies \
  --scope=projects/qivo-mining-prod \
  --query="policy:roles/owner OR policy:roles/editor"
```

**2.1.2 Criar Roles Personalizadas**

```yaml
# Role: QIVO Developer (acesso limitado)
title: "QIVO Developer"
description: "Acesso para desenvolvedores - deploy e logs"
stage: "GA"
includedPermissions:
  - run.services.get
  - run.services.list
  - run.services.update
  - logging.logEntries.list
  - logging.logs.list
  - monitoring.timeSeries.list
  - cloudbuild.builds.get
  - cloudbuild.builds.list

# Role: QIVO DBA (acesso ao banco de dados)
title: "QIVO DBA"
description: "Acesso para DBAs - Cloud SQL apenas"
stage: "GA"
includedPermissions:
  - cloudsql.instances.get
  - cloudsql.instances.list
  - cloudsql.instances.update
  - cloudsql.databases.get
  - cloudsql.databases.list
  - cloudsql.users.list
  - cloudsql.backups.get
  - cloudsql.backups.list
  - cloudsql.backups.create
```

**Comando para criar roles:**
```bash
gcloud iam roles create qivoDeveloper \
  --project=qivo-mining-prod \
  --file=role-developer.yaml

gcloud iam roles create qivoDBA \
  --project=qivo-mining-prod \
  --file=role-dba.yaml
```

**2.1.3 Atribuir Roles com Princípio de Menor Privilégio**

```bash
# Remover Owner/Editor de service accounts
gcloud projects remove-iam-policy-binding qivo-mining-prod \
  --member="serviceAccount:qivo-app-oauth@qivo-mining-prod.iam.gserviceaccount.com" \
  --role="roles/editor"

# Adicionar roles específicas
gcloud projects add-iam-policy-binding qivo-mining-prod \
  --member="serviceAccount:qivo-app-oauth@qivo-mining-prod.iam.gserviceaccount.com" \
  --role="roles/run.invoker"

gcloud projects add-iam-policy-binding qivo-mining-prod \
  --member="serviceAccount:qivo-app-oauth@qivo-mining-prod.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding qivo-mining-prod \
  --member="serviceAccount:qivo-app-oauth@qivo-mining-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Adicionar role customizada para desenvolvedores
gcloud projects add-iam-policy-binding qivo-mining-prod \
  --member="user:vinicius.debian@theneil.com.br" \
  --role="projects/qivo-mining-prod/roles/qivoDeveloper"
```

**2.1.4 Habilitar Auditoria de IAM**

```bash
# Configurar audit logs para IAM
gcloud logging sinks create iam-audit-logs \
  bigquery.googleapis.com/projects/qivo-mining-prod/datasets/iam_audit \
  --log-filter='protoPayload.serviceName="iam.googleapis.com"'
```

---

### 2.2 Web Application Firewall (Cloud Armor)

#### 🎯 Objetivo
Proteger aplicação contra ataques DDoS, SQL Injection, XSS e bots maliciosos.

#### 📋 Implementação

**2.2.1 Criar Security Policy**

```bash
# Criar política de segurança
gcloud compute security-policies create qivo-waf-policy \
  --description="WAF policy for QIVO Mining"

# Regra 1: Bloquear países de alto risco (opcional)
gcloud compute security-policies rules create 1000 \
  --security-policy=qivo-waf-policy \
  --expression="origin.region_code == 'CN' || origin.region_code == 'RU'" \
  --action=deny-403 \
  --description="Block high-risk countries"

# Regra 2: Rate limiting - Proteger contra DDoS
gcloud compute security-policies rules create 2000 \
  --security-policy=qivo-waf-policy \
  --expression="true" \
  --action=rate-based-ban \
  --rate-limit-threshold-count=100 \
  --rate-limit-threshold-interval-sec=60 \
  --ban-duration-sec=600 \
  --conform-action=allow \
  --exceed-action=deny-429 \
  --enforce-on-key=IP \
  --description="Rate limit: 100 req/min per IP"

# Regra 3: Bloquear SQL Injection
gcloud compute security-policies rules create 3000 \
  --security-policy=qivo-waf-policy \
  --expression="evaluatePreconfiguredExpr('sqli-stable')" \
  --action=deny-403 \
  --description="Block SQL Injection attempts"

# Regra 4: Bloquear XSS
gcloud compute security-policies rules create 4000 \
  --security-policy=qivo-waf-policy \
  --expression="evaluatePreconfiguredExpr('xss-stable')" \
  --action=deny-403 \
  --description="Block XSS attempts"

# Regra 5: Bloquear Local File Inclusion
gcloud compute security-policies rules create 5000 \
  --security-policy=qivo-waf-policy \
  --expression="evaluatePreconfiguredExpr('lfi-stable')" \
  --action=deny-403 \
  --description="Block LFI attempts"

# Regra 6: Bloquear Remote Code Execution
gcloud compute security-policies rules create 6000 \
  --security-policy=qivo-waf-policy \
  --expression="evaluatePreconfiguredExpr('rce-stable')" \
  --action=deny-403 \
  --description="Block RCE attempts"

# Regra 7: Permitir tráfego legítimo (default)
gcloud compute security-policies rules create 10000 \
  --security-policy=qivo-waf-policy \
  --expression="true" \
  --action=allow \
  --description="Allow legitimate traffic"
```

**2.2.2 Aplicar WAF ao Cloud Run (via Load Balancer)**

**Nota:** Cloud Run não suporta Cloud Armor diretamente. É necessário usar um Load Balancer.

```bash
# Passo 1: Criar Network Endpoint Group (NEG) para Cloud Run
gcloud compute network-endpoint-groups create qivo-neg \
  --region=southamerica-east1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=qivo-mining

# Passo 2: Criar Backend Service
gcloud compute backend-services create qivo-backend \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED

# Passo 3: Adicionar NEG ao Backend Service
gcloud compute backend-services add-backend qivo-backend \
  --global \
  --network-endpoint-group=qivo-neg \
  --network-endpoint-group-region=southamerica-east1

# Passo 4: Aplicar Security Policy ao Backend
gcloud compute backend-services update qivo-backend \
  --global \
  --security-policy=qivo-waf-policy

# Passo 5: Criar URL Map
gcloud compute url-maps create qivo-url-map \
  --default-service=qivo-backend

# Passo 6: Criar certificado SSL (usando Let's Encrypt ou Google-managed)
gcloud compute ssl-certificates create qivo-ssl-cert \
  --domains=qivo-mining.com.br

# Passo 7: Criar HTTPS Proxy
gcloud compute target-https-proxies create qivo-https-proxy \
  --url-map=qivo-url-map \
  --ssl-certificates=qivo-ssl-cert

# Passo 8: Criar Forwarding Rule (IP público)
gcloud compute forwarding-rules create qivo-https-rule \
  --global \
  --target-https-proxy=qivo-https-proxy \
  --ports=443

# Passo 9: Obter IP público
gcloud compute forwarding-rules describe qivo-https-rule \
  --global \
  --format="get(IPAddress)"
```

**2.2.3 Configurar Logging do WAF**

```bash
# Habilitar logging no backend service
gcloud compute backend-services update qivo-backend \
  --global \
  --enable-logging \
  --logging-sample-rate=1.0

# Criar sink para logs do WAF
gcloud logging sinks create waf-security-logs \
  bigquery.googleapis.com/projects/qivo-mining-prod/datasets/waf_logs \
  --log-filter='resource.type="http_load_balancer" AND jsonPayload.enforcedSecurityPolicy.name="qivo-waf-policy"'
```

**2.2.4 Alertas de Segurança WAF**

```yaml
# Alerta: Tentativas de SQL Injection bloqueadas
displayName: "QIVO - SQL Injection Attempts Blocked"
conditions:
  - displayName: "More than 10 SQL injection attempts in 5 minutes"
    conditionThreshold:
      filter: 'resource.type="http_load_balancer" AND jsonPayload.enforcedSecurityPolicy.configuredAction="DENY" AND jsonPayload.enforcedSecurityPolicy.preconfiguredExprIds="sqli-stable"'
      comparison: COMPARISON_GT
      thresholdValue: 10
      duration: 300s
notificationChannels:
  - projects/qivo-mining-prod/notificationChannels/[EMAIL_CHANNEL_ID]
  - projects/qivo-mining-prod/notificationChannels/[SLACK_CHANNEL_ID]

# Alerta: Rate limit excedido (possível DDoS)
displayName: "QIVO - Possible DDoS Attack"
conditions:
  - displayName: "More than 100 rate limit violations in 1 minute"
    conditionThreshold:
      filter: 'resource.type="http_load_balancer" AND jsonPayload.enforcedSecurityPolicy.configuredAction="RATE_BASED_BAN"'
      comparison: COMPARISON_GT
      thresholdValue: 100
      duration: 60s
notificationChannels:
  - projects/qivo-mining-prod/notificationChannels/[EMAIL_CHANNEL_ID]
  - projects/qivo-mining-prod/notificationChannels/[SMS_CHANNEL_ID]
```

---

### 2.3 Secrets Management

#### 🎯 Objetivo
Garantir que secrets (DATABASE_URL, API keys) estejam seguros e rotacionados.

#### 📋 Implementação

**2.3.1 Auditoria de Secrets**

```bash
# Listar todos os secrets
gcloud secrets list --project=qivo-mining-prod

# Verificar permissões de cada secret
gcloud secrets get-iam-policy DATABASE_URL --project=qivo-mining-prod
```

**2.3.2 Configurar Rotação Automática de Secrets**

```bash
# Habilitar versionamento de secrets
gcloud secrets versions list DATABASE_URL --project=qivo-mining-prod

# Criar nova versão do DATABASE_URL (rotação manual)
echo -n "postgresql://compliance_admin:NEW_PASSWORD@10.66.0.3:5432/compliancecore?sslmode=require" | \
  gcloud secrets versions add DATABASE_URL --data-file=-
```

**2.3.3 Restringir Acesso aos Secrets**

```bash
# Remover acesso de todos exceto service account
gcloud secrets remove-iam-policy-binding DATABASE_URL \
  --member="allUsers" \
  --role="roles/secretmanager.secretAccessor"

# Adicionar apenas service account necessária
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:qivo-app-oauth@qivo-mining-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**2.3.4 Alertas de Acesso a Secrets**

```yaml
displayName: "QIVO - Unauthorized Secret Access Attempt"
conditions:
  - displayName: "Secret accessed by unauthorized user"
    conditionThreshold:
      filter: 'protoPayload.serviceName="secretmanager.googleapis.com" AND protoPayload.authenticationInfo.principalEmail!="qivo-app-oauth@qivo-mining-prod.iam.gserviceaccount.com"'
      comparison: COMPARISON_GT
      thresholdValue: 0
      duration: 60s
notificationChannels:
  - projects/qivo-mining-prod/notificationChannels/[EMAIL_CHANNEL_ID]
  - projects/qivo-mining-prod/notificationChannels/[SMS_CHANNEL_ID]
```

---

### 2.4 Cloud SQL Security

#### 🎯 Objetivo
Proteger banco de dados contra acessos não autorizados e vazamentos.

#### 📋 Implementação

**2.4.1 Configurações de Segurança**

```bash
# Desabilitar IP público (usar apenas VPC)
gcloud sql instances patch compliancecore-db-prod \
  --no-assign-ip

# Habilitar backup automático
gcloud sql instances patch compliancecore-db-prod \
  --backup-start-time=03:00 \
  --enable-bin-log

# Habilitar Point-in-Time Recovery
gcloud sql instances patch compliancecore-db-prod \
  --enable-point-in-time-recovery

# Configurar janela de manutenção
gcloud sql instances patch compliancecore-db-prod \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=4

# Habilitar auditoria de queries
gcloud sql instances patch compliancecore-db-prod \
  --database-flags=log_statement=all,log_duration=on
```

**2.4.2 Criar Usuários com Privilégios Mínimos**

```sql
-- Conectar ao Cloud SQL e criar usuários específicos

-- Usuário read-only para analytics
CREATE USER qivo_analytics WITH PASSWORD 'STRONG_PASSWORD';
GRANT CONNECT ON DATABASE compliancecore TO qivo_analytics;
GRANT USAGE ON SCHEMA public TO qivo_analytics;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO qivo_analytics;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO qivo_analytics;

-- Usuário para aplicação (sem DROP/TRUNCATE)
CREATE USER qivo_app WITH PASSWORD 'STRONG_PASSWORD';
GRANT CONNECT ON DATABASE compliancecore TO qivo_app;
GRANT USAGE ON SCHEMA public TO qivo_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO qivo_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO qivo_app;
```

**2.4.3 Alertas de Segurança Cloud SQL**

```yaml
# Alerta: Conexões falhadas suspeitas
displayName: "QIVO - Cloud SQL Failed Connections"
conditions:
  - displayName: "More than 10 failed connections in 5 minutes"
    conditionThreshold:
      filter: 'resource.type="cloudsql_database" AND logName="projects/qivo-mining-prod/logs/cloudaudit.googleapis.com%2Fdata_access" AND protoPayload.status.code!=0'
      comparison: COMPARISON_GT
      thresholdValue: 10
      duration: 300s
notificationChannels:
  - projects/qivo-mining-prod/notificationChannels/[EMAIL_CHANNEL_ID]

# Alerta: Queries lentas (possível ataque)
displayName: "QIVO - Slow Queries Detected"
conditions:
  - displayName: "Query execution time > 5 seconds"
    conditionThreshold:
      filter: 'resource.type="cloudsql_database" AND textPayload=~"duration: [5-9][0-9]{3}ms"'
      comparison: COMPARISON_GT
      thresholdValue: 5
      duration: 60s
notificationChannels:
  - projects/qivo-mining-prod/notificationChannels/[SLACK_CHANNEL_ID]
```

---

### 2.5 Vulnerability Scanning

#### 🎯 Objetivo
Identificar vulnerabilidades em containers e dependências.

#### 📋 Implementação

**2.5.1 Habilitar Container Analysis**

```bash
# Habilitar API
gcloud services enable containeranalysis.googleapis.com \
  --project=qivo-mining-prod

# Configurar scanning automático de imagens
gcloud container images scan gcr.io/qivo-mining-prod/qivo-mining:latest
```

**2.5.2 Integrar Dependabot (GitHub)**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "vinicius-debian"
    labels:
      - "dependencies"
      - "security"
```

**2.5.3 Scan de Vulnerabilidades no CI/CD**

```yaml
# cloudbuild.yaml - adicionar step de security scan
steps:
  # ... build steps ...
  
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'Security Scan'
    args:
      - 'container'
      - 'images'
      - 'scan'
      - 'gcr.io/qivo-mining-prod/qivo-mining:$SHORT_SHA'
    waitFor: ['Build']
  
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'Check Vulnerabilities'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        VULNS=$(gcloud container images describe gcr.io/qivo-mining-prod/qivo-mining:$SHORT_SHA \
          --format='value(image_summary.vulnerability_summary.counts.CRITICAL)')
        if [ "$VULNS" -gt 0 ]; then
          echo "CRITICAL vulnerabilities found: $VULNS"
          exit 1
        fi
    waitFor: ['Security Scan']
```

---

## 📋 FASE 3: IMPLEMENTAÇÃO PASSO A PASSO

### Semana 1: Monitoramento Básico
- [ ] Dia 1-2: Configurar Cloud Monitoring + Dashboards
- [ ] Dia 3-4: Configurar Cloud Logging + Log Sinks
- [ ] Dia 5: Criar alertas críticos (erro rate, latência, downtime)

### Semana 2: Monitoramento Avançado
- [ ] Dia 1-2: Configurar Uptime Checks
- [ ] Dia 3-4: Integrar Cloud Trace e Cloud Profiler
- [ ] Dia 5: Criar log-based metrics e alertas personalizados

### Semana 3: Segurança IAM
- [ ] Dia 1-2: Auditoria de permissões atuais
- [ ] Dia 3-4: Criar roles personalizadas e aplicar princípio de menor privilégio
- [ ] Dia 5: Configurar auditoria de IAM e alertas

### Semana 4: WAF e Segurança Avançada
- [ ] Dia 1-2: Configurar Load Balancer + Cloud Armor
- [ ] Dia 3-4: Criar regras WAF (SQL injection, XSS, rate limiting)
- [ ] Dia 5: Configurar alertas de segurança WAF

### Semana 5: Secrets e Cloud SQL Security
- [ ] Dia 1-2: Auditoria e rotação de secrets
- [ ] Dia 3-4: Hardening do Cloud SQL (backup, PITR, auditoria)
- [ ] Dia 5: Criar usuários com privilégios mínimos

### Semana 6: Vulnerability Scanning e Testes
- [ ] Dia 1-2: Configurar Container Analysis e Dependabot
- [ ] Dia 3-4: Integrar security scan no CI/CD
- [ ] Dia 5: Testes de penetração e validação final

---

## 💰 ESTIMATIVA DE CUSTOS

| Serviço | Custo Mensal Estimado (USD) |
|---------|----------------------------|
| Cloud Monitoring | $8 - $15 |
| Cloud Logging | $5 - $10 |
| Cloud Trace | $2 - $5 |
| Cloud Profiler | Gratuito |
| Uptime Checks | $1 - $3 |
| Cloud Armor (WAF) | $5 - $10 |
| Load Balancer | $18 - $25 |
| Container Analysis | $0.26 por imagem |
| **TOTAL** | **$40 - $70/mês** |

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Antes | Meta | Prazo |
|---------|-------|------|-------|
| **MTTR** (Mean Time To Recovery) | N/A | < 15 min | 2 meses |
| **Uptime** | 99.5% | 99.9% | 1 mês |
| **Alertas Falsos Positivos** | N/A | < 5% | 2 meses |
| **Vulnerabilidades Críticas** | Desconhecido | 0 | 1 mês |
| **Tempo de Resposta p95** | ~600ms | < 500ms | 2 meses |
| **Taxa de Erro** | ~0.5% | < 0.1% | 1 mês |

---

## ✅ CHECKLIST FINAL

### Monitoramento
- [ ] Cloud Monitoring configurado
- [ ] Dashboards personalizados criados
- [ ] Cloud Logging com sinks configurados
- [ ] Log-based metrics criadas
- [ ] Sistema de alertas implementado
- [ ] Canais de notificação configurados (Email, Slack, SMS)
- [ ] Uptime checks ativos
- [ ] Cloud Trace integrado
- [ ] Cloud Profiler integrado

### Segurança
- [ ] Auditoria de IAM completa
- [ ] Roles personalizadas criadas
- [ ] Princípio de menor privilégio aplicado
- [ ] Cloud Armor (WAF) configurado
- [ ] Regras WAF implementadas (SQL injection, XSS, rate limiting)
- [ ] Secrets rotacionados e restritos
- [ ] Cloud SQL hardened (backup, PITR, auditoria)
- [ ] Usuários de banco com privilégios mínimos
- [ ] Container Analysis habilitado
- [ ] Dependabot configurado
- [ ] Security scan no CI/CD

---

## 📞 CONTATOS DE EMERGÊNCIA

| Papel | Nome | Email | Telefone |
|-------|------|-------|----------|
| **Admin Principal** | Vinicius Debian | vinicius.debian@theneil.com.br | +55 11 XXXXX-XXXX |
| **Suporte GCP** | Google Cloud Support | - | Via Console |
| **DBA** | [Nome] | [Email] | [Telefone] |

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- [Google Cloud Monitoring Documentation](https://cloud.google.com/monitoring/docs)
- [Google Cloud Armor Documentation](https://cloud.google.com/armor/docs)
- [Cloud SQL Security Best Practices](https://cloud.google.com/sql/docs/postgres/security)
- [IAM Best Practices](https://cloud.google.com/iam/docs/best-practices)

---

**Criado por:** Manus AI  
**Data:** 05 de Novembro de 2025  
**Versão:** 1.0  
**Status:** 📋 Pronto para Implementação
