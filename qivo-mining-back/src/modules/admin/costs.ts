/**
 * Admin Costs Service
 * Tracks and calculates costs from external integrations
 */

export interface ServiceCost {
  service: string;
  category: 'infrastructure' | 'ai' | 'data' | 'maps';
  monthlyCost: number;
  variableCost: number;
  description: string;
}

/**
 * Get all service costs
 */
export function getServiceCosts(): ServiceCost[] {
  return [
    // Infrastructure
    {
      service: 'Render.com',
      category: 'infrastructure',
      monthlyCost: parseFloat(process.env.RENDER_MONTHLY_COST || '25'),
      variableCost: 0,
      description: 'Web hosting + PostgreSQL database',
    },
    {
      service: 'AWS S3',
      category: 'infrastructure',
      monthlyCost: 0,
      variableCost: parseFloat(process.env.AWS_S3_COST_PER_GB || '0.023'),
      description: 'File storage ($0.023/GB)',
    },

    // AI Services
    {
      service: 'OpenAI GPT-4',
      category: 'ai',
      monthlyCost: 0,
      variableCost: parseFloat(process.env.OPENAI_COST_PER_1K_TOKENS || '0.03'),
      description: 'AI report generation ($0.03/1K tokens)',
    },

    // Data Services
    {
      service: 'ANM SIGMINE',
      category: 'data',
      monthlyCost: 0,
      variableCost: 0,
      description: 'Free public API',
    },
    {
      service: 'CPRM GeoSGB',
      category: 'data',
      monthlyCost: 0,
      variableCost: 0,
      description: 'Free public API',
    },
    {
      service: 'ANP CKAN',
      category: 'data',
      monthlyCost: 0,
      variableCost: 0,
      description: 'Free public API',
    },
    {
      service: 'IBAMA CKAN',
      category: 'data',
      monthlyCost: 0,
      variableCost: 0,
      description: 'Free public API',
    },
    {
      service: 'USGS MRDS',
      category: 'data',
      monthlyCost: 0,
      variableCost: 0,
      description: 'Free public API',
    },
    {
      service: 'Copernicus',
      category: 'data',
      monthlyCost: 0,
      variableCost: parseFloat(process.env.COPERNICUS_COST_PER_REQUEST || '0.001'),
      description: 'Satellite imagery ($0.001/request)',
    },
    {
      service: 'NASA EarthData',
      category: 'data',
      monthlyCost: 0,
      variableCost: 0,
      description: 'Free public API',
    },

    // Maps
    {
      service: 'Mapbox',
      category: 'maps',
      monthlyCost: 0,
      variableCost: parseFloat(process.env.MAPBOX_COST_PER_1K_REQUESTS || '0.50'),
      description: 'Map rendering ($0.50/1K requests)',
    },
  ];
}

/**
 * Calculate total monthly fixed costs
 */
export function calculateFixedCosts(): number {
  const costs = getServiceCosts();
  return costs.reduce((sum, cost) => sum + cost.monthlyCost, 0);
}

/**
 * Calculate total variable costs based on usage
 */
export interface UsageMetrics {
  s3StorageGB?: number;
  openaiTokens?: number;
  copernicusRequests?: number;
  mapboxRequests?: number;
}

export function calculateVariableCosts(usage: UsageMetrics): number {
  const costs = getServiceCosts();
  let total = 0;

  // S3 Storage
  if (usage.s3StorageGB) {
    const s3Cost = costs.find(c => c.service === 'AWS S3');
    total += (usage.s3StorageGB || 0) * (s3Cost?.variableCost || 0);
  }

  // OpenAI
  if (usage.openaiTokens) {
    const openaiCost = costs.find(c => c.service === 'OpenAI GPT-4');
    total += ((usage.openaiTokens || 0) / 1000) * (openaiCost?.variableCost || 0);
  }

  // Copernicus
  if (usage.copernicusRequests) {
    const copernicusCost = costs.find(c => c.service === 'Copernicus');
    total += (usage.copernicusRequests || 0) * (copernicusCost?.variableCost || 0);
  }

  // Mapbox
  if (usage.mapboxRequests) {
    const mapboxCost = costs.find(c => c.service === 'Mapbox');
    total += ((usage.mapboxRequests || 0) / 1000) * (mapboxCost?.variableCost || 0);
  }

  return total;
}

/**
 * Calculate profit (Revenue - Costs)
 */
export interface ProfitCalculation {
  revenue: number;
  fixedCosts: number;
  variableCosts: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export function calculateProfit(
  revenue: number,
  usage: UsageMetrics
): ProfitCalculation {
  const fixedCosts = calculateFixedCosts();
  const variableCosts = calculateVariableCosts(usage);
  const totalCosts = fixedCosts + variableCosts;
  const grossProfit = revenue - variableCosts;
  const netProfit = revenue - totalCosts;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    revenue,
    fixedCosts,
    variableCosts,
    totalCosts,
    grossProfit,
    netProfit,
    profitMargin,
  };
}

