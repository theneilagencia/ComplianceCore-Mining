# 🚀 Guia de Deploy - QIVO Mining

**Última atualização:** 04/11/2025

---

## 📋 Visão Geral

O projeto QIVO Mining usa **Render** para deploy automático. Cada push para a branch `main` triggera um deploy automaticamente.

---

## ⚙️ Configuração

### Render

**Arquivo:** `render.yaml`

```yaml
services:
  - type: web
    name: qivo-mining
    runtime: node
    branch: main
    autoDeploy: true  # ✅ CRÍTICO: Deve estar habilitado!
```

**⚠️ IMPORTANTE:** Se `autoDeploy: false`, os deploys NÃO serão aplicados!

### GitHub Actions

**Arquivo:** `.github/workflows/deploy.yml`

- Executa build em cada push
- Valida que o código compila
- Notifica sobre o deploy

---

## 🔄 Processo de Deploy

### Automático (Recomendado)

1. Fazer alterações no código
2. Commit e push para `main`:
   ```bash
   git add .
   git commit -m "feat: sua alteração"
   git push origin main
   ```
3. GitHub Actions executa build
4. Render detecta o push e inicia deploy
5. Deploy completo em ~7-10 minutos

### Manual (Se Necessário)

1. Acessar [Render Dashboard](https://dashboard.render.com)
2. Selecionar serviço `qivo-mining`
3. Clicar em "Manual Deploy"
4. Selecionar branch `main`
5. Confirmar deploy

---

## 🧪 Validação de Deploy

### 1. Verificar se Deploy Foi Aplicado

**Método 1: View Source**
```
1. Acessar: view-source:https://qivo-mining.onrender.com
2. Procurar por hash do arquivo (ex: AuditKRCI.9_8vMHEy.js)
3. Se encontrar = Deploy OK
```

**Método 2: Console do Navegador**
```javascript
// Procurar por logs específicos
[AuditKRCI v3.0] Component mounted
```

**Método 3: Network Tab**
```
1. Abrir DevTools (F12)
2. Network tab
3. Recarregar página
4. Verificar hash dos arquivos .js carregados
```

### 2. Limpar Cache

**Chrome/Edge:**
```
1. DevTools (F12)
2. Application > Clear storage
3. Clear site data
4. Recarregar (Ctrl+Shift+R)
```

**Safari:**
```
1. Desenvolver > Limpar Caches
2. Recarregar página
```

**Modo Anônimo:**
```
Sempre funciona sem cache!
```

---

## 🐛 Troubleshooting

### Deploy não foi aplicado

**Sintomas:**
- Interface antiga ainda aparece
- Alterações não visíveis em produção
- Logs antigos no console

**Causas possíveis:**
1. ❌ `autoDeploy: false` no `render.yaml`
2. ❌ Build falhou no Render
3. ❌ Cache do navegador/CDN
4. ❌ Service Worker servindo versão antiga

**Soluções:**
```bash
# 1. Verificar autoDeploy
cat render.yaml | grep autoDeploy
# Deve mostrar: autoDeploy: true

# 2. Forçar novo deploy
git commit --allow-empty -m "chore: force redeploy"
git push origin main

# 3. Limpar cache (ver seção acima)
```

### Build falha no Render

**Verificar logs:**
1. Acessar Render Dashboard
2. Selecionar serviço
3. Aba "Logs"
4. Procurar por erros

**Erros comuns:**
- Dependências faltando → `pnpm install`
- TypeScript errors → `pnpm run check`
- Build timeout → Otimizar build

### Service Worker cache

**Desabilitar temporariamente:**
```javascript
// No console do navegador
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});
```

---

## 📊 Monitoramento

### Logs em Tempo Real

**Render Dashboard:**
```
1. Acessar dashboard
2. Selecionar serviço
3. Aba "Logs"
4. Ver logs em tempo real
```

### Status do Serviço

**Render Status:**
- 🟢 Verde = Rodando
- 🟡 Amarelo = Deployando
- 🔴 Vermelho = Erro

**Health Check:**
```bash
curl https://qivo-mining.onrender.com/health
```

---

## 🔐 Variáveis de Ambiente

**Configuradas no Render Dashboard:**

Essenciais:
- `DATABASE_URL`
- `SESSION_SECRET`
- `OPENAI_API_KEY`

Opcionais:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`
- etc.

**⚠️ NUNCA commitar secrets no código!**

---

## 📝 Checklist de Deploy

Antes de fazer push:
- [ ] Código compila sem erros (`pnpm run check`)
- [ ] Build funciona localmente (`pnpm run build`)
- [ ] Testes passam (se houver)
- [ ] Commit message descritivo
- [ ] `autoDeploy: true` no `render.yaml`

Após push:
- [ ] GitHub Actions passou
- [ ] Render iniciou deploy
- [ ] Deploy concluído com sucesso
- [ ] Validar em produção
- [ ] Limpar cache se necessário

---

## 🆘 Suporte

**Problemas de deploy?**

1. Verificar logs do Render
2. Verificar GitHub Actions
3. Testar build localmente
4. Verificar `render.yaml`
5. Forçar deploy manual se necessário

**Contato:**
- Dashboard Render: https://dashboard.render.com
- GitHub Issues: [repo]/issues
- Documentação Render: https://render.com/docs

---

## 📚 Referências

- [Render Documentation](https://render.com/docs)
- [Render YAML Reference](https://render.com/docs/yaml-spec)
- [GitHub Actions](https://docs.github.com/actions)
- [pnpm](https://pnpm.io/)
- [Vite](https://vitejs.dev/)

---

**Última correção crítica:** 04/11/2025  
**Problema:** `autoDeploy: false` estava impedindo todos os deploys  
**Solução:** Habilitado `autoDeploy: true` no `render.yaml`
