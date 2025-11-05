# Validação da Integração Stripe - QIVO Mining

## Status: EM VALIDAÇÃO

Data: 05/11/2025

---

## 1. CONFIGURAÇÃO DO STRIPE

### 1.1 Variáveis de Ambiente
- [ ] `STRIPE_SECRET_KEY` configurada
- [ ] `STRIPE_PUBLISHABLE_KEY` configurada  
- [ ] `STRIPE_WEBHOOK_SECRET` configurada
- [ ] Chaves de produção (não test mode)

### 1.2 Produtos e Preços no Stripe Dashboard
- [ ] Produto: QIVO Mining - Start (US$ 2.500/mês)
- [ ] Produto: QIVO Mining - Pro (US$ 12.500/mês)
- [ ] Produto: QIVO Mining - Enterprise (US$ 18.900/mês)
- [ ] Preços anuais com 10% desconto configurados
- [ ] Produtos de relatórios avulsos (5 tipos)

---

## 2. FLUXO DE ASSINATURA

### 2.1 Checkout de Assinatura
**Endpoint:** `POST /api/payment/checkout`

**Teste Manual:**
```bash
curl -X POST https://qivo-mining-kfw7vgq5xa-rj.a.run.app/api/payment/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=..." \
  -d '{"plan": "PRO", "billingPeriod": "monthly"}'
```

**Checklist:**
- [ ] Retorna `sessionId` e `url` válidos
- [ ] Redireciona para Stripe Checkout
- [ ] Exibe preço correto (US$ 12.500)
- [ ] Exibe nome do plano correto
- [ ] Aceita cartão de teste (4242 4242 4242 4242)
- [ ] Redireciona para `/success` após pagamento
- [ ] Redireciona para `/pricing` se cancelar

### 2.2 Webhook - checkout.session.completed
**Endpoint:** `POST /api/payment/webhook`

**Checklist:**
- [ ] Webhook registrado no Stripe Dashboard
- [ ] URL: `https://qivo-mining-kfw7vgq5xa-rj.a.run.app/api/payment/webhook`
- [ ] Evento `checkout.session.completed` habilitado
- [ ] Signature verificada corretamente
- [ ] Cria licença no banco de dados
- [ ] Associa `stripeCustomerId` ao usuário
- [ ] Associa `stripeSubscriptionId` à licença
- [ ] Status da licença = `active`

### 2.3 Webhook - customer.subscription.updated
**Checklist:**
- [ ] Atualiza status da licença para `active`
- [ ] Atualiza status da licença para `suspended` (past_due)
- [ ] Atualiza status da licença para `cancelled`

### 2.4 Webhook - customer.subscription.deleted
**Checklist:**
- [ ] Cancela licença no banco de dados
- [ ] Status da licença = `cancelled`

### 2.5 Webhook - invoice.payment_failed
**Checklist:**
- [ ] Suspende licença no banco de dados
- [ ] Status da licença = `suspended`
- [ ] Envia notificação ao usuário (se implementado)

---

## 3. FLUXO DE RELATÓRIOS AVULSOS

### 3.1 Checkout de Relatório Avulso
**Endpoint:** `POST /api/payment/one-time`

**Teste Manual (Usuário Autenticado com Assinatura):**
```bash
curl -X POST https://qivo-mining-kfw7vgq5xa-rj.a.run.app/api/payment/one-time \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=..." \
  -d '{"reportType": "tecnico_completo", "email": "user@example.com"}'
```

**Checklist:**
- [ ] Retorna `sessionId` e `url` válidos
- [ ] Verifica se usuário tem assinatura ativa
- [ ] Aplica 10% de desconto se assinante
- [ ] Exibe preço original e desconto no Stripe
- [ ] Nome do produto inclui "(Desconto de Assinante - 10%)"
- [ ] Metadata inclui `hasDiscount`, `originalPrice`, `finalPrice`
- [ ] Aceita pagamento com cartão de teste
- [ ] Redireciona para `/success?type=report`

**Teste Manual (Usuário Não Autenticado):**
```bash
curl -X POST https://qivo-mining-kfw7vgq5xa-rj.a.run.app/api/payment/one-time \
  -H "Content-Type: application/json" \
  -d '{"reportType": "simplificado", "email": "guest@example.com"}'
```

**Checklist:**
- [ ] Aceita checkout sem autenticação
- [ ] Não aplica desconto
- [ ] Exibe preço cheio
- [ ] Processa pagamento corretamente

### 3.2 Preços de Relatórios Avulsos
**Checklist:**
- [ ] Simplificado: US$ 2.800 → US$ 2.520 (com desconto)
- [ ] Técnico Completo: US$ 6.800 → US$ 6.120 (com desconto)
- [ ] Multinormativo: US$ 9.800 → US$ 8.820 (com desconto)
- [ ] Auditável: US$ 12.000 → US$ 10.800 (com desconto)
- [ ] ESG Integrado: US$ 12.800 → US$ 11.520 (com desconto)

---

## 4. CUSTOMER PORTAL

### 4.1 Acesso ao Portal
**Endpoint:** `GET /api/payment/portal`

**Teste Manual:**
```bash
curl -X GET https://qivo-mining-kfw7vgq5xa-rj.a.run.app/api/payment/portal \
  -H "Cookie: session_token=..."
```

**Checklist:**
- [ ] Retorna URL do Customer Portal
- [ ] Redireciona para Stripe Customer Portal
- [ ] Usuário pode cancelar assinatura
- [ ] Usuário pode atualizar método de pagamento
- [ ] Usuário pode ver histórico de faturas
- [ ] Retorna para `/account` após ações

---

## 5. TESTES DE INTEGRAÇÃO

### 5.1 Fluxo Completo - Assinatura
1. [ ] Usuário não autenticado acessa `/pricing`
2. [ ] Clica em "Assinar PRO"
3. [ ] Redireciona para `/login`
4. [ ] Faz login com Google OAuth
5. [ ] Redireciona de volta para `/pricing`
6. [ ] Clica em "Assinar PRO" novamente
7. [ ] Redireciona para Stripe Checkout
8. [ ] Preenche dados do cartão (4242 4242 4242 4242)
9. [ ] Confirma pagamento
10. [ ] Webhook `checkout.session.completed` dispara
11. [ ] Licença criada no banco de dados
12. [ ] Redireciona para `/success`
13. [ ] Página de sucesso exibe plano correto
14. [ ] Dashboard mostra plano PRO ativo

### 5.2 Fluxo Completo - Relatório Avulso com Desconto
1. [ ] Usuário autenticado com plano START ativo
2. [ ] Acessa landing page
3. [ ] Vê badge "Você tem 10% de desconto"
4. [ ] Clica em "Contratar" relatório Técnico Completo
5. [ ] Redireciona para Stripe Checkout
6. [ ] Preço exibido: US$ 6.120 (10% off de US$ 6.800)
7. [ ] Nome do produto: "... (Desconto de Assinante - 10%)"
8. [ ] Confirma pagamento
9. [ ] Redireciona para `/success?type=report`
10. [ ] Relatório gerado e disponível para download

### 5.3 Fluxo Completo - Cancelamento de Assinatura
1. [ ] Usuário autenticado com plano PRO ativo
2. [ ] Acessa `/account`
3. [ ] Clica em "Gerenciar Assinatura"
4. [ ] Redireciona para Customer Portal
5. [ ] Clica em "Cancelar Assinatura"
6. [ ] Confirma cancelamento
7. [ ] Webhook `customer.subscription.deleted` dispara
8. [ ] Licença cancelada no banco de dados
9. [ ] Dashboard mostra plano FREE
10. [ ] Acesso a recursos PRO bloqueado

---

## 6. TESTES DE SEGURANÇA

### 6.1 Verificação de Webhook Signature
**Checklist:**
- [ ] Webhook rejeita requisições sem signature
- [ ] Webhook rejeita requisições com signature inválida
- [ ] Webhook aceita apenas requisições do Stripe

### 6.2 Autenticação
**Checklist:**
- [ ] Checkout de assinatura requer autenticação
- [ ] Checkout de relatório avulso aceita guest
- [ ] Customer Portal requer autenticação
- [ ] Desconto aplicado apenas para usuários autenticados

---

## 7. MONITORAMENTO E LOGS

### 7.1 Logs do Servidor
**Checklist:**
- [ ] Log de checkout criado
- [ ] Log de webhook recebido
- [ ] Log de licença criada/atualizada
- [ ] Log de erro em caso de falha

### 7.2 Stripe Dashboard
**Checklist:**
- [ ] Pagamentos aparecem em "Payments"
- [ ] Assinaturas aparecem em "Subscriptions"
- [ ] Clientes aparecem em "Customers"
- [ ] Webhooks aparecem em "Webhooks" com status 200

---

## 8. RESULTADOS DA VALIDAÇÃO

### 8.1 Testes Automatizados
```bash
# Executar testes (quando implementados)
cd /home/ubuntu/qivo-mining
pnpm test:stripe
```

**Status:** PENDENTE

### 8.2 Testes Manuais
**Status:** PENDENTE

### 8.3 Problemas Encontrados
- [ ] Nenhum problema encontrado
- [ ] Problemas listados abaixo:

---

## 9. AÇÕES NECESSÁRIAS

### 9.1 Configuração Inicial
- [ ] Configurar produtos no Stripe Dashboard
- [ ] Configurar preços no Stripe Dashboard
- [ ] Configurar webhook endpoint
- [ ] Testar webhook com Stripe CLI

### 9.2 Testes Pendentes
- [ ] Executar todos os testes de checkout
- [ ] Executar todos os testes de webhook
- [ ] Executar todos os testes de fluxo completo
- [ ] Validar logs e monitoramento

### 9.3 Documentação
- [ ] Documentar fluxo de pagamento
- [ ] Documentar tratamento de erros
- [ ] Documentar webhooks configurados

---

## 10. CONCLUSÃO

**Status Final:** PENDENTE DE VALIDAÇÃO

**Próximos Passos:**
1. Configurar produtos e preços no Stripe Dashboard
2. Configurar webhook endpoint
3. Executar testes manuais de checkout
4. Validar webhooks com Stripe CLI
5. Executar fluxos completos end-to-end
6. Validar logs e monitoramento
7. Marcar como VALIDADO se todos os testes passarem

**Responsável:** Equipe de Desenvolvimento QIVO
**Data Prevista:** 05/11/2025
