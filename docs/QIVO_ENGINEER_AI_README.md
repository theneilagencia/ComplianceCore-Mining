# 🤖 QIVO Engineer AI v2

**Autonomous engineering agent with dual-core architecture for continuous improvement and product evolution.**

---

## 📋 Overview

QIVO Engineer AI v2 is an intelligent automation system that combines technical excellence with product thinking:

- **Technical Core** → Continuous auditing, optimization, and automated fixes
- **Product Core** → Functional analysis, UX/UI auditing, and roadmap planning

---

## 🏗️ Architecture

```
QIVO Engineer AI v2
├── Technical Core
│   ├── generateAudit.ts          → Build, dependencies, quality metrics
│   ├── generateOptimizationDiff.ts → Performance comparisons
│   └── healthCheck.ts             → System health monitoring
│
├── Product Core
│   ├── analyzeModules.ts          → Module redundancy & gap analysis
│   ├── generateFunctionalSpec.ts  → User stories & acceptance criteria
│   ├── generateUXAudit.ts         → Nielsen heuristics evaluation
│   └── generateRoadmap.ts         → Feature prioritization & planning
│
└── GitHub Actions Workflows
    ├── qivo-engineer.yml          → Technical audit (every 12h + on push)
    ├── qivo-auto-fix.yml          → Auto-fix + deploy trigger
    └── qivo-product-core.yml      → Product analysis (daily)
```

---

## 🚀 Setup

### 1. GitHub Secrets

Configure the following secrets in your repository:

```bash
RENDER_DEPLOY_HOOK=https://api.render.com/deploy/srv-xxxxx?key=yyyyy
SENTRY_DSN=https://xxxxx@sentry.io/yyyyy (optional)
API_URL=https://your-app.onrender.com (optional, defaults to localhost)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz (optional)
```

### 2. Enable GitHub Actions

Make sure GitHub Actions are enabled in your repository settings:
- **Settings → Actions → General**
- Allow: "All actions and reusable workflows"

### 3. Install Dependencies

```bash
pnpm install
```

---

## 🎯 Workflows

### Technical Core Audit (`qivo-engineer.yml`)

**Triggers:**
- Every push to `main` or `develop`
- Every pull request
- Every 12 hours (scheduled)
- Manual dispatch

**Actions:**
1. Runs full technical audit
2. Measures build time, dependencies, bundles
3. Analyzes code quality (ESLint, TypeScript, tests)
4. Performs health checks
5. Generates optimization diff (last 10 commits)
6. Commits reports to `/docs`

**Outputs:**
- `docs/QIVO_TECHNICAL_AUDIT.md`
- `docs/QIVO_OPTIMIZATION_DIFF.md`
- `docs/QIVO_HEALTH_CHECK.md`

---

### Auto Fix & Deploy (`qivo-auto-fix.yml`)

**Triggers:**
- After successful Technical Audit
- Manual dispatch

**Actions:**
1. Runs ESLint auto-fix
2. Applies Prettier formatting
3. Updates minor/patch dependencies
4. Creates `auto-fix/*` branch
5. Opens pull request
6. Triggers Render deployment (if on `main`)
7. Reports to Sentry on failure

---

### Product Core Analysis (`qivo-product-core.yml`)

**Triggers:**
- Daily at 2 AM UTC
- Manual dispatch

**Actions:**
1. Analyzes client/server modules
2. Generates functional specifications
3. Performs UX/UI audit (Nielsen heuristics)
4. Updates product roadmap
5. Commits reports to `/docs`

**Outputs:**
- `docs/QIVO_MODULE_ANALYSIS.md`
- `docs/QIVO_FUNCTIONAL_SPEC.md`
- `docs/QIVO_UX_UI_AUDIT.md`
- `docs/QIVO_PRODUCT_ROADMAP.md`

---

## 🔧 Manual Execution

### Run Technical Audit Locally

```bash
pnpm tsx scripts/technical-core/generateAudit.ts
```

### Run Optimization Diff

```bash
pnpm tsx scripts/technical-core/generateOptimizationDiff.ts HEAD~10 HEAD
```

### Run Health Check

```bash
API_URL=http://localhost:3000 pnpm tsx scripts/technical-core/healthCheck.ts
```

### Run Product Core Scripts

```bash
pnpm tsx scripts/product-core/analyzeModules.ts
pnpm tsx scripts/product-core/generateFunctionalSpec.ts
pnpm tsx scripts/product-core/generateUXAudit.ts
pnpm tsx scripts/product-core/generateRoadmap.ts
```

---

## 📊 Reports

All reports are automatically generated in `/docs`:

### Technical Reports
- **QIVO_TECHNICAL_AUDIT.md** - Comprehensive technical health check
- **QIVO_OPTIMIZATION_DIFF.md** - Performance improvements over time
- **QIVO_HEALTH_CHECK.md** - Real-time system status

### Product Reports
- **QIVO_MODULE_ANALYSIS.md** - Module structure and gaps
- **QIVO_FUNCTIONAL_SPEC.md** - User stories and requirements
- **QIVO_UX_UI_AUDIT.md** - UX/UI quality evaluation
- **QIVO_PRODUCT_ROADMAP.md** - Feature planning and priorities

---

## 🎯 Commit Message Standards

QIVO Engineer AI uses these prefixes:

| Prefix | Context |
|--------|---------|
| `🤖 QIVO Engineer AI` | Technical audit reports |
| `🔧 QIVO Engineer AI` | Auto-fix applications |
| `🚀 QIVO Engineer AI` | Deploy triggers |
| `🧭 QIVO Product Core` | Product documentation |
| `🎨 QIVO Product Core` | UX audit reports |

---

## 📈 Metrics Tracked

### Technical Metrics
- Build duration
- Bundle sizes (client + server)
- Dependencies (total, outdated, vulnerable)
- Code quality (lint errors, type errors)
- Test coverage
- API response times
- System health status

### Product Metrics
- Module count and structure
- User stories documented
- UX/UI compliance (Nielsen heuristics)
- Feature roadmap priorities
- Redundancies and gaps

---

## 🔒 Security

- All secrets are stored in GitHub Secrets (encrypted)
- No sensitive data is committed to the repository
- Deploy hooks use secure tokens
- Sentry DSN is optional for error tracking

---

## 🤝 Integration

### Render Deployment
Set `RENDER_DEPLOY_HOOK` to your Render deploy webhook URL.
Auto-fix workflow will trigger deployment on main branch.

### Sentry Monitoring
Set `SENTRY_DSN` to enable error tracking.
Failed workflows will report to Sentry automatically.

### Slack Notifications
Set `SLACK_WEBHOOK_URL` to receive alerts on failures.

---

## 📚 References

QIVO Engineer AI follows standards defined in:
- `/docs/Briefing Técnico QIVO.pdf`
- `/docs/AUDIT_REPORT_QIVO_v5.0.md`
- `/docs/QIVO_OPTIMIZATION_REPORT_v6.0.md`
- `/docs/ARCHITECTURE_QIVO_2.0.md`

---

## ✅ Status

**Version:** 2.0.0  
**Status:** 🟢 Active  
**Last Updated:** 2025-11-03

**Workflows:**
- ✅ Technical Core Audit (every 12h)
- ✅ Auto Fix & Deploy (triggered)
- ✅ Product Core Analysis (daily)

---

## 🎯 Next Steps

1. Configure GitHub Secrets
2. Enable workflows
3. Monitor first run
4. Review generated reports
5. Adjust thresholds if needed

---

**🤖 QIVO Engineer AI v2 - Autonomous. Intelligent. Continuous.**
