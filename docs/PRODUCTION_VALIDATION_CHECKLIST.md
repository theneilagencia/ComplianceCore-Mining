# QIVO Mining - Checklist de Validação em Produção

**URL de Produção:** https://qivo-mining.onrender.com

---

## 🔐 1. Autenticação & Autorização

### Login/Logout
- [ ] Acessar `/login`
- [ ] Fazer login com credenciais de teste
- [ ] Verificar redirecionamento para `/dashboard`
- [ ] Verificar que o token JWT foi criado (DevTools → Application → Cookies)
- [ ] Fazer logout
- [ ] Verificar redirecionamento para `/`
- [ ] Verificar que o cookie foi removido

### Refresh Token Automático
- [ ] Fazer login
- [ ] Aguardar 15 minutos (ou modificar tempo no backend para teste)
- [ ] Fazer uma ação qualquer (ex: navegar para outro módulo)
- [ ] Verificar que a sessão NÃO expirou
- [ ] Verificar no Network tab que `/api/auth/refresh` foi chamado
- [ ] Confirmar que novo access token foi emitido

**Credenciais de Teste:**
```
Email: admin@qivomining.com
Senha: [verificar no banco de dados]
```

---

## 📊 2. Dashboard Central

### Acesso
- [ ] Navegar para `/dashboard`
- [ ] Verificar que a página carrega sem erros
- [ ] Verificar que os cards de estatísticas aparecem

### Funcionalidades
- [ ] Verificar contadores (Total Reports, Active Projects, etc.)
- [ ] Verificar gráficos (se houver dados)
- [ ] Clicar em "Gerar Novo Relatório" → redireciona para `/reports/generate`
- [ ] Clicar em "Ver Todos os Relatórios" → redireciona para `/reports`
- [ ] Verificar menu lateral com todos os módulos

---

## 🤖 3. AI Report Generator

### Acesso
- [ ] Navegar para `/reports/generate`
- [ ] Verificar que o formulário carrega

### Criar Relatório
- [ ] Selecionar padrão: JORC 2012
- [ ] Preencher título: "Teste Relatório IA"
- [ ] Preencher nome do projeto: "Projeto Teste"
- [ ] Preencher localização: "Minas Gerais, Brasil"
- [ ] Clicar em "Gerar Relatório"
- [ ] Verificar toast de sucesso
- [ ] Verificar que relatório aparece na lista

### Upload de Documentos
- [ ] Fazer upload de um PDF de teste
- [ ] Verificar progresso de upload
- [ ] Verificar que arquivo foi aceito
- [ ] Verificar parsing automático (se implementado)

---

## ✍️ 4. Manual Report Creator

### Acesso
- [ ] Navegar para `/reports/create`
- [ ] Verificar que StandardSelector aparece

### Selecionar Padrão
- [ ] Clicar em "JORC 2012"
- [ ] Verificar redirecionamento para `/reports/create/jorc`
- [ ] Verificar que formulário completo carrega

### Preencher Formulário JORC
- [ ] Preencher campos da Seção 1 (Sampling Techniques)
- [ ] Preencher campos da Seção 2 (Exploration Results)
- [ ] Preencher campos da Seção 3 (Estimation & Reporting)
- [ ] Preencher campos da Seção 4 (Mining Factors)
- [ ] Preencher campos da Seção 5 (Processing & Recovery)
- [ ] Clicar em "Salvar Rascunho"
- [ ] Verificar toast de sucesso
- [ ] Clicar em "Gerar Relatório Final"
- [ ] Verificar que relatório foi criado

---

## 🔄 5. Standards Converter (Bridge Regulatória)

### Acesso
- [ ] Navegar para `/reports/export`
- [ ] Verificar que a página carrega

### Listar Relatórios
- [ ] Verificar que lista de relatórios aparece
- [ ] Selecionar um relatório da lista

### Converter Padrão
- [ ] Selecionar "To Standard": NI 43-101
- [ ] Selecionar formato: PDF
- [ ] Clicar em "Exportar Relatório"
- [ ] Verificar progresso de exportação
- [ ] Verificar toast de sucesso
- [ ] Verificar que exportação aparece na lista de "Exportações Recentes"

### Download
- [ ] Clicar em "Download" na exportação criada
- [ ] Verificar que arquivo é baixado (ou URL S3 é gerada)

---

## 🌍 6. Regulatory Radar

### Acesso
- [ ] Navegar para `/reports/regulatory`
- [ ] Verificar que mapa mundial carrega

### Funcionalidades
- [ ] Verificar que países estão marcados no mapa
- [ ] Clicar em um país
- [ ] Verificar que informações regulatórias aparecem
- [ ] Verificar filtros (por país, por tipo de regulação)
- [ ] Verificar timeline de mudanças
- [ ] Verificar alertas recentes

### APIs Externas
- [ ] Verificar se dados do USGS carregam
- [ ] Verificar se dados da ANM carregam (Brasil)
- [ ] Verificar se dados do IBAMA carregam

---

## 🔍 7. KRCI Audit

### Acesso
- [ ] Navegar para `/reports/audit`
- [ ] Verificar que a página carrega

### Executar Auditoria
- [ ] Selecionar um relatório da lista
- [ ] Clicar em "Executar Auditoria KRCI"
- [ ] Verificar que auditoria inicia
- [ ] Verificar progresso (se houver)
- [ ] Verificar que resultado aparece

### Resultado
- [ ] Verificar score geral (0-100)
- [ ] Verificar lista de 22 regras verificadas
- [ ] Verificar status de cada regra (Pass/Warning/Fail)
- [ ] Verificar recomendações de correção
- [ ] Clicar em "Baixar Relatório de Auditoria"

---

## ✅ 8. Pre-Certification

### Acesso
- [ ] Navegar para `/reports/precert`
- [ ] Verificar que a página carrega

### Solicitar Pré-Certificação
- [ ] Selecionar um relatório
- [ ] Selecionar regulador: ASX (JORC 2012)
- [ ] Preencher informações adicionais
- [ ] Clicar em "Solicitar Pré-Certificação"
- [ ] Verificar toast de sucesso
- [ ] Verificar que solicitação aparece na lista

### Status
- [ ] Verificar status da solicitação (Pending/In Progress/Completed)
- [ ] Verificar estimativa de tempo
- [ ] Verificar progresso (%)

---

## 🌱 9. ESG Reporting

### Acesso
- [ ] Navegar para `/reports/esg`
- [ ] Verificar que formulário completo carrega

### Preencher Dados Básicos
- [ ] Nome do Projeto: "Projeto ESG Teste"
- [ ] Período: "Q4 2025"
- [ ] Framework: GRI Standards 2021
- [ ] Localização: "Pará, Brasil"

### Preencher Métricas Ambientais
- [ ] Scope 1 Emissions: 5000 tCO₂e
- [ ] Scope 2 Emissions: 3000 tCO₂e
- [ ] Scope 3 Emissions: 2000 tCO₂e
- [ ] Water Withdrawal: 100000 m³
- [ ] Water Recycled: 60000 m³
- [ ] Waste Generated: 50000 tonnes
- [ ] Waste Recycled: 30000 tonnes
- [ ] Energy Consumption: 20000 MWh
- [ ] Renewable Energy: 8000 MWh

### Preencher Métricas Sociais
- [ ] Total Employees: 500
- [ ] Female Employees: 150
- [ ] Local Employees: 400
- [ ] LTIFR: 2.5
- [ ] Fatality Rate: 0

### Preencher Métricas de Governança
- [ ] Board Members: 9
- [ ] Independent Directors: 5
- [ ] Female Directors: 3
- [ ] Corruption Incidents: 0
- [ ] Regulatory Violations: 0

### Gerar Relatório
- [ ] Clicar em "Gerar Relatório ESG"
- [ ] Verificar que cálculo inicia
- [ ] Verificar toast de sucesso
- [ ] Verificar ESG Score (E/S/G separados + Overall)
- [ ] Verificar Rating (A+, A, B, C, D)

### Integrações Externas
- [ ] Verificar se dados do IBAMA foram buscados (se localização fornecida)
- [ ] Verificar se dados do Copernicus foram buscados (dados satelitais)

---

## 💰 10. Valuation Automático

### Acesso
- [ ] Navegar para `/reports/valuation`
- [ ] Verificar que calculadora carrega

### Preencher Parâmetros Básicos
- [ ] Nome do Projeto: "Projeto Valuation Teste"
- [ ] Commodity: Gold
- [ ] Método: DCF (Discounted Cash Flow)

### Preencher Recursos Minerais
- [ ] Measured Resources: 1000000 tonnes
- [ ] Indicated Resources: 2000000 tonnes
- [ ] Inferred Resources: 1500000 tonnes
- [ ] Grade: 5.0 g/t

### Preencher Parâmetros Econômicos
- [ ] Commodity Price: Clicar em "Fetch" para buscar preço atual
- [ ] Verificar que preço foi atualizado
- [ ] OPEX: 50 USD/tonne
- [ ] CAPEX: 100000000 USD
- [ ] Recovery Rate: 85%
- [ ] Discount Rate: 10%
- [ ] Mine Life: 10 years
- [ ] Production Rate: 500000 tonnes/year

### Calcular Valuation
- [ ] Clicar em "Calcular Valuation"
- [ ] Verificar que cálculo inicia
- [ ] Verificar toast de sucesso

### Resultados
- [ ] Verificar NPV (Net Present Value) em USD
- [ ] Verificar IRR (Internal Rate of Return) em %
- [ ] Verificar Payback Period em anos
- [ ] Verificar Financial Breakdown:
  - [ ] Total Revenue
  - [ ] Total OPEX
  - [ ] Total CAPEX
  - [ ] Net Profit
- [ ] Verificar Sensitivity Analysis (se disponível)

---

## 🔧 11. Admin Core

### Admin Panel (`/admin`)

**⚠️ Requer privilégios de administrador**

#### Acesso
- [ ] Navegar para `/admin`
- [ ] Verificar que painel carrega (ou redireciona se não for admin)

#### Dashboard Administrativo
- [ ] Verificar estatísticas gerais:
  - [ ] Total Users
  - [ ] Recent Users (últimos 30 dias)
  - [ ] MRR (Monthly Recurring Revenue)
  - [ ] Breakdown por plano (Start/Pro/Enterprise)

#### Gestão de Usuários
- [ ] Clicar na aba "Users"
- [ ] Verificar lista de usuários
- [ ] Verificar campos: Email, Nome, Plano, Status, Data de Criação
- [ ] Usar busca para filtrar usuários
- [ ] Clicar em um usuário para ver detalhes

#### Gestão de Assinaturas
- [ ] Clicar na aba "Subscriptions"
- [ ] Verificar lista de assinaturas ativas
- [ ] Verificar campos: Usuário, Plano, Status, Uso, Expiração
- [ ] Filtrar por plano
- [ ] Filtrar por status

#### Análise de Receita
- [ ] Clicar na aba "Revenue"
- [ ] Verificar MRR (Monthly Recurring Revenue)
- [ ] Verificar ARR (Annual Recurring Revenue)
- [ ] Verificar breakdown por plano
- [ ] Verificar gráfico de crescimento (se disponível)

---

### Subscription Management (`/subscription`)

#### Acesso
- [ ] Navegar para `/subscription`
- [ ] Verificar que página carrega

#### Visualizar Plano Atual
- [ ] Verificar nome do plano (Start/Pro/Enterprise)
- [ ] Verificar status (Active/Trialing/Canceled)
- [ ] Verificar período de billing (Monthly/Annual)
- [ ] Verificar datas (Valid From / Valid Until)

#### Uso de Recursos
- [ ] Verificar "Reports Used" vs "Reports Limit"
- [ ] Verificar "Projects Active" vs "Projects Limit"
- [ ] Verificar barra de progresso de uso

#### Histórico de Faturas
- [ ] Verificar lista de faturas
- [ ] Verificar campos: Número, Data, Valor, Status
- [ ] Clicar em "Download PDF" em uma fatura
- [ ] Clicar em "View Invoice" para abrir no Stripe

#### Gerenciar Assinatura
- [ ] Clicar em "Manage Subscription"
- [ ] Verificar redirecionamento para Stripe Customer Portal
- [ ] (Ou) Verificar opções de upgrade/downgrade
- [ ] (Ou) Verificar opção de cancelamento

#### Cancelar Assinatura
- [ ] Clicar em "Cancel Subscription"
- [ ] Verificar modal de confirmação
- [ ] Confirmar cancelamento
- [ ] Verificar toast de sucesso
- [ ] Verificar que status mudou para "Canceled"

---

## 🔍 Testes de Integração

### tRPC Communication
- [ ] Abrir DevTools → Network
- [ ] Fazer qualquer ação que chame o backend
- [ ] Verificar que requisições vão para `/api/trpc/*`
- [ ] Verificar que responses são JSON válidos
- [ ] Verificar que não há erros 500

### Database Persistence
- [ ] Criar um relatório
- [ ] Fazer logout
- [ ] Fazer login novamente
- [ ] Verificar que relatório ainda existe
- [ ] Navegar para `/reports`
- [ ] Confirmar que relatório aparece na lista

### Multi-Tenancy
- [ ] Criar conta de teste 1
- [ ] Criar alguns relatórios
- [ ] Fazer logout
- [ ] Criar conta de teste 2
- [ ] Verificar que relatórios da conta 1 NÃO aparecem
- [ ] Criar relatórios na conta 2
- [ ] Fazer logout e login na conta 1
- [ ] Verificar que apenas relatórios da conta 1 aparecem

---

## 🚨 Testes de Erro

### Validação de Formulários
- [ ] Tentar criar relatório sem título
- [ ] Verificar mensagem de erro
- [ ] Tentar exportar sem selecionar relatório
- [ ] Verificar mensagem de erro
- [ ] Tentar calcular valuation sem grade
- [ ] Verificar mensagem de erro

### Sessão Expirada
- [ ] Fazer login
- [ ] Limpar cookies manualmente (DevTools)
- [ ] Tentar fazer uma ação
- [ ] Verificar que é redirecionado para `/login`

### Erros de Rede
- [ ] Desconectar internet
- [ ] Tentar criar relatório
- [ ] Verificar mensagem de erro amigável
- [ ] Reconectar internet
- [ ] Verificar que retry funciona (se implementado)

---

## 📱 Testes de Responsividade

### Desktop (1920x1080)
- [ ] Verificar que layout está correto
- [ ] Verificar que todos os elementos são visíveis
- [ ] Verificar que não há overflow horizontal

### Tablet (768x1024)
- [ ] Verificar que layout se adapta
- [ ] Verificar que menu lateral colapsa (se aplicável)
- [ ] Verificar que formulários são usáveis

### Mobile (375x667)
- [ ] Verificar que layout mobile funciona
- [ ] Verificar que menu vira hamburguer
- [ ] Verificar que tabelas são scrolláveis
- [ ] Verificar que botões são clicáveis (não muito pequenos)

---

## ⚡ Testes de Performance

### Tempo de Carregamento
- [ ] Abrir DevTools → Network
- [ ] Limpar cache
- [ ] Recarregar `/dashboard`
- [ ] Verificar que página carrega em < 3 segundos
- [ ] Verificar tamanho total de assets (< 2MB ideal)

### Lazy Loading
- [ ] Verificar que páginas são carregadas sob demanda
- [ ] Navegar para `/reports/esg`
- [ ] Verificar no Network que apenas bundle dessa página foi baixado

### Memória
- [ ] Abrir DevTools → Performance
- [ ] Gravar sessão de 1 minuto navegando entre páginas
- [ ] Verificar que não há memory leaks
- [ ] Verificar que heap size não cresce indefinidamente

---

## 🎨 Testes de UI/UX

### Consistência Visual
- [ ] Verificar que paleta de cores está correta:
  - Primary: #000020, #171a4a, #2f2c79
  - Accent: #8d4925, #b96e48
- [ ] Verificar que tipografia é consistente
- [ ] Verificar que espaçamentos são uniformes
- [ ] Verificar que ícones são do mesmo estilo

### Feedback ao Usuário
- [ ] Verificar que toasts aparecem em ações importantes
- [ ] Verificar que loading spinners aparecem durante processamento
- [ ] Verificar que botões mostram estado disabled quando necessário
- [ ] Verificar que erros são mostrados de forma clara

### Acessibilidade
- [ ] Navegar usando apenas teclado (Tab)
- [ ] Verificar que todos os elementos são alcançáveis
- [ ] Verificar que contraste de cores é adequado
- [ ] Verificar que labels de formulário existem

---

## ✅ Critérios de Aprovação

### Mínimo para Produção
- [ ] Todos os 11 módulos carregam sem erro
- [ ] Login/Logout funciona
- [ ] Refresh token automático funciona
- [ ] Criar relatório manual funciona
- [ ] Exportar padrões funciona
- [ ] ESG Reporting gera score
- [ ] Valuation calcula NPV/IRR
- [ ] Sem erros 500 no console
- [ ] Sem erros JavaScript no console

### Ideal para Produção
- [ ] Todos os itens acima ✅
- [ ] Testes de responsividade passam
- [ ] Performance adequada (< 3s load time)
- [ ] Integrações externas funcionam (IBAMA, Copernicus)
- [ ] Stripe integration funciona
- [ ] S3 upload funciona
- [ ] Geração de PDF funciona

---

## 📊 Relatório de Validação

**Data:** ___/___/2025  
**Validado por:** ________________  
**Ambiente:** Produção (https://qivo-mining.onrender.com)

**Resultado:**
- [ ] ✅ Aprovado para produção
- [ ] ⚠️ Aprovado com ressalvas (listar abaixo)
- [ ] ❌ Reprovado (listar problemas críticos abaixo)

**Observações:**
```
[Escrever observações aqui]
```

**Problemas Encontrados:**
1. 
2. 
3. 

**Próximas Ações:**
1. 
2. 
3. 

---

**Gerado em:** 28 de Outubro de 2025  
**Versão:** 1.0

