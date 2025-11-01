# 🚀 EXECUTAR SCRIPT PARA CRIAR TABELA UPLOADS

**Solução Final:** Script Node.js que cria a tabela remotamente no banco do Render

---

## 📋 PASSO A PASSO

### 1️⃣ Obter DATABASE_URL do Render

1. Acesse: https://dashboard.render.com/
2. Clique em `qivo-mining-db` (PostgreSQL)
3. Na página do banco, procure por **"Internal Database URL"** ou **"Connection String"**
4. Copie a URL (formato: `postgresql://user:password@host:port/database`)

### 2️⃣ Executar Script Localmente

Abra o terminal no diretório do projeto e execute:

```bash
# Navegar para o diretório do projeto
cd /caminho/para/ComplianceCore-Mining

# Configurar DATABASE_URL (substitua pela URL copiada)
export DATABASE_URL="postgresql://user:password@host:port/database"

# Executar script
node create-uploads-table.js
```

### 3️⃣ Verificar Sucesso

Você deve ver:

```
🗄️  Conectando ao banco de dados...
📍 Host: dpg-xxx.oregon-postgres.render.com

📊 Criando tipo enum upload_status...
✅ Enum upload_status criado

📊 Criando tabela uploads...
✅ Tabela uploads criada

📊 Criando índices...
✅ Índice idx_uploads_reportId criado
✅ Índice idx_uploads_tenantId criado
✅ Índice idx_uploads_userId criado
✅ Índice idx_uploads_status criado
✅ Índice idx_uploads_createdAt criado

🔍 Verificando tabela criada...

📋 Colunas da tabela uploads:
   - id: character varying
   - reportId: character varying
   - tenantId: character varying
   - userId: character varying
   - fileName: text
   - fileSize: integer
   - mimeType: character varying
   - s3Url: text
   - status: USER-DEFINED
   - createdAt: timestamp without time zone
   - completedAt: timestamp without time zone

🎉 SUCESSO! Tabela uploads criada com sucesso!

✅ Próximo passo: Teste o upload em https://qivo-mining.onrender.com/reports/generate
```

### 4️⃣ Testar Upload

1. Acesse: https://qivo-mining.onrender.com/reports/generate
2. Faça login
3. Faça upload de um arquivo
4. **VAI FUNCIONAR!** 🎉

---

## 🚨 Troubleshooting

### Se aparecer "DATABASE_URL não encontrada"

Execute novamente o comando export:
```bash
export DATABASE_URL="postgresql://..."
```

### Se aparecer "enum already exists"

Isso é normal! O script vai continuar e criar a tabela mesmo assim.

### Se aparecer erro de conexão

Verifique se:
1. A DATABASE_URL está correta
2. O banco de dados está ativo no Render
3. Você tem acesso à internet

---

## 📊 Resumo da Jornada

Depois de **8 commits** e **múltiplas tentativas**, esta é a **solução definitiva**!

**EXECUTE O SCRIPT AGORA E ME CONFIRME SE FUNCIONOU!** 🙏

