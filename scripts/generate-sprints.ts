/**
 * 🚀 QIVO v1.3 - Gerador Automático de Sprints
 * 
 * Gera o roadmap completo de Sprints v1.3 com base na auditoria técnica
 * Saídas:
 * - docs/Sprints_QIVO_v1.3.md (Markdown legível)
 * - docs/QIVO_v1.3_Roadmap.xlsx (Planilha Excel)
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import ExcelJS from 'exceljs';

// ========================================
// 📋 DEFINIÇÃO DAS SPRINTS
// ========================================

interface Task {
  id: string;
  title: string;
  description: string;
  responsible: string;
  estimateDays: number;
  dependencies: string[];
  acceptanceCriteria: string[];
  commands: string[];
  deliverable: string;
  risk: 'Baixo' | 'Médio' | 'Alto';
  status: 'Não Iniciado' | 'Em Progresso' | 'Concluído';
}

interface Sprint {
  number: number;
  name: string;
  objective: string;
  duration: string;
  tasks: Task[];
  deliverables: string[];
}

const sprints: Sprint[] = [
  // ========================================
  // 🧱 SPRINT 1 - Regulatory Radar & Notificações
  // ========================================
  {
    number: 1,
    name: 'Regulatory Radar & Notificações',
    objective: 'Completar automação do radar regulatório e criar alertas automáticos',
    duration: '2 semanas',
    deliverables: [
      'Radar com dados 100% reais',
      'Sistema de notificações Slack/Teams ativo',
      'Monitoramento DOU funcionando',
      'APIs brasileiras autenticadas',
      'Cobertura de testes >60% no módulo Radar'
    ],
    tasks: [
      {
        id: 'RAD-001',
        title: 'Sistema de Notificações Slack/Teams',
        description: 'Implementar envio de notificações via webhooks configuráveis para alertas de mudanças regulatórias',
        responsible: 'Backend Dev',
        estimateDays: 3,
        dependencies: [],
        acceptanceCriteria: [
          'Mensagem entregue em canal Slack após nova atualização de API',
          'Configuração de webhook via variável de ambiente',
          'Suporte para múltiplos canais (Slack, Teams, Discord)',
          'Template de mensagem com dados estruturados (título, fonte, link)',
          'Retry automático em caso de falha (3 tentativas)'
        ],
        commands: [
          'pnpm add @slack/webhook',
          'pnpm add @microsoft/teams-webhook',
          'Criar service em server/modules/radar/services/notifications.ts',
          'Adicionar variáveis SLACK_WEBHOOK_URL e TEAMS_WEBHOOK_URL em .env'
        ],
        deliverable: 'Sistema de notificações funcional com testes unitários',
        risk: 'Médio',
        status: 'Não Iniciado'
      },
      {
        id: 'RAD-002',
        title: 'Scraper DOU e RSS Feeds',
        description: 'Parser Python para Diário Oficial da União + integração Node via child_process',
        responsible: 'Backend Dev',
        estimateDays: 5,
        dependencies: [],
        acceptanceCriteria: [
          'Detectar publicações com termos: "mineração", "licença", "CFEM", "ANM"',
          'Parser de RSS feed do DOU',
          'Registrar publicações no banco de dados',
          'Mínimo 3 novas publicações/dia detectadas',
          'Integração com sistema de notificações'
        ],
        commands: [
          'pip install feedparser beautifulsoup4 requests',
          'Criar script em scripts/dou-scraper.py',
          'Criar service em server/modules/radar/services/douIntegration.ts',
          'Adicionar URL_DOU_RSS em .env'
        ],
        deliverable: 'Scraper funcional com histórico de publicações',
        risk: 'Alto',
        status: 'Não Iniciado'
      },
      {
        id: 'RAD-003',
        title: 'Cron Job Real (node-cron + GitHub Actions)',
        description: 'Configurar agendamento automático para aggregator e scraper',
        responsible: 'DevOps',
        estimateDays: 1,
        dependencies: ['RAD-002'],
        acceptanceCriteria: [
          'Aggregator rodando a cada 6 horas',
          'Scraper DOU rodando a cada 12 horas',
          'Logs de execução em Render',
          'Backup via GitHub Actions scheduled workflow',
          'Health check endpoint retornando última execução'
        ],
        commands: [
          'pnpm add node-cron',
          'Configurar cron em server/modules/radar/services/diagnosticCron.ts',
          'Criar workflow .github/workflows/scheduled-radar.yml',
          'Adicionar endpoint /api/radar/cron/status'
        ],
        deliverable: 'Cron jobs ativos e monitorados',
        risk: 'Baixo',
        status: 'Não Iniciado'
      },
      {
        id: 'RAD-004',
        title: 'Autenticação SIGMINE / MapBiomas',
        description: 'Corrigir autenticação das APIs brasileiras que retornam vazio',
        responsible: 'DevOps',
        estimateDays: 2,
        dependencies: [],
        acceptanceCriteria: [
          'SIGMINE retornando dados reais',
          'MapBiomas retornando dados reais',
          'Documentação de credenciais em README',
          'Variáveis de ambiente configuradas',
          'Fallback para mock apenas em desenvolvimento'
        ],
        commands: [
          'Pesquisar documentação oficial SIGMINE',
          'Registrar chaves de API necessárias',
          'Adicionar SIGMINE_API_KEY e MAPBIOMAS_API_KEY em .env',
          'Atualizar dataAggregator.ts com autenticação'
        ],
        deliverable: 'APIs brasileiras retornando dados reais',
        risk: 'Médio',
        status: 'Não Iniciado'
      },
      {
        id: 'RAD-005',
        title: 'Testes Unitários Radar (Vitest)',
        description: 'Criar suite completa de testes para módulo Radar',
        responsible: 'QA Engineer',
        estimateDays: 3,
        dependencies: ['RAD-001', 'RAD-002', 'RAD-003'],
        acceptanceCriteria: [
          'Cobertura >60% no módulo Radar',
          'Testes para dataAggregator',
          'Testes para notifications',
          'Testes para DOU scraper',
          'Testes para cron scheduler',
          'Mocks para APIs externas'
        ],
        commands: [
          'Criar server/modules/radar/__tests__/dataAggregator.test.ts',
          'Criar server/modules/radar/__tests__/notifications.test.ts',
          'Criar server/modules/radar/__tests__/douScraper.test.ts',
          'pnpm test -- radar'
        ],
        deliverable: 'Suite de testes Radar com >60% de cobertura',
        risk: 'Baixo',
        status: 'Não Iniciado'
      }
    ]
  },

  // ========================================
  // 🧪 SPRINT 2 - Testes & Qualidade
  // ========================================
  {
    number: 2,
    name: 'Testes & Qualidade de Código',
    objective: 'Elevar cobertura global de testes para >70% e reforçar segurança',
    duration: '2 semanas',
    deliverables: [
      'Cobertura geral >70%',
      'Testes E2E para fluxos críticos',
      'Relatórios automáticos de qualidade',
      'Dashboard de cobertura público',
      'Análise SAST implementada'
    ],
    tasks: [
      {
        id: 'TEST-001',
        title: 'Testes Unitários Auditoria/KRCI',
        description: 'Criar testes completos para sistema de auditoria com 30+ regras',
        responsible: 'QA Engineer',
        estimateDays: 3,
        dependencies: [],
        acceptanceCriteria: [
          'Validar 30+ regras KRCI',
          'Testar scoring 0-100',
          'Testar regras CBRR/ANM',
          'Testar planos de correção',
          'Cobertura >80% no módulo audit'
        ],
        commands: [
          'Criar server/modules/technical-reports/__tests__/audit.test.ts',
          'Criar server/modules/technical-reports/__tests__/krci.test.ts',
          'pnpm test -- audit'
        ],
        deliverable: 'Suite de testes Auditoria completa',
        risk: 'Baixo',
        status: 'Não Iniciado'
      },
      {
        id: 'TEST-002',
        title: 'Testes de Integração Reports (E2E Playwright)',
        description: 'Testes end-to-end para fluxo completo de geração de relatórios',
        responsible: 'QA Engineer',
        estimateDays: 4,
        dependencies: [],
        acceptanceCriteria: [
          'Testar upload de arquivo',
          'Testar parsing e normalização',
          'Testar auditoria KRCI',
          'Testar geração de PDF',
          'Testar exportação'
        ],
        commands: [
          'pnpm add -D @playwright/test',
          'Criar tests/e2e/reports.spec.ts',
          'npx playwright install',
          'pnpm test:e2e'
        ],
        deliverable: 'Suite E2E de relatórios funcionando',
        risk: 'Médio',
        status: 'Não Iniciado'
      },
      {
        id: 'TEST-003',
        title: 'Codecov + Badge Automático',
        description: 'Configurar relatórios de cobertura automáticos no GitHub',
        responsible: 'DevOps',
        estimateDays: 1,
        dependencies: ['TEST-001', 'TEST-002'],
        acceptanceCriteria: [
          'Codecov integrado no CI',
          'Badge de cobertura no README',
          'Relatórios por PR',
          'Alerta se cobertura cair >5%',
          'Dashboard público'
        ],
        commands: [
          'pnpm add -D @vitest/coverage-v8',
          'Configurar vitest.config.ts com coverage',
          'Adicionar CODECOV_TOKEN ao GitHub Secrets',
          'Atualizar .github/workflows/test.yml'
        ],
        deliverable: 'Dashboard de cobertura público',
        risk: 'Baixo',
        status: 'Não Iniciado'
      },
      {
        id: 'TEST-004',
        title: 'Análise SAST (SonarQube)',
        description: 'Implementar análise estática de segurança',
        responsible: 'DevOps',
        estimateDays: 2,
        dependencies: [],
        acceptanceCriteria: [
          'SonarQube configurado',
          'Análise automática em PRs',
          'Alertas para vulnerabilidades críticas',
          'Quality Gate configurado',
          'Relatórios semanais'
        ],
        commands: [
          'Criar conta SonarCloud',
          'Adicionar sonar-project.properties',
          'Adicionar step no workflow CI',
          'Configurar quality gate'
        ],
        deliverable: 'SonarQube ativo com quality gate',
        risk: 'Médio',
        status: 'Não Iniciado'
      },
      {
        id: 'TEST-005',
        title: 'Auditoria CI/CD',
        description: 'Verificar secrets, logs e configurações de deploy',
        responsible: 'DevOps',
        estimateDays: 1,
        dependencies: [],
        acceptanceCriteria: [
          'Todos secrets rotacionados',
          'Logs sem informações sensíveis',
          'Deploy rollback funcional',
          'Health checks automáticos',
          'Documentação atualizada'
        ],
        commands: [
          'Auditar GitHub Secrets',
          'Verificar logs Render',
          'Testar rollback manual',
          'Configurar health check endpoint',
          'Atualizar docs/DEPLOY.md'
        ],
        deliverable: 'CI/CD auditado e seguro',
        risk: 'Baixo',
        status: 'Não Iniciado'
      }
    ]
  },

  // ========================================
  // 🌉 SPRINT 3 - Bridge UI & Performance
  // ========================================
  {
    number: 3,
    name: 'Bridge UI & Performance',
    objective: 'Criar interface de tradução normativa e otimizar performance com cache',
    duration: '1-2 semanas',
    deliverables: [
      'UI de tradução funcional',
      'Performance 10x melhor com cache',
      'Biblioteca de glossário',
      'Suporte para padrão americano (SEC)',
      'Testes E2E Bridge AI'
    ],
    tasks: [
      {
        id: 'BRG-001',
        title: 'UI Bridge AI (React + Tailwind + shadcn)',
        description: 'Interface frontend para tradução entre normas regulatórias',
        responsible: 'Frontend Dev',
        estimateDays: 4,
        dependencies: [],
        acceptanceCriteria: [
          'Página /bridge funcional',
          'Upload de texto ou arquivo',
          'Seleção de norma origem e destino',
          'Preview de tradução em tempo real',
          'Opção "explain" habilitada',
          'Histórico de traduções'
        ],
        commands: [
          'Criar client/src/modules/bridge/BridgePage.tsx',
          'Criar client/src/modules/bridge/components/TranslationForm.tsx',
          'Criar client/src/modules/bridge/components/TranslationPreview.tsx',
          'Adicionar rota em App.tsx'
        ],
        deliverable: 'Interface Bridge AI completa',
        risk: 'Médio',
        status: 'Não Iniciado'
      },
      {
        id: 'BRG-002',
        title: 'Cache Redis (traduções GPT repetidas)',
        description: 'Implementar cache para evitar chamadas duplicadas ao GPT',
        responsible: 'Backend Dev',
        estimateDays: 2,
        dependencies: [],
        acceptanceCriteria: [
          'Redis configurado',
          'Cache com TTL de 7 dias',
          'Hit rate >80% após 1 semana',
          'Cache invalidation ao atualizar glossário',
          'Métricas de performance'
        ],
        commands: [
          'pnpm add redis ioredis',
          'Configurar Redis em Render',
          'Criar server/_core/cache.ts',
          'Integrar em src/ai/core/bridge/engine.py',
          'Adicionar REDIS_URL em .env'
        ],
        deliverable: 'Sistema de cache funcionando',
        risk: 'Médio',
        status: 'Não Iniciado'
      },
      {
        id: 'BRG-003',
        title: 'Glossário de Traduções Comuns',
        description: 'Criar biblioteca de termos técnicos pré-traduzidos',
        responsible: 'Regulatory Analyst',
        estimateDays: 2,
        dependencies: [],
        acceptanceCriteria: [
          '>100 termos técnicos mapeados',
          'Suporte ANM/JORC/NI/PERC/SAMREC',
          'Arquivo JSON estruturado',
          'Integrado no Bridge AI',
          'Documentação de uso'
        ],
        commands: [
          'Criar src/ai/core/bridge/glossary.json',
          'Atualizar engine.py com lookup glossário',
          'Criar endpoint GET /api/bridge/glossary',
          'Adicionar interface de edição no admin'
        ],
        deliverable: 'Glossário com >100 termos',
        risk: 'Baixo',
        status: 'Não Iniciado'
      },
      {
        id: 'BRG-004',
        title: 'Suporte SEC S-K 1300 e Chile',
        description: 'Adicionar novos padrões regulatórios ao Bridge',
        responsible: 'Backend Dev',
        estimateDays: 3,
        dependencies: ['BRG-003'],
        acceptanceCriteria: [
          'Suporte para SEC S-K 1300 (EUA)',
          'Suporte para regulação chilena',
          'Regras de conversão documentadas',
          'Testes de tradução',
          'Atualização da API /api/bridge/norms'
        ],
        commands: [
          'Pesquisar documentação SEC S-K 1300',
          'Adicionar normas em engine.py',
          'Atualizar schemas.py',
          'Criar testes em tests/test_bridge_ai.py'
        ],
        deliverable: 'Bridge com 7 normas suportadas',
        risk: 'Médio',
        status: 'Não Iniciado'
      },
      {
        id: 'BRG-005',
        title: 'Testes E2E Bridge AI (pytest + Playwright)',
        description: 'Suite completa de testes para Bridge AI',
        responsible: 'QA Engineer',
        estimateDays: 2,
        dependencies: ['BRG-001', 'BRG-002'],
        acceptanceCriteria: [
          'Testes unitários Python',
          'Testes E2E frontend',
          'Testes de performance (cache)',
          'Testes de integração GPT',
          'Cobertura >70%'
        ],
        commands: [
          'Criar tests/test_bridge_performance.py',
          'Criar tests/e2e/bridge.spec.ts',
          'pytest tests/test_bridge*',
          'npx playwright test bridge'
        ],
        deliverable: 'Suite de testes Bridge completa',
        risk: 'Baixo',
        status: 'Não Iniciado'
      }
    ]
  },

  // ========================================
  // 🤖 SPRINT 4 - Geração Completa de Relatórios GPT
  // ========================================
  {
    number: 4,
    name: 'Geração Completa de Relatórios GPT',
    objective: 'Completar a IA redatora com geração textual 100% automatizada',
    duration: '2-3 semanas',
    deliverables: [
      'Relatórios completos gerados automaticamente',
      'Templates prontos para JORC, NI, CBRR',
      'Parsing robusto de planilhas',
      'Suporte completo para Word',
      'Integração com Manus'
    ],
    tasks: [
      {
        id: 'RPT-001',
        title: 'Geração Completa com GPT',
        description: 'IA capaz de gerar relatório técnico completo (não apenas executive summary)',
        responsible: 'AI Engineer',
        estimateDays: 5,
        dependencies: [],
        acceptanceCriteria: [
          'Gerar 27 seções JORC completas',
          'Gerar relatório NI 43-101 completo',
          'Gerar relatório CBRR/ANM completo',
          'Saída em DOCX e PDF',
          'Qualidade aprovada por revisor técnico'
        ],
        commands: [
          'Criar service server/modules/technical-reports/services/ai-full-report.ts',
          'Integrar com OpenAI GPT-4',
          'Criar prompts específicos por padrão',
          'Adicionar endpoint POST /api/reports/generate-full'
        ],
        deliverable: 'IA redatora completa funcionando',
        risk: 'Alto',
        status: 'Não Iniciado'
      },
      {
        id: 'RPT-002',
        title: 'Templates Normativos (JORC, NI, CBRR)',
        description: 'Biblioteca de templates pré-aprovados por padrão',
        responsible: 'Regulatory Analyst',
        estimateDays: 4,
        dependencies: [],
        acceptanceCriteria: [
          'Template JORC 2012 completo',
          'Template NI 43-101 completo',
          'Template CBRR/ANM completo',
          'Templates em DOCX e HTML',
          'Documentação de uso'
        ],
        commands: [
          'Criar server/modules/technical-reports/templates/jorc-2012.docx',
          'Criar server/modules/technical-reports/templates/ni43-101.docx',
          'Criar server/modules/technical-reports/templates/cbrr.docx',
          'Criar parser de templates'
        ],
        deliverable: 'Biblioteca de templates completa',
        risk: 'Baixo',
        status: 'Não Iniciado'
      },
      {
        id: 'RPT-003',
        title: 'Parsing XLSX e DOCX Avançado',
        description: 'Melhorar heurísticas de parsing para casos complexos',
        responsible: 'Backend Dev',
        estimateDays: 3,
        dependencies: [],
        acceptanceCriteria: [
          'Parser XLSX com detecção de tabelas',
          'Parser DOCX com extração de estilos',
          'Suporte para arquivos grandes (>10MB)',
          'Detecção automática de encoding',
          'Testes com 20+ arquivos reais'
        ],
        commands: [
          'pnpm add xlsx mammoth',
          'Atualizar parsing.ts com novos parsers',
          'Criar testes com arquivos reais',
          'Adicionar validação de formato'
        ],
        deliverable: 'Parsing robusto de XLSX/DOCX',
        risk: 'Médio',
        status: 'Não Iniciado'
      },
      {
        id: 'RPT-004',
        title: 'Treinamento de Prompts no Manus',
        description: 'Otimizar prompts regulatórios no sistema Manus',
        responsible: 'AI Engineer',
        estimateDays: 3,
        dependencies: ['RPT-001'],
        acceptanceCriteria: [
          'Prompts documentados no Manus',
          'Versionamento de prompts',
          'Testes A/B de qualidade',
          'Métricas de performance',
          'Aprovação de especialista'
        ],
        commands: [
          'Criar src/ai/core/manus/prompts-registry.json',
          'Integrar com sistema Manus',
          'Criar dashboard de métricas',
          'Documentar em docs/PROMPTS.md'
        ],
        deliverable: 'Sistema de prompts otimizado',
        risk: 'Médio',
        status: 'Não Iniciado'
      },
      {
        id: 'RPT-005',
        title: 'Exportação Automática para Auditoria e Bridge',
        description: 'Integrar fluxo completo: geração → auditoria → bridge',
        responsible: 'Backend Dev',
        estimateDays: 2,
        dependencies: ['RPT-001'],
        acceptanceCriteria: [
          'Relatório gerado passa por auditoria automática',
          'Score KRCI calculado automaticamente',
          'Opção de traduzir para outra norma',
          'Exportação com metadados completos',
          'Webhook para notificar conclusão'
        ],
        commands: [
          'Criar orchestrator em server/modules/technical-reports/services/orchestrator.ts',
          'Integrar generate → audit → bridge',
          'Adicionar webhook notifications',
          'Criar testes de integração'
        ],
        deliverable: 'Pipeline completo funcionando',
        risk: 'Alto',
        status: 'Não Iniciado'
      }
    ]
  },

  // ========================================
  // 🧬 SPRINT 5 - Machine Learning & Integração com Reguladores
  // ========================================
  {
    number: 5,
    name: 'Machine Learning & Integração com Reguladores',
    objective: 'Iniciar fase de inteligência adaptativa e integração oficial',
    duration: '3-4 semanas',
    deliverables: [
      'Auditoria preditiva funcionando',
      'Integração ANM ativa',
      'Dashboard de métricas e tendências',
      'Alertas inteligentes',
      'Documentação de integração'
    ],
    tasks: [
      {
        id: 'ML-001',
        title: 'Modelo de Detecção de Anomalias KRCI',
        description: 'ML para detectar inconformidades a partir de histórico',
        responsible: 'AI Engineer',
        estimateDays: 5,
        dependencies: [],
        acceptanceCriteria: [
          'Modelo treinado com >100 auditorias',
          'Precisão >85% em validação',
          'Detecção de padrões anômalos',
          'API para predição em tempo real',
          'Explicabilidade de resultados'
        ],
        commands: [
          'pip install scikit-learn joblib',
          'Criar src/ai/ml/anomaly_detection.py',
          'Treinar modelo com histórico',
          'Criar endpoint POST /api/ml/predict-anomalies',
          'Adicionar testes de performance'
        ],
        deliverable: 'Modelo ML de anomalias funcionando',
        risk: 'Alto',
        status: 'Não Iniciado'
      },
      {
        id: 'ML-002',
        title: 'Integração ANM (API Pública)',
        description: 'Integração oficial com Agência Nacional de Mineração',
        responsible: 'Backend Dev',
        estimateDays: 4,
        dependencies: [],
        acceptanceCriteria: [
          'Autenticação ANM configurada',
          'Consulta de processos minerários',
          'Consulta de títulos minerários',
          'Sincronização diária',
          'Documentação de API'
        ],
        commands: [
          'Pesquisar API pública ANM',
          'Registrar credenciais',
          'Criar service server/modules/integrations/anm.ts',
          'Adicionar ANM_API_KEY em .env',
          'Criar testes de integração'
        ],
        deliverable: 'Integração ANM funcionando',
        risk: 'Alto',
        status: 'Não Iniciado'
      },
      {
        id: 'ML-003',
        title: 'Integração TSX / ASX',
        description: 'Integração com bolsas de valores canadense e australiana',
        responsible: 'Backend Dev',
        estimateDays: 4,
        dependencies: [],
        acceptanceCriteria: [
          'Consulta de empresas listadas',
          'Consulta de relatórios técnicos',
          'Validação de conformidade',
          'Alertas de não-conformidade',
          'Documentação de API'
        ],
        commands: [
          'Pesquisar APIs TSX e ASX',
          'Registrar credenciais',
          'Criar service server/modules/integrations/exchanges.ts',
          'Adicionar TSX_API_KEY e ASX_API_KEY em .env'
        ],
        deliverable: 'Integração TSX/ASX funcionando',
        risk: 'Alto',
        status: 'Não Iniciado'
      },
      {
        id: 'ML-004',
        title: 'Dashboard de Métricas e Tendências',
        description: 'Visualização de métricas de auditoria e tendências',
        responsible: 'Frontend Dev',
        estimateDays: 3,
        dependencies: ['ML-001'],
        acceptanceCriteria: [
          'Dashboard com gráficos interativos',
          'Tendências de score KRCI',
          'Análise de anomalias',
          'Exportação de relatórios',
          'Filtros por período e padrão'
        ],
        commands: [
          'pnpm add recharts @tanstack/react-table',
          'Criar client/src/modules/analytics/DashboardPage.tsx',
          'Criar componentes de gráficos',
          'Integrar com API de métricas'
        ],
        deliverable: 'Dashboard de analytics completo',
        risk: 'Médio',
        status: 'Não Iniciado'
      },
      {
        id: 'ML-005',
        title: 'Alertas Inteligentes (threshold dinâmico)',
        description: 'Sistema de alertas com aprendizado de padrões',
        responsible: 'AI Engineer',
        estimateDays: 3,
        dependencies: ['ML-001'],
        acceptanceCriteria: [
          'Threshold adaptativo por empresa',
          'Alertas personalizados por criticidade',
          'Redução de falsos positivos >50%',
          'Integração com notificações',
          'Documentação de algoritmo'
        ],
        commands: [
          'Criar src/ai/ml/adaptive_alerts.py',
          'Integrar com notification service',
          'Adicionar configuração de thresholds',
          'Criar testes de performance'
        ],
        deliverable: 'Sistema de alertas inteligentes',
        risk: 'Médio',
        status: 'Não Iniciado'
      }
    ]
  }
];

// ========================================
// 📊 GERAÇÃO DO MARKDOWN
// ========================================

function generateMarkdown(): string {
  let md = `# 🚀 ROTEIRO DE EXECUÇÃO - QIVO v1.3

**Data de Criação**: ${new Date().toLocaleDateString('pt-BR')}  
**Versão**: 1.0  
**Base**: Auditoria Técnica Automatizada - 01/11/2025  
**Duração Total Estimada**: 8-10 semanas  
**Equipe Recomendada**: 1 Backend Dev + 1 Frontend Dev + 1 QA Engineer + 1 DevOps + 1 AI Engineer  
**Metodologia**: Scrum (2-week sprints)  
**Entrega Alvo**: Janeiro/2026

---

## 📋 SUMÁRIO EXECUTIVO

Este documento apresenta o roadmap completo de desenvolvimento para a versão 1.3 da plataforma QIVO Mining Platform, dividido em **5 sprints** com **${sprints.reduce((acc, s) => acc + s.tasks.length, 0)} tarefas** no total.

### 🎯 Objetivos por Sprint

`;

  sprints.forEach(sprint => {
    md += `- **Sprint ${sprint.number}**: ${sprint.name} (${sprint.duration})\n`;
  });

  md += `\n### 📊 Estatísticas Gerais\n\n`;
  md += `| Métrica | Valor |\n`;
  md += `|---------|-------|\n`;
  md += `| **Total de Sprints** | ${sprints.length} |\n`;
  md += `| **Total de Tarefas** | ${sprints.reduce((acc, s) => acc + s.tasks.length, 0)} |\n`;
  md += `| **Duração Total Estimada** | ${sprints.reduce((acc, s) => acc + s.tasks.reduce((a, t) => a + t.estimateDays, 0), 0)} dias de trabalho |\n`;
  md += `| **Tarefas de Risco Alto** | ${sprints.reduce((acc, s) => acc + s.tasks.filter(t => t.risk === 'Alto').length, 0)} |\n`;
  md += `| **Tarefas de Risco Médio** | ${sprints.reduce((acc, s) => acc + s.tasks.filter(t => t.risk === 'Médio').length, 0)} |\n`;
  md += `| **Tarefas de Risco Baixo** | ${sprints.reduce((acc, s) => acc + s.tasks.filter(t => t.risk === 'Baixo').length, 0)} |\n\n`;

  md += `---\n\n`;

  // Gerar detalhamento de cada sprint
  sprints.forEach(sprint => {
    md += `## 🏃 Sprint ${sprint.number} - ${sprint.name}\n\n`;
    md += `**Objetivo**: ${sprint.objective}\n\n`;
    md += `**Duração Estimada**: ${sprint.duration}\n\n`;

    md += `### 📋 Visão Geral\n\n`;
    md += `| ID | Título | Responsável | Estimativa | Risco |\n`;
    md += `|----|---------|--------------|-------------|---------|\n`;
    sprint.tasks.forEach(task => {
      md += `| ${task.id} | ${task.title} | ${task.responsible} | ${task.estimateDays} dias | ${task.risk} |\n`;
    });
    md += `\n`;

    md += `### 🎯 Entregáveis do Sprint\n\n`;
    sprint.deliverables.forEach(deliverable => {
      md += `- ✅ ${deliverable}\n`;
    });
    md += `\n`;

    // Detalhamento das tarefas
    md += `### 📝 Detalhamento das Tarefas\n\n`;
    sprint.tasks.forEach(task => {
      md += `#### ${task.id} - ${task.title}\n\n`;
      md += `**Responsável**: ${task.responsible}  \n`;
      md += `**Estimativa**: ${task.estimateDays} dias  \n`;
      md += `**Risco**: ${task.risk}  \n`;
      md += `**Status**: ${task.status}\n\n`;
      
      md += `**Descrição**:  \n${task.description}\n\n`;
      
      if (task.dependencies.length > 0) {
        md += `**Dependências**:  \n`;
        task.dependencies.forEach(dep => {
          md += `- ${dep}\n`;
        });
        md += `\n`;
      }
      
      md += `**Critérios de Aceitação**:\n`;
      task.acceptanceCriteria.forEach(criteria => {
        md += `- ${criteria}\n`;
      });
      md += `\n`;
      
      md += `**Comandos/Ações Recomendadas**:\n\`\`\`bash\n`;
      task.commands.forEach(cmd => {
        md += `${cmd}\n`;
      });
      md += `\`\`\`\n\n`;
      
      md += `**Entregável**: ${task.deliverable}\n\n`;
      md += `---\n\n`;
    });
  });

  // Apêndices
  md += `## 📚 APÊNDICES\n\n`;
  md += `### A. Glossário de Termos\n\n`;
  md += `- **KRCI**: Key Risk Compliance Indicators\n`;
  md += `- **JORC**: Joint Ore Reserves Committee (Austrália)\n`;
  md += `- **NI 43-101**: National Instrument 43-101 (Canadá)\n`;
  md += `- **CBRR**: Código Brasileiro de Recursos e Reservas\n`;
  md += `- **ANM**: Agência Nacional de Mineração (Brasil)\n`;
  md += `- **DOU**: Diário Oficial da União\n`;
  md += `- **SAST**: Static Application Security Testing\n\n`;

  md += `### B. Referências\n\n`;
  md += `- [Auditoria Técnica QIVO v1.3](AUDITORIA_AUTOMATIZADA_QIVO_v1.3.md)\n`;
  md += `- [Documentação API](../README.md)\n`;
  md += `- [Guia de Deploy](DEPLOY.md)\n\n`;

  md += `---\n\n`;
  md += `**Gerado automaticamente por**: scripts/generate-sprints.ts  \n`;
  md += `**Data**: ${new Date().toLocaleString('pt-BR')}  \n`;
  md += `**Versão**: 1.0\n`;

  return md;
}

// ========================================
// 📊 GERAÇÃO DO EXCEL
// ========================================

async function generateExcel(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  
  // Configurações gerais
  workbook.creator = 'QIVO Systems';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ========================================
  // ABA 1: Visão Geral
  // ========================================
  const overviewSheet = workbook.addWorksheet('Visão Geral', {
    properties: { tabColor: { argb: 'FF2F2C79' } }
  });

  overviewSheet.columns = [
    { header: 'Sprint', key: 'sprint', width: 10 },
    { header: 'Nome', key: 'name', width: 35 },
    { header: 'Duração', key: 'duration', width: 15 },
    { header: 'Tarefas', key: 'tasks', width: 10 },
    { header: 'Total Dias', key: 'totalDays', width: 12 },
    { header: 'Risco Alto', key: 'highRisk', width: 12 },
    { header: 'Risco Médio', key: 'mediumRisk', width: 12 },
    { header: 'Risco Baixo', key: 'lowRisk', width: 12 }
  ];

  // Estilizar header
  overviewSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  overviewSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2F2C79' }
  };
  overviewSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Adicionar dados
  sprints.forEach(sprint => {
    const totalDays = sprint.tasks.reduce((acc, t) => acc + t.estimateDays, 0);
    const highRisk = sprint.tasks.filter(t => t.risk === 'Alto').length;
    const mediumRisk = sprint.tasks.filter(t => t.risk === 'Médio').length;
    const lowRisk = sprint.tasks.filter(t => t.risk === 'Baixo').length;

    overviewSheet.addRow({
      sprint: sprint.number,
      name: sprint.name,
      duration: sprint.duration,
      tasks: sprint.tasks.length,
      totalDays,
      highRisk,
      mediumRisk,
      lowRisk
    });
  });

  // ========================================
  // ABA 2-6: Cada Sprint
  // ========================================
  sprints.forEach(sprint => {
    const sheet = workbook.addWorksheet(`Sprint ${sprint.number}`, {
      properties: { tabColor: { argb: 'FF7ED957' } }
    });

    sheet.columns = [
      { header: 'ID', key: 'id', width: 12 },
      { header: 'Título', key: 'title', width: 30 },
      { header: 'Descrição', key: 'description', width: 50 },
      { header: 'Responsável', key: 'responsible', width: 15 },
      { header: 'Estimativa (dias)', key: 'estimate', width: 18 },
      { header: 'Dependências', key: 'dependencies', width: 20 },
      { header: 'Risco', key: 'risk', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Entregável', key: 'deliverable', width: 40 }
    ];

    // Estilizar header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7ED957' }
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Adicionar tarefas
    sprint.tasks.forEach(task => {
      const row = sheet.addRow({
        id: task.id,
        title: task.title,
        description: task.description,
        responsible: task.responsible,
        estimate: task.estimateDays,
        dependencies: task.dependencies.join(', '),
        risk: task.risk,
        status: task.status,
        deliverable: task.deliverable
      });

      // Colorir por risco
      if (task.risk === 'Alto') {
        row.getCell('risk').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF6B6B' }
        };
      } else if (task.risk === 'Médio') {
        row.getCell('risk').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFD93D' }
        };
      } else {
        row.getCell('risk').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF95E1D3' }
        };
      }
    });

    // Auto-ajustar altura das linhas
    sheet.eachRow(row => {
      row.height = 25;
    });
  });

  // ========================================
  // ABA 7: Critérios de Aceitação
  // ========================================
  const criteriaSheet = workbook.addWorksheet('Critérios de Aceitação', {
    properties: { tabColor: { argb: 'FFB96E48' } }
  });

  criteriaSheet.columns = [
    { header: 'Task ID', key: 'taskId', width: 12 },
    { header: 'Critério', key: 'criterion', width: 80 }
  ];

  criteriaSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  criteriaSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFB96E48' }
  };

  sprints.forEach(sprint => {
    sprint.tasks.forEach(task => {
      task.acceptanceCriteria.forEach(criterion => {
        criteriaSheet.addRow({
          taskId: task.id,
          criterion
        });
      });
    });
  });

  // Salvar arquivo
  const outputPath = join(process.cwd(), 'docs', 'QIVO_v1.3_Roadmap.xlsx');
  await workbook.xlsx.writeFile(outputPath);
}

// ========================================
// 🚀 EXECUÇÃO PRINCIPAL
// ========================================

async function main() {
  console.log('🚀 Iniciando geração do Roadmap QIVO v1.3...\n');

  // Criar diretório docs se não existir
  const docsPath = join(process.cwd(), 'docs');
  if (!existsSync(docsPath)) {
    mkdirSync(docsPath, { recursive: true });
    console.log('✅ Diretório /docs criado\n');
  }

  try {
    // Gerar Markdown
    console.log('📝 Gerando arquivo Markdown...');
    const markdown = generateMarkdown();
    const mdPath = join(docsPath, 'Sprints_QIVO_v1.3.md');
    writeFileSync(mdPath, markdown, 'utf-8');
    console.log(`✅ Markdown gerado: ${mdPath}\n`);

    // Gerar Excel
    console.log('📊 Gerando planilha Excel...');
    await generateExcel();
    console.log(`✅ Excel gerado: ${join(docsPath, 'QIVO_v1.3_Roadmap.xlsx')}\n`);

    // Resumo
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Plano de Sprints QIVO v1.3 gerado com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`📄 Arquivos gerados:`);
    console.log(`   - docs/Sprints_QIVO_v1.3.md`);
    console.log(`   - docs/QIVO_v1.3_Roadmap.xlsx\n`);
    console.log(`📊 Estatísticas:`);
    console.log(`   - ${sprints.length} Sprints`);
    console.log(`   - ${sprints.reduce((acc, s) => acc + s.tasks.length, 0)} Tarefas`);
    console.log(`   - ${sprints.reduce((acc, s) => acc + s.tasks.reduce((a, t) => a + t.estimateDays, 0), 0)} dias de trabalho estimados\n`);
    console.log('🚀 Próximo passo: Revisar o roadmap e iniciar Sprint 1!\n');

  } catch (error) {
    console.error('❌ Erro ao gerar arquivos:', error);
    process.exit(1);
  }
}

// Executar
main();

