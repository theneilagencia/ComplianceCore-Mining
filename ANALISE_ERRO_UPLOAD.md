# Análise do Erro de Upload - QIVO Mining

**Data:** 01/11/2025 10:04 AM  
**Ambiente:** Produção (https://qivo-mining.onrender.com)  
**Página:** /reports/generate

---

## 📸 Erro Capturado

**Mensagem de Erro Principal:**
```
Erro no upload
Failed to try insert into 'uploads': LibsqlError: SQLITE_CONSTRAINT: UNIQUE constraint failed: uploads.id
```

**Contexto:**
- Usuário tentou fazer upload de arquivo: `JORC-Report_ALG_Feb2021_Final.pdf` (9.39 MB)
- Modal de upload estava aberto
- Arquivo foi selecionado com sucesso
- Erro ocorreu ao tentar salvar no banco de dados

---

## 🔍 Análise do Erro

### Tipo de Erro
`SQLITE_CONSTRAINT: UNIQUE constraint failed: uploads.id`

### Significado
O erro indica que está tentando inserir um registro na tabela `uploads` com um `id` que já existe no banco de dados, violando a constraint UNIQUE.

### Possíveis Causas

1. **ID não está sendo gerado automaticamente**
   - O campo `id` pode não estar configurado como auto-increment
   - O código pode estar tentando inserir um ID fixo ou duplicado

2. **Problema no schema do Drizzle ORM**
   - A definição da tabela `uploads` pode estar incorreta
   - Falta de configuração de `primaryKey` ou `autoIncrement`

3. **Dados residuais no banco**
   - Pode haver registros antigos causando conflito
   - O banco pode precisar ser resetado ou migrado

4. **Código de inserção incorreto**
   - O código pode estar passando um ID manualmente
   - Falta de geração de UUID ou auto-increment

---

## 🎯 Próximos Passos

1. Verificar schema da tabela `uploads` no Drizzle ORM
2. Verificar código de inserção no backend
3. Verificar se há migrations pendentes
4. Corrigir definição do campo `id`
5. Testar localmente
6. Fazer deploy da correção

---

## 📝 Stack Trace Completo

```
Failed to try insert into 'uploads': LibsqlError: 
SQLITE_CONSTRAINT: UNIQUE constraint failed: uploads.id
at mapResultError (/opt/render/project/src/dist/index.js:735:39)
at executeStmt (/opt/render/project/src/dist/index.js:769:23)
at LibsqlSession.prepareQuery (/opt/render/project/src/dist/index.js:1204:16)
at LibsqlSession.all (/opt/render/project/src/dist/index.js:1190:24)
at /opt/render/project/src/dist/index.js:1780:60
at Array.map (<anonymous>)
at LibsqlDialect.sqlToQuery (/opt/render/project/src/dist/index.js:1780:34)
at PgInsertBase.toSQL (/opt/render/project/src/dist/index.js:3908:36)
at PgInsertBase.execute (/opt/render/project/src/dist/index.js:3908:36)
at file:///opt/render/project/src/dist/index.js:6941:143
at newFn (file:///opt/render/project/src/dist/index.js:735:39)
at uploading
```

---

## 🔧 Arquivos a Verificar

1. `db/schema.ts` - Definição da tabela uploads
2. `server/routes.ts` - Endpoint de upload
3. `server/storage.ts` - Lógica de armazenamento
4. `drizzle.config.ts` - Configuração do Drizzle

---

**Status:** Em análise  
**Prioridade:** Alta  
**Impacto:** Funcionalidade crítica não está funcionando

