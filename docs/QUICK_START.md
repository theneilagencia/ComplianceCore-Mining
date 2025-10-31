# Guia de Início Rápido - QIVO Mining Platform

## 🚀 Configuração em 5 Minutos

### 1. Clone o Repositório

```bash
git clone https://github.com/theneilagencia/ComplianceCore-Mining.git
cd ComplianceCore-Mining
```

### 2. Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas credenciais
nano .env  # ou use seu editor preferido
```

### 3. Instale as Dependências

```bash
# Instale as dependências do projeto
pnpm install
```

### 4. Configure o Banco de Dados

```bash
# Opção A: Use Docker (recomendado)
docker run -d \
  --name qivo-postgres \
  -e POSTGRES_USER=qivo_user \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=qivo_mining \
  -p 5432:5432 \
  postgres:17

# Opção B: Use PostgreSQL local
# Certifique-se de que o PostgreSQL está rodando e crie o banco:
createdb qivo_mining

# Execute as migrations
pnpm run db:push
```

### 5. Inicie o Servidor

```bash
# Modo desenvolvimento
pnpm run dev

# Ou modo produção
pnpm run build
pnpm run start
```

### 6. Acesse a Aplicação

Abra seu navegador em: **http://localhost:3000**

---

## 📋 Variáveis Obrigatórias Mínimas

Para rodar localmente, você precisa configurar no mínimo:

```bash
# .env
DATABASE_URL=postgresql://qivo_user:senha123@localhost:5432/qivo_mining
JWT_SECRET=seu-segredo-jwt-com-minimo-32-caracteres-aleatorios
NODE_ENV=development
PORT=3000
```

---

## 🔑 Obtendo Credenciais de APIs

### Google OAuth (Autenticação)

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Crie um novo projeto
3. Vá em **Credentials** > **Create Credentials** > **OAuth client ID**
4. Adicione: `http://localhost:3000/api/auth/google/callback`
5. Copie o **Client ID** e **Client Secret**

### Stripe (Pagamentos)

1. Acesse: https://dashboard.stripe.com/apikeys
2. Use as chaves de **Test mode** para desenvolvimento
3. Copie a **Secret key** e **Publishable key**

### OpenAI (IA)

1. Acesse: https://platform.openai.com/api-keys
2. Clique em **Create new secret key**
3. Copie a chave (ela só será exibida uma vez)

### AWS S3 (Armazenamento)

1. Acesse: https://console.aws.amazon.com/iam/
2. Crie um novo usuário com permissões S3
3. Gere **Access Key** e **Secret Key**
4. Crie um bucket em: https://s3.console.aws.amazon.com/

---

## 🐛 Problemas Comuns

### Erro: "Port already in use"

```bash
# Mate o processo na porta 3000
lsof -i :3000
kill -9 <PID>

# Ou use outra porta
PORT=3001 pnpm run dev
```

### Erro: "DATABASE_URL is not defined"

```bash
# Verifique se o arquivo .env existe
ls -la .env

# Se não existir, copie do exemplo
cp .env.example .env
```

### Erro: "Cannot connect to database"

```bash
# Verifique se o PostgreSQL está rodando
docker ps  # se usando Docker

# Ou
pg_isready  # se usando PostgreSQL local

# Verifique a URL de conexão no .env
grep DATABASE_URL .env
```

---

## 📚 Próximos Passos

1. **Leia a documentação completa**: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
2. **Configure todas as variáveis**: Veja a lista completa no `.env.example`
3. **Deploy em produção**: Siga o guia de deploy no Render
4. **Explore o código**: Navegue pela estrutura do projeto

---

## 🆘 Precisa de Ajuda?

- **Documentação completa**: [docs/ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- **Issues no GitHub**: https://github.com/theneilagencia/ComplianceCore-Mining/issues
- **Changelog**: [CHANGELOG.md](../CHANGELOG.md)

---

**Boa sorte! 🚀**

