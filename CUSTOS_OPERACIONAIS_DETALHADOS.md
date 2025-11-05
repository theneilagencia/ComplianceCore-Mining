# QIVO Mining - Análise Detalhada de Custos Operacionais

**Data:** 05/11/2025  
**Versão:** 1.0.0  
**Região:** us-central1 (Iowa, USA)

---

## RESUMO EXECUTIVO

**Custo Mensal Total:** US$ 250 - US$ 400  
**Custo Anual Total:** US$ 3.000 - US$ 4.800

**Breakdown:**
- Infraestrutura Core: US$ 200 - US$ 300/mês
- Serviços Opcionais: US$ 50 - US$ 100/mês

---

## 1. INFRAESTRUTURA CORE (OBRIGATÓRIA)

### 1.1 Cloud SQL (PostgreSQL 15)

**Configuração:**
- Instância: `db-custom-2-7680`
- vCPUs: 2
- RAM: 7.68 GB
- Storage: 100 GB SSD
- Tipo: Regional (High Availability)
- Backups: Automáticos diários

**Custos Detalhados:**

| Item | Especificação | Preço Unitário | Quantidade | Subtotal |
|------|---------------|----------------|------------|----------|
| vCPU | 2 vCPUs | US$ 0.0413/hora | 730h/mês | US$ 60.30 |
| RAM | 7.68 GB | US$ 0.0070/GB/hora | 5,606.4 GB-hora | US$ 39.24 |
| Storage SSD | 100 GB | US$ 0.17/GB/mês | 100 GB | US$ 17.00 |
| Backups | ~20 GB | US$ 0.08/GB/mês | 20 GB | US$ 1.60 |
| High Availability | Replica | +100% | - | US$ 118.14 |

**Subtotal Cloud SQL:** US$ 236.28/mês

**Otimizações Possíveis:**
- Usar Single Zone (sem HA): -US$ 118/mês → US$ 118/mês
- Reduzir para db-custom-1-3840: -US$ 60/mês → US$ 176/mês
- Usar 50 GB storage: -US$ 8/mês → US$ 228/mês

**Recomendação:** Manter configuração para produção (HA essencial)

---

### 1.2 Cloud Run

**Configuração:**
- vCPUs: 2
- RAM: 2 GB
- Min instances: 1
- Max instances: 10
- Timeout: 300s
- Concurrency: 80

**Custos Detalhados:**

**A. Instâncias Sempre Ativas (Min Instances = 1)**

| Item | Especificação | Preço Unitário | Quantidade | Subtotal |
|------|---------------|----------------|------------|----------|
| vCPU | 2 vCPUs | US$ 0.00002400/vCPU-s | 5,184,000 vCPU-s | US$ 124.42 |
| RAM | 2 GB | US$ 0.00000250/GB-s | 5,184,000 GB-s | US$ 12.96 |

**Subtotal Instâncias Ativas:** US$ 137.38/mês

**B. Requisições**

Estimativa conservadora: 100.000 requisições/mês

| Item | Especificação | Preço Unitário | Quantidade | Subtotal |
|------|---------------|----------------|------------|----------|
| Requisições | Primeiras 2M | US$ 0.40/milhão | 0.1 milhão | US$ 0.04 |

**Subtotal Requisições:** US$ 0.04/mês

**C. Egress (Saída de Dados)**

Estimativa: 10 GB/mês

| Item | Especificação | Preço Unitário | Quantidade | Subtotal |
|------|---------------|----------------|------------|----------|
| Network Egress | América do Norte | US$ 0.12/GB | 10 GB | US$ 1.20 |

**Subtotal Egress:** US$ 1.20/mês

**Total Cloud Run:** US$ 138.62/mês

**Cenários de Uso:**

| Tráfego | Requisições/mês | Custo Estimado |
|---------|-----------------|----------------|
| Baixo | 50.000 | US$ 138/mês |
| Médio | 500.000 | US$ 145/mês |
| Alto | 2.000.000 | US$ 160/mês |
| Muito Alto | 5.000.000 | US$ 190/mês |

**Otimizações Possíveis:**
- Min instances = 0: -US$ 137/mês (mas aumenta cold start)
- Reduzir para 1 vCPU, 1 GB RAM: -US$ 69/mês → US$ 69/mês
- Usar Cloud Run Jobs para tarefas batch: economia variável

**Recomendação:** Manter 1 min instance para SLA, considerar 0 se cold start aceitável

---

### 1.3 Cloud Memorystore (Redis)

**Configuração:**
- Versão: Redis 7.0
- Tier: Standard (HA)
- Capacidade: 1 GB
- Região: us-central1

**Custos Detalhados:**

| Item | Especificação | Preço Unitário | Quantidade | Subtotal |
|------|---------------|----------------|------------|----------|
| Standard Tier | 1 GB | US$ 0.054/GB/hora | 730 GB-hora | US$ 39.42 |
| Replica | Incluída | - | - | US$ 0.00 |

**Total Cloud Memorystore:** US$ 39.42/mês

**Otimizações Possíveis:**
- Usar Basic Tier (sem HA): -US$ 20/mês → US$ 19/mês
- Usar Redis Cloud (externo): ~US$ 20-30/mês
- Usar cache in-memory apenas: US$ 0/mês (não recomendado)

**Recomendação:** Manter Standard Tier para HA e performance

---

### 1.4 Secret Manager

**Configuração:**
- Secrets: ~20
- Versões ativas: ~20
- Acessos: ~100.000/mês

**Custos Detalhados:**

| Item | Especificação | Preço Unitário | Quantidade | Subtotal |
|------|---------------|----------------|------------|----------|
| Secret Versions | Ativas | US$ 0.06/versão/mês | 20 versões | US$ 1.20 |
| Access Operations | Primeiras 10k grátis | US$ 0.03/10k | 9 × 10k | US$ 0.27 |

**Total Secret Manager:** US$ 1.47/mês

**Otimizações Possíveis:**
- Usar variáveis de ambiente: US$ 0/mês (menos seguro)
- Reduzir número de secrets: economia marginal

**Recomendação:** Manter Secret Manager por segurança

---

### 1.5 Container Registry

**Configuração:**
- Imagens Docker: ~5 imagens
- Storage: ~2 GB
- Egress: ~1 GB/mês

**Custos Detalhados:**

| Item | Especificação | Preço Unitário | Quantidade | Subtotal |
|------|---------------|----------------|------------|----------|
| Storage | Standard | US$ 0.026/GB/mês | 2 GB | US$ 0.05 |
| Network Egress | América do Norte | US$ 0.12/GB | 1 GB | US$ 0.12 |

**Total Container Registry:** US$ 0.17/mês

**Otimizações Possíveis:**
- Limpar imagens antigas: economia marginal
- Usar Artifact Registry: custo similar

**Recomendação:** Manter e limpar imagens antigas regularmente

---

### 1.6 Cloud Build

**Configuração:**
- Builds: ~30/mês (1 por dia)
- Tempo médio: 10 minutos/build
- Machine type: n1-standard-1

**Custos Detalhados:**

| Item | Especificação | Preço Unitário | Quantidade | Subtotal |
|------|---------------|----------------|------------|----------|
| Build Time | Primeiras 120 min grátis | US$ 0.003/min | 180 min | US$ 0.54 |

**Total Cloud Build:** US$ 0.54/mês

**Otimizações Possíveis:**
- Reduzir frequência de builds: economia marginal
- Usar cache de build: reduz tempo

**Recomendação:** Otimizar Dockerfile para builds rápidos

---

## 2. MONITORAMENTO E LOGS (RECOMENDADO)

### 2.1 Cloud Logging

**Configuração:**
- Logs: ~5 GB/mês
- Retenção: 30 dias

**Custos Detalhados:**

| Item | Especificação | Preço Unitário | Quantidade | Subtotal |
|------|---------------|----------------|------------|----------|
| Log Ingestion | Primeiros 50 GB grátis | US$ 0.50/GB | 0 GB | US$ 0.00 |
| Log Storage | Primeiros 30 dias grátis | - | - | US$ 0.00 |

**Total Cloud Logging:** US$ 0.00/mês (dentro do free tier)

---

### 2.2 Cloud Monitoring

**Configuração:**
- Métricas: ~200 time series
- Uptime checks: 3

**Custos Detalhados:**

| Item | Especificação | Preço Unitário | Quantidade | Subtotal |
|------|---------------|----------------|------------|----------|
| Metrics | Primeiras 150 grátis | US$ 0.2580/série | 50 séries | US$ 12.90 |
| Uptime Checks | Primeiros 1M grátis | - | 3 checks | US$ 0.00 |

**Total Cloud Monitoring:** US$ 12.90/mês

**Otimizações Possíveis:**
- Reduzir métricas customizadas: -US$ 10/mês
- Usar apenas métricas básicas: US$ 0/mês

**Recomendação:** Manter para observabilidade

---

## 3. SERVIÇOS EXTERNOS (OBRIGATÓRIOS)

### 3.1 Stripe

**Configuração:**
- Transações: variável
- Taxa: 2.9% + US$ 0.30 por transação

**Custos Estimados:**

**Cenário 1: 10 assinaturas/mês**
- Receita: US$ 125.000 (10 × US$ 12.500 PRO)
- Taxa Stripe: US$ 3.655 (2.9% + US$ 3)
- **Custo efetivo:** 2.92%

**Cenário 2: 50 assinaturas/mês**
- Receita: US$ 625.000
- Taxa Stripe: US$ 18.140
- **Custo efetivo:** 2.90%

**Nota:** Stripe cobra sobre receita, não é custo fixo de infraestrutura.

---

### 3.2 SendGrid (Email)

**Configuração:**
- Plano: Essentials
- Emails: 50.000/mês

**Custos Detalhados:**

| Plano | Emails/mês | Preço |
|-------|------------|-------|
| Free | 100/dia (3.000/mês) | US$ 0/mês |
| Essentials | 50.000/mês | US$ 19.95/mês |
| Pro | 100.000/mês | US$ 89.95/mês |

**Total SendGrid:** US$ 0 - US$ 19.95/mês

**Alternativa: Mailgun**
- Free: 5.000 emails/mês
- Foundation: US$ 35/mês (50.000 emails)

**Recomendação:** Começar com SendGrid Free, upgrade conforme necessário

---

## 4. SERVIÇOS OPCIONAIS (RECOMENDADOS)

### 4.1 Sentry (Error Tracking)

**Configuração:**
- Plano: Team
- Eventos: 50.000/mês

**Custos:**
- Free: 5.000 eventos/mês
- Team: US$ 26/mês (50.000 eventos)
- Business: US$ 80/mês (200.000 eventos)

**Total Sentry:** US$ 0 - US$ 26/mês

---

### 4.2 APIs Oficiais (Integrações)

**ANM, CPRM, IBAMA, ANP:**
- Custo: Variável ou gratuito
- Estimativa: US$ 0 - US$ 50/mês

**USGS, Copernicus:**
- Custo: Gratuito com rate limits
- Estimativa: US$ 0/mês

**Total APIs:** US$ 0 - US$ 50/mês

---

## 5. BACKUP E DISASTER RECOVERY

### 5.1 Cloud SQL Backups

**Incluído no custo do Cloud SQL:**
- Backups automáticos diários
- Retenção: 7 dias
- Point-in-time recovery

**Custo adicional:** US$ 0/mês (incluído)

---

### 5.2 Snapshots de Disco (Opcional)

**Para backups adicionais:**
- Snapshots: 1/semana
- Retenção: 4 semanas
- Storage: ~10 GB

**Custo:** US$ 0.40/mês

---

## RESUMO DE CUSTOS

### Cenário 1: MÍNIMO (Desenvolvimento/Staging)

| Categoria | Serviço | Custo Mensal |
|-----------|---------|--------------|
| Database | Cloud SQL (Single Zone) | US$ 118.00 |
| Compute | Cloud Run (min=0) | US$ 5.00 |
| Cache | Redis Basic | US$ 19.00 |
| Secrets | Secret Manager | US$ 1.50 |
| Registry | Container Registry | US$ 0.20 |
| Build | Cloud Build | US$ 0.50 |
| Monitoring | Cloud Monitoring | US$ 0.00 |
| Email | SendGrid Free | US$ 0.00 |
| **TOTAL** | | **US$ 144.20/mês** |

---

### Cenário 2: RECOMENDADO (Produção Inicial)

| Categoria | Serviço | Custo Mensal |
|-----------|---------|--------------|
| Database | Cloud SQL (HA) | US$ 236.28 |
| Compute | Cloud Run (min=1) | US$ 138.62 |
| Cache | Redis Standard | US$ 39.42 |
| Secrets | Secret Manager | US$ 1.47 |
| Registry | Container Registry | US$ 0.17 |
| Build | Cloud Build | US$ 0.54 |
| Monitoring | Cloud Monitoring | US$ 12.90 |
| Email | SendGrid Free | US$ 0.00 |
| Error Tracking | Sentry Free | US$ 0.00 |
| **TOTAL** | | **US$ 429.40/mês** |

---

### Cenário 3: OTIMIZADO (Produção Custo-Efetivo)

| Categoria | Serviço | Custo Mensal |
|-----------|---------|--------------|
| Database | Cloud SQL (HA) | US$ 236.28 |
| Compute | Cloud Run (min=0, cold start) | US$ 5.00 |
| Cache | Redis Standard | US$ 39.42 |
| Secrets | Secret Manager | US$ 1.47 |
| Registry | Container Registry | US$ 0.17 |
| Build | Cloud Build | US$ 0.54 |
| Monitoring | Básico (free tier) | US$ 0.00 |
| Email | SendGrid Free | US$ 0.00 |
| **TOTAL** | | **US$ 282.88/mês** |

---

### Cenário 4: ESCALADO (Alto Tráfego)

| Categoria | Serviço | Custo Mensal |
|-----------|---------|--------------|
| Database | Cloud SQL (HA, 4 vCPU, 15 GB) | US$ 472.00 |
| Compute | Cloud Run (min=2, max=20) | US$ 280.00 |
| Cache | Redis Standard 5 GB | US$ 197.00 |
| Secrets | Secret Manager | US$ 1.47 |
| Registry | Container Registry | US$ 0.17 |
| Build | Cloud Build | US$ 0.54 |
| Monitoring | Cloud Monitoring | US$ 12.90 |
| Email | SendGrid Essentials | US$ 19.95 |
| Error Tracking | Sentry Team | US$ 26.00 |
| APIs | Integrações premium | US$ 50.00 |
| **TOTAL** | | **US$ 1.060.03/mês** |

---

## RECOMENDAÇÃO FINAL

### Para Lançamento Inicial (Primeiros 3 meses)

**Configuração Recomendada:**
- Cloud SQL: HA (essencial para produção)
- Cloud Run: min=0 (aceitar cold start para economizar)
- Redis: Standard (HA para cache crítico)
- Monitoring: Básico (free tier)
- Email: SendGrid Free (suficiente para início)

**Custo Mensal:** US$ 282.88/mês  
**Custo Anual:** US$ 3.394.56/ano

### Após Validação de Mercado (6+ meses)

**Upgrade para:**
- Cloud Run: min=1 (eliminar cold start)
- Monitoring: Completo
- Email: SendGrid Essentials (mais emails)
- Error Tracking: Sentry Team

**Custo Mensal:** US$ 429.40/mês  
**Custo Anual:** US$ 5.152.80/ano

### Escala (1+ ano, 100+ clientes)

**Upgrade para:**
- Cloud SQL: 4 vCPU, 15 GB RAM
- Cloud Run: min=2, max=20
- Redis: 5 GB
- Todas as ferramentas premium

**Custo Mensal:** US$ 1.060/mês  
**Custo Anual:** US$ 12.720/ano

---

## OTIMIZAÇÕES ADICIONAIS

### 1. Committed Use Discounts (CUD)

Comprometer 1 ou 3 anos com GCP:
- 1 ano: 25% de desconto
- 3 anos: 52% de desconto

**Economia potencial:** US$ 100-200/mês

### 2. Sustained Use Discounts

Automático para recursos usados > 25% do mês:
- Até 30% de desconto

**Economia potencial:** US$ 50-100/mês

### 3. Cloud Run Cold Start

Aceitar cold start (min=0):
- **Economia:** US$ 137/mês
- **Trade-off:** Primeira requisição ~2-5s mais lenta

### 4. Database Optimization

- Usar read replicas apenas quando necessário
- Otimizar queries para reduzir CPU
- Usar connection pooling

**Economia potencial:** US$ 50-100/mês

---

## CONCLUSÃO

**Custo Inicial Recomendado:** US$ 283/mês (US$ 3.400/ano)

**Breakdown:**
- Infraestrutura GCP: US$ 283/mês
- Email (free tier): US$ 0/mês
- Stripe: % sobre receita (não custo fixo)

**Escalabilidade:**
- Baixo tráfego: US$ 283/mês
- Médio tráfego: US$ 429/mês
- Alto tráfego: US$ 1.060/mês

**ROI:**
Com apenas 3 clientes no plano PRO (US$ 12.500/mês cada):
- Receita: US$ 37.500/mês
- Custo infraestrutura: US$ 283/mês
- **Margem:** 99.2%

---

**Data:** 05/11/2025  
**Versão:** 1.0.0  
**Status:** Análise Completa ✅
