/**
 * Radar Regulatória Global Router
 * Aggregates mining operation data from 12 global sources
 */

import express, { type Request, type Response } from 'express';
import { aggregateAllData } from './services/dataAggregator';

const router = express.Router();

// REMOVED: MOCK_OPERATIONS array (210 lines)
// Production mode: only real data from aggregator
// If you need to restore mocks for development, check git history

/**
 * GET /api/radar/operations
 * Returns aggregated mining operations from 12 global sources
 * 
 * PRODUCTION MODE: Only returns real data from aggregator.
 * Returns 503 if no data sources are available.
 */
router.get('/operations', async (req: Request, res: Response) => {
  try {
    // Fetch real data from aggregator
    const { operations, sources } = await aggregateAllData();
    const activeSources = sources.filter(s => s.status === 'active').length;
    
    // Production mode: require real data
    if (operations.length === 0) {
      console.error('[Radar] No operations available from data sources');
      return res.status(503).json({
        success: false,
        error: 'No mining operations data available. Data sources may be offline or not configured.',
        sources: activeSources,
        sourceDetails: sources,
      });
    }
    
    console.log(`[Radar] Returning ${operations.length} operations from ${activeSources} active sources`);
    
    res.json({
      success: true,
      operations,
      sources: activeSources,
      lastUpdate: new Date().toISOString(),
      sourceDetails: sources,
    });
  } catch (error: any) {
    console.error('[Radar] Error fetching operations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mining operations',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

/**
 * GET /api/radar/regulatory-changes
 * Returns regulatory changes from global sources
 * 
 * NOTE: Currently returns mock data pending DOU scraper integration.
 * Real implementation will use DOUScraper service once scheduler is fully enabled.
 * 
 * TODO Phase 3: Integrate real DOU scraping with scheduler
 *   - Enable DOU scraper job in production
 *   - Store results in database
 *   - Return real regulatory changes from DB
 */

/**
 * GET /api/radar/regulatory-changes
 * Returns regulatory changes affecting mining operations globally
 */
router.get('/regulatory-changes', async (req: Request, res: Response) => {
  try {
    // PRODUCTION MODE: Fetch real data from database
    // Data is populated by:
    // - DOU scraper (Brazil)
    // - Government official gazettes
    // - Mining ministries websites
    // - International mining associations
    // - Legal databases
    // - News agencies
    
    const db = await import('../../db').then((m) => m.getDb());
    if (!db) {
      throw new Error('Database not available');
    }
    
    // Import schema
    const { regulatoryChanges } = await import('../../../drizzle/schema');
    const { desc } = await import('drizzle-orm');
    
    // Fetch from database
    const changes = await db
      .select()
      .from(regulatoryChanges)
      .orderBy(desc(regulatoryChanges.publishedAt))
      .limit(100);
    
    if (changes.length === 0) {
      console.warn('[Radar] No regulatory changes found in database');
      return res.status(503).json({
        success: false,
        error: 'No regulatory changes data available. Scraper may not be running or database is empty.',
        total: 0,
      });
    }
    
    console.log(`[Radar] Returning ${changes.length} regulatory changes from database`);
    
    res.json({
      success: true,
      changes,
      total: changes.length,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Radar] Error fetching regulatory changes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch regulatory changes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/radar/notifications
 * Returns notifications from radar monitoring system
 * 
 * NOTE: Currently returns mock data. Real notifications will come from:
 *   - DOU Scraper (scheduled job - every 12 hours)
 *   - External API changes detected by aggregator
 *   - Regulatory updates from integrated sources
 * 
 * TODO Phase 3: Connect to real notification service
 *   - Store notifications in database
 *   - Integrate with webhook notification system
 *   - Support real-time notifications via SSE
 */

// Mock notifications data from all radar sources
const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-001',
    title: 'Nova Publicação DOU - Licenciamento Ambiental',
    message: 'Portaria nº 123/2025 do IBAMA estabelece novos critérios para licenciamento de projetos de mineração em áreas de preservação ambiental',
    severity: 'high' as const,
    category: 'regulatory' as const,
    source: 'DOU Scraper',
    date: new Date('2025-10-25T08:30:00Z').toISOString(),
    read: false,
    metadata: {
      documentType: 'Portaria',
      agency: 'IBAMA',
      jurisdiction: 'Brasil',
      affectedSectors: ['Mineração', 'Licenciamento']
    }
  },
  {
    id: 'notif-002',
    title: 'Área de Mineração Detectada - SIGMINE',
    message: '15 novos processos de mineração registrados na ANM para minério de ferro em Minas Gerais',
    severity: 'medium' as const,
    category: 'mining_activity' as const,
    source: 'SIGMINE Client',
    date: new Date('2025-10-24T14:20:00Z').toISOString(),
    read: false,
    metadata: {
      state: 'MG',
      mineral: 'Ferro',
      processCount: 15,
      totalArea: '2500 hectares'
    }
  },
  {
    id: 'notif-003',
    title: 'Alerta de Desmatamento - MapBiomas',
    message: 'Detectado aumento de 18% em desmatamento próximo a áreas de concessão mineral no Pará',
    severity: 'high' as const,
    category: 'environmental' as const,
    source: 'MapBiomas Client',
    date: new Date('2025-10-23T16:45:00Z').toISOString(),
    read: true,
    metadata: {
      state: 'PA',
      increasePercentage: 18,
      affectedArea: '850 hectares',
      alertType: 'Deforestation'
    }
  },
  {
    id: 'notif-004',
    title: 'Mudança Regulatória - Chile',
    message: 'Aumento de royalties sobre mineração de cobre de 3% para 5% aprovado pelo Congresso chileno',
    severity: 'high' as const,
    category: 'regulatory' as const,
    source: 'Regulatory Changes Monitor',
    date: new Date('2025-10-22T10:15:00Z').toISOString(),
    read: true,
    metadata: {
      country: 'Chile',
      mineral: 'Cobre',
      changeType: 'Taxation',
      effectiveDate: '2026-01-01'
    }
  },
  {
    id: 'notif-005',
    title: 'Nova Operação Minerária - USGS',
    message: 'Registro de nova operação de mineração de lítio na Argentina identificada pelo USGS',
    severity: 'low' as const,
    category: 'mining_activity' as const,
    source: 'USGS Data Aggregator',
    date: new Date('2025-10-21T09:00:00Z').toISOString(),
    read: true,
    metadata: {
      country: 'Argentina',
      mineral: 'Lítio',
      operator: 'Lithium Americas',
      status: 'Planejamento'
    }
  },
  {
    id: 'notif-006',
    title: 'Consulta Pública - Barragens',
    message: 'ANM abre consulta pública sobre revisão das normas de segurança de barragens de mineração',
    severity: 'medium' as const,
    category: 'regulatory' as const,
    source: 'DOU Scraper',
    date: new Date('2025-10-20T11:30:00Z').toISOString(),
    read: false,
    metadata: {
      agency: 'ANM',
      consultationType: 'Pública',
      deadline: '2025-11-30',
      topic: 'Segurança de Barragens'
    }
  },
  {
    id: 'notif-007',
    title: 'Monitoramento Global - GFW',
    message: 'Global Forest Watch identificou 45 novas concessões de mineração em áreas de floresta tropical',
    severity: 'medium' as const,
    category: 'environmental' as const,
    source: 'GFW Data Integration',
    date: new Date('2025-10-19T15:20:00Z').toISOString(),
    read: true,
    metadata: {
      region: 'América Latina',
      forestType: 'Tropical',
      concessionCount: 45,
      countries: ['Brasil', 'Peru', 'Colômbia']
    }
  },
  {
    id: 'notif-008',
    title: 'Atualização SIGMINE - Processos Suspensos',
    message: '8 processos minerários suspensos por irregularidades ambientais em São Paulo',
    severity: 'high' as const,
    category: 'compliance' as const,
    source: 'SIGMINE Client',
    date: new Date('2025-10-18T13:45:00Z').toISOString(),
    read: false,
    metadata: {
      state: 'SP',
      processCount: 8,
      reason: 'Irregularidades Ambientais',
      action: 'Suspensão'
    }
  },
  {
    id: 'notif-009',
    title: 'Análise Temporal - MapBiomas',
    message: 'Estudo mostra redução de 12% em áreas de mineração ativa no Cerrado nos últimos 2 anos',
    severity: 'low' as const,
    category: 'mining_activity' as const,
    source: 'MapBiomas Client',
    date: new Date('2025-10-17T08:15:00Z').toISOString(),
    read: true,
    metadata: {
      biome: 'Cerrado',
      changePercentage: -12,
      period: '2023-2025',
      trendType: 'Redução'
    }
  },
  {
    id: 'notif-010',
    title: 'Publicação DOU - CFEM',
    message: 'Receita Federal publica novas regras para recolhimento da Compensação Financeira pela Exploração Mineral',
    severity: 'medium' as const,
    category: 'regulatory' as const,
    source: 'DOU Scraper',
    date: new Date('2025-10-16T07:00:00Z').toISOString(),
    read: true,
    metadata: {
      documentType: 'Instrução Normativa',
      agency: 'Receita Federal',
      topic: 'CFEM',
      effectiveDate: '2025-11-01'
    }
  }
];

/**
 * GET /api/radar/notifications
 * Returns regulatory notifications with filtering options
 * Query params:
 * - severity: high | medium | low
 * - category: regulatory | environmental | mining_activity | compliance
 * - dateFrom: ISO date string
 * - dateTo: ISO date string
 * - read: true | false
 * - source: string (DOU Scraper, SIGMINE Client, MapBiomas Client, etc.)
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const { severity, category, dateFrom, dateTo, read, source } = req.query;

    let filteredNotifications = [...MOCK_NOTIFICATIONS];

    // Filter by severity
    if (severity && typeof severity === 'string') {
      filteredNotifications = filteredNotifications.filter(n => n.severity === severity);
    }

    // Filter by category
    if (category && typeof category === 'string') {
      filteredNotifications = filteredNotifications.filter(n => n.category === category);
    }

    // Filter by date range
    if (dateFrom && typeof dateFrom === 'string') {
      const fromDate = new Date(dateFrom);
      filteredNotifications = filteredNotifications.filter(n => new Date(n.date) >= fromDate);
    }

    if (dateTo && typeof dateTo === 'string') {
      const toDate = new Date(dateTo);
      filteredNotifications = filteredNotifications.filter(n => new Date(n.date) <= toDate);
    }

    // Filter by read status
    if (read !== undefined) {
      const isRead = read === 'true';
      filteredNotifications = filteredNotifications.filter(n => n.read === isRead);
    }

    // Filter by source
    if (source && typeof source === 'string') {
      filteredNotifications = filteredNotifications.filter(n => 
        n.source.toLowerCase().includes(source.toLowerCase())
      );
    }

    // Calculate statistics
    const stats = {
      total: MOCK_NOTIFICATIONS.length,
      filtered: filteredNotifications.length,
      unread: MOCK_NOTIFICATIONS.filter(n => !n.read).length,
      bySeverity: {
        high: MOCK_NOTIFICATIONS.filter(n => n.severity === 'high').length,
        medium: MOCK_NOTIFICATIONS.filter(n => n.severity === 'medium').length,
        low: MOCK_NOTIFICATIONS.filter(n => n.severity === 'low').length,
      },
      byCategory: {
        regulatory: MOCK_NOTIFICATIONS.filter(n => n.category === 'regulatory').length,
        environmental: MOCK_NOTIFICATIONS.filter(n => n.category === 'environmental').length,
        mining_activity: MOCK_NOTIFICATIONS.filter(n => n.category === 'mining_activity').length,
        compliance: MOCK_NOTIFICATIONS.filter(n => n.category === 'compliance').length,
      },
    };

    res.json({
      success: true,
      notifications: filteredNotifications,
      stats,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Radar] Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
});

/**
 * PATCH /api/radar/notifications/:id/read
 * Marks a notification as read
 */
router.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = MOCK_NOTIFICATIONS.find(n => n.id === id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    notification.read = true;

    res.json({
      success: true,
      notification,
    });
  } catch (error: any) {
    console.error('[Radar] Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
});

export default router;
