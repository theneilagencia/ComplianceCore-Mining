# Integrações Oficiais - APIs Governamentais

## 📋 Visão Geral

FASE 2 COMPLETA ✅ - Sistema de validação com APIs reais dos órgãos reguladores brasileiros:

- **ANM** (Agência Nacional de Mineração) - Títulos minerários
- **CPRM** (Serviço Geológico do Brasil) - Dados geológicos
- **IBAMA** (Instituto Brasileiro do Meio Ambiente) - Licenças ambientais  
- **ANP** (Agência Nacional do Petróleo) - Concessões de petróleo e gás

---

## 🚀 Configuração

### 1. Variáveis de Ambiente

Adicione ao arquivo `.env`:

```bash
# Feature Flag (OBRIGATÓRIO)
ENABLE_OFFICIAL_INTEGRATIONS=false  # Mude para 'true' para ativar

# API Keys dos órgãos (obtenha junto às agências)
ANM_API_KEY=your_anm_jwt_token_here
CPRM_API_KEY=your_cprm_api_key_here
IBAMA_API_KEY=your_ibama_api_key_here
ANP_API_KEY=your_anp_api_key_here
```

### 2. Como Obter API Keys

#### ANM (Agência Nacional de Mineração)
1. Acesse: https://sistemas.anm.gov.br/api/
2. Cadastre-se como desenvolvedor
3. Solicite credenciais JWT
4. Rate Limit: 100 requisições/minuto

#### CPRM (Serviço Geológico)
1. Acesse: https://geosgb.cprm.gov.br/api/
2. Solicite chave de API via formulário
3. Rate Limit: 60 requisições/minuto

#### IBAMA (Meio Ambiente)
1. Acesse: https://servicos.ibama.gov.br/licenciamento/
2. Login Gov.br necessário
3. Solicite token de acesso
4. Rate Limit: 50 requisições/minuto

#### ANP (Petróleo e Gás)
1. Acesse: https://dados.anp.gov.br/api/
2. Cadastro via Dados Abertos
3. Token gratuito para consultas públicas
4. Rate Limit: 100 requisições/minuto

---

## 📊 Uso

### Validação Completa de Relatório

```typescript
import { validateReportData } from './services/official-integrations';

const report = {
  miningTitleNumber: '48226.800153/2023',
  commodity: 'Ouro',
  latitude: -19.9167,
  longitude: -43.9345,
  geologicalFormation: 'Supergrupo Minas',
  environmentalLicense: '123456/2023',
  concessionNumber: 'BM-S-11', // Para petróleo/gás
};

const summary = await validateReportData(report);

console.log(`Score: ${summary.score}/100`);
console.log(`Validações: ${summary.passed}/${summary.totalChecks} válidas`);
console.log(`Reprovadas: ${summary.failed}`);
console.log(`Erros API: ${summary.errors}`);
```

### Validação de Campo Individual

```typescript
import { validateField } from './services/official-integrations';

// Validação em tempo real no formulário
const result = await validateField(
  'miningTitleNumber',
  '48226.800153/2023'
);

if (result.status === 'valid') {
  console.log('✓ Processo ANM válido');
} else if (result.status === 'invalid') {
  console.error('✗ Processo inválido:', result.message);
} else if (result.status === 'not_found') {
  console.warn('⚠ Processo não encontrado no sistema ANM');
}
```

### Status de Validação (UI)

```typescript
import { getValidationStatusMessage } from './services/official-integrations';

const message = getValidationStatusMessage(result);

// message = {
//   type: 'success' | 'error' | 'warning' | 'info',
//   title: '✓ ANM Validado',
//   description: 'Processo válido - CONCESSÃO DE LAVRA - Ouro - Ouro Preto/MG'
// }
```

---

## 🔍 Validações Implementadas

### ANM - Agência Nacional de Mineração

#### 1. Número de Processo
- **Formato**: `XXXXX.XXXXXX/XXXX` (Ex: `48226.800153/2023`)
- **API**: `https://sistemas.anm.gov.br/SCM/api/v2/processos/{number}`
- **Validações**:
  - ✅ Formato correto
  - ✅ Processo existe no sistema ANM
  - ✅ Status = ATIVO (rejeita SUSPENSO, CANCELADO, ARQUIVADO)
  - ✅ Fase válida (Concessão de Lavra, Autorização de Pesquisa, etc.)
  - ✅ Titular correto (CPF/CNPJ)
  - ✅ Substância válida

#### 2. Substância Mineral
- **Lista Oficial**: Portaria DNPM 155/2016
- **Validações**:
  - ✅ Nomenclatura ANM (Ouro, Ferro, Cobre, etc.)
  - ⚠️ Substâncias não oficiais marcadas como aviso

**Retorno ANM**:
```json
{
  "numero": "48226.800153/2023",
  "situacao": "ATIVO",
  "fase": "CONCESSÃO DE LAVRA",
  "substancia": "Ouro",
  "area_ha": 1234.56,
  "municipio": "Ouro Preto",
  "uf": "MG",
  "titular": {
    "nome": "Mineradora XYZ Ltda",
    "cpf_cnpj": "12.345.678/0001-99"
  },
  "data_publicacao": "2023-03-15"
}
```

---

### CPRM - Serviço Geológico do Brasil

#### Dados Geológicos por Coordenadas
- **API**: `https://geosgb.cprm.gov.br/api/v1/geology?lat={lat}&lon={lon}`
- **Validações**:
  - ✅ Coordenadas dentro do Brasil (-33.75 a 5.27, -73.99 a -28.84)
  - ✅ Formação geológica oficial CPRM
  - ✅ Idade geológica válida
  - ✅ Litologia compatível
  - ⚠️ Província/distrito mineral (se disponível)

**Retorno CPRM**:
```json
{
  "latitude": -19.9167,
  "longitude": -43.9345,
  "formacao_geologica": "Supergrupo Minas",
  "idade_geologica": "Paleoproterozoico",
  "litologia": "Formação Ferrífera Bandada",
  "mineralizacao": ["Ferro", "Ouro"],
  "provincia_mineral": "Quadrilátero Ferrífero",
  "fonte": "Mapa Geológico do Brasil 1:1.000.000"
}
```

---

### IBAMA - Instituto Brasileiro do Meio Ambiente

#### Licença Ambiental
- **Formato**: `XXXXXX/XXXX` (Ex: `123456/2023`)
- **API**: `https://servicos.ibama.gov.br/licenciamento/api/v1/consulta?numero={number}`
- **Validações**:
  - ✅ Formato correto
  - ✅ Licença existe no sistema IBAMA
  - ✅ Status = ATIVO
  - ✅ Tipo válido: LP (Prévia), LI (Instalação), LO (Operação)
  - ✅ Não expirada (data_validade > hoje)
  - ⚠️ LA (Autorização) não aceita para relatórios técnicos
  - ✅ Condicionantes atendidas

**Retorno IBAMA**:
```json
{
  "numero": "123456/2023",
  "tipo": "LI",
  "status": "ATIVO",
  "empreendimento": "Mina de Ouro XYZ",
  "titular": {
    "nome": "Mineradora XYZ Ltda",
    "cpf_cnpj": "12.345.678/0001-99"
  },
  "atividade": "Extração de minério de ouro",
  "municipio": "Ouro Preto",
  "uf": "MG",
  "data_emissao": "2023-01-15",
  "data_validade": "2025-01-15",
  "condicoes": [
    "Monitoramento trimestral de qualidade da água",
    "Plano de recuperação de áreas degradadas"
  ]
}
```

---

### ANP - Agência Nacional do Petróleo

#### Concessão/Bloco Exploratório
- **Formato**: `XX-Y-ZZ` (Ex: `BM-S-11`, `ES-T-19`)
- **API**: `https://dados.anp.gov.br/api/v1/blocos/{block}`
- **Validações**:
  - ✅ Formato correto
  - ✅ Bloco existe na base ANP
  - ✅ Situação = ATIVO
  - ✅ Fase válida (EXPLORAÇÃO, PRODUÇÃO, DESENVOLVIMENTO)
  - ✅ Concessão não expirada
  - ✅ Operador válido (CNPJ)
  - ⚠️ Participantes e percentual

**Retorno ANP**:
```json
{
  "bloco": "BM-S-11",
  "bacia": "Santos",
  "situacao": "ATIVO",
  "fase": "PRODUÇÃO",
  "concessao_numero": "ANP/DPC-002/2010",
  "operador": {
    "nome": "Petrobras S.A.",
    "cnpj": "33.000.167/0001-01",
    "participacao": 65.0
  },
  "participantes": [
    { "nome": "Shell Brasil", "cnpj": "...", "participacao": 25.0 },
    { "nome": "Total Energies", "cnpj": "...", "participacao": 10.0 }
  ],
  "data_inicio": "2010-12-15",
  "data_termino": "2045-12-15",
  "area_km2": 800.5,
  "laminaDagua_m": 2150,
  "producao": {
    "petroleo_bpd": 150000,
    "gas_m3d": 8500000
  }
}
```

---

## 🛡️ Comportamento de Fallback

Sistema possui **fallback inteligente** quando APIs não estão disponíveis:

### 1. API Key Não Configurada
```
[ANM] API Key not configured (ANM_API_KEY), using mock validation
Resultado: Validação de FORMATO apenas (não consulta API)
```

### 2. API Indisponível (timeout/erro)
```
Status: 'error'
Message: 'Erro ao consultar ANM: timeout exceeded'
Comportamento: Não penaliza score (erro ≠ inválido)
```

### 3. Processo Não Encontrado
```
Status: 'not_found'
Message: 'Processo não encontrado na base de dados da ANM'
Comportamento: Penaliza menos que 'invalid' (-10 vs -30 pontos)
```

### 4. Feature Flag Desabilitada
```
ENABLE_OFFICIAL_INTEGRATIONS=false
Resultado: Retorna score 100 (não executa validações)
```

---

## 📈 Sistema de Pontuação

### Pesos por Status
- **valid**: +0 (passa)
- **invalid**: -30 pontos (erro crítico)
- **not_found**: -10 pontos (aviso)
- **error**: -5 pontos (falha de API)

### Cálculo de Score
```typescript
score = 100 - (invalid × 30 + not_found × 10 + error × 5)
score = Math.max(0, score) // Mínimo 0
```

### Exemplos
| Cenário | Cálculo | Score |
|---------|---------|-------|
| 5 validações, todas válidas | 100 - 0 | 100 |
| 5 validações, 1 inválida | 100 - 30 | 70 |
| 5 validações, 2 não encontradas | 100 - 20 | 80 |
| 5 validações, 1 erro de API | 100 - 5 | 95 |
| 3 inválidas + 2 não encontradas | 100 - (90 + 20) | 0 |

---

## 🔧 Cache (Redis)

Sistema possui cache in-memory (24h TTL) para reduzir chamadas às APIs:

```typescript
// Primeira consulta: API call (200-500ms)
await validateWithANM_Real('48226.800153/2023');

// Segunda consulta: cache hit (<1ms)
await validateWithANM_Real('48226.800153/2023'); // Retorna do cache
```

**Configuração de Cache**:
- TTL: 86400s (24 horas)
- Estratégia: Memory Map (Redis planejado)
- Key pattern: `{agency}:process:{number}`
- Limpeza: Expiração automática

---

## 🚦 Rate Limiting

Limites por agência (já implementados nas APIs):

| Agência | Limite | Janela | Comportamento |
|---------|--------|--------|---------------|
| ANM | 100 req | 1 min | HTTP 429 (retry after 60s) |
| CPRM | 60 req | 1 min | HTTP 429 (retry after 60s) |
| IBAMA | 50 req | 1 min | HTTP 429 (retry after 60s) |
| ANP | 100 req | 1 min | HTTP 429 (retry after 60s) |

**Recomendações**:
- Use cache agressivamente
- Implemente exponential backoff
- Considere batch validation (não implementado ainda)

---

## 🧪 Testes

```bash
# Testar ANM (mock)
curl -X POST http://localhost:3000/api/validate/field \
  -H "Content-Type: application/json" \
  -d '{"field":"miningTitleNumber","value":"48226.800153/2023"}'

# Testar CPRM (mock)
curl -X POST http://localhost:3000/api/validate/field \
  -H "Content-Type: application/json" \
  -d '{"field":"geologicalFormation","value":"Supergrupo Minas","context":{"latitude":-19.9167,"longitude":-43.9345}}'

# Validação completa de relatório
curl -X POST http://localhost:3000/api/technical-reports/validate \
  -H "Content-Type: application/json" \
  -d '{
    "miningTitleNumber": "48226.800153/2023",
    "commodity": "Ouro",
    "latitude": -19.9167,
    "longitude": -43.9345,
    "environmentalLicense": "123456/2023"
  }'
```

---

## 📝 Logs

Sistema possui logs detalhados para debug:

```
[ANM] Validating process: 48226.800153/2023
[ANM] Process data received: { numero: '...', situacao: 'ATIVO', fase: 'CONCESSÃO DE LAVRA' }
[Cache] SET anm:process:48226.800153/2023 (TTL: 86400s)

[CPRM] Validating geology at: { latitude: -19.9167, longitude: -43.9345 }
[CPRM] Geology data received: Supergrupo Minas

[IBAMA] Validating license: 123456/2023
[IBAMA] License data received: { numero: '...', tipo: 'LI', status: 'ATIVO' }

[ANP] Validating concession: BM-S-11
[ANP] Concession data received: { bloco: 'BM-S-11', situacao: 'ATIVO', fase: 'PRODUÇÃO' }
```

---

## ⚠️ Troubleshooting

### Erro: "API Key not configured"
**Solução**: Configure a variável de ambiente no `.env`
```bash
ANM_API_KEY=seu_token_aqui
```

### Erro: "401 Unauthorized"
**Causa**: Token JWT inválido ou expirado  
**Solução**: Solicite novo token junto à agência

### Erro: "429 Too Many Requests"
**Causa**: Rate limit excedido  
**Solução**: Aguarde 60 segundos ou implemente retry com backoff

### Erro: "timeout exceeded"
**Causa**: API lenta ou indisponível  
**Solução**: Aumente timeout (padrão 10s) ou use cache

### Validações retornam score 100 sempre
**Causa**: Feature flag desabilitada  
**Solução**: `ENABLE_OFFICIAL_INTEGRATIONS=true` no `.env`

---

## 📊 Roadmap

- [x] FASE 1: Implementação ANM ✅
- [x] FASE 2: Implementação CPRM ✅
- [x] FASE 3: Implementação IBAMA ✅
- [x] FASE 4: Implementação ANP ✅
- [x] FASE 5: Cache in-memory ✅
- [ ] FASE 6: Migração cache para Redis
- [ ] FASE 7: Batch validation (múltiplos processos)
- [ ] FASE 8: Webhooks para atualizações
- [ ] FASE 9: Dashboard de monitoramento
- [ ] FASE 10: Retry com exponential backoff

---

## 🔗 Links Oficiais

- **ANM**: https://www.gov.br/anm/pt-br
- **CPRM**: https://www.cprm.gov.br/
- **IBAMA**: https://www.gov.br/ibama/pt-br
- **ANP**: https://www.gov.br/anp/pt-br

---

## 📞 Suporte

Para problemas com as integrações, contate:

- **Técnico**: Abra issue no GitHub
- **APIs Governamentais**: Contate diretamente as agências
- **Credenciais**: Solicite via portais oficiais das agências

---

**Status**: FASE 2 COMPLETA ✅  
**Última atualização**: 2024  
**Versão**: 2.0.0
