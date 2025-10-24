/**
 * Radar Regulatória Global Router
 * Aggregates mining operation data from 12 global sources
 */

import express, { type Request, type Response } from 'express';
import { aggregateAllData } from './services/dataAggregator';

const router = express.Router();

// Mock data representing aggregated data from 12 sources
const MOCK_OPERATIONS = [
  // Global Mining Areas (GEE)
  {
    id: 'gee-001',
    name: 'Carajás Mine',
    country: 'Brazil',
    continent: 'Americas',
    mineral: 'Iron',
    status: 'active',
    operator: 'Vale S.A.',
    latitude: -6.0626,
    longitude: -50.1558,
    source: 'Global Mining Areas (GEE)',
    lastUpdate: '2025-10-15',
  },
  // Resource Watch
  {
    id: 'rw-002',
    name: 'Escondida Mine',
    country: 'Chile',
    continent: 'Americas',
    mineral: 'Copper',
    status: 'active',
    operator: 'BHP',
    latitude: -24.2333,
    longitude: -69.0833,
    source: 'Resource Watch – Mining Concessions',
    lastUpdate: '2025-10-10',
  },
  // Nature Dataset
  {
    id: 'nd-003',
    name: 'Hunter Valley Coal',
    country: 'Australia',
    continent: 'Oceania',
    mineral: 'Coal',
    status: 'active',
    operator: 'Glencore',
    latitude: -32.5,
    longitude: 151.0,
    source: 'Global Coal & Metal Mine Production – Nature Dataset',
    lastUpdate: '2025-10-12',
  },
  // Brazil Mining Concessions (GFW)
  {
    id: 'gfw-004',
    name: 'Minas-Rio',
    country: 'Brazil',
    continent: 'Americas',
    mineral: 'Iron',
    status: 'active',
    operator: 'Anglo American',
    latitude: -18.2,
    longitude: -43.5,
    source: 'Brazil Mining Concessions – Global Forest Watch',
    lastUpdate: '2025-10-08',
  },
  // USGS Latin America
  {
    id: 'usgs-005',
    name: 'Cerro Verde',
    country: 'Peru',
    continent: 'Americas',
    mineral: 'Copper',
    status: 'active',
    operator: 'Freeport-McMoRan',
    latitude: -16.5333,
    longitude: -71.5833,
    source: 'Mineral Facilities of Latin America & Caribbean – USGS',
    lastUpdate: '2025-10-05',
  },
  // Indo-Pacific USGS
  {
    id: 'usgs-006',
    name: 'Grasberg Mine',
    country: 'Indonesia',
    continent: 'Asia',
    mineral: 'Gold',
    status: 'active',
    operator: 'Freeport Indonesia',
    latitude: -4.0533,
    longitude: 137.1156,
    source: 'Indo-Pacific USGS Mineral GIS',
    lastUpdate: '2025-10-18',
  },
  // Philippines Mining
  {
    id: 'ph-007',
    name: 'Tampakan Copper-Gold',
    country: 'Philippines',
    continent: 'Asia',
    mineral: 'Copper',
    status: 'planned',
    operator: 'Sagittarius Mines',
    latitude: 6.4,
    longitude: 124.9,
    source: 'Philippines Mining Industry Statistics – Data.gov.ph',
    lastUpdate: '2025-10-01',
  },
  // Pacific Data Portal
  {
    id: 'pdp-008',
    name: 'Panguna Mine',
    country: 'Papua New Guinea',
    continent: 'Oceania',
    mineral: 'Copper',
    status: 'inactive',
    operator: 'Bougainville Copper',
    latitude: -6.3167,
    longitude: 155.4833,
    source: 'Pacific Data Portal – Mining Datasets (PNG, Solomon Islands)',
    lastUpdate: '2025-09-25',
  },
  // Africa RCMRD
  {
    id: 'rcmrd-009',
    name: 'Jwaneng Diamond Mine',
    country: 'Botswana',
    continent: 'Africa',
    mineral: 'Gold',
    status: 'active',
    operator: 'Debswana',
    latitude: -24.6,
    longitude: 24.7,
    source: 'Africa Major Mineral Deposits – RCMRD',
    lastUpdate: '2025-10-20',
  },
  // Mineral Operations Africa
  {
    id: 'rcmrd-010',
    name: 'Obuasi Gold Mine',
    country: 'Ghana',
    continent: 'Africa',
    mineral: 'Gold',
    status: 'active',
    operator: 'AngloGold Ashanti',
    latitude: 6.2,
    longitude: -1.67,
    source: 'Mineral Operations of Africa & Middle East – RCMRD',
    lastUpdate: '2025-10-17',
  },
  // Australian Operating Mines
  {
    id: 'atlas-011',
    name: 'Olympic Dam',
    country: 'Australia',
    continent: 'Oceania',
    mineral: 'Copper',
    status: 'active',
    operator: 'BHP',
    latitude: -30.4667,
    longitude: 136.8833,
    source: 'Australian Operating Mines – Atlas Gov',
    lastUpdate: '2025-10-22',
  },
  // EU Mineral Resources
  {
    id: 'eu-012',
    name: 'Kiruna Iron Mine',
    country: 'Sweden',
    continent: 'Europe',
    mineral: 'Iron',
    status: 'active',
    operator: 'LKAB',
    latitude: 67.8558,
    longitude: 20.2253,
    source: 'EU Mineral Resources Dataset – EuroGeoSurveys',
    lastUpdate: '2025-10-19',
  },
  // Additional samples for diversity
  {
    id: 'gee-013',
    name: 'Salar de Atacama',
    country: 'Chile',
    continent: 'Americas',
    mineral: 'Lithium',
    status: 'active',
    operator: 'SQM',
    latitude: -23.5,
    longitude: -68.25,
    source: 'Global Mining Areas (GEE)',
    lastUpdate: '2025-10-14',
  },
  {
    id: 'rw-014',
    name: 'Bayan Obo',
    country: 'China',
    continent: 'Asia',
    mineral: 'Rare Earths',
    status: 'active',
    operator: 'China Northern Rare Earth',
    latitude: 41.7667,
    longitude: 109.9667,
    source: 'Resource Watch – Mining Concessions',
    lastUpdate: '2025-10-11',
  },
  {
    id: 'nd-015',
    name: 'Pilbara Iron Ore',
    country: 'Australia',
    continent: 'Oceania',
    mineral: 'Iron',
    status: 'active',
    operator: 'Rio Tinto',
    latitude: -22.5,
    longitude: 117.5,
    source: 'Global Coal & Metal Mine Production – Nature Dataset',
    lastUpdate: '2025-10-16',
  },
];

/**
 * GET /api/radar/operations
 * Returns aggregated mining operations from 12 global sources
 */
router.get('/operations', async (req: Request, res: Response) => {
  try {
    // Try to fetch real data from aggregator
    const { operations, sources } = await aggregateAllData();
    
    // If no real data available, fallback to mock data
    const finalOperations = operations.length > 0 ? operations : MOCK_OPERATIONS;
    const activeSources = sources.filter(s => s.status === 'active').length;
    
    res.json({
      success: true,
      operations: finalOperations,
      sources: activeSources || 12,
      lastUpdate: new Date().toISOString(),
      dataSource: operations.length > 0 ? 'real' : 'mock',
      sourceDetails: sources,
    });
  } catch (error: any) {
    console.error('[Radar] Error fetching operations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mining operations',
    });
  }
});

/**
 * GET /api/radar/sources
 * Returns information about the 12 data sources
 */
router.get('/sources', async (req: Request, res: Response) => {
  const sources = [
    {
      id: 1,
      name: 'Global Mining Areas (GEE)',
      region: 'Global',
      type: 'Satellite Data',
      url: 'https://earthengine.google.com/',
    },
    {
      id: 2,
      name: 'Resource Watch – Mining Concessions',
      region: 'Global',
      type: 'Concession Data',
      url: 'https://resourcewatch.org/',
    },
    {
      id: 3,
      name: 'Global Coal & Metal Mine Production – Nature Dataset',
      region: 'Global',
      type: 'Production Data',
      url: 'https://www.nature.com/',
    },
    {
      id: 4,
      name: 'Brazil Mining Concessions – Global Forest Watch',
      region: 'Americas',
      type: 'Concession Data',
      url: 'https://www.globalforestwatch.org/',
    },
    {
      id: 5,
      name: 'Mineral Facilities of Latin America & Caribbean – USGS',
      region: 'Americas',
      type: 'Facility Data',
      url: 'https://www.usgs.gov/',
    },
    {
      id: 6,
      name: 'Indo-Pacific USGS Mineral GIS',
      region: 'Asia/Pacific',
      type: 'GIS Data',
      url: 'https://www.usgs.gov/',
    },
    {
      id: 7,
      name: 'Philippines Mining Industry Statistics – Data.gov.ph',
      region: 'Asia/Pacific',
      type: 'Government Data',
      url: 'https://data.gov.ph/',
    },
    {
      id: 8,
      name: 'Pacific Data Portal – Mining Datasets',
      region: 'Oceania',
      type: 'Regional Data',
      url: 'https://pacificdata.org/',
    },
    {
      id: 9,
      name: 'Africa Major Mineral Deposits – RCMRD',
      region: 'Africa',
      type: 'Deposit Data',
      url: 'https://www.rcmrd.org/',
    },
    {
      id: 10,
      name: 'Mineral Operations of Africa & Middle East – RCMRD',
      region: 'Africa',
      type: 'Operations Data',
      url: 'https://www.rcmrd.org/',
    },
    {
      id: 11,
      name: 'Australian Operating Mines – Atlas Gov',
      region: 'Oceania',
      type: 'Government Data',
      url: 'https://www.industry.gov.au/',
    },
    {
      id: 12,
      name: 'EU Mineral Resources Dataset – EuroGeoSurveys',
      region: 'Europe',
      type: 'Resource Data',
      url: 'https://www.eurogeosurveys.org/',
    },
  ];

  res.json({
    success: true,
    sources,
    total: sources.length,
  });
});

export default router;



// Mock regulatory changes data
const MOCK_REGULATORY_CHANGES = [
  {
    id: 'reg-001',
    country: 'Brazil',
    date: '2025-10-15',
    summary: 'Nova lei de licenciamento ambiental para mineração reduz prazo de análise de 180 para 90 dias',
    fullText: 'O Congresso Nacional aprovou a Lei 14.XXX/2025 que estabelece novos prazos para análise de licenciamento ambiental de projetos de mineração. A medida visa acelerar a aprovação de projetos considerados estratégicos para o país, mantendo os requisitos de proteção ambiental. Os órgãos ambientais terão 90 dias para análise inicial, com possibilidade de prorrogação por mais 45 dias em casos excepcionais.',
    source: 'Diário Oficial da União',
    category: 'licensing',
    impact: 'high',
    url: 'https://www.in.gov.br/exemplo',
  },
  {
    id: 'reg-002',
    country: 'Chile',
    date: '2025-10-10',
    summary: 'Aumento de royalties sobre mineração de cobre de 3% para 5%',
    fullText: 'O governo chileno anunciou o aumento da alíquota de royalties sobre a exploração de cobre, principal commodity do país. A medida entrará em vigor em janeiro de 2026 e afetará todas as operações com produção superior a 50.000 toneladas anuais. Os recursos adicionais serão destinados a programas de desenvolvimento regional e transição energética.',
    source: 'Ministerio de Minería de Chile',
    category: 'taxation',
    impact: 'high',
    url: 'https://www.mineria.gob.cl/ejemplo',
  },
  {
    id: 'reg-003',
    country: 'Australia',
    date: '2025-10-08',
    summary: 'Novas diretrizes de segurança para operações subterrâneas',
    fullText: 'O Departamento de Recursos Minerais da Austrália publicou novas diretrizes de segurança para operações de mineração subterrânea. As mudanças incluem requisitos mais rigorosos para ventilação, monitoramento de gases e treinamento de equipes de emergência. As empresas têm 12 meses para adequação completa aos novos padrões.',
    source: 'Australian Department of Resources',
    category: 'safety',
    impact: 'medium',
    url: 'https://www.industry.gov.au/exemplo',
  },
  {
    id: 'reg-004',
    country: 'Peru',
    date: '2025-10-05',
    summary: 'Consulta prévia obrigatória a comunidades indígenas ampliada',
    fullText: 'O Ministério de Energia e Minas do Peru ampliou o escopo da consulta prévia obrigatória a comunidades indígenas. Agora, além de novos projetos, operações em expansão que afetem territórios tradicionais também devem passar pelo processo de consulta. A medida visa garantir maior participação das comunidades nas decisões sobre projetos minerários.',
    source: 'Ministerio de Energía y Minas del Perú',
    category: 'licensing',
    impact: 'high',
    url: 'https://www.minem.gob.pe/ejemplo',
  },
  {
    id: 'reg-005',
    country: 'Indonesia',
    date: '2025-10-01',
    summary: 'Proibição de exportação de minério bruto de níquel mantida',
    fullText: 'O governo indonésio confirmou a manutenção da proibição de exportação de minério bruto de níquel, forçando empresas a processar o mineral localmente. A medida visa agregar valor à cadeia produtiva nacional e atrair investimentos em refinarias. Empresas que não se adequarem até 2026 terão suas licenças de exportação canceladas.',
    source: 'Ministry of Energy and Mineral Resources Indonesia',
    category: 'other',
    impact: 'high',
    url: 'https://www.esdm.go.id/exemplo',
  },
  {
    id: 'reg-006',
    country: 'South Africa',
    date: '2025-09-28',
    summary: 'Novo código de mineração estabelece cotas de participação local',
    fullText: 'O novo Mining Charter da África do Sul estabelece que empresas de mineração devem ter no mínimo 30% de participação de empresários negros sul-africanos até 2030. A medida faz parte da política de transformação econômica do país e afeta todas as novas licenças de mineração concedidas a partir de 2026.',
    source: 'Department of Mineral Resources and Energy SA',
    category: 'licensing',
    impact: 'high',
    url: 'https://www.dmre.gov.za/exemplo',
  },
  {
    id: 'reg-007',
    country: 'Canada',
    date: '2025-09-25',
    summary: 'Incentivos fiscais para mineração de minerais críticos',
    fullText: 'O governo canadense anunciou um pacote de incentivos fiscais para empresas que exploram minerais críticos (lítio, cobalto, grafite, terras raras). As medidas incluem crédito tributário de 30% sobre investimentos em exploração e isenção de impostos sobre exportação por 5 anos. O objetivo é fortalecer a cadeia de suprimentos de baterias para veículos elétricos.',
    source: 'Natural Resources Canada',
    category: 'taxation',
    impact: 'medium',
    url: 'https://www.nrcan.gc.ca/exemplo',
  },
  {
    id: 'reg-008',
    country: 'DRC',
    date: '2025-09-20',
    summary: 'Revisão do código de mineração aumenta participação estatal',
    fullText: 'A República Democrática do Congo revisou seu código de mineração, aumentando a participação estatal em projetos de mineração de 5% para 10%. A medida afeta principalmente operações de cobalto e cobre. Empresas já estabelecidas têm 24 meses para renegociar contratos e adequar estruturas societárias.',
    source: 'Ministère des Mines RDC',
    category: 'taxation',
    impact: 'high',
    url: 'https://www.mines-rdc.cd/exemplo',
  },
  {
    id: 'reg-009',
    country: 'Sweden',
    date: '2025-09-15',
    summary: 'Novas exigências ambientais para mineração no Ártico',
    fullText: 'A Suécia implementou novas regulamentações ambientais para projetos de mineração em regiões árticas. As mudanças incluem estudos de impacto mais detalhados sobre ecossistemas sensíveis, monitoramento contínuo de biodiversidade e planos de recuperação ambiental mais rigorosos. Projetos em andamento têm 18 meses para adequação.',
    source: 'Swedish Environmental Protection Agency',
    category: 'environmental',
    impact: 'medium',
    url: 'https://www.naturvardsverket.se/exemplo',
  },
  {
    id: 'reg-010',
    country: 'India',
    date: '2025-09-10',
    summary: 'Simplificação de processos para mineração de carvão',
    fullText: 'O Ministério do Carvão da Índia anunciou a simplificação de processos de licenciamento para mineração de carvão. O número de aprovações necessárias foi reduzido de 15 para 8, e o prazo total de licenciamento caiu de 3 anos para 18 meses. A medida visa aumentar a produção doméstica e reduzir importações.',
    source: 'Ministry of Coal India',
    category: 'licensing',
    impact: 'medium',
    url: 'https://www.coal.nic.in/exemplo',
  },
];

/**
 * GET /api/radar/regulatory-changes
 * Returns regulatory changes affecting mining operations globally
 */
router.get('/regulatory-changes', async (req: Request, res: Response) => {
  try {
    // In production, this would aggregate data from:
    // - Government official gazettes
    // - Mining ministries websites
    // - International mining associations
    // - Legal databases
    // - News agencies

    // For now, return mock data
    res.json({
      success: true,
      changes: MOCK_REGULATORY_CHANGES,
      total: MOCK_REGULATORY_CHANGES.length,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Radar] Error fetching regulatory changes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch regulatory changes',
    });
  }
});

