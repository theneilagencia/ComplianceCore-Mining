# 🔍 Diagnóstico Completo do Problema de Upload

## Data: 3 de novembro de 2025

---

## ❌ Problemas Identificados

### 1. **Upload não funciona (erro no insert)**
- **Sintoma:** `Failed query insert into 'uploads'`
- **Root Cause:** O erro mostra dados confusos no log
- **Status:** ⚠️ INVESTIGANDO

### 2. **Render configurado com Python**
- **Sintoma:** Build command usa `pip install`
- **Root Cause:** Dashboard Render configurado errado
- **Status:** ⚠️ PENDENTE CORREÇÃO

---

## 🔬 Análise Técnica

### Problema 1: Upload Insert

**Erro visível:**
```
Failed query insert into 'uploads' [...]
userId: "upl_73220613-3fe4-4d71-860d-d7b-selfsigned"
fileSize: 9.39
```

**Análise:**

✅ **O que está CORRETO:**
- UUID está sendo gerado: `upl_73220613-3fe4-4d71-860d-`
- Schema do banco está correto (drizzle/schema.ts)
- Frontend envia fileSize em bytes: `file.size` (9841143)
- Validação de ctx.user existe (linha 32 de uploadsV2.ts)

❌ **O que está ERRADO:**
- Log mostra `userId: "upl_[...]"` - deveria ser ID do usuário
- Log mostra `fileSize: 9.39` - deveria ser 9841143
- Sufixo `"d7b-selfsigned"` indica problema SSL/auth

**Hipóteses:**

1. **Problema de Autenticação:**
   ```typescript
   // uploadsV2.ts linha 32
   if (!ctx.user || !ctx.user.id || !ctx.user.tenantId) {
     throw new Error(`Invalid user context`);
   }
   ```
   - Possível que `ctx.user.id` esteja undefined
   - Ou esteja recebendo valor errado

2. **Problema de Serialização:**
   - O log pode estar mostrando dados serializados de forma confusa
   - Não necessariamente reflete o que foi inserido no banco

3. **Problema de Certificado SSL:**
   - `"d7b-selfsigned"` sugere certificado auto-assinado
   - Pode estar causando falha na autenticação

### Problema 2: Render Build Command

**Estado Atual no Dashboard:**
```bash
Build Command: pip install -r requirements.txt flask db upgrade || true
```

**Estado Correto (render.yaml):**
```yaml
buildCommand: |
  echo "🚀 QIVO Mining - Node.js Build v2.0"
  node --version
  npm --version
  
  if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm@10.4.1
  fi
  pnpm --version
  
  pnpm install --frozen-lockfile --prefer-offline
  bash build.sh
  
  if [ "$NODE_ENV" = "production" ]; then
    pnpm drizzle-kit push || echo "⚠️ Migrations skipped"
  fi
```

**Por que dá erro 127:**
- `pip` não existe em ambiente Node.js
- Exit code 127 = "command not found"

---

## ✅ Plano de Correção

### Etapa 1: Verificar Autenticação (Backend)

**Arquivo:** `server/modules/technical-reports/routers/uploadsV2.ts`

**Adicionar log detalhado:**
```typescript
if (!ctx.user || !ctx.user.id || !ctx.user.tenantId) {
  console.error('❌ Invalid user context:', {
    hasUser: !!ctx.user,
    userId: ctx.user?.id,
    tenantId: ctx.user?.tenantId,
    userObject: JSON.stringify(ctx.user, null, 2)
  });
  throw new Error(`Invalid user context`);
}

console.log('✅ Upload context:', {
  userId: ctx.user.id,
  tenantId: ctx.user.tenantId,
  fileName: input.fileName,
  fileSize: input.fileSize,
  mimeType: input.fileType
});
```

### Etapa 2: Corrigir Render Dashboard

**Manual:**
1. Ir em: https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0/settings
2. **Build Command:** Copiar do render.yaml (linhas 34-50)
3. **Start Command:** `node dist/index.js`
4. Salvar e fazer novo deploy

**Automático (via render.yaml):**
```bash
# O render.yaml já está correto!
# Basta fazer commit e push que o Render deve sincronizar
git add render.yaml
git commit -m "fix: ensure render uses Node.js build commands"
git push origin main
```

### Etapa 3: Testar Upload com Logs

**Procedimento:**
1. Deploy com logs adicionados
2. Tentar upload na UI
3. Verificar logs do Render:
   ```bash
   # Ver logs em tempo real
   render logs qivo-mining --tail
   ```
4. Analisar output dos console.log

### Etapa 4: Verificar Certificado SSL

**Se problema persistir:**
```typescript
// Adicionar em uploadsV2.ts
console.log('🔐 SSL/TLS Context:', {
  protocol: ctx.req.protocol,
  secure: ctx.req.secure,
  hostname: ctx.req.hostname,
  headers: {
    'x-forwarded-proto': ctx.req.headers['x-forwarded-proto'],
    'x-forwarded-host': ctx.req.headers['x-forwarded-host'],
  }
});
```

---

## 🎯 Resultado Esperado

### Após correções:

✅ **Upload funcionando:**
- userId correto (ID do usuário autenticado)
- fileSize correto (em bytes)
- Insert bem-sucedido
- Parsing inicia automaticamente

✅ **Render build OK:**
- Build command Node.js executado
- pnpm install funcionando
- bash build.sh compilando
- Deploy sem exit code 127

---

## 📊 Métricas de Sucesso

- [ ] Upload completa sem erro
- [ ] Logs mostram userId e tenantId corretos
- [ ] fileSize em bytes no banco
- [ ] Render build passa (exit code 0)
- [ ] Start command inicia servidor
- [ ] Health check retorna 200

---

## 🚀 Próximos Passos

1. ✅ Adicionar logs detalhados no uploadsV2.ts
2. ✅ Corrigir build command no Render dashboard
3. ✅ Fazer deploy e testar
4. ✅ Analisar logs
5. ✅ Ajustar conforme necessário

---

**Status:** 🟡 AGUARDANDO IMPLEMENTAÇÃO
