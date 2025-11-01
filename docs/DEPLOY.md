# 🚀 QIVO Deploy Pipeline - Documentação# 🚀 Guia de Deploy - ComplianceCore Mining



**Pipeline CI/CD Completo para QIVO Intelligence Layer**  ## 📋 Visão Geral

**Versão:** 4.0.0  

**Status:** ✅ Ativo  Este projeto utiliza **GitHub Actions** para CI/CD automático com deploy no **Render**.

**Plataforma:** GitHub Actions + Render

## 🔄 Pipeline Automático

---

### Workflows Configurados

## 📋 Índice

1. **`deploy.yaml`** - Deploy automático no Render

1. [Visão Geral](#visão-geral)2. **`test.yml`** - Testes automatizados

2. [Arquitetura do Pipeline](#arquitetura-do-pipeline)3. **`python-ci.yml`** - CI para backend Python

3. [Jobs e Stages](#jobs-e-stages)

4. [Configuração de Secrets](#configuração-de-secrets)### Fluxo de Deploy

5. [Como Funciona](#como-funciona)

6. [Monitoramento](#monitoramento)```mermaid

7. [Troubleshooting](#troubleshooting)graph LR

    A[Push to main] --> B[GitHub Actions]

---    B --> C[Trigger Render Deploy]

    C --> D[Render Build]

## 🎯 Visão Geral    D --> E[Deploy Completo]

```

O pipeline CI/CD automatiza todo o processo de **build → test → deploy** para a QIVO Intelligence Platform, garantindo que:

## ⚙️ Configuração Inicial

✅ Todas as dependências são instaladas corretamente  

✅ Testes do Bridge AI e Validator AI passam  ### 1. Configurar Deploy Hook do Render

✅ Deploy no Render acontece apenas com código validado  

✅ Logs detalhados de cada etapa estão disponíveis```bash

# Obter URL do Deploy Hook no Render Dashboard

### Trigger# Settings → Deploy Hook



- **Evento**: `push` na branch `main`# Configurar como secret no GitHub

- **Arquivo**: `.github/workflows/deploy.yaml`gh secret set RENDER_DEPLOY_HOOK --body "https://api.render.com/deploy/srv-XXXXX?key=YYYY"

- **Duração média**: 3-5 minutos```



---### 2. Verificar Secrets Configurados



## 🏗️ Arquitetura do Pipeline```bash

gh secret list

``````

┌─────────────────────────────────────────────────────────┐

│                   GITHUB PUSH (main)                    │Secrets necessários:

└────────────────────┬────────────────────────────────────┘- `RENDER_DEPLOY_HOOK` - URL do webhook do Render

                     │- `DATABASE_URL` - URL do banco PostgreSQL

                     ▼- `OPENAI_API_KEY` - API key da OpenAI

         ┌───────────────────────┐

         │  JOB 1: Build & Setup │### 3. Testar Deploy Manual

         │  ⏱️ ~1-2 min          │

         └───────────┬───────────┘```bash

                     │# Testar webhook diretamente

                     │ ✅ Successcurl -X POST "$RENDER_DEPLOY_HOOK"

                     ▼

         ┌───────────────────────┐# Deve retornar 200 OK

         │  JOB 2: Automated     │```

         │  Tests                │

         │  ⏱️ ~30s-1min         │## 🐛 Troubleshooting

         └───────────┬───────────┘

                     │### Deploy falha com "HTTP 000"

                     │ ✅ All tests passed

                     ▼**Causa**: URL do webhook incorreta ou malformada

         ┌───────────────────────┐

         │  JOB 3: Deploy to     │**Solução**:

         │  Render               │```bash

         │  ⏱️ ~10-15s           │# Reconfigurar o secret

         └───────────────────────┘gh secret set RENDER_DEPLOY_HOOK --body "URL_CORRETA_AQUI"

```

# Trigger deploy manual

### Sequenciamentogit commit --allow-empty -m "ci: trigger deploy"

git push origin main

- **JOB 2** só executa se **JOB 1** passar```

- **JOB 3** só executa se **JOB 2** passar

- Se qualquer job falhar, pipeline é interrompido### Build falha no Render



---**Causa**: Dependências desatualizadas ou lockfile inconsistente



## 📦 Jobs e Stages**Solução**:

```bash

### JOB 1: 🏗️ Build & Setup# Recriar lockfile

rm pnpm-lock.yaml

**Objetivo**: Preparar ambiente de execuçãopnpm install --no-frozen-lockfile

pnpm build

**Steps**:

1. Checkout repository# Commit e push

2. Setup Node.js 22.xgit add pnpm-lock.yaml

3. Setup Python 3.11git commit -m "ci: recria pnpm-lock.yaml"

4. Setup pnpm 10git push origin main

5. Install Node dependencies```

6. Install Python dependencies

7. Run linter (não bloqueante)### Erro "fetch first" no git push

8. Build Summary

**Solução**:

### JOB 2: 🧪 Run Automated Tests```bash

# Fazer rebase antes de push

**Objetivo**: Validar códigogit pull --rebase origin main

git push origin main

**Tests executados**:```

- ✅ Bridge AI (16 testes)

- ✅ Validator AI (12 testes)## �� Monitoramento



### JOB 3: 🚀 Deploy to Render### Ver status dos workflows



**Objetivo**: Disparar deploy```bash

# Listar últimas execuções

**Ações**:gh run list --limit 5

- Trigger webhook Render

- Validar resposta (HTTP 200/201/202)# Ver detalhes de uma execução

- Gerar resumo visualgh run view <RUN_ID>



---# Ver logs de falha

gh run view <RUN_ID> --log-failed

## 🔐 Secrets Necessários```



### RENDER_DEPLOY_HOOK (Obrigatório)### Verificar deploy no Render



```bash1. Acesse: https://dashboard.render.com

gh secret set RENDER_DEPLOY_HOOK --body "URL_DO_WEBHOOK"2. Selecione o serviço "qivo-mining"

```3. Veja logs em tempo real na aba **Logs**



### OPENAI_API_KEY (Opcional)## 🔄 Deploy Manual de Emergência



```bashSe o pipeline automático falhar:

gh secret set OPENAI_API_KEY --body "sk-..."

``````bash

# 1. Fazer build local

---pnpm install --no-frozen-lockfile

pnpm build

## ⚙️ Como Usar

# 2. Trigger deploy via webhook

### Trigger Automáticocurl -X POST "https://api.render.com/deploy/srv-XXXXX?key=YYYY"



```bash# 3. Ou fazer deploy manual pelo Dashboard do Render

git push origin main# Dashboard → qivo-mining → Manual Deploy

``````



### Trigger Manual## ✅ Checklist de Deploy



```bash- [ ] Todos os testes passando localmente

gh workflow run deploy.yaml- [ ] Build executado com sucesso

```- [ ] Secrets configurados no GitHub

- [ ] Deploy Hook do Render válido

### Ver Status- [ ] Branch `main` atualizada

- [ ] Workflow executado sem erros

```bash- [ ] Aplicação acessível em produção

gh run list --workflow=deploy.yaml

```## 🤖 Monitoramento & Auto-Recovery



---### Sistema de Monitoramento Automático



## 🛠️ TroubleshootingO projeto possui um sistema completo de monitoramento e auto-correção:



### Secret faltando#### 📊 Monitor Pipeline (`monitor.yaml`)



```bash- **Frequência**: A cada 30 minutos

gh secret set RENDER_DEPLOY_HOOK --body "URL"- **Funcionalidades**:

```  - ✅ Consulta status do serviço via API Render

  - ✅ Verifica status do último deploy

### Tests falhando  - ✅ Atualiza automaticamente `docs/PIPELINE.md`

  - ✅ Cria issue automaticamente se deploy falhar

```bash  - ✅ Push automático com rebase em caso de conflito

pytest tests/test_bridge_ai.py -v

```**Verificar status**:

```bash

### Deploy falhou# Ver histórico de monitoramento

gh run list --workflow="monitor.yaml" --limit 5

1. Verificar https://status.render.com

2. Validar secret RENDER_DEPLOY_HOOK# Ver status atual

3. Re-executar workflowcat docs/PIPELINE.md

```

---

#### 🔧 Auto-Recovery (`auto-recovery.yaml`)

**Documentação completa**: Ver backup em `DEPLOY.md.bak`  

**Última atualização:** 2025-11-01  - **Trigger**: Executa automaticamente quando workflows falharem

**Versão:** 4.0.0- **Correções Automáticas**:

  - ✅ Rebuild `pnpm-lock.yaml` se detectar erro de build
  - ✅ Rebase automático em conflitos de git
  - ✅ Teste e validação de webhook
  - ✅ Commit e push automático das correções
  - ✅ Criação de issue se falhar

**Forçar auto-recovery manual**:
```bash
gh workflow run auto-recovery.yaml
```

### Configuração de Secrets

Secrets necessários no GitHub:

```bash
# Obrigatórios
gh secret set RENDER_DEPLOY_HOOK --body "URL_DO_WEBHOOK"
gh secret set DATABASE_URL --body "postgresql://..."
gh secret set OPENAI_API_KEY --body "sk-..."

# Opcional (para monitoramento avançado)
gh secret set RENDER_API_KEY --body "seu_token_render"
```

### Monitoramento em Tempo Real

1. **Status do Pipeline**: `docs/PIPELINE.md` (atualizado a cada 30min)
2. **Logs do Render**: https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0/logs
3. **GitHub Actions**: https://github.com/theneilagencia/ComplianceCore-Mining/actions
4. **Issues Automáticas**: Criadas quando há falhas

## 📚 Referências

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Render Deploy Hooks](https://render.com/docs/deploy-hooks)
- [Render API Documentation](https://api-docs.render.com/)
- [pnpm Documentation](https://pnpm.io)

---

**Última atualização**: 01/11/2025  
**Workflows**: `deploy.yaml`, `monitor.yaml`, `auto-recovery.yaml`
