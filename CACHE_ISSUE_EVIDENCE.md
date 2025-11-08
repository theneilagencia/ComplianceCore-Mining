# Evidência do Problema de Cache - ROI Calculator

## Data: 2025-11-07 13:32 GMT-3

## Problema Identificado

Após múltiplos deploys com estratégias de cache-busting, a calculadora ROI ainda está exibindo **R$** (Real Brasileiro) em vez de **$** (Dólar Americano).

## Evidências Visuais

### Screenshot da Calculadora
- **URL testada:** https://www.qivomining.com/?nocache=1731000708
- **Timestamp do teste:** 2025-11-07 13:32
- **Resultado:** Calculadora mostrando "R$ 30.000" em vez de "$ 30.000"

### Campos Visíveis no Formulário
1. **Label do campo:** "Custo atual por relatório (R$)" - AINDA EM BRL
2. **Resultado calculado:** "R$ 30.000" - AINDA EM BRL

## Código Atual no Repositório

O arquivo `client/src/components/ROICalculator.tsx` foi atualizado para USD:
- Linhas modificadas para usar "$" em vez de "R$"
- Commit realizado e pushed para o repositório
- Deploy realizado com sucesso (revisão qivo-mining-00144-rcd)

## Estratégias Já Tentadas

1. ✅ **Headers HTTP anti-cache** - Adicionados ao Express server
2. ✅ **Remoção de hashing de arquivos** - vite.config.ts modificado
3. ✅ **Deploy forçado com rebuild** - Timestamp adicionado ao build
4. ✅ **Query parameter no-cache** - Testado com ?nocache=timestamp
5. ❌ **Resultado:** Cache ainda persiste

## Análise do Problema

### Possíveis Causas
1. **Cloudflare CDN Cache:** Cache agressivo no nível do CDN (sem acesso ao dashboard)
2. **Browser Cache:** Cache local do navegador (testado com query parameter, não resolveu)
3. **Service Worker:** Possível service worker cacheando assets
4. **Build Cache:** Arquivos não sendo regenerados no build

### Evidência de Cache Ativo
O conteúdo Markdown extraído da página mostra:
```
Custo atual por relatório (R$)
Economia Anual
R$ 30.000
```

Isso confirma que o HTML servido ainda contém referências a BRL.

## Próximas Ações Recomendadas

1. **Verificar se há Service Worker registrado** no site
2. **Adicionar versão ao nome do componente** (ex: ROICalculatorV2)
3. **Testar em navegador anônimo** sem cache
4. **Verificar se o build está realmente gerando novos arquivos**
5. **Considerar mudança de rota** (ex: /calculator-v2)

## Status Atual

⚠️ **CRÍTICO:** Mudança de moeda não está sendo refletida em produção apesar de múltiplos deploys.

## Revisão de Produção Atual
- **Service:** qivo-mining
- **Revision:** qivo-mining-00144-rcd
- **Traffic:** 100%
- **Status:** Serving (mas com cache antigo)


---

## Atualização: 2025-11-07 13:46 GMT-3

### Deploy com File Hashing Concluído

**Revisão:** qivo-mining-00016-kc4 (100% do tráfego)

**Estratégia:** Reativado file hashing no Vite para gerar nomes únicos de arquivos

**Resultado:** ❌ **CACHE AINDA PERSISTE**

A calculadora continua mostrando:
- Label: "Custo atual por relatório (R$)"
- Valor: "R$ 30.000"

### Análise Profunda

O problema é mais complexo do que cache de CDN. Possíveis causas:

1. **HTML index.html também está cacheado** - O Cloudflare pode estar cacheando o HTML principal que referencia os arquivos JS antigos
2. **Service Worker** - Pode haver um service worker registrado cacheando assets
3. **Cloudflare Cache Level: Standard** - Cache agressivo de HTML e assets estáticos
4. **Browser Cache** - Mesmo com query parameters, o browser pode estar usando cache local

### Próximas Ações Necessárias

**Opção 1: Verificar e limpar Service Worker**
- Inspecionar se há service worker registrado
- Desregistrar se existir

**Opção 2: Adicionar meta tags no HTML**
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

**Opção 3: Modificar o servidor Express para servir index.html com headers anti-cache**
- Adicionar headers específicos para HTML
- Garantir que o HTML nunca seja cacheado

**Opção 4: Testar em navegador anônimo/incógnito**
- Verificar se o problema é cache local do navegador

**Opção 5: Verificar logs do Cloud Run**
- Confirmar que a nova revisão está realmente servindo as requisições
- Verificar se há erros no build/deploy

### Conclusão Temporária

O cache do Cloudflare é extremamente agressivo e não está respeitando os headers HTTP enviados pelo servidor Express. Precisamos de uma abordagem mais radical para forçar a atualização.
