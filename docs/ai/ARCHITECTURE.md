# 🧠 QIVO Intelligence Layer - Arquitetura

## 📋 Visão Geral

A **QIVO Intelligence Layer** é o núcleo de inteligência artificial da plataforma QIVO Mining, responsável por:

- ✅ Análise automatizada de conformidade regulatória
- ✅ Tradução entre linguagem jurídica e técnica
- ✅ Monitoramento contínuo de normas e regulações
- ✅ Geração automática de relatórios técnicos

## 🏗️ Arquitetura Modular

```
src/ai/
├── core/
│   ├── validator/    # ✅ ATIVO - Validação de compliance
│   ├── bridge/       # 🔜 EM BREVE - Tradução jurídico ↔ técnico
│   ├── radar/        # 🔜 EM BREVE - Monitoramento regulatório
│   └── manus/        # 🔜 EM BREVE - Relatórios automáticos
├── api/routes/       # Rotas FastAPI
└── workers/          # Background tasks
```

## 🧩 Módulo 1: Validator AI (ATIVO)

### Responsabilidades

1. **Preprocessamento de Documentos**
   - Extração de texto (PDF, DOCX, TXT)
   - Limpeza e normalização
   - Metadata extraction

2. **Análise com GPT-4**
   - Identificação de padrões regulatórios
   - Avaliação de conformidade
   - Detecção de gaps

3. **Compliance Scoring**
   - Score 0-100
   - Classificação de risco (baixo/moderado/alto/crítico)
   - Breakdown por categoria (JORC, NI 43-101, PRMS, QA/QC)
   - Recomendações personalizadas

### Componentes

#### `validator.py` - Core Engine
- Classe `ValidatorAI`
- Integração com OpenAI GPT-4
- Orquestração do pipeline completo

#### `preprocessor.py` - Document Processing
- Classe `DocumentPreprocessor`
- Suporte a múltiplos formatos
- Extração e limpeza de texto
- Metadata tracking

#### `scoring.py` - Compliance Evaluation
- Classe `ComplianceScorer`
- Análise por palavras-chave
- Score ponderado
- Risk assessment

### Fluxo de Processamento

```mermaid
graph LR
    A[Upload Documento] --> B[Preprocessor]
    B --> C[Extração de Texto]
    C --> D[GPT-4 Análise]
    D --> E[Compliance Scorer]
    E --> F[Resultado Final]
```

## 🔌 API Endpoints

### `POST /ai/analyze`
Analisa arquivo para conformidade regulatória

**Request:**
```bash
curl -X POST "http://localhost:8001/ai/analyze" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "status": "success",
  "metadata": {
    "file_name": "document.pdf",
    "file_size": 1024000,
    "word_count": 5000
  },
  "analysis": {
    "summary": "Análise de conformidade...",
    "full_text": "..."
  },
  "compliance": {
    "compliance_score": 75,
    "risk_level": "moderado",
    "breakdown": {
      "jorc_mentions": 5,
      "ni_43_101_mentions": 3,
      "qa_qc_mentions": 8
    },
    "strengths": ["qa_qc", "jorc"],
    "weaknesses": ["prms"],
    "recommendations": [...]
  }
}
```

### `POST /ai/analyze/text`
Analisa texto direto (sem arquivo)

### `GET /ai/health`
Health check do módulo

### `GET /ai/capabilities`
Lista capacidades disponíveis

## 🔐 Configuração

### Variáveis de Ambiente Necessárias

```bash
# OpenAI API Key (obrigatória)
OPENAI_API_KEY=sk-...

# Configurações opcionais
AI_MODEL=gpt-4o  # Padrão: gpt-4o
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.3
```

## 🚀 Execução

### Desenvolvimento

```bash
# Instalar dependências
pip install -r requirements-ai.txt

# Iniciar API
python main_ai.py

# Ou com uvicorn
uvicorn main_ai:app --reload --port 8001
```

### Produção

```bash
gunicorn main_ai:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

## 📊 Monitoramento

### Logs

```bash
# Ver logs em tempo real
tail -f logs/ai-monitor.log
```

### Métricas

- Tempo de processamento por documento
- Taxa de sucesso/falha
- Distribuição de compliance scores
- Uso de tokens OpenAI

## 🔜 Próximos Módulos

### Bridge AI (Fase 4)
- Tradução jurídico → técnico
- Tradução técnico → jurídico
- Explicações em linguagem simples

### Radar AI (Fase 5)
- Web scraping de normas
- Alertas de mudanças regulatórias
- Feed de notícias do setor

### Manus AI (Fase 6)
- Geração automática de relatórios
- Templates customizáveis
- Export em múltiplos formatos

## 🧪 Testes

```bash
# Executar testes unitários
pytest tests/ai/

# Com coverage
pytest tests/ai/ --cov=src/ai --cov-report=html
```

## 🛡️ Segurança

- ✅ API Keys em variáveis de ambiente
- ✅ Validação de tipos de arquivo
- ✅ Limpeza de arquivos temporários
- ✅ Rate limiting (em implementação)
- ✅ Input sanitization

## 📈 Performance

- **Tempo médio de análise**: 5-15 segundos
- **Máx documentos/min**: ~10 (limitado por OpenAI API)
- **Formatos suportados**: PDF, DOCX, TXT
- **Tamanho máximo**: 10MB por arquivo

---

**Documentação atualizada**: 01/11/2025  
**Versão**: 3.0.0  
**Status**: ✅ Validator AI Ativo | 🔜 Bridge, Radar, Manus em desenvolvimento
