# Passo a Passo: Configurar DATABASE_URL no Render

## 🎯 Objetivo

Conectar o web service `qivo-mining` ao banco de dados PostgreSQL `qivo-mining-db` que já existe no Render.

---

## 📋 Passo 1: Obter a DATABASE_URL

### 1.1 Acessar o Banco de Dados

1. Acesse: https://dashboard.render.com/
2. Na lista de serviços, procure por `qivo-mining-db` (PostgreSQL 17)
3. Clique no nome `qivo-mining-db`

### 1.2 Copiar a Internal Database URL

1. Na página do banco de dados, role para baixo
2. Procure pela seção **"Connections"** ou **"Info"**
3. Encontre o campo **"Internal Database URL"**
4. Clique no ícone de **copiar** (📋) ao lado da URL

A URL terá este formato:
```
postgresql://qivo_mining_user:SENHA@dpg-XXXXX-a.oregon-postgres.render.com/qivo_mining_db
```

**IMPORTANTE:** Use a **Internal Database URL**, não a External!

---

## 📋 Passo 2: Configurar no Web Service

### 2.1 Acessar Environment Variables

1. Acesse: https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0
2. No menu lateral, clique em **"Environment"**
3. Role até encontrar a lista de variáveis

### 2.2 Adicionar DATABASE_URL

1. Clique no botão **"Add Environment Variable"**
2. Preencha:
   - **Key:** `DATABASE_URL`
   - **Value:** (cole a URL copiada no Passo 1.2)
3. Clique em **"Save Changes"**

### 2.3 Aguardar Redeploy

1. O Render vai iniciar um redeploy automaticamente
2. Aguarde 2-3 minutos
3. Verifique se o deploy foi bem-sucedido

---

## 📋 Passo 3: Executar Migrations

Agora precisamos criar as tabelas no banco de dados.

### Opção A: Via Render Shell (Recomendado)

1. Acesse: https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0/shell
2. No terminal, execute:
```bash
cd /opt/render/project/src
pnpm drizzle-kit push
```

### Opção B: Adicionar ao build.sh (Automático)

Vou criar um script que executa as migrations automaticamente durante o build.

---

## ✅ Verificação

Após configurar, teste:

1. Acesse: https://qivo-mining.onrender.com/reports/generate
2. Faça login
3. Tente fazer upload de um arquivo
4. Verifique se funciona sem erros

---

## 🚨 Troubleshooting

### Erro: "Failed to connect to database"

**Solução:**
1. Verifique se a DATABASE_URL está correta
2. Verifique se usou a **Internal** URL, não a External
3. Verifique se o banco está na mesma região (Oregon)

### Erro: "relation 'uploads' does not exist"

**Solução:**
1. Execute as migrations (Passo 3)
2. Verifique se o comando foi bem-sucedido

### Erro: "SSL connection required"

**Solução:**
O código já está configurado com `ssl: 'require'`, não precisa fazer nada.

---

## 📞 Próximos Passos

Após configurar a DATABASE_URL:

1. ✅ Me confirme que configurou
2. ✅ Vou criar o script de migration
3. ✅ Vou fazer deploy
4. ✅ Vamos testar o upload

---

**Tempo estimado:** 5-10 minutos  
**Dificuldade:** Fácil  
**Custo:** Grátis (usando plano free do Render)

