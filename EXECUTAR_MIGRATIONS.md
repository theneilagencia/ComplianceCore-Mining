# 🗄️ EXECUTAR MIGRATIONS MANUALMENTE NO RENDER

**Problema:** As migrations não foram executadas automaticamente durante o build.  
**Solução:** Executar manualmente via Shell do Render.

---

## 📋 Passo a Passo

### 1. Acessar Shell do Render

Você já está no Shell! A tela mostra:
```
render@srv-d3sk5h1r0fns738ibdg0-7794476518-ckm9p:~/project/src$
```

### 2. Executar Migrations

Digite o seguinte comando e pressione Enter:

```bash
pnpm drizzle-kit push
```

### 3. Aguardar Execução

O comando vai:
1. Conectar no banco de dados PostgreSQL
2. Ler o schema em `drizzle/schema.ts`
3. Criar todas as tabelas necessárias
4. Exibir mensagem de sucesso

**Tempo estimado:** 10-30 segundos

### 4. Verificar Sucesso

Você deve ver algo como:
```
✓ Pushing schema changes to database
✓ Schema changes applied successfully
```

---

## ✅ Após Executar

1. Feche o Shell
2. Teste o upload novamente em: https://qivo-mining.onrender.com/reports/generate
3. **DEVE FUNCIONAR!** 🎉

---

## 🚨 Se houver erro

### Erro: "command not found: pnpm"

**Solução:** Use o caminho completo:
```bash
/opt/render/project/src/node_modules/.bin/drizzle-kit push
```

### Erro: "DATABASE_URL not found"

**Solução:** Verifique se DATABASE_URL está configurada:
```bash
echo $DATABASE_URL
```

Se estiver vazia, configure em:
https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0/env

### Erro: "Connection refused"

**Solução:** Verifique se o banco de dados está rodando:
https://dashboard.render.com/

---

## 📝 Comando Alternativo

Se `pnpm drizzle-kit push` não funcionar, tente:

```bash
cd /opt/render/project/src
pnpm install
pnpm drizzle-kit push
```

---

## 🎯 O que as Migrations Fazem

Criam as seguintes tabelas:
- ✅ `users` - Usuários
- ✅ `tenants` - Organizações
- ✅ `uploads` - **Uploads de arquivos** (resolve o erro!)
- ✅ `reports` - Relatórios técnicos
- ✅ `audits` - Auditorias
- ✅ `certifications` - Certificações
- ✅ `exports` - Exportações
- ✅ `reviewLogs` - Logs de revisão
- E outras...

---

**EXECUTE O COMANDO AGORA NO SHELL!** ⌨️

Depois me confirme se funcionou!

