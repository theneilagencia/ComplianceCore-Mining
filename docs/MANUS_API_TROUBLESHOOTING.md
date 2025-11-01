# 🔧 Configuração da API Manus - Guia de Troubleshooting

**Data**: 01/11/2025  
**Status**: ⚠️ API Endpoint Precisa de Configuração

---

## 🚨 Problema Identificado

A chave Manus fornecida está correta (`sk-6SED3B3...`), mas a URL da API não está respondendo corretamente:

- ❌ `https://api.manus.ai/v1` → **404 Not Found**
- ❌ `https://api.manus.app` → **ENOTFOUND (domínio não existe)**

---

## 🎯 Soluções Possíveis

### Opção 1: Usar Manus Runtime Local

Se você está usando o **Manus Runtime** (plugin VSCode), a API estará disponível localmente:

```bash
# Edite o .env
MANUS_BASE_URL=http://localhost:3000/api
```

**Como verificar se o Manus Runtime está rodando**:
```bash
# Teste manual
curl http://localhost:3000/api/health

# Ou verifique no VSCode
# Extensions → Manus → Deve estar ativo
```

---

### Opção 2: Encontrar a URL Correta da API Manus

A API Manus pode estar em um dos seguintes endpoints:

```bash
# Possibilidades comuns:
https://app.manus.ai/api
https://api.manus.cloud/v1
https://manus.ai/api/v1
https://platform.manus.ai/api
```

**Como testar**:
```bash
# Teste manual cada URL
curl -H "Authorization: Bearer sk-6SED3B3..." https://app.manus.ai/api/projects

# Ou use o script de teste que vou criar
```

---

### Opção 3: Consultar Documentação Oficial

1. Acesse: https://manus.ai/docs
2. Procure por "API Reference" ou "Developers"
3. Encontre a seção "Base URL" ou "Endpoint"

---

## 🛠️ Script de Teste de Endpoints

Vou criar um script para testar automaticamente várias URLs:

```typescript
// scripts/test-manus-api.ts
const endpoints = [
  'https://api.manus.ai/v1',
  'https://api.manus.app/v1',
  'https://app.manus.ai/api',
  'https://app.manus.ai/api/v1',
  'https://manus.ai/api',
  'https://platform.manus.ai/api',
  'http://localhost:3000/api',
];

for (const endpoint of endpoints) {
  try {
    const response = await fetch(`${endpoint}/projects`, {
      headers: { 'Authorization': `Bearer ${process.env.MANUS_API_KEY}` }
    });
    console.log(`✅ ${endpoint} → ${response.status}`);
  } catch (error) {
    console.log(`❌ ${endpoint} → ${error.message}`);
  }
}
```

---

## 📝 Próximos Passos

### Passo 1: Descobrir URL Correta

**Escolha uma das opções**:

#### A) Manus Runtime (Local):
```bash
# 1. Verificar se está rodando
ps aux | grep manus

# 2. Configurar .env
echo "MANUS_BASE_URL=http://localhost:3000/api" >> .env

# 3. Testar
pnpm run import:manus:dry
```

#### B) API Cloud (Remota):
```bash
# 1. Encontrar URL correta (verificar docs ou suporte)
# 2. Configurar .env
nano .env  # Editar MANUS_BASE_URL

# 3. Testar
pnpm run import:manus:dry
```

---

### Passo 2: Alternativa - Importação Manual

Enquanto não temos a API configurada, você pode:

1. **Abrir o Excel** gerado:
   ```
   open docs/QIVO_v1.3_Roadmap.xlsx
   ```

2. **Importar manualmente** no Manus:
   - Acessar: https://app.manus.ai
   - Criar projeto: "QIVO Mining Platform v1.3"
   - Importar tarefas do Excel (copiar/colar)

3. **Ou exportar para outro formato**:
   - Jira CSV
   - GitHub Projects
   - Trello
   - Linear
   - ClickUp

---

## 🔍 Debug - Informações da Chave

A chave fornecida:
```
sk-6SED3B3uIyEsAON-Zm-k-di0AN1tnaLqlzO9Qf7YqY01CJjjUJPVNEDJNJnyclW-lb7_mvIMavrF8rZSNbc7oXPqaluw
```

**Formato**: ✅ Válido (prefixo `sk-` indica Secret Key)  
**Tamanho**: ✅ Adequado (~100 caracteres)  
**Origem**: Parece ser de ambiente **Manus Cloud** ou **Manus Runtime**

---

## 💡 Recomendação Imediata

### 1. Verifique o Painel Manus

Acesse https://app.manus.ai e procure por:
- **Settings** → **API Keys**
- **Developers** → **API Documentation**
- **Integrations** → **Webhook URL** (pode conter a base URL)

### 2. Teste com cURL

```bash
# Teste 1: API Projects
curl -v \
  -H "Authorization: Bearer sk-6SED3B3..." \
  https://app.manus.ai/api/projects

# Teste 2: API Health
curl -v \
  -H "Authorization: Bearer sk-6SED3B3..." \
  https://app.manus.ai/api/health

# Teste 3: Runtime Local
curl -v http://localhost:3000/api/health
```

### 3. Contate o Suporte Manus

Se nada funcionar:
- Email: support@manus.ai
- Discord: https://discord.gg/manus
- Docs: https://manus.ai/docs

**Perguntas a fazer**:
1. Qual é a URL base da API para minha chave?
2. Quais são os endpoints disponíveis para importação de tarefas?
3. Existe documentação da API REST?

---

## 🎯 Status Atual

| Item | Status |
|------|--------|
| **Chave API** | ✅ Fornecida |
| **Script de Importação** | ✅ Criado |
| **Excel Roadmap** | ✅ Gerado |
| **URL da API** | ❌ **PENDENTE** |
| **Importação** | ⏸️ **BLOQUEADA** |

---

## 📚 Recursos Criados

Mesmo sem a API funcionando, você já tem:

1. ✅ **Roadmap completo** em Excel
2. ✅ **Documentação técnica** em Markdown
3. ✅ **Script de importação** pronto
4. ✅ **25 tarefas** detalhadas
5. ✅ **5 sprints** estruturados

**Você pode usar estes arquivos independentemente da importação para o Manus!**

---

## 🔄 Alternativas de Importação

Enquanto a API Manus não está configurada:

### Opção 1: GitHub Projects
```bash
# Instalar CLI GitHub
brew install gh

# Criar projeto
gh project create --title "QIVO v1.3"

# Importar tarefas (script separado disponível)
```

### Opção 2: Notion
- Abrir Excel → Copiar tabela
- Notion → New Database → Colar

### Opção 3: Linear
- Usar CSV import do Linear
- Mapear colunas automaticamente

### Opção 4: Jira
- Exportar Excel para CSV
- Jira → Import → CSV

---

## 📞 Próxima Ação Recomendada

**URGENTE**: Descobrir a URL correta da API Manus

1. Verificar painel web do Manus
2. Consultar documentação
3. Contatar suporte se necessário

**ALTERNATIVA**: Usar Excel manualmente ou exportar para outra ferramenta

---

**💬 Me avise quando descobrir a URL correta da API para testarmos novamente!**
