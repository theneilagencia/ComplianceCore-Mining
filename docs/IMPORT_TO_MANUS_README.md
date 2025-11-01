# 📦 Importador de Roadmap QIVO v1.3 → Manus

Script TypeScript para importar automaticamente o roadmap técnico gerado (`docs/QIVO_v1.3_Roadmap.xlsx`) para a plataforma Manus via API oficial.

## 📋 Índice

- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Estrutura de Dados](#estrutura-de-dados)
- [Troubleshooting](#troubleshooting)

---

## ✨ Funcionalidades

### ✅ O que o script faz:

1. **Lê arquivo Excel** (`docs/QIVO_v1.3_Roadmap.xlsx`)
2. **Extrai todas as tarefas** de todas as abas (sprints)
3. **Cria projeto no Manus** (ou usa existente)
4. **Cria sprints automaticamente** (um para cada aba do Excel)
5. **Importa tarefas** com todos os metadados:
   - Título e descrição
   - Responsável (assignee)
   - Estimativa (dias)
   - Prioridade (baseada no risco)
   - Critérios de aceitação
   - Comandos técnicos
   - Dependências
   - Entregáveis

### 🎯 Características:

- ✅ **Modo Dry-Run** - Testa importação sem criar dados reais
- ✅ **Idempotente** - Não duplica projetos/sprints existentes
- ✅ **Rate Limiting** - Respeita limites da API Manus (200ms entre requests)
- ✅ **Relatório Detalhado** - Exibe estatísticas e erros
- ✅ **Logs Estruturados** - Acompanhe cada etapa da importação
- ✅ **Tratamento de Erros** - Continua importação mesmo com falhas individuais

---

## 🔧 Pré-requisitos

### 1. Arquivo Excel Gerado

Execute primeiro o gerador de sprints:

```bash
pnpm run generate:sprints
```

Isso criará: `docs/QIVO_v1.3_Roadmap.xlsx`

### 2. Conta no Manus

- Crie uma conta em: https://manus.ai
- Acesse: **Settings → API Keys**
- Gere uma nova chave de API

### 3. Dependências Instaladas

O script utiliza:
- `exceljs` - Leitura de arquivos Excel
- `axios` - Requisições HTTP
- `dotenv` - Variáveis de ambiente

Todas já estão no `package.json` do projeto.

---

## 📦 Instalação

As dependências já estão configuradas no projeto. Caso precise reinstalar:

```bash
pnpm install
```

---

## ⚙️ Configuração

### 1. Configure as Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

### 2. Adicione sua Chave Manus

Edite o arquivo `.env` e adicione:

```bash
# Chave de API do Manus
MANUS_API_KEY=your-actual-manus-api-key-here

# URL da API Manus (padrão)
MANUS_BASE_URL=https://api.manus.ai/v1

# Modo de teste (opcional)
DRY_RUN=false
```

### 3. Para Manus Runtime Local (Opcional)

Se estiver usando Manus Runtime local:

```bash
MANUS_BASE_URL=http://localhost:3000/api
```

---

## 🚀 Uso

### Modo Dry-Run (Recomendado primeiro)

Teste a importação **SEM criar dados reais** no Manus:

```bash
pnpm run import:manus:dry
```

Isso vai:
- ✅ Ler o Excel
- ✅ Extrair todas as tarefas
- ✅ Validar dados
- ✅ Exibir o que seria importado
- ❌ **NÃO vai criar** nada no Manus

### Importação Real

Após validar no dry-run, execute a importação:

```bash
pnpm run import:manus
```

### Executar Manualmente com Opções

```bash
# Modo dry-run
DRY_RUN=true tsx scripts/import-to-manus.ts

# Com URL customizada
MANUS_BASE_URL=http://localhost:3000/api tsx scripts/import-to-manus.ts

# Com debug detalhado
DEBUG=1 tsx scripts/import-to-manus.ts
```

---

## 📊 Estrutura de Dados

### Campos Importados

Cada tarefa no Manus conterá:

| Campo Manus | Origem Excel | Descrição |
|-------------|--------------|-----------|
| **title** | ID + Título | Ex: `[RAD-001] Sistema de Notificações` |
| **description** | Descrição + Entregável + Comandos | Descrição completa formatada |
| **assignee** | Responsável | Backend Dev, Frontend Dev, etc. |
| **sprint** | Nome da Aba | Sprint 1, Sprint 2, etc. |
| **estimate** | Estimativa | Número de dias |
| **status** | - | Sempre `todo` inicialmente |
| **priority** | Risco | Alto → high, Médio → medium, Baixo → low |
| **labels** | Risco + Sprint | Ex: `['Alto', 'Sprint: Sprint 1']` |
| **metadata.acceptanceCriteria** | Critérios de Aceitação | Array de strings |
| **metadata.commands** | Comandos | Comandos técnicos bash/npm |
| **metadata.deliverable** | Entregável | Descrição do deliverable |
| **metadata.dependencies** | Dependências | Array de IDs de tarefas |

### Exemplo de Descrição Formatada

```markdown
Implementar envio de notificações via webhooks configuráveis

**📦 Entregável:**
Sistema de notificações funcionando com Slack e Teams

**🔗 Dependências:**
Nenhuma

**⚙️ Comandos:**
```bash
pnpm add @slack/webhook axios
```
```

---

## 📈 Relatório de Importação

Após a execução, você verá:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RELATÓRIO DE IMPORTAÇÃO - QIVO v1.3 → MANUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Total de tarefas encontradas:  25
✅ Tarefas importadas com sucesso: 25
❌ Tarefas com falha:              0
🏃 Sprints criados:                5

📈 Taxa de sucesso:                100.0%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🐛 Troubleshooting

### Erro: "MANUS_API_KEY não configurada"

**Problema**: Variável de ambiente não definida

**Solução**:
```bash
# Edite o .env
nano .env

# Ou exporte diretamente
export MANUS_API_KEY="sua-chave-aqui"
```

---

### Erro: "Arquivo Excel não encontrado"

**Problema**: `docs/QIVO_v1.3_Roadmap.xlsx` não existe

**Solução**:
```bash
# Gere o roadmap primeiro
pnpm run generate:sprints
```

---

### Erro: "Não foi possível conectar ao Manus"

**Problema**: API Manus não acessível ou chave inválida

**Soluções**:
1. Verifique se a chave está correta
2. Teste a conexão:
   ```bash
   curl -H "Authorization: Bearer $MANUS_API_KEY" https://api.manus.ai/v1/health
   ```
3. Verifique se a URL está correta no `.env`

---

### Erro: "Rate Limit Exceeded"

**Problema**: Muitas requisições em pouco tempo

**Solução**: O script já tem delay de 200ms entre requests. Se persistir:
```typescript
// Edite scripts/import-to-manus.ts
// Linha ~550: Aumente o delay
await new Promise(resolve => setTimeout(resolve, 500)); // 500ms em vez de 200ms
```

---

### Tarefas Duplicadas

**Problema**: Executou o script múltiplas vezes

**Solução**:
1. O script **tenta evitar duplicatas** buscando projetos/sprints existentes
2. Para garantir, delete o projeto no Manus antes de reimportar
3. Ou use IDs únicos no título das tarefas (já implementado: `[RAD-001]`)

---

### Nenhuma Tarefa Extraída do Excel

**Problema**: Formato do Excel não reconhecido

**Soluções**:
1. Verifique se o Excel foi gerado corretamente:
   ```bash
   ls -lh docs/QIVO_v1.3_Roadmap.xlsx
   ```
2. Abra o Excel e verifique se tem múltiplas abas
3. Verifique se a primeira linha de cada aba tem cabeçalhos (ID, Título, etc.)

---

## 🔍 Modo Debug

Para logs mais detalhados:

```typescript
// Edite scripts/import-to-manus.ts
// Adicione no início:
const DEBUG = true;

// Ou use variável de ambiente
DEBUG=1 pnpm run import:manus
```

---

## 📚 Recursos Adicionais

### Documentação Relacionada

- [Auditoria Técnica QIVO v1.3](../docs/AUDITORIA_AUTOMATIZADA_QIVO_v1.3.md)
- [Roadmap de Sprints](../docs/Sprints_QIVO_v1.3.md)
- [Gerador de Sprints](./generate-sprints.ts)

### API Manus

- Documentação oficial: https://docs.manus.ai
- Endpoints: https://api.manus.ai/v1/docs
- Status: https://status.manus.ai

---

## 🤝 Contribuindo

Para melhorias no script:

1. Edite: `scripts/import-to-manus.ts`
2. Teste com dry-run: `pnpm run import:manus:dry`
3. Valide importação real em projeto de teste

---

## 📝 Changelog

### v1.0.0 (01/11/2025)
- ✅ Importação completa de tarefas do Excel
- ✅ Criação automática de projetos e sprints
- ✅ Modo dry-run para testes
- ✅ Relatório detalhado de importação
- ✅ Rate limiting e tratamento de erros
- ✅ Suporte a todos os campos do roadmap

---

## 📄 Licença

Este script faz parte do QIVO Mining Platform.  
© 2025 QIVO Mining. Todos os direitos reservados.

---

**🎯 Próximo passo**: Execute `pnpm run import:manus:dry` para testar!
