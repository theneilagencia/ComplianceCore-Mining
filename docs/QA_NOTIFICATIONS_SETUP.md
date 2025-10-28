# QIVO Mining - Configuração de Notificações QA

Guia completo para configurar notificações automáticas via Email e WhatsApp.

---

## 🎯 Objetivo

Receber notificações automáticas após cada execução do QA semanal:
- ✅ **Email** (SendGrid)
- ✅ **WhatsApp** (Twilio + fallback Gupshup)
- ✅ **Log histórico** (`/docs/QA_STATUS_LOG.md`)

**Custo:** <0.002 USD por execução (ultra-leve)

---

## 📋 Pré-requisitos

### 1. Conta SendGrid (Email)

**Criar conta gratuita:**
1. Acessar: https://signup.sendgrid.com/
2. Criar conta (plano gratuito: 100 emails/dia)
3. Verificar email
4. Criar API Key:
   - Settings → API Keys → Create API Key
   - Nome: "QIVO QA Notifications"
   - Permissões: Full Access (ou Mail Send)
   - Copiar API Key (só aparece uma vez!)

**Verificar domínio (opcional, mas recomendado):**
- Settings → Sender Authentication → Verify Single Sender
- Preencher email e informações
- Verificar email de confirmação

---

### 2. Conta Twilio (WhatsApp)

**Criar conta:**
1. Acessar: https://www.twilio.com/try-twilio
2. Criar conta (trial gratuito: $15 crédito)
3. Verificar telefone
4. Obter credenciais:
   - Console → Account Info
   - Copiar **Account SID**
   - Copiar **Auth Token**

**Configurar WhatsApp Sandbox:**
1. Console → Messaging → Try it out → Send a WhatsApp message
2. Seguir instruções para conectar seu WhatsApp
3. Enviar mensagem para o número Twilio: `join <código>`
4. Copiar número Twilio (formato: `whatsapp:+14155238886`)

**Upgrade para produção (opcional):**
- Adicionar créditos ($20 mínimo)
- Solicitar número WhatsApp dedicado
- Aprovar template de mensagem

---

### 3. Conta Gupshup (Fallback WhatsApp)

**Criar conta (opcional):**
1. Acessar: https://www.gupshup.io/
2. Criar conta
3. Obter API Key:
   - Dashboard → API Key
   - Copiar API Key

**Nota:** Gupshup é usado como fallback se Twilio falhar.

---

## 🔐 Configurar Secrets no GitHub

### Acessar configurações:

1. Ir para: https://github.com/theneilagencia/ComplianceCore-Mining
2. Settings → Secrets and variables → Actions
3. Clicar em **"New repository secret"**

### Secrets obrigatórios (Email):

| Nome | Valor | Exemplo |
|------|-------|---------|
| `SMTP_HOST` | `smtp.sendgrid.net` | `smtp.sendgrid.net` |
| `SMTP_PORT` | `587` | `587` |
| `SMTP_USER` | `apikey` | `apikey` (sempre "apikey" no SendGrid) |
| `SMTP_PASS` | Sua API Key do SendGrid | `SG.xxxxxxxxxxxxxxxxxxxxxxxx` |
| `EMAIL_FROM` | Email remetente | `QIVO QA Bot <qa@qivo.ai>` |
| `EMAIL_TO` | Seu email | `vinicius@seudominio.com` |

### Secrets opcionais (WhatsApp via Twilio):

| Nome | Valor | Exemplo |
|------|-------|---------|
| `TWILIO_SID` | Account SID do Twilio | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_TOKEN` | Auth Token do Twilio | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `WHATSAPP_FROM` | Número Twilio | `whatsapp:+14155238886` |
| `WHATSAPP_TO` | Seu WhatsApp | `whatsapp:+5511999999999` |

### Secrets opcionais (WhatsApp via Gupshup - fallback):

| Nome | Valor | Exemplo |
|------|-------|---------|
| `GUPSHUP_API` | `https://api.gupshup.io/sm/api/v1/msg` | URL padrão |
| `GUPSHUP_KEY` | API Key do Gupshup | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `GUPSHUP_APP` | Nome do app | `QIVO_QA` |

### Variables (não são secrets):

1. Settings → Secrets and variables → Actions → **Variables** tab
2. Clicar em **"New repository variable"**

| Nome | Valor |
|------|-------|
| `REPO_URL` | `https://github.com/theneilagencia/ComplianceCore-Mining` |
| `PROD_URL` | `https://qivo-mining.onrender.com` |

---

## 🧪 Testar Localmente

### 1. Criar arquivo `.env` (não commitar!)

```bash
# Email (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="QIVO QA Bot <qa@qivo.ai>"
EMAIL_TO=vinicius@seudominio.com

# WhatsApp (Twilio)
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_FROM=whatsapp:+14155238886
WHATSAPP_TO=whatsapp:+5511999999999

# WhatsApp (Gupshup - fallback)
GUPSHUP_API=https://api.gupshup.io/sm/api/v1/msg
GUPSHUP_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GUPSHUP_APP=QIVO_QA

# URLs
REPO_URL=https://github.com/theneilagencia/ComplianceCore-Mining
PROD_URL=https://qivo-mining.onrender.com

# QA Status (para teste)
QA_STATUS=SUCCESS
QA_PARTIAL=0
```

### 2. Executar script de teste

```bash
# Carregar variáveis de ambiente
export $(cat .env | xargs)

# Executar script
python3 backend/jobs/notify_qa.py
```

### 3. Verificar saída

```
🔔 QIVO QA Notification System
============================================================

Status: ✅ SUCCESS
Branch: main
Commit: eec0c13
PR: https://github.com/theneilagencia/ComplianceCore-Mining/compare/main...main
Prod: https://qivo-mining.onrender.com
Time: 2025-10-28T21:30:00.000000Z

✅ Email sent to vinicius@seudominio.com
✅ WhatsApp sent via Twilio to whatsapp:+5511999999999
✅ Status logged to docs/QA_STATUS_LOG.md

✅ QA passed successfully, exiting with code 0
```

---

## 📧 Exemplo de Email

**Assunto:** `QIVO QA — SUCCESS`

**Corpo:**

```
┌─────────────────────────────────────────┐
│ ✅ QIVO QA — SUCCESS                    │
│ (fundo verde)                           │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Branch: main                            │
│ Commit: eec0c13                         │
│ Timestamp: 2025-10-28T21:30:00Z         │
│                                         │
│ [Ver PR] [Produção]                     │
│ (botões azul e verde)                   │
└─────────────────────────────────────────┘
```

---

## 💬 Exemplo de WhatsApp

```
QIVO QA ✅ SUCCESS
main@eec0c13

Aprovar PR: https://github.com/theneilagencia/ComplianceCore-Mining/compare/main...main
Produção: https://qivo-mining.onrender.com

2025-10-28T21:30:00Z
```

---

## 🗂️ Log Histórico

**Arquivo:** `/docs/QA_STATUS_LOG.md`

```markdown
# QIVO Mining - QA Status Log

Histórico de execuções do QA automático semanal.

| Timestamp (UTC) | Status | Branch@Commit | PR | Produção |
|-----------------|--------|---------------|----|----------|
| 2025-10-28 21:30:00 UTC | ✅ SUCCESS | main@eec0c13 | [PR](...) | [Prod](...) |
| 2025-11-01 21:00:00 UTC | ⚠️ PARTIAL | main@a1b2c3d | [PR](...) | [Prod](...) |
| 2025-11-08 21:00:00 UTC | ❌ FAILURE | main@e4f5g6h | [PR](...) | [Prod](...) |
```

---

## 🎨 Estados e Cores

| Estado | Emoji | Cor | Quando |
|--------|-------|-----|--------|
| **SUCCESS** | ✅ | Verde (#2e7d32) | QA passou 100% |
| **PARTIAL** | ⚠️ | Amarelo (#f9a825) | QA passou com warnings |
| **FAILURE** | ❌ | Vermelho (#c62828) | QA falhou |

---

## 🔧 Troubleshooting

### Email não enviado

**Erro:** `Email failed: [Errno -2] Name or service not known`

**Solução:**
1. Verificar `SMTP_HOST` correto: `smtp.sendgrid.net`
2. Verificar `SMTP_PORT`: `587`
3. Verificar API Key válida
4. Verificar sender verificado no SendGrid

---

### WhatsApp não enviado (Twilio)

**Erro:** `Twilio failed with status 403`

**Solução:**
1. Verificar que você enviou `join <código>` para o sandbox
2. Verificar formato do número: `whatsapp:+5511999999999`
3. Verificar créditos disponíveis no Twilio
4. Verificar Account SID e Auth Token

---

### WhatsApp não enviado (Gupshup)

**Erro:** `Gupshup failed with status 401`

**Solução:**
1. Verificar API Key válida
2. Verificar formato do número (sem `whatsapp:` prefix)
3. Verificar app name correto

---

### Log não atualizado

**Erro:** `Permission denied: docs/QA_STATUS_LOG.md`

**Solução:**
1. Verificar que `GITHUB_TOKEN` tem permissão de write
2. Settings → Actions → General → Workflow permissions
3. Marcar: "Read and write permissions"

---

## 💰 Custos Estimados

### SendGrid (Email)
- **Plano gratuito:** 100 emails/dia (suficiente)
- **Custo por email:** $0.00 (gratuito até 100/dia)
- **Custo mensal (4 QAs):** $0.00

### Twilio (WhatsApp)
- **Trial:** $15 crédito gratuito
- **Custo por mensagem:** ~$0.005 USD
- **Custo mensal (4 QAs):** ~$0.02 USD

### Gupshup (WhatsApp fallback)
- **Plano gratuito:** 1000 mensagens/mês
- **Custo por mensagem:** $0.00 (gratuito até 1000/mês)
- **Custo mensal (4 QAs):** $0.00

### Total Mensal
- **Estimado:** $0.02 USD/mês (apenas Twilio)
- **Com fallback:** $0.00 USD/mês (se usar Gupshup)

---

## 📊 Métricas

### Tempo de Execução
- Script Python: ~2-3 segundos
- Email (SendGrid): ~1-2 segundos
- WhatsApp (Twilio): ~2-3 segundos
- Total: ~5-8 segundos

### Confiabilidade
- Email: 99.9% (SendGrid SLA)
- WhatsApp (Twilio): 99.5%
- WhatsApp (Gupshup fallback): 98%
- Log local: 100%

---

## 🚀 Próximos Passos

### Após configurar secrets:

1. ✅ Testar localmente (ver seção "Testar Localmente")
2. ✅ Commit e push do código
3. ✅ Executar workflow manualmente no GitHub
4. ✅ Verificar email recebido
5. ✅ Verificar WhatsApp recebido
6. ✅ Verificar log atualizado

### Melhorias futuras:

- [ ] Slack integration
- [ ] Discord webhook
- [ ] Telegram bot
- [ ] Dashboard web de QA
- [ ] Métricas de tendência (gráficos)

---

## 📞 Suporte

**Documentação:**
- Script: `/backend/jobs/notify_qa.py`
- Workflow: `/.github/workflows/weekly-qa.yml`
- Log: `/docs/QA_STATUS_LOG.md`

**Links úteis:**
- SendGrid Docs: https://docs.sendgrid.com/
- Twilio Docs: https://www.twilio.com/docs/whatsapp
- Gupshup Docs: https://www.gupshup.io/developer/docs

---

**Criado em:** 28 de Outubro de 2025  
**Versão:** 1.0  
**Autor:** QIVO Mining Development Team

