# Manual ADMIN - Gestão de Usuários e Licenças

Este manual é para administradores que gerenciam usuários, licenças e configurações da organização.

## 1. Acessando o Painel Administrativo

### Requisitos
- Conta com permissão de **Administrador**
- Login ativo na plataforma

### Como acessar
1. Faça login na plataforma
2. No menu superior, clique em **"Admin"** (visível apenas para administradores)
3. Você será redirecionado para `/admin`

---

## 2. Dashboard Administrativo

### Visão Geral
O dashboard mostra métricas importantes:

#### Estatísticas Gerais
- **Total de Usuários:** Quantidade total de contas
- **Usuários Ativos:** Logaram nos últimos 30 dias
- **Relatórios Gerados:** Total de relatórios criados
- **Receita Total:** Faturamento acumulado

#### Gráficos
- **Novos Usuários por Mês:** Crescimento da base
- **Relatórios por Padrão:** JORC, NI 43-101, etc.
- **Receita Mensal:** Faturamento recorrente

---

## 3. Gestão de Usuários

### Visualizando Usuários

#### Lista de Usuários
1. No painel admin, clique em **"Usuários"**
2. Você verá uma tabela com:
   - Nome
   - Email
   - Plano
   - Status (Ativo/Inativo)
   - Data de Cadastro
   - Última Atividade

#### Filtros Disponíveis
- **Por Plano:** START, PROFESSIONAL, ENTERPRISE
- **Por Status:** Ativo, Inativo, Suspenso
- **Por Data:** Cadastrados em período específico
- **Por Atividade:** Ativos nos últimos X dias

#### Busca
- Digite nome ou email na barra de busca
- Resultados em tempo real

### Criando Usuários Manualmente

#### Quando usar?
- Onboarding de clientes corporativos
- Contas de teste para demonstrações
- Migração de usuários de outra plataforma

#### Passo a passo
1. Clique em **"Novo Usuário"**
2. Preencha:
   - **Nome completo**
   - **Email** (será o login)
   - **Senha temporária** (usuário deve trocar no primeiro login)
   - **Plano:** START, PROFESSIONAL ou ENTERPRISE
   - **Permissões:** Usuário ou Administrador
3. Clique em **"Criar Usuário"**
4. Sistema envia email de boas-vindas automaticamente

### Editando Usuários

#### Dados Editáveis
- Nome
- Email (com confirmação)
- Plano
- Permissões
- Status (Ativo/Inativo/Suspenso)

#### Como editar
1. Na lista de usuários, clique no ícone de **editar** (lápis)
2. Modifique os campos desejados
3. Clique em **"Salvar Alterações"**

### Suspendendo Usuários

#### Quando suspender?
- Inadimplência de pagamento
- Violação de termos de uso
- Solicitação do próprio usuário
- Investigação de atividade suspeita

#### Como suspender
1. Clique no usuário
2. Clique em **"Suspender Conta"**
3. Informe o motivo (obrigatório)
4. Confirme a ação

**Efeitos da suspensão:**
- ❌ Usuário não consegue fazer login
- ❌ Acesso a relatórios bloqueado
- ✅ Dados preservados
- ✅ Pode ser reativado a qualquer momento

### Excluindo Usuários

#### ⚠️ ATENÇÃO: Ação Irreversível!
A exclusão remove permanentemente:
- Conta do usuário
- Todos os relatórios gerados
- Histórico de atividades
- Dados de pagamento

#### Como excluir
1. Clique no usuário
2. Clique em **"Excluir Conta"**
3. Digite "CONFIRMAR EXCLUSÃO" no campo
4. Clique em **"Excluir Permanentemente"**

**Recomendação:** Prefira **suspender** ao invés de excluir.

---

## 4. Gestão de Licenças e Assinaturas

### Tipos de Licenças

#### START (Gratuito)
- 1 relatório/mês
- 1 projeto ativo
- Suporte por email
- Sem custo

#### PROFESSIONAL (R$ 299/mês)
- 10 relatórios/mês
- 5 projetos ativos
- Suporte prioritário
- Todos os módulos

#### ENTERPRISE (R$ 999/mês)
- Relatórios ilimitados
- Projetos ilimitados
- Suporte dedicado
- API access
- Treinamento personalizado

### Visualizando Assinaturas

#### Lista de Assinaturas
1. No painel admin, clique em **"Assinaturas"**
2. Você verá:
   - Usuário
   - Plano atual
   - Status (Ativa/Cancelada/Vencida)
   - Data de início
   - Próxima cobrança
   - Valor mensal

#### Filtros
- **Por Plano**
- **Por Status**
- **Por Data de Vencimento**

### Alterando Planos Manualmente

#### Quando usar?
- Upgrade/downgrade fora do fluxo normal
- Cortesias e descontos especiais
- Correção de erros de cobrança
- Negociações comerciais

#### Como alterar
1. Clique na assinatura do usuário
2. Clique em **"Alterar Plano"**
3. Escolha o novo plano
4. Defina:
   - **Data de início:** Imediato ou próximo ciclo
   - **Ajuste de cobrança:** Proporcional ou integral
   - **Motivo:** Documentar a mudança
5. Clique em **"Confirmar Alteração"**

### Aplicando Descontos

#### Tipos de Desconto
- **Percentual:** Ex: 20% off
- **Valor Fixo:** Ex: R$ 50 off
- **Período:** Ex: 3 meses grátis

#### Como aplicar
1. Clique na assinatura
2. Clique em **"Aplicar Desconto"**
3. Preencha:
   - **Tipo de desconto**
   - **Valor/Percentual**
   - **Duração:** Permanente ou temporário
   - **Motivo:** Documentar
4. Clique em **"Aplicar"**

### Cancelando Assinaturas

#### Tipos de Cancelamento

**Imediato:**
- Acesso bloqueado imediatamente
- Sem reembolso proporcional
- Usar apenas em casos excepcionais

**Fim do Ciclo:**
- Acesso mantido até o fim do período pago
- Não renova automaticamente
- Recomendado para cancelamentos normais

#### Como cancelar
1. Clique na assinatura
2. Clique em **"Cancelar Assinatura"**
3. Escolha o tipo de cancelamento
4. Informe o motivo (obrigatório)
5. Confirme a ação

---

## 5. Gestão de Pagamentos

### Visualizando Transações

#### Lista de Transações
1. No painel admin, clique em **"Pagamentos"**
2. Você verá:
   - Data
   - Usuário
   - Valor
   - Status (Pago/Pendente/Falhou/Reembolsado)
   - Método (Cartão/Boleto/PIX)
   - Fatura (link para PDF)

#### Filtros
- **Por Status**
- **Por Período**
- **Por Método de Pagamento**
- **Por Valor**

### Processando Reembolsos

#### Quando reembolsar?
- Cobrança duplicada
- Erro no sistema
- Insatisfação do cliente (dentro da política)
- Cancelamento com direito a reembolso

#### Como reembolsar
1. Clique na transação
2. Clique em **"Processar Reembolso"**
3. Escolha:
   - **Reembolso Total:** 100% do valor
   - **Reembolso Parcial:** Especifique o valor
4. Informe o motivo
5. Confirme a ação

**Prazo:** Reembolso processado em até 7 dias úteis.

### Gerando Relatórios Financeiros

#### Tipos de Relatórios
- **Receita Mensal:** Faturamento por mês
- **Churn Rate:** Taxa de cancelamento
- **MRR (Monthly Recurring Revenue):** Receita recorrente
- **LTV (Lifetime Value):** Valor vitalício do cliente

#### Como gerar
1. Clique em **"Relatórios Financeiros"**
2. Escolha o tipo de relatório
3. Defina o período
4. Clique em **"Gerar Relatório"**
5. Exporte em PDF ou Excel

---

## 6. Gestão de Permissões

### Níveis de Permissão

#### Usuário
- Acessa apenas suas próprias contas e relatórios
- Não vê dados de outros usuários
- Não pode alterar configurações globais

#### Administrador
- Acessa todos os usuários e relatórios
- Pode criar, editar e excluir usuários
- Pode alterar planos e processar reembolsos
- Acessa painel administrativo completo

### Promovendo Usuários a Admin

#### Quando promover?
- Equipe interna de suporte
- Gerentes de conta
- Parceiros de negócio autorizados

#### Como promover
1. Acesse a lista de usuários
2. Clique no usuário
3. Clique em **"Editar Permissões"**
4. Marque **"Administrador"**
5. Confirme a ação

**⚠️ CUIDADO:** Administradores têm acesso total ao sistema!

### Revogando Permissões de Admin

#### Como revogar
1. Acesse a lista de usuários
2. Clique no admin
3. Clique em **"Editar Permissões"**
4. Desmarque **"Administrador"**
5. Confirme a ação

---

## 7. Configurações Globais

### Configurações de Planos

#### Editando Limites
1. Clique em **"Configurações"** → **"Planos"**
2. Escolha o plano (START, PROFESSIONAL, ENTERPRISE)
3. Edite:
   - **Limite de relatórios/mês**
   - **Limite de projetos ativos**
   - **Preço mensal**
   - **Recursos incluídos**
4. Clique em **"Salvar"**

**⚠️ Mudanças afetam apenas novas assinaturas.**

### Configurações de Email

#### Templates de Email
Personalize emails automáticos:
- Boas-vindas
- Confirmação de cadastro
- Redefinição de senha
- Notificação de pagamento
- Lembrete de vencimento
- Cancelamento de assinatura

#### Como editar
1. Clique em **"Configurações"** → **"Emails"**
2. Escolha o template
3. Edite o conteúdo (suporta HTML)
4. Use variáveis: `{{nome}}`, `{{email}}`, `{{plano}}`
5. Clique em **"Salvar"**

### Configurações de Segurança

#### Autenticação
- **Senha mínima:** Caracteres mínimos
- **Complexidade:** Letras, números, símbolos
- **Expiração:** Forçar troca periódica
- **2FA (Two-Factor Authentication):** Obrigatório ou opcional

#### Sessões
- **Tempo de inatividade:** Logout automático
- **Sessões simultâneas:** Permitir ou bloquear

#### Logs de Auditoria
- **Retenção:** Período de armazenamento
- **Eventos registrados:** Login, alterações, exclusões

---

## 8. Monitoramento e Logs

### Logs de Atividade

#### O que é registrado?
- Logins e logouts
- Criação/edição/exclusão de usuários
- Alterações de planos
- Processamento de pagamentos
- Geração de relatórios
- Acessos ao painel admin

#### Como visualizar
1. Clique em **"Logs"**
2. Filtre por:
   - **Tipo de evento**
   - **Usuário**
   - **Data**
   - **IP de origem**
3. Exporte logs em CSV para análise

### Alertas Automáticos

#### Configurar Alertas
Receba notificações por email quando:
- Novo usuário se cadastra
- Pagamento falha
- Usuário cancela assinatura
- Limite de uso é atingido
- Atividade suspeita é detectada

#### Como configurar
1. Clique em **"Configurações"** → **"Alertas"**
2. Marque os eventos desejados
3. Adicione emails para receber alertas
4. Clique em **"Salvar"**

---

## 9. Suporte ao Cliente

### Visualizando Tickets de Suporte

#### Lista de Tickets
1. Clique em **"Suporte"**
2. Você verá:
   - Número do ticket
   - Usuário
   - Assunto
   - Status (Aberto/Em andamento/Resolvido)
   - Prioridade (Baixa/Média/Alta/Urgente)
   - Data de abertura

#### Como responder
1. Clique no ticket
2. Leia o histórico de mensagens
3. Digite sua resposta
4. Clique em **"Enviar Resposta"**
5. Altere o status se necessário

### Fechando Tickets

#### Quando fechar?
- Problema resolvido
- Usuário confirmou resolução
- Sem resposta do usuário por 7 dias

#### Como fechar
1. Clique no ticket
2. Clique em **"Fechar Ticket"**
3. Adicione comentário final (opcional)
4. Confirme a ação

---

## 10. Melhores Práticas para Admins

### Segurança
✅ Use senha forte e 2FA  
✅ Nunca compartilhe credenciais de admin  
✅ Revise logs de auditoria semanalmente  
✅ Mantenha lista de admins atualizada  
✅ Faça backup de dados regularmente

### Gestão de Usuários
✅ Responda tickets em até 24 horas  
✅ Documente todas as alterações manuais  
✅ Prefira suspender ao invés de excluir  
✅ Monitore usuários inativos mensalmente  
✅ Faça follow-up de cancelamentos

### Financeiro
✅ Reconcilie pagamentos semanalmente  
✅ Monitore taxa de churn mensalmente  
✅ Analise motivos de cancelamento  
✅ Ofereça descontos estrategicamente  
✅ Gere relatórios financeiros mensais

### Compliance
✅ Mantenha políticas de privacidade atualizadas  
✅ Respeite LGPD e GDPR  
✅ Documente processos administrativos  
✅ Faça auditoria interna trimestral  
✅ Treine novos admins adequadamente

---

## 11. Troubleshooting Comum

### Problema: Usuário não recebe emails
**Soluções:**
1. Verifique se email está correto
2. Peça para checar spam/lixeira
3. Reenvie email manualmente
4. Verifique logs de envio de email

### Problema: Pagamento falhou
**Soluções:**
1. Verifique dados do cartão
2. Confirme se há saldo disponível
3. Tente outro método de pagamento
4. Entre em contato com gateway de pagamento

### Problema: Relatório não foi gerado
**Soluções:**
1. Verifique logs de erro
2. Confirme se dados estão completos
3. Tente gerar novamente
4. Escale para equipe técnica se persistir

### Problema: Usuário esqueceu senha
**Soluções:**
1. Envie link de redefinição de senha
2. Se não receber, redefina manualmente
3. Envie nova senha temporária por email seguro

---

## Precisa de Ajuda?

**Suporte para Administradores:**
- Email: admin-support@qivo-mining.com
- Chat: Seg-Sex, 9h-18h BRT (canal prioritário)
- Telefone: +55 11 1234-5678 (ramal 2)

**Documentação Técnica:**
- API Docs: https://api.qivo-mining.com/docs
- Changelog: https://qivo-mining.com/changelog

---

**Anterior:** [Manual PRO](/support/manual-pro)  
**Próximo:** [FAQ](/support/faq)

