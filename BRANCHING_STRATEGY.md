# Estratégia de Branches - QIVO Mining

## Estrutura de Branches

### `main` (Produção)
- **Ambiente:** Produção (www.qivomining.com)
- **Proteção:** Apenas merges via Pull Request
- **Deploy:** Automático para Google Cloud Run (qivo-mining)
- **Estabilidade:** Sempre estável e testado

### `develop` (Desenvolvimento)
- **Ambiente:** Staging (qivo-mining-staging)
- **Proteção:** Aceita commits diretos e PRs
- **Deploy:** Automático para Google Cloud Run Staging
- **Propósito:** Integração e testes antes de produção

### `feature/*` (Features)
- **Exemplo:** `feature/roi-calculator`, `feature/radar-api`
- **Base:** Criado a partir de `develop`
- **Merge:** Para `develop` via Pull Request
- **Propósito:** Desenvolvimento de novas funcionalidades

### `hotfix/*` (Correções Urgentes)
- **Exemplo:** `hotfix/login-error`
- **Base:** Criado a partir de `main`
- **Merge:** Para `main` E `develop`
- **Propósito:** Correções críticas em produção

## Fluxo de Trabalho

### Desenvolvimento de Nova Feature
```bash
# 1. Criar branch a partir de develop
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature

# 2. Desenvolver e testar localmente
# ... fazer mudanças ...
git add .
git commit -m "feat: descrição da feature"

# 3. Push para repositório
git push origin feature/nome-da-feature

# 4. Criar Pull Request para develop
# 5. Após aprovação, merge para develop
# 6. Testar em staging
# 7. Se OK, criar PR de develop para main
```

### Correção de Bug em Produção
```bash
# 1. Criar hotfix a partir de main
git checkout main
git pull origin main
git checkout -b hotfix/nome-do-bug

# 2. Corrigir bug
git add .
git commit -m "fix: descrição da correção"

# 3. Push e PR para main
git push origin hotfix/nome-do-bug

# 4. Após merge em main, fazer merge também em develop
git checkout develop
git merge hotfix/nome-do-bug
git push origin develop
```

## Convenção de Commits

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação (não afeta código)
- `refactor:` Refatoração
- `test:` Adicionar testes
- `chore:` Tarefas de manutenção

## Ambientes

| Branch | Ambiente | URL | Deploy |
|--------|----------|-----|--------|
| `main` | Produção | www.qivomining.com | Automático |
| `develop` | Staging | qivo-mining-staging-xxx.run.app | Automático |
| `feature/*` | Local | localhost:5000 | Manual |

## Regras de Proteção

### Branch `main`
- ✅ Requer Pull Request
- ✅ Requer aprovação
- ✅ Requer testes passando
- ❌ Não permite push direto
- ❌ Não permite force push

### Branch `develop`
- ✅ Aceita commits diretos (para testes rápidos)
- ✅ Aceita Pull Requests
- ⚠️ Permite force push (com cuidado)
