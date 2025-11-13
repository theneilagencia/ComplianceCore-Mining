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
    
    // Handle empty data gracefully
    if (operations.length === 0) {
      console.warn('[Radar] No operations available from data sources');
      return res.status(200).json({
        success: true,
        operations: [],
        sources: activeSources,
        lastUpdate: new Date().toISOString(),
        sourceDetails: sources,
        message: 'No mining operations data available at this time. Data sources are being updated.',
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
 * NOTE: Returns regulatory changes from database.
 * Data is populated by DOU scraper service via scheduler.
 * Configure API keys to enable real-time scraping.
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
    // TODO: Implement notifications table in database
    // For now, return empty array until notification system is fully integrated
    const { severity, category, dateFrom, dateTo, read, source } = req.query;

    // Return empty array until notification system is fully implemented
    res.json({
      success: true,
      notifications: [],
      stats: {
        total: 0,
        filtered: 0,
        unread: 0,
        bySeverity: { high: 0, medium: 0, low: 0 },
        byCategory: { regulatory: 0, environmental: 0, mining_activity: 0, compliance: 0 },
      },
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
    
    // TODO: Implement database update when notifications table is ready
    return res.status(501).json({
      success: false,
      error: 'Notification system not yet implemented',
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
