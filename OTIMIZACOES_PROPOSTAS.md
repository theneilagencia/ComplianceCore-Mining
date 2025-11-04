# 🚀 Otimizações Propostas - Redução de Tempo de Deploy

## 🎯 Objetivo
Reduzir tempo de deploy de **6 minutos → 4-5 minutos** (-20%) através de otimizações gratuitas.

---

## 📊 Análise de Dependências Pesadas

### Total Atual
- **node_modules**: 1.1 GB
- **Tempo de install**: ~2-3 min (40-50% do deploy)

### Dependências Pesadas Identificadas

| Dependência | Tamanho Estimado | Uso Atual | Ação Proposta |
|-------------|------------------|-----------|---------------|
| **@tensorflow/tfjs-node** | ~200-300 MB | ❓ Não claro | ⚠️ Investigar uso |
| **puppeteer** | ~150-200 MB | PDF generation? | 🔄 Substituir por API |
| **@playwright/test** | ~100-150 MB | E2E testing | ✅ Manter (devDep) |
| **sharp** | ~50-100 MB | Image processing | ✅ Manter (essencial) |
| **mysql2** | ~10-20 MB | ❌ Não usado | ❌ **REMOVER** |

**Total removível**: ~200-350 MB (-18-32% de node_modules)

---

## ✅ Otimizações Recomendadas

### 1. Remover Dependências Não Utilizadas

#### 1.1. mysql2 (ALTA PRIORIDADE)
```bash
pnpm remove mysql2
```

**Motivo**: Projeto usa PostgreSQL, não MySQL.  
**Impacto**: -10-20 MB, -5s no install  
**Risco**: Baixo (não usado)

#### 1.2. TensorFlow.js (MÉDIA PRIORIDADE)
```bash
# Verificar se está sendo usado
grep -r "tensorflow" server/ client/

# Se não estiver sendo usado:
pnpm remove @tensorflow/tfjs @tensorflow/tfjs-node @tensorflow-models/coco-ssd
```

**Motivo**: TensorFlow.js é muito pesado (~300 MB) e pode não estar sendo usado.  
**Impacto**: -200-300 MB, -30-60s no install  
**Risco**: Médio (precisa verificar uso)

#### 1.3. Puppeteer (BAIXA PRIORIDADE)
```bash
# Verificar se está sendo usado
grep -r "puppeteer" server/ client/

# Se usado apenas para PDF, substituir por API externa
pnpm remove puppeteer
```

**Motivo**: Puppeteer inclui Chromium completo (~150 MB).  
**Alternativa**: Usar API de PDF (ex: PDFKit, jsPDF, ou API externa)  
**Impacto**: -150-200 MB, -20-40s no install  
**Risco**: Médio (precisa substituir funcionalidade)

---

### 2. Otimizar Bundle Size (Code Splitting)

#### 2.1. Lazy Loading de Páginas Grandes

**Páginas identificadas**:
- `AuditKRCI.tsx` (472 KB gzipped: 119 KB)
- `index.js` (441 KB gzipped: 129 KB)
- `RadarPage.tsx` (182 KB gzipped: 50 KB)

**Implementação**:
```typescript
// Antes
import AuditKRCI from './pages/AuditKRCI';

// Depois
const AuditKRCI = lazy(() => import('./pages/AuditKRCI'));
```

**Impacto**: -10-15% no tempo de build, melhor performance inicial  
**Risco**: Baixo (padrão React)

#### 2.2. Code Splitting de Bibliotecas Grandes

**Bibliotecas identificadas**:
- `trpc.js` (82 KB)
- `ui.js` (103 KB)

**Implementação**: Vite já faz code splitting automático, mas pode ser melhorado.

**Impacto**: -5-10% no tempo de build  
**Risco**: Baixo

---

### 3. Otimizar Configuração de Build

#### 3.1. Usar esbuild para Minificação
```javascript
// vite.config.ts
export default {
  build: {
    minify: 'esbuild', // Mais rápido que terser
    target: 'es2020',
  }
}
```

**Impacto**: -10-20% no tempo de build  
**Risco**: Baixo

#### 3.2. Desabilitar Source Maps em Produção
```javascript
// vite.config.ts
export default {
  build: {
    sourcemap: false, // Desabilitar em produção
  }
}
```

**Impacto**: -5-10% no tempo de build, -30% no tamanho do upload  
**Risco**: Baixo (pode dificultar debug em produção)

---

## 📈 Impacto Estimado

### Cenário Conservador (Apenas mysql2)
- **Redução de node_modules**: -10-20 MB (-1-2%)
- **Redução de tempo de install**: -5-10s (-3-5%)
- **Tempo total de deploy**: 6 min → **5.5-5.8 min** (-5-8%)

### Cenário Moderado (mysql2 + TensorFlow.js)
- **Redução de node_modules**: -210-320 MB (-19-29%)
- **Redução de tempo de install**: -35-70s (-20-40%)
- **Tempo total de deploy**: 6 min → **4.5-5 min** (-17-25%)

### Cenário Agressivo (mysql2 + TensorFlow.js + Puppeteer)
- **Redução de node_modules**: -360-520 MB (-33-47%)
- **Redução de tempo de install**: -55-110s (-30-60%)
- **Tempo total de deploy**: 6 min → **4-4.5 min** (-25-33%)

---

## 🎯 Plano de Ação Recomendado

### Fase 1: Verificação (10 minutos)
1. ✅ Verificar se `mysql2` está sendo usado
2. ✅ Verificar se `@tensorflow/tfjs` está sendo usado
3. ✅ Verificar se `puppeteer` está sendo usado

### Fase 2: Remoção Segura (5 minutos)
1. ✅ Remover `mysql2` (se não usado)
2. ⚠️ Remover TensorFlow.js (se não usado)
3. ⚠️ Remover Puppeteer (se não usado ou substituível)

### Fase 3: Teste Local (10 minutos)
1. ✅ `pnpm install` (verificar se não quebrou nada)
2. ✅ `pnpm run build` (verificar se build funciona)
3. ✅ `pnpm run dev` (verificar se app funciona)

### Fase 4: Deploy e Monitoramento (10-15 minutos)
1. ✅ Commit e push
2. ✅ Monitorar tempo de deploy
3. ✅ Validar app em produção

**Tempo total estimado**: ~35-40 minutos

---

## ⚠️ Riscos e Mitigações

### Risco 1: Quebrar Funcionalidade
**Mitigação**: Testar localmente antes de fazer deploy

### Risco 2: Dependências Transitivas
**Mitigação**: Verificar `pnpm why <pacote>` antes de remover

### Risco 3: Rollback Necessário
**Mitigação**: Manter commit anterior disponível para rollback rápido

---

## 📝 Próximos Passos

1. ✅ **Verificar uso de mysql2, tensorflow, puppeteer**
2. ✅ **Remover dependências não utilizadas**
3. ✅ **Testar build local**
4. ✅ **Deploy e monitorar**
5. ✅ **Relatório final com resultados**

---

**Status**: ⏳ **Aguardando aprovação para prosseguir**
