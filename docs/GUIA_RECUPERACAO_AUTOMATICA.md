# 🧭 Guia de Recuperação Automática QIVO v2

> **Este guia é gerado e atualizado automaticamente pelo Manus Bot.**  
> Descreve cada etapa do pipeline de recuperação, refatoração e deploy automatizado.

---

## 📋 Visão Geral

O sistema de recuperação automática do QIVO v2 é projetado para:
- ✅ Detectar falhas automaticamente
- ✅ Executar diagnóstico completo
- ✅ Aplicar correções quando possível
- ✅ Notificar equipe em caso de intervenção manual

---

## 🔄 Pipeline de Recuperação

### 1️⃣ Recuperação de Código

**Objetivo:** Garantir que o código-fonte está em estado consistente e compilável.

**Etapas:**
1. Verificar integridade do repositório Git
2. Validar estrutura de diretórios
3. Conferir arquivos críticos (package.json, tsconfig.json, render.yaml)
4. Executar `git fsck` para verificar corrupção

**Automação:**
```yaml
# Executado em: .github/workflows/auditoria_qivo.yml
- name: Code Recovery Check
  run: |
    git fsck --full
    git status
    npm run check
```

**Ação Manual Requerida:**
- Se houver corrupção de arquivos: Restaurar do backup
- Se houver conflitos de merge: Resolver manualmente

---

### 2️⃣ Refatoração Modular

**Objetivo:** Manter organização modular e eliminar código duplicado.

**Módulos Auditados:**
- `radar` - Monitoramento regulatório
- `report` - Geração de relatórios
- `bridge` - Integração com APIs externas
- `krci` - Auditoria KRCI
- `admin` - Administração
- `billing` - Faturamento Stripe
- `sse` - Server-Sent Events

**Verificações Automatizadas:**
```python
# Executado em: scripts/manus_auditor.py
def audit_modules():
    for module in MODULES:
        check_structure()
        count_files()
        verify_tests()
```

**Ação Manual Requerida:**
- Se módulo ausente: Recriar estrutura base
- Se testes faltando: Adicionar cobertura mínima

---

### 3️⃣ Build e Validação

**Objetivo:** Garantir que o build produz artefatos válidos.

**Processo:**
1. Instalar dependências: `pnpm install`
2. Executar type check: `pnpm run check`
3. Build produção: `pnpm run build`
4. Validar output: `dist/index.js` (tamanho ~450KB)

**Métricas Esperadas:**
- Tempo de build: < 5s
- Bundle size: ~448KB
- Erros TypeScript: < 50 (não-bloqueantes)

**Automação:**
```yaml
# Executado em: .github/workflows/deploy_manus.yml
- name: Build Application
  run: pnpm run build
  env:
    NODE_ENV: production
```

**Ação Manual Requerida:**
- Se build falhar: Verificar logs detalhados
- Se bundle > 1MB: Revisar imports e tree-shaking

---

### 4️⃣ Deploy Render

**Objetivo:** Deployar aplicação no Render com zero downtime.

**Configuração:**
```yaml
# manus/config.qivo.yml
deploy:
  provider: render
  build_command: npm install -g pnpm@latest && pnpm install && pnpm run build
  start_command: pnpm start
  health_check: false
  auto_deploy: false
```

**Processo Automatizado:**
1. Trigger deploy via Render API
2. Monitorar status a cada 20s
3. Timeout após 10 minutos
4. Executar health check após conclusão

**Script:**
```python
# scripts/manus_deploy.py
def trigger_deploy():
    response = requests.post(
        f"{RENDER_API}/services/{SERVICE_ID}/deploys",
        headers=get_headers()
    )
    return response.json()["id"]
```

**Ação Manual Requerida:**
- Se deploy falhar após 3 tentativas: Verificar Dashboard do Render
- Se timeout: Aumentar recursos ou otimizar build

---

### 5️⃣ Auditoria Técnica

**Objetivo:** Gerar relatório completo do estado do sistema.

**Auditorias Executadas:**
- 📦 Módulos do sistema
- 🔒 Dependências e vulnerabilidades
- 📊 Qualidade de código
- 🏗️ Processo de build
- 🔐 Segurança (secrets expostos)
- ⚡ Performance (response time)

**Schedule:**
- **Diária:** 3h UTC (0h BRT)
- **On-demand:** Via workflow_dispatch

**Output:**
- `docs/AUDITORIA_CONFORMIDADE_QIVO_V2.md` (Markdown)
- `audit_logs/*.json` (JSON detalhado)

**Ação Manual Requerida:**
- Se vulnerabilidades HIGH: Atualizar dependências imediatamente
- Se secrets expostos: Rotacionar chaves e limpar histórico Git

---

### 6️⃣ Geração de Documentação

**Objetivo:** Manter documentação sempre atualizada com estado real do sistema.

**Documentos Automáticos:**
- ✅ `AUDITORIA_CONFORMIDADE_QIVO_V2.md` - Relatório técnico
- ✅ `CHANGELOG_AUTOMATICO.md` - Histórico de mudanças
- ✅ `GUIA_RECUPERACAO_AUTOMATICA.md` - Este guia
- ✅ `DEPLOYMENT_HISTORY.json` - Histórico de deploys

**Atualização:**
- Commit automático após cada auditoria
- Push via ManusBot (bot@manus.ai)

**Ação Manual Requerida:**
- Se commit falhar: Verificar permissões do GitHub Token
- Se conflito: Resolver manualmente e fazer merge

---

### 7️⃣ Backup e Logs

**Objetivo:** Manter histórico recuperável de todas operações.

**Backups Automáticos:**
- **Deploy History:** `deploy_history/*.json` (cada deploy)
- **Audit Logs:** `audit_logs/*.json` (cada auditoria)
- **Build Artifacts:** GitHub Actions (7 dias)

**Retenção:**
- Deploy history: 30 dias
- Audit logs: 90 dias
- Build artifacts: 7 dias

**Ação Manual Requerida:**
- Se disco cheio: Limpar logs antigos
- Se backup corrompido: Restaurar do Git

---

## 🔔 Notificações

### Slack Integration

**Canais:**
- `#qivo-ops` - Operações gerais
- `#qivo-deploys` - Notificações de deploy

**Eventos Notificados:**
- ✅ Deploy bem-sucedido
- ❌ Deploy falhou
- 🏥 Health check falhou
- 📊 Auditoria concluída
- 🔄 Rollback triggered

**Configuração:**
```yaml
# .github/workflows/deploy_manus.yml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## 🚨 Troubleshooting

### Problema: Deploy Falha Constantemente

**Sintomas:**
- Build timeout no Render
- Erros de "out of memory"

**Solução Automática:**
1. Clear build cache
2. Retry deploy (até 3x)

**Solução Manual:**
1. Verificar logs do Render Dashboard
2. Considerar upgrade do plano (512MB → 1GB)
3. Otimizar dependências (remover não-usadas)

---

### Problema: Health Check Sempre Falha

**Sintomas:**
- Curl retorna 502/503
- Aplicação não responde

**Solução Automática:**
1. Aguardar 60s adicionais
2. Retry health check (até 3x)

**Solução Manual:**
1. Verificar variáveis de ambiente no Render
2. Confirmar `PORT=10000` configurado
3. Testar endpoint manualmente: `curl https://qivo-mining.onrender.com/`

---

### Problema: Auditoria Não Commita

**Sintomas:**
- Workflow executa mas não há commit
- Erro "nothing to commit"

**Solução Automática:**
1. Verificar se há mudanças reais
2. Skip commit se nada mudou

**Solução Manual:**
1. Verificar permissões do GitHub Token
2. Conferir se ManusBot tem acesso de escrita
3. Executar manualmente: `git commit -m "📊 Auditoria manual"`

---

## 📊 Métricas de Sucesso

| Métrica | Target | Atual | Status |
|---------|--------|-------|--------|
| Deploy Success Rate | > 95% | - | 🔄 |
| Build Time | < 5s | 3.33s | ✅ |
| Health Check Uptime | > 99% | - | 🔄 |
| Audit Completion | 100% | - | 🔄 |
| Response Time | < 2s | - | 🔄 |

---

## 🔐 Secrets Requeridos

| Secret | Descrição | Status |
|--------|-----------|--------|
| `MANUS_API_KEY` | Chave API Manus | ⚠️ |
| `RENDER_SERVICE_ID` | ID do serviço Render | ⚠️ |
| `RENDER_API_KEY` | API key do Render | ⚠️ |
| `SLACK_WEBHOOK_URL` | Webhook Slack (opcional) | ⚠️ |
| `GITHUB_TOKEN` | Token automático (built-in) | ✅ |

**Configurar em:** https://github.com/theneilagencia/ComplianceCore-Mining/settings/secrets

---

## 📞 Contatos e Suporte

**Equipe Técnica:**
- Repositório: https://github.com/theneilagencia/ComplianceCore-Mining
- Issues: https://github.com/theneilagencia/ComplianceCore-Mining/issues
- Slack: #qivo-ops

**Manus Bot:**
- Email: bot@manus.ai
- GitHub: @ManusBot

---

## 📝 Changelog do Guia

| Data | Versão | Mudanças |
|------|--------|----------|
| 2025-11-03 | 1.0.0 | Criação inicial do guia automático |

---

**Última Atualização:** Gerado automaticamente em cada auditoria  
**Próxima Revisão:** Diária às 3h UTC
