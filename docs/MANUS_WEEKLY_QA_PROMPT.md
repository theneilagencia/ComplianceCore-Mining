# Prompt para QA Semanal com Manus

**Quando usar:** Toda sexta-feira às 18h BRT (ou quando GitHub Actions reportar falha)

---

## 📋 Prompt Otimizado

Copie e cole este prompt em uma nova conversa com Manus:

```
🔍 QIVO Mining - QA Semanal Completo

Executar verificação completa de qualidade dos 11 módulos da plataforma QIVO Mining em produção (https://qivo-mining.onrender.com).

**Contexto:**
- Repositório: https://github.com/theneilagencia/ComplianceCore-Mining
- Versão atual: v1.1.0
- Último QA: [DATA DO ÚLTIMO QA]

**Tarefas:**

1. **Verificações Automáticas:**
   - Build sem erros
   - TypeScript sem erros
   - ESLint compliance
   - Security audit (npm audit)
   - Dependências desatualizadas

2. **Testes Funcionais (11 módulos):**
   - Dashboard Central
   - AI Report Generator
   - Manual Report Creator
   - Standards Converter
   - Regulatory Radar
   - KRCI Audit
   - Pre-Certification
   - ESG Reporting
   - Valuation Automático
   - Bridge Regulatória
   - Admin Core

3. **Verificações de Segurança:**
   - JWT refresh automático funcionando
   - HttpOnly cookies configurados
   - RBAC implementado
   - Multi-tenancy isolado

4. **Performance:**
   - Tempo de carregamento < 3s
   - Bundle size < 2MB
   - Sem memory leaks

5. **Correções Automáticas:**
   - Se bugs críticos encontrados → corrigir + commit
   - Se dependências vulneráveis → upgrade + commit
   - Se testes falharem → investigar + corrigir

6. **Documentação:**
   - Atualizar /docs/QA_REPORT.md
   - Criar entrada em CHANGELOG.md
   - Incrementar versão patch (v1.1.x)

7. **Entrega:**
   - Relatório completo de QA
   - Lista de correções aplicadas
   - Próximos passos recomendados

**Critério de Aceite:**
- QA Automático: 100%
- QA Funcional: 100%
- Segurança: 100%
- Documentação: Atualizada

**Formato de Saída:**
- Relatório em Markdown
- Commits semânticos (fix:, chore:, docs:)
- Hash SHA-256 dos commits
```

---

## 🎯 Variações do Prompt

### Prompt Curto (Rápido)
```
QA semanal QIVO Mining - verificar 11 módulos, corrigir bugs, atualizar docs
```

### Prompt Focado em Correções
```
QIVO Mining - GitHub Actions reportou falha no QA semanal. 
Investigar, corrigir problemas e atualizar documentação.
```

### Prompt Focado em Segurança
```
QIVO Mining - Auditoria de segurança semanal.
Verificar vulnerabilidades, JWT, cookies, RBAC e multi-tenancy.
```

---

## 📊 Checklist Pós-QA

Após Manus completar o QA, verificar:

- [ ] Relatório de QA gerado
- [ ] Bugs críticos corrigidos
- [ ] Commits semânticos criados
- [ ] Documentação atualizada
- [ ] Versão incrementada
- [ ] GitHub Actions passou (se re-executado)
- [ ] Produção funcionando

---

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────┐
│  Sexta-feira 18h BRT                                │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  GitHub Actions executa QA automático               │
│  - Build check                                      │
│  - TypeScript check                                 │
│  - Security audit                                   │
│  - Outdated dependencies                            │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
              ┌───────┴───────┐
              │               │
         ✅ Passou      ❌ Falhou
              │               │
              │               ▼
              │    ┌─────────────────────────┐
              │    │  Notificação enviada    │
              │    │  (email/Slack)          │
              │    └─────────────────────────┘
              │               │
              │               ▼
              │    ┌─────────────────────────┐
              │    │  Abrir Manus            │
              │    │  Colar prompt otimizado │
              │    └─────────────────────────┘
              │               │
              │               ▼
              │    ┌─────────────────────────┐
              │    │  Manus executa QA       │
              │    │  profundo + correções   │
              │    └─────────────────────────┘
              │               │
              └───────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Documentação atualizada                            │
│  - QA_REPORT.md                                     │
│  - CHANGELOG.md                                     │
│  - Versão incrementada                              │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Commits criados e pushed                           │
│  - fix: correções de bugs                           │
│  - chore: atualizações de deps                      │
│  - docs: documentação                               │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Deploy automático (Render.com)                     │
│  - Build                                            │
│  - Deploy                                           │
│  - Produção atualizada                              │
└─────────────────────────────────────────────────────┘
```

---

## 📅 Histórico de QA

Manter registro de cada execução:

| Data | Executor | Status | Bugs Encontrados | Correções | Versão |
|------|----------|--------|------------------|-----------|--------|
| 2025-10-28 | Manus (Manual) | ✅ Passou | 0 | 0 | v1.1.0 |
| 2025-11-01 | GitHub Actions | ✅ Passou | 0 | 0 | v1.1.1 |
| 2025-11-08 | GitHub Actions + Manus | ⚠️ Warnings | 2 | 2 | v1.1.2 |

---

## 🛠️ Troubleshooting

### GitHub Actions não executou
1. Verificar se workflow está habilitado
2. Verificar cron syntax (UTC vs BRT)
3. Verificar permissões do GITHUB_TOKEN

### Manus não consegue acessar repositório
1. Fornecer URL do repositório
2. Fornecer contexto da última sprint
3. Fornecer credenciais de teste (se necessário)

### Correções não foram aplicadas
1. Verificar se commits foram criados
2. Verificar se push foi bem-sucedido
3. Verificar se deploy foi acionado

---

## 📞 Suporte

**Documentação:**
- QA Report: `/docs/QA_REPORT.md`
- Validation Checklist: `/docs/PRODUCTION_VALIDATION_CHECKLIST.md`
- Sprint Summary: `/docs/SPRINT_2_SUMMARY.md`

**Repositório:** https://github.com/theneilagencia/ComplianceCore-Mining  
**Produção:** https://qivo-mining.onrender.com

---

**Criado em:** 28 de Outubro de 2025  
**Versão:** 1.0  
**Autor:** QIVO Mining Development Team

