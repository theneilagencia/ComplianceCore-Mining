/**
 * Radar Regulatória Global Router
 * Aggregates mining operation data from 12 global sources
 */

import express, { type Request, type Response } from 'express';

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
    // In production, this would aggregate data from:
    // 1. Global Mining Areas (GEE)
    // 2. Resource Watch – Mining Concessions
    // 3. Global Coal & Metal Mine Production – Nature Dataset
    // 4. Brazil Mining Concessions – Global Forest Watch
    // 5. Mineral Facilities of Latin America & Caribbean – USGS
    // 6. Indo-Pacific USGS Mineral GIS
    // 7. Philippines Mining Industry Statistics – Data.gov.ph
    // 8. Pacific Data Portal – Mining Datasets (PNG, Solomon Islands)
    // 9. Africa Major Mineral Deposits – RCMRD
    // 10. Mineral Operations of Africa & Middle East – RCMRD
    // 11. Australian Operating Mines – Atlas Gov
    // 12. EU Mineral Resources Dataset – EuroGeoSurveys

    // For now, return mock data
    res.json({
      success: true,
      operations: MOCK_OPERATIONS,
      sources: 12,
      lastUpdate: new Date().toISOString(),
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

