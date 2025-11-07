# Guia de Testes - QIVO Mining

## Visão Geral

A plataforma QIVO Mining possui uma suíte completa de testes automatizados para garantir qualidade e estabilidade.

## Tipos de Testes

### 1. **Smoke Tests** (Testes de Fumaça)
Testes rápidos e básicos para detectar problemas críticos.

```bash
pnpm test tests/smoke
```

**Quando executar:**
- Antes de cada commit
- Após mudanças de configuração
- Antes de deploy

### 2. **Unit Tests** (Testes Unitários)
Testam funções e componentes isolados.

```bash
pnpm test
```

**Cobertura atual:**
- ✅ 6 arquivos de teste passando
- ⚠️ 3 arquivos com falhas (APIs externas)
- 📊 220 testes passando / 52 falhando

**Arquivos testados:**
- Módulo Radar (notificações, scrapers, clientes)
- Módulo Technical Reports (mappers, PDF, auditoria)
- Integrações oficiais (ANM, ANP, CPRM, IBAMA)

### 3. **Integration Tests** (Testes de Integração)
Testam interação entre módulos.

```bash
pnpm test server/modules
```

### 4. **E2E Tests** (Testes End-to-End)
Testam fluxos completos da aplicação.

```bash
pnpm test:e2e
```

**Fluxos testados:**
- Autenticação (login/registro)
- Auditoria KRCI
- Geração de relatórios

## Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm test` | Executa todos os testes |
| `pnpm test:watch` | Executa testes em modo watch |
| `pnpm test:coverage` | Gera relatório de cobertura |
| `pnpm test:ui` | Interface visual para testes |
| `pnpm test:e2e` | Executa testes E2E |
| `pnpm test:e2e:ui` | Interface visual para E2E |
| `pnpm check` | Verifica tipos TypeScript |

## Estrutura de Testes

```
tests/
├── smoke/              # Testes de fumaça
│   └── basic.test.ts
├── unit/               # Testes unitários gerais
├── e2e/                # Testes end-to-end
│   ├── auth.spec.ts
│   └── audit-krci.e2e.test.ts
└── fixtures/           # Dados de teste

server/
└── modules/
    ├── radar/
    │   └── __tests__/  # Testes do módulo Radar
    └── technical-reports/
        └── __tests__/  # Testes do módulo Reports

client/
└── src/
    └── modules/
        └── radar/
            └── components/
                └── __tests__/  # Testes de componentes React
```

## Configuração

### Vitest (Unit/Integration)
Arquivo: `vitest.config.ts`

**Configurações importantes:**
- Environment: jsdom (para testes React)
- Coverage: v8 provider
- Thresholds: 15-20% (baseline atual)

### Playwright (E2E)
Arquivo: `playwright.config.ts`

**Browsers testados:**
- Chromium
- Firefox
- WebKit (Safari)

## Metas de Cobertura

| Sprint | Meta | Status |
|--------|------|--------|
| Sprint 2 | 15-20% | ✅ Atingido |
| Sprint 3 | 40-50% | 🎯 Próximo |
| Sprint 4 | 70-80% | 📅 Futuro |

## Problemas Conhecidos

### Testes Falhando (52 falhas)

**Causa:** Testes de integração com APIs externas (SIGMINE, DOU) que requerem:
- Conexão com APIs reais
- Credenciais válidas
- Dados de teste específicos

**Solução planejada:**
- Implementar mocks para APIs externas
- Criar fixtures de dados
- Separar testes de integração real dos unitários

### Testes que Passam (220 sucessos)

✅ Todos os testes de lógica interna e componentes React estão funcionando.

## Boas Práticas

### Escrevendo Testes

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Nome do Módulo', () => {
  beforeEach(() => {
    // Setup antes de cada teste
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Nomenclatura

- **Arquivos:** `*.test.ts` ou `*.spec.ts`
- **Describes:** Nome do módulo/componente
- **Its:** Começar com "should" + ação esperada

### Organização

- Colocar testes próximos ao código testado
- Usar `__tests__/` para múltiplos arquivos
- Criar fixtures em `tests/fixtures/`

## CI/CD

Os testes são executados automaticamente no GitHub Actions:

- ✅ Em cada push para `main` ou `develop`
- ✅ Em cada Pull Request
- ✅ Antes de cada deploy

**Pipeline:**
1. Type check (`pnpm check`)
2. Unit tests (`pnpm test`)
3. Coverage report (`pnpm test:coverage`)
4. Deploy (se testes passarem)

## Debugging

### Testes Unitários

```bash
# Modo watch (re-executa ao salvar)
pnpm test:watch

# Interface visual
pnpm test:ui

# Teste específico
pnpm test path/to/test.test.ts
```

### Testes E2E

```bash
# Modo headed (ver navegador)
pnpm test:e2e:headed

# Modo debug (passo a passo)
pnpm test:e2e:debug

# Interface visual
pnpm test:e2e:ui
```

## Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Suporte

Para dúvidas sobre testes:
1. Consulte esta documentação
2. Veja exemplos em `tests/` e `__tests__/`
3. Entre em contato com a equipe de desenvolvimento
