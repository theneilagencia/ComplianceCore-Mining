# Guia de Configuração do Banco de Dados no Render

**Problema Identificado:** Incompatibilidade entre SQLite (local) e PostgreSQL (produção)

---

## 🔍 Causa Raiz

O erro mostra:
```
Failed query: insert into "uploads" (...) values ($1, $2, $3, ...)
```

Isso indica que o código está tentando usar **PostgreSQL**, mas:
1. A variável `DATABASE_URL` pode não estar configurada no Render
2. O banco de dados pode não estar criado
3. As migrations podem não ter sido executadas

---

## ✅ Solução: Configurar PostgreSQL no Render

### Opção 1: Usar PostgreSQL do Render (Recomendado)

#### Passo 1: Criar Banco de Dados PostgreSQL

1. Acesse: https://dashboard.render.com/
2. Clique em **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `qivo-mining-db`
   - **Database:** `qivo_mining`
   - **User:** `qivo_admin`
   - **Region:** `Oregon (US West)` (mesma do web service)
   - **Instance Type:** `Free` (para teste)
4. Clique em **"Create Database"**
5. Aguarde a criação (1-2 minutos)

#### Passo 2: Obter DATABASE_URL

1. Após criação, clique no banco de dados
2. Procure por **"Internal Database URL"** ou **"External Database URL"**
3. Copie a URL (formato: `postgresql://user:password@host:port/database`)

#### Passo 3: Configurar no Web Service

1. Acesse: https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0/env
2. Clique em **"Add Environment Variable"**
3. Configure:
   - **Key:** `DATABASE_URL`
   - **Value:** (cole a URL copiada)
4. Clique em **"Save Changes"**
5. O Render vai fazer redeploy automaticamente

#### Passo 4: Executar Migrations

Após o deploy, execute as migrations para criar as tabelas:

```bash
# Via Render Shell
cd /opt/render/project/src
pnpm drizzle-kit push
```

Ou adicione ao `build.sh`:
```bash
echo "🗄️ Running database migrations..."
pnpm drizzle-kit push --force
```

---

### Opção 2: Usar Neon (PostgreSQL Serverless - Grátis)

#### Passo 1: Criar Conta no Neon

1. Acesse: https://neon.tech/
2. Clique em **"Sign Up"** (pode usar GitHub)
3. Crie um novo projeto:
   - **Project name:** `qivo-mining`
   - **Region:** `US East (Ohio)` ou `US West (Oregon)`
4. Copie a **Connection String** (formato: `postgresql://...`)

#### Passo 2: Configurar no Render

1. Acesse: https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0/env
2. Adicione:
   - **Key:** `DATABASE_URL`
   - **Value:** (cole a connection string do Neon)
3. Salve e aguarde redeploy

#### Passo 3: Executar Migrations

Mesmo processo da Opção 1.

---

### Opção 3: Usar Turso (SQLite na Nuvem - Grátis)

Se preferir continuar com SQLite:

#### Passo 1: Criar Conta no Turso

1. Acesse: https://turso.tech/
2. Crie conta e instale CLI:
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

3. Login e crie database:
```bash
turso auth login
turso db create qivo-mining
turso db show qivo-mining
```

4. Copie a **Database URL**

#### Passo 2: Atualizar Código para Turso

Modificar `server/db.ts`:
```typescript
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

export async function getDb() {
  const dbUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  
  if (!_db && dbUrl) {
    const client = createClient({
      url: dbUrl,
      authToken: authToken,
    });
    _db = drizzle(client);
  }
  return _db;
}
```

#### Passo 3: Configurar no Render

Adicionar variáveis:
- `TURSO_DATABASE_URL`: URL do banco
- `TURSO_AUTH_TOKEN`: Token de autenticação

---

## 🎯 Recomendação

**Use Opção 1 (PostgreSQL do Render)** porque:
- ✅ Já está configurado para PostgreSQL no código
- ✅ Não precisa modificar código
- ✅ Mesma região do web service (baixa latência)
- ✅ Fácil de configurar

---

## 📝 Checklist

Após configurar:

- [ ] DATABASE_URL configurada no Render
- [ ] Banco de dados criado
- [ ] Redeploy realizado
- [ ] Migrations executadas
- [ ] Teste de upload funcionando

---

## 🚨 Troubleshooting

### Erro: "Failed to connect to database"
- Verifique se DATABASE_URL está correta
- Verifique se o banco está na mesma região
- Verifique se SSL está habilitado (`ssl: 'require'`)

### Erro: "relation 'uploads' does not exist"
- Execute as migrations: `pnpm drizzle-kit push`
- Verifique se as tabelas foram criadas

### Erro: "password authentication failed"
- Verifique usuário e senha na DATABASE_URL
- Regenere a senha do banco se necessário

---

**Próximo Passo:** Configure o DATABASE_URL no Render e teste novamente!

