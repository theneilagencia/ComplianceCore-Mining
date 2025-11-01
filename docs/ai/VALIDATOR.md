# 🔍 QIVO Validator AI - Documentação Técnica

## 📋 Visão Geral

O **Validator AI** é o primeiro módulo da QIVO Intelligence Layer, especializado em análise automatizada de conformidade regulatória para documentos técnicos de mineração.

## 🎯 Funcionalidades

### 1. Análise de Conformidade
- ✅ JORC Code (Joint Ore Reserves Committee)
- ✅ NI 43-101 (Canadian National Instrument)
- ✅ PRMS (Petroleum Resources Management System)
- ✅ Procedimentos QA/QC
- ✅ Qualificação de pessoas competentes

### 2. Scoring Inteligente
- Score de 0-100
- Classificação de risco em 4 níveis
- Breakdown detalhado por categoria
- Identificação de pontos fortes e fracos
- Recomendações personalizadas

### 3. Suporte a Múltiplos Formatos
- PDF (via PyPDF2)
- DOCX (via python-docx)
- TXT (texto plano)

## 📥 Entradas

### Opção 1: Upload de Arquivo

**Endpoint**: `POST /ai/analyze`

**Requisição**:
```bash
curl -X POST "http://localhost:8001/ai/analyze" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/document.pdf"
```

**Formatos Aceitos**:
- `.pdf` - Portable Document Format
- `.docx` / `.doc` - Microsoft Word
- `.txt` - Texto plano

**Limite de Tamanho**: 10MB

### Opção 2: Análise de Texto Direto

**Endpoint**: `POST /ai/analyze/text`

**Requisição**:
```bash
curl -X POST "http://localhost:8001/ai/analyze/text" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Texto do documento técnico...",
    "document_type": "technical_report"
  }'
```

**Requisitos**:
- Mínimo 100 caracteres
- Máximo ~12,000 caracteres (limitação de tokens)

## 📤 Saídas

### Estrutura da Resposta

```json
{
  "status": "success",
  "metadata": {
    "file_name": "technical_report.pdf",
    "file_type": ".pdf",
    "file_size": 524288,
    "char_count": 15420,
    "word_count": 2847
  },
  "analysis": {
    "summary": "Primeiros 500 caracteres da análise...",
    "full_text": "Análise completa do GPT-4..."
  },
  "compliance": {
    "compliance_score": 78,
    "risk_level": "moderado",
    "breakdown": {
      "jorc_mentions": 12,
      "ni_43_101_mentions": 5,
      "prms_mentions": 2,
      "qa_qc_mentions": 18,
      "compliance_terms": 9
    },
    "strengths": ["qa_qc", "jorc"],
    "weaknesses": ["prms", "ni_43_101"],
    "recommendations": [
      "Incluir mais informações sobre NI 43-101 e pessoa qualificada",
      "Adicionar detalhes sobre classificação de recursos petrolíferos (PRMS)"
    ]
  },
  "timestamp": "2025-11-01T16:45:30.123456+00:00"
}
```

### Campos Detalhados

#### `metadata`
Informações sobre o documento processado:
- `file_name`: Nome do arquivo
- `file_type`: Extensão do arquivo
- `file_size`: Tamanho em bytes
- `char_count`: Total de caracteres
- `word_count`: Total de palavras

#### `analysis`
Análise textual do GPT-4:
- `summary`: Resumo (primeiros 500 chars)
- `full_text`: Análise completa

#### `compliance`
Avaliação de conformidade:
- `compliance_score`: 0-100
- `risk_level`: "baixo" | "moderado" | "alto" | "crítico"
- `breakdown`: Contagem por categoria
- `strengths`: Categorias com 3+ menções
- `weaknesses`: Categorias com < 2 menções
- `recommendations`: Lista de melhorias sugeridas

## 🎓 Exemplos de Uso

### Exemplo 1: Análise de Relatório JORC

```python
import requests

url = "http://localhost:8001/ai/analyze"
files = {'file': open('jorc_report.pdf', 'rb')}

response = requests.post(url, files=files)
result = response.json()

print(f"Score: {result['compliance']['compliance_score']}")
print(f"Risco: {result['compliance']['risk_level']}")
print(f"Recomendações: {result['compliance']['recommendations']}")
```

### Exemplo 2: Análise de Texto

```python
import requests

url = "http://localhost:8001/ai/analyze/text"
payload = {
    "text": """
    Este é um relatório técnico sobre recursos minerais...
    Classificação de recursos conforme JORC Code...
    Procedimentos de QA/QC aplicados incluem...
    """,
    "document_type": "resource_report"
}

response = requests.post(url, json=payload)
result = response.json()

print(f"Status: {result['status']}")
if result['status'] == 'success':
    print(f"Score: {result['compliance']['compliance_score']}")
```

### Exemplo 3: JavaScript/TypeScript

```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('http://localhost:8001/ai/analyze', {
  method: 'POST',
  body: formData
});

const result = await response.json();

if (result.status === 'success') {
  console.log('Compliance Score:', result.compliance.compliance_score);
  console.log('Risk Level:', result.compliance.risk_level);
}
```

## ⚙️ Configuração Avançada

### Variáveis de Ambiente

```bash
# Obrigatória
OPENAI_API_KEY=sk-...

# Opcionais
AI_MODEL=gpt-4o          # Modelo OpenAI
AI_MAX_TOKENS=2000       # Máx tokens na resposta
AI_TEMPERATURE=0.3       # Temperatura (0.0 - 1.0)
```

### Personalização do Scoring

Edite `src/ai/core/validator/scoring.py`:

```python
self.scoring_weights = {
    'jorc': 0.30,        # Aumentar peso do JORC
    'ni_43_101': 0.25,
    'prms': 0.10,        # Diminuir peso do PRMS
    'qa_qc': 0.25,
    'compliance': 0.10
}
```

### Adicionar Novas Keywords

```python
CUSTOM_KEYWORDS = [
    'sua_keyword_1',
    'sua_keyword_2',
    'sua_keyword_3'
]

# No método _count_keywords
count += text.count(keyword.lower())
```

## 🐛 Tratamento de Erros

### Erros Comuns

#### 1. Formato Não Suportado
```json
{
  "detail": "Formato não suportado: .xlsx. Use: .pdf, .docx, .txt"
}
```

#### 2. Documento Vazio
```json
{
  "status": "error",
  "message": "Documento muito curto ou vazio"
}
```

#### 3. API Key Não Configurada
```json
{
  "detail": "OPENAI_API_KEY não configurada"
}
```

#### 4. Erro no GPT
```json
{
  "status": "error",
  "message": "Erro na análise GPT: [detalhes do erro]"
}
```

## 🧪 Testes

### Teste Unitário

```bash
# Executar todos os testes
pytest tests/ai/test_validator.py

# Teste específico
pytest tests/ai/test_validator.py::test_process_pdf

# Com verbose
pytest tests/ai/test_validator.py -v
```

### Teste Manual

```bash
# Health check
curl http://localhost:8001/ai/health

# Capabilities
curl http://localhost:8001/ai/capabilities

# Análise de teste
curl -X POST "http://localhost:8001/ai/analyze/text" \
  -H "Content-Type: application/json" \
  -d '{"text": "Este é um teste de análise JORC com procedimentos de QA/QC..."}'
```

## 📊 Performance

### Benchmarks

| Tipo de Documento | Tamanho | Tempo Médio |
|-------------------|---------|-------------|
| PDF simples       | 1 MB    | 5-8 segundos|
| DOCX complexo     | 500 KB  | 6-10 segundos|
| TXT grande        | 2 MB    | 3-5 segundos|

### Otimizações

1. **Cache de Análises**: Implementar Redis para resultados recentes
2. **Processamento Paralelo**: Queue com Celery
3. **Batch Processing**: Múltiplos documentos por vez

## 🔒 Segurança

- ✅ Arquivos temporários são deletados após processamento
- ✅ Validação de extensão de arquivo
- ✅ Limite de tamanho de arquivo
- ✅ Sanitização de input
- ✅ API Key em variável de ambiente

## 📚 Referências

- [JORC Code 2012](https://www.jorc.org/)
- [NI 43-101 Standards](https://www.osc.ca/en/securities-law/instruments-rules-policies/4/43-101)
- [PRMS Guidelines](https://www.spe.org/industry/reserves/prms-guidelines.php)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

**Última atualização**: 01/11/2025  
**Versão**: 3.0.0  
**Status**: ✅ Produção
