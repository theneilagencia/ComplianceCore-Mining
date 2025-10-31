# Guia de Configuração de Variáveis de Ambiente

## Índice

1. [Visão Geral](#visão-geral)
2. [Configuração Rápida](#configuração-rápida)
3. [Variáveis Obrigatórias](#variáveis-obrigatórias)
4. [Variáveis Opcionais](#variáveis-opcionais)
5. [Ambientes de Deploy](#ambientes-de-deploy)
6. [Segurança e Boas Práticas](#segurança-e-boas-práticas)
7. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O **QIVO Mining Platform** utiliza variáveis de ambiente para configurar integrações com serviços externos, credenciais de API e parâmetros de execução. Este documento detalha todas as variáveis necessárias e como configurá-las corretamente.

### Categorias de Variáveis

O sistema utiliza **25 variáveis de ambiente** organizadas em 7 categorias:

| Categoria | Quantidade | Obrigatórias | Descrição |
|-----------|------------|--------------|-----------|
| **Banco de Dados** | 1 | 1 | Conexão PostgreSQL |
| **Autenticação** | 6 | 6 | JWT, OAuth Google e customizado |
| **Pagamentos** | 3 | 3 | Integração Stripe |
| **Armazenamento** | 4 | 4 | AWS S3 para arquivos |
| **IA** | 2 | 1 | OpenAI API |
| **Aplicação** | 3 | 3 | Configurações gerais |
| **Frontend** | 6 | 4 | Variáveis Vite |

---

## Configuração Rápida

### Passo 1: Copiar o Arquivo de Exemplo

```bash
cp .env.example .env
```

### Passo 2: Preencher as Variáveis Obrigatórias

Edite o arquivo `.env` e preencha as seguintes variáveis **obrigatórias**:

```bash
# Banco de Dados
DATABASE_URL=postgresql://user:password@host:5432/database

# Autenticação
JWT_SECRET=your-secret-min-32-chars
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
OAUTH_CLIENT_ID=your-oauth-id
OAUTH_CLIENT_SECRET=your-oauth-secret
OAUTH_SERVER_URL=https://your-oauth-server.com

# Pagamentos
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Armazenamento
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=your-bucket
S3_REGION=sa-east-1

# IA
OPENAI_API_KEY=sk-proj-your-key

# Aplicação
NODE_ENV=production
FLASK_ENV=production
PORT=5050

# Frontend
VITE_APP_ID=qivo-mining
VITE_APP_TITLE=QIVO Mining
VITE_APP_LOGO=https://your-domain.com/logo.png
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
```

### Passo 3: Verificar a Configuração

```bash
# Verificar se todas as variáveis estão definidas
node -e "require('dotenv').config(); console.log(process.env)"
```

---

## Variáveis Obrigatórias

### 1. Banco de Dados

#### `DATABASE_URL`
- **Tipo**: String (URL de conexão)
- **Formato**: `postgresql://user:password@host:port/database`
- **Exemplo**: `postgresql://qivo_user:senha123@localhost:5432/qivo_mining`
- **Descrição**: URL de conexão com o banco de dados PostgreSQL
- **Onde obter**: 
  - **Render**: Automaticamente fornecido ao criar um PostgreSQL database
  - **Local**: Configure um PostgreSQL local ou use Docker

**Exemplo de configuração local com Docker:**
```bash
docker run -d \
  --name qivo-postgres \
  -e POSTGRES_USER=qivo_user \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=qivo_mining \
  -p 5432:5432 \
  postgres:17
```

---

### 2. Autenticação e Segurança

#### `JWT_SECRET`
- **Tipo**: String (mínimo 32 caracteres)
- **Exemplo**: `261d3cec8050c8ef607801ce8bcd0c0e`
- **Descrição**: Chave secreta para assinatura de tokens JWT
- **Como gerar**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

#### `GOOGLE_CLIENT_ID`
- **Tipo**: String
- **Formato**: `*.apps.googleusercontent.com`
- **Descrição**: ID do cliente OAuth Google
- **Onde obter**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

**Passo a passo:**
1. Acesse o Google Cloud Console
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth client ID**
5. Selecione **Web application**
6. Adicione as URLs de redirecionamento autorizadas
7. Copie o **Client ID** e **Client Secret**

#### `GOOGLE_CLIENT_SECRET`
- **Tipo**: String
- **Descrição**: Segredo do cliente OAuth Google
- **Onde obter**: Google Cloud Console (mesmo local do Client ID)

#### `GOOGLE_CALLBACK_URL`
- **Tipo**: String (URL)
- **Formato**: `https://your-domain.com/api/auth/google/callback`
- **Descrição**: URL de callback após autenticação Google
- **Produção**: `https://qivo-mining.onrender.com/api/auth/google/callback`
- **Local**: `http://localhost:5050/api/auth/google/callback`

#### `OAUTH_CLIENT_ID`
- **Tipo**: String
- **Descrição**: ID do cliente OAuth customizado
- **Onde obter**: Seu servidor OAuth customizado

#### `OAUTH_CLIENT_SECRET`
- **Tipo**: String
- **Descrição**: Segredo do cliente OAuth customizado
- **Onde obter**: Seu servidor OAuth customizado

#### `OAUTH_SERVER_URL`
- **Tipo**: String (URL)
- **Descrição**: URL do servidor OAuth customizado
- **Exemplo**: `https://oauth.your-domain.com`

---

### 3. Pagamentos - Stripe

#### `STRIPE_SECRET_KEY`
- **Tipo**: String
- **Formato**: `sk_test_*` (teste) ou `sk_live_*` (produção)
- **Descrição**: Chave secreta da API Stripe
- **Onde obter**: [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

**Passo a passo:**
1. Acesse o Stripe Dashboard
2. Vá em **Developers** > **API keys**
3. Copie a **Secret key**
4. Para produção, use a chave **Live mode**
5. Para desenvolvimento, use a chave **Test mode**

#### `STRIPE_PUBLISHABLE_KEY`
- **Tipo**: String
- **Formato**: `pk_test_*` (teste) ou `pk_live_*` (produção)
- **Descrição**: Chave pública da API Stripe
- **Onde obter**: Stripe Dashboard (mesmo local da Secret key)

#### `STRIPE_WEBHOOK_SECRET`
- **Tipo**: String
- **Formato**: `whsec_*`
- **Descrição**: Segredo para validação de webhooks Stripe
- **Onde obter**: [Stripe Webhooks](https://dashboard.stripe.com/webhooks)

**Passo a passo:**
1. Acesse **Developers** > **Webhooks**
2. Clique em **Add endpoint**
3. Configure a URL: `https://your-domain.com/api/webhooks/stripe`
4. Selecione os eventos que deseja receber
5. Copie o **Signing secret**

---

### 4. Armazenamento - AWS S3

#### `S3_ACCESS_KEY`
- **Tipo**: String
- **Descrição**: Access Key ID da AWS
- **Onde obter**: [AWS IAM Console](https://console.aws.amazon.com/iam/)

**Passo a passo:**
1. Acesse o AWS IAM Console
2. Vá em **Users** > Selecione seu usuário
3. Clique em **Security credentials**
4. Clique em **Create access key**
5. Copie o **Access key ID** e **Secret access key**

#### `S3_SECRET_KEY`
- **Tipo**: String
- **Descrição**: Secret Access Key da AWS
- **Onde obter**: AWS IAM Console (mesmo local do Access Key)

#### `S3_BUCKET`
- **Tipo**: String
- **Descrição**: Nome do bucket S3
- **Exemplo**: `qivo-mining-files`
- **Onde obter**: [AWS S3 Console](https://s3.console.aws.amazon.com/)

**Passo a passo:**
1. Acesse o AWS S3 Console
2. Clique em **Create bucket**
3. Escolha um nome único
4. Selecione a região (recomendado: `sa-east-1` para Brasil)
5. Configure as permissões conforme necessário

#### `S3_REGION`
- **Tipo**: String
- **Valores comuns**: `us-east-1`, `sa-east-1`, `eu-west-1`
- **Descrição**: Região AWS do bucket S3
- **Recomendado**: `sa-east-1` (São Paulo) para melhor latência no Brasil

---

### 5. Inteligência Artificial - OpenAI

#### `OPENAI_API_KEY` ⚠️ **FALTANTE NO RENDER**
- **Tipo**: String
- **Formato**: `sk-proj-*`
- **Descrição**: Chave da API OpenAI para funcionalidades de IA
- **Onde obter**: [OpenAI Platform](https://platform.openai.com/api-keys)

**Passo a passo:**
1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Faça login ou crie uma conta
3. Vá em **API keys**
4. Clique em **Create new secret key**
5. Copie a chave (ela só será exibida uma vez)

**⚠️ ATENÇÃO**: Esta variável está **faltando no Render** e precisa ser adicionada!

**Como adicionar no Render:**
```bash
# Via CLI
render env set OPENAI_API_KEY=sk-proj-your-key --service qivo-mining

# Ou via Dashboard:
# 1. Acesse https://dashboard.render.com/web/srv-*/env
# 2. Clique em "Edit"
# 3. Clique em "+ Add"
# 4. Adicione: OPENAI_API_KEY = sk-proj-your-key
# 5. Clique em "Save, rebuild, and deploy"
```

#### `OPENAI_API_URL` (Opcional)
- **Tipo**: String (URL)
- **Padrão**: `https://api.openai.com/v1`
- **Descrição**: URL da API OpenAI (use apenas se precisar de endpoint customizado)

---

### 6. Configuração da Aplicação

#### `NODE_ENV`
- **Tipo**: String
- **Valores**: `development`, `production`, `test`
- **Descrição**: Ambiente de execução Node.js
- **Produção**: `production`
- **Local**: `development`

#### `FLASK_ENV`
- **Tipo**: String
- **Valores**: `development`, `production`
- **Descrição**: Ambiente de execução Flask (se aplicável)
- **Produção**: `production`
- **Local**: `development`

#### `PORT`
- **Tipo**: Number
- **Descrição**: Porta do servidor
- **Render**: `5050`
- **Local**: `3000` ou `5050`

---

### 7. Frontend - Vite

#### `VITE_APP_ID`
- **Tipo**: String
- **Descrição**: Identificador único da aplicação
- **Exemplo**: `qivo-mining-prod`

#### `VITE_APP_TITLE`
- **Tipo**: String
- **Descrição**: Título da aplicação exibido no navegador
- **Exemplo**: `QIVO Mining`

#### `VITE_APP_LOGO`
- **Tipo**: String (URL)
- **Descrição**: URL do logo da aplicação
- **Exemplo**: `https://qivo-mining.onrender.com/logo.png`

#### `VITE_OAUTH_PORTAL_URL`
- **Tipo**: String (URL)
- **Descrição**: URL do portal OAuth
- **Exemplo**: `https://oauth.your-domain.com`

#### `VITE_ANALYTICS_ENDPOINT` (Opcional)
- **Tipo**: String (URL)
- **Descrição**: Endpoint de analytics (ex: Umami, Google Analytics)

#### `VITE_ANALYTICS_WEBSITE_ID` (Opcional)
- **Tipo**: String
- **Descrição**: ID do website no serviço de analytics

---

## Variáveis Opcionais

### Analytics

As variáveis de analytics são **opcionais** e podem ser omitidas se você não usar um serviço de analytics:

- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`

### OpenAI URL

- `OPENAI_API_URL`: Use apenas se precisar de um endpoint customizado (ex: proxy, Azure OpenAI)

---

## Ambientes de Deploy

### Desenvolvimento Local

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite `.env` com valores de **teste**:

```bash
# Use chaves de teste do Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Use banco de dados local
DATABASE_URL=postgresql://localhost:5432/qivo_mining_dev

# Use porta padrão de desenvolvimento
PORT=3000
NODE_ENV=development
FLASK_ENV=development
```

### Render (Produção)

Configure as variáveis diretamente no **Render Dashboard**:

1. Acesse: https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0/env
2. Clique em **"Edit"**
3. Adicione ou edite as variáveis
4. Clique em **"Save, rebuild, and deploy"**

**Ou use o Render CLI:**

```bash
# Adicionar uma variável
render env set VARIABLE_NAME=value --service qivo-mining

# Listar variáveis
render env list --service qivo-mining

# Remover uma variável
render env unset VARIABLE_NAME --service qivo-mining
```

### Vercel (Frontend)

Se você estiver usando Vercel para o frontend:

1. Acesse: https://vercel.com/your-team/qivo-mining/settings/environment-variables
2. Adicione as variáveis que começam com `VITE_`
3. Selecione os ambientes (Production, Preview, Development)
4. Clique em **"Save"**

**Ou use o Vercel CLI:**

```bash
# Adicionar variável
vercel env add VITE_APP_TITLE production

# Listar variáveis
vercel env ls

# Remover variável
vercel env rm VITE_APP_TITLE production
```

---

## Segurança e Boas Práticas

### ✅ Boas Práticas

1. **NUNCA faça commit do arquivo `.env`**
   - O arquivo `.env` já está no `.gitignore`
   - Use apenas `.env.example` para referência

2. **Use valores diferentes para desenvolvimento e produção**
   - Desenvolvimento: chaves de teste, banco local
   - Produção: chaves reais, banco em nuvem

3. **Rotacione suas chaves regularmente**
   - Especialmente após vazamentos ou mudanças de equipe
   - Configure alertas de segurança no GitHub

4. **Use secrets managers em produção**
   - Render: variáveis de ambiente nativas
   - AWS: AWS Secrets Manager
   - Vercel: Environment Variables

5. **Limite permissões de API keys**
   - Stripe: use restricted keys quando possível
   - AWS: siga o princípio do menor privilégio
   - OpenAI: configure limites de uso

6. **Monitore uso de APIs**
   - Configure alertas de gastos
   - Revise logs regularmente
   - Use rate limiting

### ⚠️ Avisos de Segurança

1. **JWT_SECRET**
   - Mínimo 32 caracteres
   - Use caracteres aleatórios
   - Nunca use valores previsíveis

2. **OPENAI_API_KEY**
   - Configure limites de uso
   - Monitore gastos
   - Use soft/hard limits na OpenAI

3. **STRIPE_SECRET_KEY**
   - Nunca exponha no frontend
   - Use apenas no backend
   - Configure webhooks com validação

4. **S3_SECRET_KEY**
   - Nunca exponha publicamente
   - Use IAM roles quando possível
   - Configure bucket policies restritivas

---

## Troubleshooting

### Erro: "DATABASE_URL is not defined"

**Solução:**
```bash
# Verifique se o arquivo .env existe
ls -la .env

# Verifique se a variável está definida
grep DATABASE_URL .env

# Se não existir, copie do exemplo
cp .env.example .env
```

### Erro: "Invalid JWT secret"

**Solução:**
```bash
# Gere um novo JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Adicione ao .env
echo "JWT_SECRET=<valor-gerado>" >> .env
```

### Erro: "Stripe webhook signature verification failed"

**Solução:**
1. Verifique se `STRIPE_WEBHOOK_SECRET` está correto
2. Confirme que a URL do webhook está correta
3. Teste com Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:5050/api/webhooks/stripe
   ```

### Erro: "OpenAI API key not found"

**Solução:**
```bash
# Verifique se a variável está definida
grep OPENAI_API_KEY .env

# Se estiver no Render, adicione via dashboard ou CLI
render env set OPENAI_API_KEY=sk-proj-your-key --service qivo-mining
```

### Erro: "S3 Access Denied"

**Solução:**
1. Verifique as credenciais AWS
2. Confirme que o bucket existe
3. Verifique as permissões IAM:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::your-bucket/*"
       }
     ]
   }
   ```

### Erro: "Port already in use"

**Solução:**
```bash
# Encontre o processo usando a porta
lsof -i :5050

# Mate o processo
kill -9 <PID>

# Ou use outra porta
PORT=3001 npm start
```

---

## Checklist de Configuração

Use este checklist para garantir que todas as variáveis estão configuradas:

### Desenvolvimento Local
- [ ] Arquivo `.env` criado
- [ ] `DATABASE_URL` configurado (PostgreSQL local ou Docker)
- [ ] `JWT_SECRET` gerado (32+ caracteres)
- [ ] `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` obtidos
- [ ] `GOOGLE_CALLBACK_URL` configurado para `localhost`
- [ ] `STRIPE_SECRET_KEY` e `STRIPE_PUBLISHABLE_KEY` (modo teste)
- [ ] `STRIPE_WEBHOOK_SECRET` configurado (Stripe CLI)
- [ ] `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION` configurados
- [ ] `OPENAI_API_KEY` obtido e configurado
- [ ] `NODE_ENV=development` e `PORT=3000`
- [ ] Variáveis `VITE_*` configuradas

### Produção (Render)
- [ ] Todas as variáveis adicionadas no Render Dashboard
- [ ] `DATABASE_URL` apontando para PostgreSQL do Render
- [ ] `JWT_SECRET` único e seguro
- [ ] `GOOGLE_CALLBACK_URL` configurado para domínio de produção
- [ ] Chaves Stripe em **modo live** (`sk_live_*` e `pk_live_*`)
- [ ] Webhook Stripe configurado para URL de produção
- [ ] Bucket S3 de produção configurado
- [ ] **`OPENAI_API_KEY` adicionado** ⚠️ **FALTANTE**
- [ ] `NODE_ENV=production` e `PORT=5050`
- [ ] Variáveis `VITE_*` apontando para URLs de produção

---

## Recursos Adicionais

### Documentação Oficial

- **Render**: https://render.com/docs/environment-variables
- **Vercel**: https://vercel.com/docs/concepts/projects/environment-variables
- **Stripe**: https://stripe.com/docs/keys
- **OpenAI**: https://platform.openai.com/docs/api-reference/authentication
- **AWS S3**: https://docs.aws.amazon.com/s3/
- **Google OAuth**: https://developers.google.com/identity/protocols/oauth2

### Ferramentas Úteis

- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Render CLI**: https://render.com/docs/cli
- **AWS CLI**: https://aws.amazon.com/cli/
- **dotenv**: https://github.com/motdotla/dotenv

### Suporte

- **GitHub Issues**: https://github.com/theneilagencia/ComplianceCore-Mining/issues
- **Documentação do Projeto**: https://github.com/theneilagencia/ComplianceCore-Mining/docs

---

**Última atualização**: 31 de outubro de 2025  
**Versão**: 1.0.0  
**Autor**: QIVO Mining Team

