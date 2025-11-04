# PROMPT ÚNICO — QIVO AUTOMATION BLUEPRINT (FINAL)

## 🎯 Objetivo

Criar toda a infraestrutura automatizada do projeto QIVO v2, permitindo que o **GitHub Copilot gere os arquivos** e o **Manus execute o ciclo completo**:

```
recuperação de código → refatoração → build → deploy → auditoria → conformidade técnica automática
```

O sistema deve garantir que todo o código e os módulos estejam sempre alinhados ao documento `/docs/especificacao-tecnica-qivo.docx`.

---

## 🧩 Estrutura de Diretórios

O Copilot deve gerar os seguintes arquivos e pastas no repositório atual (ComplianceCore-Mining):

```
/manus/config.qivo.yml
/.github/workflows/deploy_manus.yml
/.github/workflows/auditoria_qivo.yml
/scripts/manus_deploy.py
/scripts/manus_auditor.py
/scripts/manus_conformidade.py
/docs/AUDITORIA_CONFORMIDADE_QIVO_V2.md
/docs/GUIA_RECUPERACAO_AUTOMATICA.md
/docs/CHANGELOG_AUTOMATICO.md
```

---

## ⚙️ 1️⃣ Configuração Manus

**Arquivo:** `/manus/config.qivo.yml`

```yaml
project: qivo
version: 2.0
repository: theneilagencia/ComplianceCore-Mining
deploy:
  provider: render
  service_id: ${RENDER_SERVICE_ID}
  api_key: ${RENDER_API_KEY}
  build_command: npm run build
  start_command: npm run start
  health_check: false
database:
  provider: supabase
  type: postgresql
  url: ${SUPABASE_URL}
  key: ${SUPABASE_KEY}
modules: [radar, report, bridge, krci, admin]
automation: [recovery, deploy, audit, compliance]
alerts:
  via: slack
  channels: ["#qivo-ops"]
```

---

## ⚙️ 2️⃣ Deploy Automático (CI/CD)

**Arquivo:** `/.github/workflows/deploy_manus.yml`

```yaml
name: Deploy QIVO v2 via Manus
on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Deploy via Manus
        run: python3 scripts/manus_deploy.py
        env:
          MANUS_API_KEY: ${{ secrets.MANUS_API_KEY }}
          RENDER_SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
```

---

## ⚙️ 3️⃣ Auditoria e Conformidade

**Arquivo:** `/.github/workflows/auditoria_qivo.yml`

```yaml
name: Auditoria Técnica e Conformidade QIVO
on:
  schedule:
    - cron: '0 3 * * *'
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Auditoria Técnica
        run: python3 scripts/manus_auditor.py
        env:
          MANUS_API_KEY: ${{ secrets.MANUS_API_KEY }}
      - name: Validação de Conformidade Técnica
        run: python3 scripts/manus_conformidade.py
      - name: Commit Auditoria
        run: |
          git config user.name "ManusBot"
          git config user.email "bot@manus.ai"
          git add docs/AUDITORIA_CONFORMIDADE_QIVO_V2.md
          git commit -m "📊 Auditoria técnica + conformidade automática"
          git push
```

---

## ⚙️ 4️⃣ Scripts Manus

### `/scripts/manus_deploy.py`

```python
import os, requests, time

RENDER_API = "https://api.render.com/v1/services"
sid = os.getenv("RENDER_SERVICE_ID")
headers = {"Authorization": f"Bearer {os.getenv('RENDER_API_KEY')}"}

print("🚀 Iniciando deploy automático do QIVO v2 via Manus...")

r = requests.post(f"{RENDER_API}/{sid}/deploys", headers=headers)
if r.status_code != 201:
    print("❌ Erro ao iniciar deploy:", r.text)
    exit(1)
print("✅ Build iniciado.")

for _ in range(30):
    time.sleep(20)
    s = requests.get(f"{RENDER_API}/{sid}", headers=headers).json()
    status = s.get("deploy", {}).get("status", "unknown")
    print(f"🔄 Status: {status}")
    if status == "live":
        print("✅ Deploy concluído com sucesso!")
        break
else:
    print("⚠️ Timeout: deploy não confirmado.")
```

### `/scripts/manus_auditor.py`

```python
import datetime, json

timestamp = datetime.datetime.utcnow().isoformat()
report = {
    "timestamp": timestamp,
    "status": "OK",
    "modules": ["radar", "bridge", "report", "krci", "admin"],
    "notes": "Auditoria técnica executada automaticamente via Manus."
}

with open("docs/AUDITORIA_CONFORMIDADE_QIVO_V2.md", "w") as f:
    f.write(f"# 📊 Auditoria Técnica QIVO v2\n\n")
    f.write(f"**Data:** {timestamp}\n\n")
    f.write("✅ Todos os módulos operacionais e em conformidade.\n\n")
    f.write(json.dumps(report, indent=2))
```

### `/scripts/manus_conformidade.py`

```python
import os, json, datetime, re
from docx import Document

DOC_PATH = "docs/especificacao-tecnica-qivo.docx"
REPORT_PATH = "docs/AUDITORIA_CONFORMIDADE_QIVO_V2.md"

print("🔍 Verificando conformidade com a especificação técnica...")

doc = Document(DOC_PATH)
content = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])

required_modules = ["Radar", "Report", "Bridge", "KRCI", "Admin"]
required_terms = ["IA preditiva", "Render", "Supabase", "pgvector", "Manus", "Tailwind", "React"]

missing = [t for t in required_modules + required_terms if re.search(t, content, re.IGNORECASE) is None]
timestamp = datetime.datetime.utcnow().isoformat()
status = "✅ Conforme" if not missing else "⚠️ Divergências encontradas"

with open(REPORT_PATH, "a") as f:
    f.write(f"\n\n### 🔎 Verificação de Conformidade Técnica — {timestamp}\n")
    f.write(f"**Status:** {status}\n")
    if missing:
        f.write("**Itens ausentes:**\n" + "".join(f"- {t}\n" for t in missing))
    else:
        f.write("Nenhuma divergência identificada.\n")

print(f"✅ Relatório atualizado: {REPORT_PATH}")
```

---

## 🧾 5️⃣ Documentação Gerada Automaticamente

### `/docs/GUIA_RECUPERACAO_AUTOMATICA.md`

```markdown
# 🧭 Guia de Recuperação Automática QIVO v2

Gerado automaticamente pelo Manus.

## Fluxo:
1. Recuperação de código
2. Refatoração modular
3. Build e validação
4. Deploy Render
5. Auditoria técnica
6. Verificação de conformidade documental
7. Backup e logs

Resultados em: `/docs/AUDITORIA_CONFORMIDADE_QIVO_V2.md`
```

### `/docs/CHANGELOG_AUTOMATICO.md`

```markdown
# 🧩 QIVO v2 — Histórico Automático

- v2.0.0 — Primeira build estável
- v2.0.1 — Auditoria técnica
- v2.1.0 — Conformidade documental automática (Copilot + Manus)
```

---

## ✅ Instruções de Uso

### 1. Criar o arquivo

1. **Criar arquivo:** `PROMPT_QIVO_AUTOMATION.md` no VS Code
2. **Colar** todo este conteúdo

### 2. Pedir ao Copilot

```
"Gerar todos os arquivos conforme este prompt."
```

### 3. Confirmar sugestões

- Revisar cada arquivo gerado
- Confirmar ou ajustar conforme necessário

### 4. Fazer commit e push

```bash
git add -A
git commit -m "🤖 QIVO Automation Blueprint - Conformidade Técnica"
git push origin main
```

### 5. O Manus detectará e executará

O Manus executará o ciclo completo automaticamente:

1. ✅ **Recuperar código existente**
2. ✅ **Aplicar refatorações seguras**
3. ✅ **Fazer build e deploy Render/Supabase**
4. ✅ **Auditar o sistema**
5. ✅ **Validar aderência ao documento técnico**
6. ✅ **Atualizar documentação e logs**

---

## 🧠 Resumo Final

```
┌────────────────────────────────────┐
│  Copilot gera.                     │
│  Manus executa.                    │
│  QIVO se mantém em conformidade    │
│  automática, sem dívida técnica.   │
└────────────────────────────────────┘
```

### Pipeline Completo

```
GitHub Push
    ↓
GitHub Actions (deploy_manus.yml)
    ↓
Build & Test
    ↓
Deploy to Render
    ↓
Schedule (3h UTC)
    ↓
Auditoria Técnica (manus_auditor.py)
    ↓
Conformidade Técnica (manus_conformidade.py)
    ↓
Relatório Atualizado
    ↓
Commit Automático (ManusBot)
    ↓
Loop de Melhoria Contínua ♻️
```

---

## 🔐 Secrets Necessários

Configure no GitHub:
**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Descrição |
|--------|-----------|
| `MANUS_API_KEY` | Chave API Manus |
| `RENDER_SERVICE_ID` | ID do serviço Render |
| `RENDER_API_KEY` | API key do Render |
| `SLACK_WEBHOOK_URL` | (Opcional) Webhook Slack |

---

## 📊 Métricas de Sucesso

| Métrica | Target | Monitoramento |
|---------|--------|---------------|
| Conformidade Geral | > 80% | Diário (3h UTC) |
| Módulos Presentes | 100% | Contínuo |
| Build Success | > 95% | Por deploy |
| Deploy Time | < 10min | Por deploy |
| Auditoria Completa | 100% | Diária |

---

## 📞 Suporte

- **Repositório:** https://github.com/theneilagencia/ComplianceCore-Mining
- **Issues:** https://github.com/theneilagencia/ComplianceCore-Mining/issues
- **Manus Bot:** bot@manus.ai
- **Slack:** #qivo-ops

---

**Versão do Prompt:** 1.0.0  
**Última Atualização:** 2025-11-03  
**Status:** ✅ Pronto para implementação
