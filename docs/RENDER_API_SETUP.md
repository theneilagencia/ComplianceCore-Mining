# 🔑 Configuração de API Key do Render

## 📋 Como Obter o RENDER_API_KEY

1. **Acesse o Render Dashboard**: https://dashboard.render.com/
2. **Vá em Account Settings** (canto superior direito)
3. **Selecione "API Keys"** no menu lateral
4. **Clique em "Create API Key"**
5. **Dê um nome**: `ComplianceCore-Mining-Monitor`
6. **Copie a chave gerada** (ela só será mostrada uma vez!)

## ⚙️ Configurar no GitHub

### Opção 1: Via GitHub CLI

```bash
cd ~/Documents/GITHUB/ComplianceCore-Mining
gh secret set RENDER_API_KEY --body "rnd_SEU_TOKEN_AQUI"
```

### Opção 2: Via Interface Web

1. Acesse: https://github.com/theneilagencia/ComplianceCore-Mining/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Nome: `RENDER_API_KEY`
4. Valor: Cole a API key do Render
5. Clique em **"Add secret"**

## ✅ Verificar Configuração

```bash
# Listar secrets configurados
gh secret list

# Deve aparecer:
# RENDER_API_KEY
# RENDER_DEPLOY_HOOK
# DATABASE_URL
# OPENAI_API_KEY
```

## 🧪 Testar Monitoramento

Após configurar a API key:

```bash
# Trigger workflow de monitoramento manualmente
gh workflow run monitor.yaml

# Aguardar execução
sleep 15

# Verificar resultado
gh run list --workflow="monitor.yaml" --limit 1

# Ver status atualizado
cat docs/PIPELINE.md
```

## 📊 O que a API Key permite

Com a API key configurada, o sistema de monitoramento terá acesso a:

- ✅ **Status do serviço** (available, suspended, etc)
- ✅ **Histórico de deploys**
- ✅ **Tempo de deploy**
- ✅ **Logs de build**
- ✅ **Métricas de performance**

## ⚠️ Segurança

- ❌ **Nunca** commite a API key no código
- ✅ Sempre use GitHub Secrets
- ✅ Rotacione a key periodicamente
- ✅ Use keys diferentes para dev/prod

## 🔄 Funcionamento sem API Key

Se você **não configurar** a `RENDER_API_KEY`:

- ⚠️ Status aparecerá como "unknown"
- ✅ Deploy hook continuará funcionando
- ✅ Workflows de deploy funcionarão normalmente
- ❌ Monitoramento detalhado ficará limitado

---

**Recomendação**: Configure a API key para ter visibilidade completa do pipeline! 🚀
