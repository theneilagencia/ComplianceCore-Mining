# QIVO Mining Platform

[![Tests](https://github.com/theneilagencia/ComplianceCore-Mining/actions/workflows/test.yml/badge.svg)](https://github.com/theneilagencia/ComplianceCore-Mining/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/theneilagencia/ComplianceCore-Mining/branch/main/graph/badge.svg)](https://codecov.io/gh/theneilagencia/ComplianceCore-Mining)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-22.x-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.x-orange.svg)](https://pnpm.io/)

Plataforma inteligente para geração de relatórios técnicos de mineração conforme padrões internacionais (JORC, NI 43-101, CBRR).

---

## 🚀 Funcionalidades

### Módulo 1: Gestão de Projetos
- ✅ Cadastro e gerenciamento de projetos minerários
- ✅ Upload e armazenamento de documentos técnicos
- ✅ Controle de versões e histórico
- ✅ Colaboração em equipe

### Módulo 2: AI Report Generator
- ✅ Geração automática de relatórios técnicos
- ✅ Conversão entre padrões (JORC ↔ NI 43-101 ↔ CBRR)
- ✅ Parsing de documentos (PDF, DOCX, CSV, XLSX)
- ✅ Validação de dados conforme padrões
- ✅ Geração de PDFs customizados com branding
- ✅ Integração com OpenAI para análise inteligente

### Módulo 3: Pagamentos e Assinaturas
- ✅ Integração com Stripe
- ✅ Planos: Start (gratuito), Pro, Enterprise
- ✅ Relatórios avulsos sob demanda
- ✅ Gerenciamento de assinaturas

---

## 📊 Status de Testes

| Suite de Testes | Testes | Status |
|-----------------|--------|--------|
| **JORC Mapper** | 26 | ✅ 100% |
| **Standard Conversion** | 22 | ✅ 100% |
| **Document Parsing** | 24 | ✅ 100% |
| **PDF Generation** | 22 | ✅ 100% |
| **Total** | **94** | ✅ **100%** |

---

## 🛠️ Tecnologias

### Backend
- **Node.js 22.x** - Runtime JavaScript
- **TypeScript** - Linguagem tipada
- **Express** - Framework web
- **Drizzle ORM** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados
- **OpenAI API** - IA para análise de documentos

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool
- **TailwindCSS** - Framework CSS
- **Radix UI** - Componentes acessíveis

### DevOps
- **GitHub Actions** - CI/CD
- **Render** - Deploy e hospedagem
- **Vitest** - Framework de testes
- **Codecov** - Cobertura de código

---

## 📦 Instalação

### Pré-requisitos

- Node.js 22.x ou superior
- pnpm 10.x ou superior
- PostgreSQL 16+ (ou usar serviço Render)

### Passos

```bash
# 1. Clonar repositório
git clone https://github.com/theneilagencia/ComplianceCore-Mining.git
cd ComplianceCore-Mining

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 4. Executar migrações do banco de dados
pnpm db:push

# 5. Iniciar servidor de desenvolvimento
pnpm dev
```

O servidor estará disponível em `http://localhost:5050`

---

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes em modo watch
pnpm test:watch

# Gerar relatório de cobertura
pnpm test:coverage

# Abrir UI interativa de testes
pnpm test:ui
```

---

## 🔧 Desenvolvimento

### Estrutura de Diretórios

```
ComplianceCore-Mining/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── lib/           # Utilitários
├── server/                # Backend Node.js
│   ├── modules/           # Módulos da aplicação
│   │   ├── auth/         # Autenticação
│   │   ├── payment/      # Pagamentos
│   │   └── technical-reports/  # Relatórios técnicos
│   │       ├── services/ # Lógica de negócio
│   │       └── __tests__/  # Testes automatizados
│   └── _core/            # Configuração core
├── docs/                  # Documentação
├── .github/              # Workflows CI/CD
└── dist/                 # Build de produção
```

### Scripts Disponíveis

```bash
pnpm dev          # Inicia servidor de desenvolvimento
pnpm build        # Build para produção
pnpm start        # Inicia servidor de produção
pnpm check        # Verifica tipos TypeScript
pnpm format       # Formata código com Prettier
pnpm test         # Executa testes
pnpm db:push      # Aplica migrações do banco
```

---

## 📚 Documentação

- [Variáveis de Ambiente](docs/ENVIRONMENT_VARIABLES.md)
- [Guia de Início Rápido](docs/QUICK_START.md)
- [Configuração de Secrets no GitHub](docs/GITHUB_SECRETS_SETUP.md)
- [Plano de Ação - Testes](docs/PLANO_ACAO_TESTES.md)
- [Plano de Ação - APIs](docs/PLANO_ACAO_APIS.md)
- [Cronograma Consolidado](docs/CRONOGRAMA_CONSOLIDADO.md)
- [Integrações com APIs](docs/API_INTEGRATIONS_GUIDE.md)

---

## 🌐 Deploy

### Render (Produção)

O projeto está configurado para deploy automático no Render:

1. Push para branch `main` aciona deploy automático
2. Build executado via `pnpm run build`
3. Servidor iniciado via `pnpm start`
4. Variáveis de ambiente configuradas no Render Dashboard

**URL de Produção**: https://qivo-mining.onrender.com

---

## 🔐 Variáveis de Ambiente

Consulte o arquivo [`.env.example`](.env.example) para ver todas as variáveis necessárias.

### Principais Variáveis

```env
# Banco de Dados
DATABASE_URL=postgresql://user:password@host:port/database

# Autenticação
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# S3
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=your-bucket-name
S3_REGION=sa-east-1

# Aplicação
PORT=5050
FLASK_ENV=production
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript para todo código novo
- Siga as convenções do ESLint/Prettier
- Escreva testes para novas funcionalidades
- Mantenha cobertura de testes acima de 75%
- Documente APIs e funções públicas

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Equipe

- **The Neil Agência** - Desenvolvimento e Manutenção

---

## 📞 Suporte

Para suporte, envie um email para support@qivo-mining.com ou abra uma issue no GitHub.

---

## 🔗 Links Úteis

- [Documentação JORC 2012](https://www.jorc.org/)
- [NI 43-101 Guidelines](https://www.osc.ca/en/securities-law/instruments-rules-policies/4/43-101)
- [CBRR - Código Brasileiro](https://www.gov.br/anm/)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Stripe API Docs](https://stripe.com/docs/api)

---

**Última Atualização**: 31 de Outubro de 2025


---

## 🧠 QIVO Intelligence Layer (Fase 3)

Camada de inteligência artificial para análise automatizada de conformidade regulatória e geração de insights.

### Módulos Ativos

#### ✅ Validator AI
- **Status**: Ativo
- **Função**: Validação de conformidade regulatória
- **Padrões**: JORC, NI 43-101, PRMS
- **Formatos**: PDF, DOCX, TXT
- **API**: FastAPI (porta 8001)
- **Documentação**: `docs/ai/VALIDATOR.md`

**Endpoints**:
- `POST /ai/analyze` - Analisa arquivo para conformidade
- `POST /ai/analyze/text` - Analisa texto direto
- `GET /ai/health` - Health check
- `GET /ai/capabilities` - Lista capacidades

**Exemplo de Uso**:
```bash
# Analisar documento
curl -X POST "http://localhost:8001/ai/analyze" \
  -F "file=@technical_report.pdf"

# Health check
curl http://localhost:8001/ai/health
```

### Módulos em Desenvolvimento

#### �� Bridge AI (Fase 4)
- Tradução jurídico ↔ técnico
- Explicações simplificadas
- Adaptação por público-alvo

#### 🔜 Radar AI (Fase 5)
- Monitoramento regulatório
- Alertas de mudanças
- Feed de notícias do setor

#### 🔜 Manus AI (Fase 6)
- Geração automática de relatórios
- Templates customizáveis
- Export multi-formato

### Executar API de IA

```bash
# Instalar dependências Python
pip install -r requirements-ai.txt

# Configurar variável de ambiente
export OPENAI_API_KEY=sk-...

# Iniciar API
python main_ai.py

# Ou com uvicorn
uvicorn main_ai:app --reload --port 8001
```

### Documentação Completa

- 📘 **Arquitetura**: `docs/ai/ARCHITECTURE.md`
- 📗 **Validator AI**: `docs/ai/VALIDATOR.md`
- 📙 **Roadmap**: `docs/ai/ROADMAP.md`

### Testes

```bash
# Executar testes AI
pytest tests/ai/ -v

# Com coverage
pytest tests/ai/ --cov=src/ai --cov-report=html
```

---
