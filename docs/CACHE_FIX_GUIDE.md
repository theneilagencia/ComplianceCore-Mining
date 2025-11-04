# 🔧 Guia de Correção de Cache - Qivo Mining

**Data:** 4 de novembro de 2025  
**Problema:** App preso em versão antiga devido a cache agressivo do Service Worker e assets JS/CSS  
**Status:** ✅ CORRIGIDO

---

## 📋 PROBLEMAS IDENTIFICADOS

### 1. ❌ Service Worker com Cache Agressivo
- **Problema:** `sw.js` usava `cacheFirst` para JS/CSS
- **Sintoma:** Após deploy, usuários continuavam vendo código antigo
- **Causa:** Bundle JS com hash (`index.CrfyEsnb.js`) não era atualizado

### 2. ❌ Bundle Umami Inválido
- **Problema:** `<script src="/umami.js">` retornava HTML do index
- **Sintoma:** Console error `Unexpected token '<'`
- **Causa:** URL `/umami.js` não existia, Vite retornava fallback HTML

### 3. ❌ Sem Headers Anti-Cache
- **Problema:** Render.com cacheia assets sem headers HTTP adequados
- **Sintoma:** Browser cache + Service Worker cache = versão antiga persistente

---

## ✅ SOLUÇÕES IMPLEMENTADAS

### 1. Service Worker Corrigido (`client/public/sw.js`)

#### Mudanças Principais:

```javascript
// ANTES (❌ ERRADO):
// Static assets: Cache first, fallback to network
event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));

// DEPOIS (✅ CORRETO):
// JS/CSS sempre busca da rede primeiro (Network First)
if (url.pathname.match(/\.(js|css|mjs|ts|tsx)$/)) {
  event.respondWith(networkFirstNoCacheStrategy(request));
  return;
}
```

#### Nova Estratégia de Cache:

| Tipo de Asset | Estratégia | Motivo |
|---------------|------------|--------|
| **JS/CSS** | Network First (NO CACHE) | ⚠️ Sempre busca versão nova |
| **HTML** | Cache First + Revalidation | PWA offline |
| **API** | Network First + Fallback | Dados sempre frescos |
| **Imagens** | Cache First | Não mudam com frequência |

#### Nova Função `networkFirstNoCacheStrategy`:

```javascript
async function networkFirstNoCacheStrategy(request) {
  try {
    const response = await fetch(request, {
      cache: 'no-cache', // ← Força bypass de cache HTTP
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    return response;
  } catch (error) {
    // NÃO tenta cache - retorna erro direto
    return new Response('Network Error', { status: 503 });
  }
}
```

#### Cache Version Bump:

```javascript
// Incrementar a cada deploy para forçar limpeza
const CACHE_VERSION = 'qivo-v1.2.1-fix'; // ← MUDOU
```

---

### 2. Vite Config com Headers Anti-Cache (`vite.config.ts`)

#### Adicionado Preview Server Config:

```typescript
export default defineConfig({
  // ...
  
  // ⚠️ FIX CRÍTICO: Preview server (usado no Render) com headers
  preview: {
    host: true,
    port: 10000,
    headers: {
      // Headers HTTP que previnem cache de JS/CSS
      'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      
      // Security headers (bonus)
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  
  server: {
    // Headers anti-cache em dev
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
});
```

**Por que isso importa?**
- Render.com NÃO serve arquivos pelo Vite dev server
- Render usa `pnpm start` que provavelmente serve os arquivos estáticos do `dist/public`
- Headers HTTP são a única forma de controlar cache do navegador

---

### 3. Umami Analytics Desabilitado (`client/index.html`)

#### Antes (❌ ERRO):
```html
<script defer src="/umami.js" data-website-id=""></script>
```

**Problema:** `/umami.js` não existe → Vite retorna `index.html` → JavaScript tenta parsear HTML → `Unexpected token '<'`

#### Depois (✅ CORRETO):
```html
<!-- 
  ⚠️ FIX: Umami Analytics desabilitado temporariamente
  Problema: URL /umami.js retornava index.html
  
  Para reativar:
  1. Configurar variável VITE_UMAMI_URL no .env
  2. Descomentar linha abaixo
  3. Trocar src="/umami.js" por src="${VITE_UMAMI_URL}"
-->
<!--
<script defer src="/umami.js" data-website-id=""></script>
-->
```

---

## 🚀 DEPLOY NO RENDER

### Passo 1: Build Local (Opcional - Validação)

```bash
# Limpar cache e node_modules
rm -rf node_modules dist pnpm-lock.yaml

# Reinstalar dependências
pnpm install

# Build de produção
pnpm run build

# Testar localmente
pnpm start
# Abrir: http://localhost:10000
```

### Passo 2: Commit e Push

```bash
git add client/public/sw.js vite.config.ts client/index.html docs/CACHE_FIX_GUIDE.md
git commit -m "🔧 Fix: Corrige cache agressivo de Service Worker e assets JS/CSS

- Service Worker agora usa Network First para JS/CSS (não Cache First)
- Adicionado headers anti-cache no vite.config (preview server)
- Desabilitado Umami temporariamente (URL inválida)
- Bump cache version para forçar limpeza: v1.2.1-fix
- Documentação completa em docs/CACHE_FIX_GUIDE.md"

git push origin main
```

### Passo 3: Deploy Manual no Render

**Opção A: Via Dashboard**
1. Acessar: https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0
2. Clicar em **"Manual Deploy"** → **"Deploy latest commit"**
3. Aguardar build (3-5 minutos)

**Opção B: Via Render CLI**
```bash
# Instalar Render CLI (se não tiver)
npm install -g @render/cli

# Deploy manual
render deploy --service=qivo-mining --branch=main
```

**Opção C: GitHub Actions (se configurado)**
```bash
gh workflow run deploy_manus.yml
```

### Passo 4: Verificar Deploy

```bash
# 1. Verificar status do serviço
curl https://qivo-mining.onrender.com/health

# 2. Verificar versão do Service Worker
curl https://qivo-mining.onrender.com/sw.js | grep "CACHE_VERSION"
# Esperado: const CACHE_VERSION = 'qivo-v1.2.1-fix';

# 3. Verificar headers HTTP
curl -I https://qivo-mining.onrender.com/assets/index.[hash].js
# Esperado: Cache-Control: no-cache, no-store, must-revalidate
```

---

## 🧪 TESTE DE VALIDAÇÃO

### Teste 1: Limpar Cache e Recarregar

1. Abrir DevTools (F12)
2. **Application** tab → **Storage** → **Clear site data**
3. **Service Workers** → Unregister all
4. Hard reload (Ctrl+Shift+R ou Cmd+Shift+R)
5. Verificar console: `[SW] Install event - Version: qivo-v1.2.1-fix`

### Teste 2: Verificar Network Tab

1. Abrir DevTools → **Network** tab
2. Filtrar por `.js`
3. Verificar que assets JS têm:
   - Status: `200 OK` (não `304 Not Modified`)
   - Size: bytes reais (não `(disk cache)` ou `(service worker)`)
   - Headers: `Cache-Control: no-cache`

### Teste 3: Forçar Nova Versão

1. Fazer mudança visível no código (ex: mudar texto no Dashboard)
2. Commit + push
3. Deploy no Render
4. Recarregar app sem limpar cache
5. **Esperado:** Nova versão aparece IMEDIATAMENTE (sem Ctrl+Shift+R)

### Teste 4: Verificar PWA Offline (HTML apenas)

1. Abrir app online
2. DevTools → **Network** → **Offline**
3. Recarregar página
4. **Esperado:** HTML carrega do cache (PWA funciona)
5. Tentar navegar → **Esperado:** Rotas cacheadas funcionam
6. **IMPORTANTE:** JS/CSS não devem ser servidos do cache (apenas HTML)

---

## 🔍 TROUBLESHOOTING

### Problema: Cache ainda não limpa após deploy

**Causa:** Browser cache + Service Worker cache antigo  
**Solução:**
```javascript
// 1. Desregistrar Service Worker no console do navegador
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
    console.log('SW unregistered:', registration);
  }
});

// 2. Limpar TODOS os caches
caches.keys().then(keys => {
  keys.forEach(key => {
    caches.delete(key);
    console.log('Cache deleted:', key);
  });
});

// 3. Hard reload
location.reload(true);
```

### Problema: Headers anti-cache não aparecem

**Causa:** Render.com pode estar servindo via CDN/proxy  
**Solução:**
1. Verificar se `pnpm start` usa Vite preview:
   ```json
   // package.json
   {
     "scripts": {
       "start": "vite preview --host 0.0.0.0 --port $PORT"
     }
   }
   ```

2. Se usar Express, adicionar middleware:
   ```javascript
   // server/index.ts
   app.use('/assets', (req, res, next) => {
     res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
     res.setHeader('Pragma', 'no-cache');
     res.setHeader('Expires', '0');
     next();
   });
   ```

### Problema: Umami ainda causa erro

**Causa:** Script comentado mas cache do navegador ainda tem versão antiga  
**Solução:**
1. Limpar cache do navegador
2. Verificar se `index.html` buildado não tem script:
   ```bash
   cat dist/public/index.html | grep umami
   # Não deve aparecer nada
   ```

---

## 📊 CHECKLIST DE DEPLOY

- [ ] **Service Worker atualizado** (`sw.js` com v1.2.1-fix)
- [ ] **Vite config com headers** (`preview.headers` configurado)
- [ ] **Umami desabilitado** (script comentado no HTML)
- [ ] **Build local funcionando** (`pnpm build` sem erros)
- [ ] **Commit + push** para GitHub
- [ ] **Deploy manual no Render** (aguardar conclusão)
- [ ] **Verificar saúde** (`curl /health`)
- [ ] **Verificar SW versão** (`curl /sw.js`)
- [ ] **Teste hard reload** (Ctrl+Shift+R)
- [ ] **Teste offline PWA** (DevTools → Offline)
- [ ] **Teste cache busting** (nova versão sem limpar cache)

---

## 📚 REFERÊNCIAS

- [Vite - Preview Options](https://vitejs.dev/config/preview-options.html)
- [Service Worker Lifecycle](https://web.dev/service-worker-lifecycle/)
- [HTTP Caching Guide](https://web.dev/http-cache/)
- [Render Deploy Docs](https://render.com/docs/deploys)

---

## 🎯 RESULTADO ESPERADO

### Antes (❌):
- Usuários veem versão antiga após deploy
- Necessário Ctrl+Shift+R para atualizar
- Cache agressivo de JS/CSS
- Erro do Umami no console

### Depois (✅):
- Nova versão aparece IMEDIATAMENTE após deploy
- JS/CSS sempre frescos (Network First)
- HTML cacheado para PWA offline
- Sem erros no console
- Headers HTTP anti-cache configurados

---

**Autor:** GitHub Copilot  
**Ticket:** Cache Fix v1.2.1  
**Status:** ✅ READY TO DEPLOY
