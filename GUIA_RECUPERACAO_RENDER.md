# 🚀 GUIA PASSO-A-PASSO: Recuperação do Sistema no Render

**Status Atual**: 🔴 **Sistema OFFLINE** - Aguardando configuração manual no Render Dashboard  
**Tempo Estimado**: ⏱️ **5-10 minutos**  
**Complexidade**: ⭐ **BAIXA** (apenas configuração, sem código)

---

## 📋 PRÉ-REQUISITOS

✅ **Já Completos**:
- [x] Build local testado e funcionando (3.33s, 448.3kb)
- [x] Código commitado no GitHub (commit 0c98747)
- [x] render.yaml configurado corretamente
- [x] Dependências validadas (pnpm 10.4.1)

⏸️ **Aguardando**:
- [ ] Configuração manual no Render Dashboard

---

## 🎯 PASSO 1: ACESSAR O RENDER DASHBOARD

### 1.1 Abrir o Navegador
- Abra seu navegador preferido (Chrome, Firefox, Safari)
- Acesse: **https://dashboard.render.com**

### 1.2 Fazer Login
- Use suas credenciais do Render
- Se tiver 2FA habilitado, confirme o código

### 1.3 Navegar para o Serviço
- No dashboard, localize: **"qivo-mining"**
- Clique no card do serviço
- Ou acesse diretamente: **https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0**

### 1.4 Ir para Settings
- No menu lateral esquerdo, clique em **"Settings"**
- Ou acesse: **https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0/settings**

---

## ⚙️ PASSO 2: CONFIGURAR BUILD COMMAND

### 2.1 Localizar o Campo
- Role a página até encontrar a seção **"Build & Deploy"**
- Localize o campo **"Build Command"**

### 2.2 Limpar Configuração Antiga
- Se houver algum comando antigo, **SELECIONE TUDO** e **DELETE**

### 2.3 Copiar Novo Comando
**Copie EXATAMENTE este comando** (Ctrl+C / Cmd+C):

```bash
npm install -g pnpm@latest && pnpm install && pnpm run build
```

### 2.4 Colar no Campo
- Clique no campo "Build Command"
- Cole o comando (Ctrl+V / Cmd+V)
- **VERIFIQUE** se não há espaços extras no início/fim

### ✅ Resultado Esperado
O campo deve mostrar:
```
npm install -g pnpm@latest && pnpm install && pnpm run build
```

---

## 🚀 PASSO 3: CONFIGURAR START COMMAND

### 3.1 Localizar o Campo
- Logo abaixo de "Build Command", localize **"Start Command"**

### 3.2 Limpar Configuração Antiga
- Se houver algum comando antigo, **DELETE**

### 3.3 Copiar Novo Comando
**Copie EXATAMENTE este comando**:

```bash
pnpm start
```

### 3.4 Colar no Campo
- Clique no campo "Start Command"
- Cole o comando
- **VERIFIQUE** se está correto

### ✅ Resultado Esperado
O campo deve mostrar:
```
pnpm start
```

---

## 🏥 PASSO 4: DESABILITAR HEALTH CHECK

### 4.1 Localizar o Campo
- Role a página até encontrar **"Health Check"** ou **"Health Check Path"**

### 4.2 Limpar o Campo
- Se houver qualquer valor (ex: `/api/health`, `/health`), **DELETE TUDO**
- Deixe o campo **COMPLETAMENTE VAZIO**

### 4.3 Verificar Estado
- O campo deve estar **em branco**
- Pode aparecer um placeholder cinza (ignore, está correto)

### ✅ Resultado Esperado
Campo vazio (sem texto algum):
```
[ campo vazio ]
```

---

## 🔄 PASSO 5: DESABILITAR AUTO-DEPLOY

### 5.1 Localizar a Opção
- Role até encontrar **"Auto-Deploy"**
- Pode estar em uma seção chamada "Deploy Triggers" ou similar

### 5.2 Desmarcar Checkbox
- Se houver um **checkbox marcado** (☑️), **CLIQUE** para desmarcar
- O checkbox deve ficar **vazio** (☐)

### 5.3 Confirmar Estado
- **Auto-Deploy**: ☐ (desmarcado)

### ✅ Resultado Esperado
```
☐ Auto-Deploy
```

---

## 💾 PASSO 6: SALVAR CONFIGURAÇÕES

### 6.1 Localizar Botão
- Role até o **final da página**
- Localize o botão **"Save Changes"** (geralmente azul)

### 6.2 Clicar em Save
- Clique no botão **"Save Changes"**
- Aguarde a mensagem de confirmação (toast verde)

### 6.3 Confirmação Visual
- Deve aparecer: ✅ **"Settings saved successfully"** ou similar

### ⏱️ Tempo: ~5 segundos

---

## 🎬 PASSO 7: INICIAR DEPLOY MANUAL

### 7.1 Voltar para a Página do Serviço
- Clique em **"Overview"** no menu lateral (ou volte)
- Ou clique no nome do serviço no topo

### 7.2 Localizar Botão de Deploy
- No canto **superior direito**, procure por:
  - **"Manual Deploy"** (botão azul/roxo)
  - Ou ícone de ⚡ / 🚀

### 7.3 Abrir Menu de Deploy
- Clique no botão **"Manual Deploy"**
- Deve abrir um dropdown com opções

### 7.4 Selecionar Opção
- Escolha: **"Deploy latest commit"**
- Ou: **"Clear build cache & deploy"** (se quiser garantir build limpo)

### 7.5 Confirmar Deploy
- Clique no botão de confirmação
- Deve aparecer mensagem: **"Deploy started"**

### ⏱️ Tempo: ~10 segundos

---

## 📊 PASSO 8: MONITORAR DEPLOY

### 8.1 Acessar Logs
- Automaticamente, você será redirecionado para **"Logs"**
- Ou clique em **"Logs"** no menu lateral

### 8.2 Acompanhar Output
Você verá logs similares a:

```
==> Build started...
==> Cloning from https://github.com/theneilagencia/ComplianceCore-Mining...
==> Running build command: npm install -g pnpm@latest && pnpm install && pnpm run build

npm install -g pnpm@latest
✔ pnpm installed: 10.4.1

pnpm install
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 1, downloaded 0, added 0
Already up to date
Done in 2.3s

pnpm run build
vite v5.4.3 building for production...
✓ 1234 modules transformed.
✓ built in 3.50s

dist/index.js      448.3kb
dist/index.js.map  1.1mb

✅ Server bundle created successfully

==> Build successful! ✅
==> Uploading build...
==> Starting service with 'pnpm start'...

> qivo-mining-intelligence@2.0.0 start
> NODE_ENV=production node dist/index.js

🚀 QIVO Mining Intelligence Platform
📊 Environment: production
🔌 Port: 10000
✅ Server started successfully
🌐 Listening on http://0.0.0.0:10000
```

### 8.3 Sinais de Sucesso
✅ Procure por:
- `Build successful!` ✅
- `Server started successfully` ✅
- `Listening on http://0.0.0.0:10000` ✅

### 8.4 Sinais de Erro
❌ Se aparecer:
- `Build failed` → Capture log completo
- `Error: Cannot find module` → Problema de dependências
- `Timeout` → Servidor não iniciou a tempo

### ⏱️ Tempo: 5-10 minutos

---

## ✅ PASSO 9: VALIDAR APLICAÇÃO

### 9.1 Aguardar Status "Live"
- No topo da página, aguarde o status mudar para:
  - 🟢 **"Live"** (verde)
  - Ou ícone de check ✅

### 9.2 Copiar URL do Serviço
- No dashboard, localize a URL pública:
  - **https://qivo-mining.onrender.com**
  - Ou clique no ícone de link 🔗 para copiar

### 9.3 Abrir em Nova Aba
- Abra nova aba do navegador
- Cole a URL: **https://qivo-mining.onrender.com**
- Pressione Enter

### 9.4 Verificar Homepage
✅ **Sucesso se**:
- Página carrega (não mostra erro 502/503)
- Vê interface do QIVO
- Logo/menu aparecem

❌ **Erro se**:
- "Application Error" (erro 502)
- "Service Unavailable" (erro 503)
- Página em branco

### 9.5 Testar Login
- Clique em **"Login"** ou **"Entrar"**
- URL deve mudar para `/login`
- Formulário de login deve aparecer

### ⏱️ Tempo: 1-2 minutos

---

## 🧪 PASSO 10: TESTES FUNCIONAIS (OPCIONAL)

### 10.1 Teste de Autenticação
```
1. Acesse: https://qivo-mining.onrender.com/login
2. Digite credenciais válidas
3. Clique em "Entrar"
4. ✅ Deve redirecionar para /dashboard
```

### 10.2 Teste de Upload
```
1. Navegue para página de uploads
2. Clique em "Upload" ou "Novo Upload"
3. Selecione arquivo pequeno (.pdf, .docx)
4. ✅ Deve mostrar progresso
5. ✅ Verificar logs no Render para mensagens de debug:
   "✅ Upload context validated"
```

### 10.3 Teste de API
```bash
# No terminal local:
curl https://qivo-mining.onrender.com/
# ✅ Deve retornar HTML (status 200)

curl https://qivo-mining.onrender.com/api/health
# ⚠️ Pode retornar 404 (OK, health check desabilitado)
```

### ⏱️ Tempo: 3-5 minutos

---

## 🐛 TROUBLESHOOTING

### Problema 1: Build Falha com "Command not found: pnpm"
**Sintoma**:
```
npm install -g pnpm@latest
sh: pnpm: command not found
```

**Solução**:
1. Verificar se comando está exatamente:
   ```
   npm install -g pnpm@latest && pnpm install && pnpm run build
   ```
2. Notar o `&&` entre comandos (não `&` ou `;`)

---

### Problema 2: Build Falha com "Out of Memory"
**Sintoma**:
```
FATAL ERROR: Reached heap limit
```

**Solução A - Build Cache**:
1. No Render Dashboard → **"Manual Deploy"**
2. Escolher **"Clear build cache & deploy"**

**Solução B - Upgrade Plan**:
1. Free tier do Render tem 512MB RAM
2. Considerar upgrade para plano pago (1GB+)

---

### Problema 3: Servidor Não Inicia (Timeout)
**Sintoma**:
```
Service failed to start within 5 minutes
```

**Solução**:
1. Verificar Start Command: `pnpm start`
2. Verificar logs para erros de runtime
3. Verificar variáveis de ambiente (DATABASE_URL, etc.)

---

### Problema 4: Erro 502 Bad Gateway
**Sintoma**:
- Página mostra "Application Error"
- Logs mostram "Service started" mas não responde

**Solução**:
1. Verificar se `PORT=10000` está configurado em Environment Variables
2. Verificar se código escuta em `process.env.PORT`
3. Reiniciar serviço manualmente

---

### Problema 5: Deploy Entra em Loop
**Sintoma**:
- Deploy inicia automaticamente após concluir
- Múltiplos deploys consecutivos

**Solução**:
1. ✅ **Confirmar Auto-Deploy está DESMARCADO** (☐)
2. Se ainda acontecer:
   - Settings → Auto-Deploy → ☐ Desmarcar
   - Save Changes
   - Cancelar deploys em andamento

---

## 📞 PRÓXIMOS PASSOS APÓS SUCESSO

### Fase 1: Monitoramento (Primeiras 2 horas)
- [ ] Verificar logs a cada 30 minutos
- [ ] Confirmar que não há crashes
- [ ] Testar features principais (login, upload, dashboard)

### Fase 2: Análise de Logs de Upload
- [ ] Acessar Render Dashboard → Logs
- [ ] Procurar mensagens: `✅ Upload context validated`
- [ ] Verificar se logs mostram `userId`, `tenantId`, `fileName`
- [ ] Identificar causa do "Failed query insert into 'uploads'"

### Fase 3: Habilitação Gradual de Features
**Após 24h de estabilidade**:
- [ ] Reabilitar Health Check (`healthCheckPath: /api/health`)
- [ ] Testar por mais 24h
- [ ] Se estável, reabilitar Auto-Deploy (opcional)

### Fase 4: Desenvolvimento (Todo List)
- [ ] Refatorar ReviewReport com SSE
- [ ] Integrar Audit module com pipeline unificado
- [ ] Implementar testes E2E

---

## 📊 CHECKLIST FINAL

### Configuração Aplicada
- [ ] Build Command configurado: `npm install -g pnpm@latest && pnpm install && pnpm run build`
- [ ] Start Command configurado: `pnpm start`
- [ ] Health Check desabilitado (campo vazio)
- [ ] Auto-Deploy desmarcado (☐)
- [ ] Configurações salvas (✅ toast verde)

### Deploy Executado
- [ ] Manual Deploy iniciado
- [ ] Logs monitorados
- [ ] Build concluído com sucesso
- [ ] Servidor iniciou sem erros
- [ ] Status mudou para 🟢 "Live"

### Validação Funcional
- [ ] Homepage carrega (200 OK)
- [ ] Login acessível (/login)
- [ ] Dashboard funcional (se autenticado)
- [ ] Sem erros 502/503

### Documentação
- [ ] AUDITORIA_TECNICA_EMERGENCIAL.md revisado
- [ ] GUIA_RECUPERACAO_RENDER.md (este arquivo) seguido
- [ ] Screenshots capturados (opcional)
- [ ] Problemas documentados (se houver)

---

## 🎯 RESUMO - COMANDOS EXATOS

### Build Command
```bash
npm install -g pnpm@latest && pnpm install && pnpm run build
```

### Start Command
```bash
pnpm start
```

### Health Check Path
```
[VAZIO - deletar qualquer conteúdo]
```

### Auto-Deploy
```
☐ DESMARCADO
```

---

## 📝 NOTAS IMPORTANTES

### ⚠️ NÃO FAÇA:
- ❌ Não alterar comandos (copie exatamente como mostrado)
- ❌ Não habilitar Auto-Deploy ainda
- ❌ Não adicionar Health Check ainda
- ❌ Não fazer novos commits antes de validar

### ✅ FAÇA:
- ✅ Copie comandos exatamente
- ✅ Verifique cada campo antes de salvar
- ✅ Monitore logs durante deploy
- ✅ Teste funcionalidades após deploy
- ✅ Documente problemas (se houver)

---

**Preparado por**: QIVO Engineer AI  
**Data**: 2025-11-03 20:45 BRT  
**Commit de Referência**: 0c98747  
**Versão do Guia**: 1.0

---

## 🆘 SUPORTE

Se encontrar problemas não listados neste guia:

1. **Capture logs completos** do Render (botão "Download logs")
2. **Tire screenshots** do erro
3. **Documente** passo-a-passo o que fez
4. **Informe** commit hash (0c98747)
5. **Consulte** AUDITORIA_TECNICA_EMERGENCIAL.md para análise mais profunda
