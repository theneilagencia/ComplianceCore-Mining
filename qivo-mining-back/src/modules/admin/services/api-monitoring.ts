/**
 * API Monitoring Service
 * 
 * Complete monitoring system for all APIs and services integrated in QIVO Mining
 * - Availability (uptime %)
 * - Latency (response time)
 * - Costs (USD)
 * - Quotas (% used)
 * - Errors (error rate)
 * - Automatic alerts
 */

import { db } from '../../../lib/database';
import { logger } from '../../../lib/logger';

export interface APIService {
  id: string;
  name: string;
  category: 'radar' | 'infrastructure' | 'payment' | 'email' | 'ai' | 'storage';
  provider: string;
  endpoint?: string;
  tier: 'free' | 'paid';
  monthlyQuota?: number; // requests per month
  monthlyCost?: number; // USD per month
  costPerRequest?: number; // USD per request
}

export interface APIMetrics {
  serviceId: string;
  serviceName: string;
  
  // Availability
  uptime: number; // percentage (0-100)
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number; // percentage (0-100)
  
  // Performance
  avgResponseTime: number; // milliseconds
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number; // 95th percentile
  
  // Costs
  totalCost: number; // USD
  costPerRequest: number; // USD
  quotaUsed: number; // requests
  quotaPercentage: number; // percentage (0-100)
  
  // Status
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  lastChecked: Date;
  lastError?: string;
}

export interface CostBreakdown {
  total: number; // USD
  byCategory: Record<string, number>;
  byService: Record<string, number>;
  trend: 'increasing' | 'stable' | 'decreasing';
  projectedMonthly: number; // USD
}

export interface Alert {
  id: string;
  serviceId: string;
  serviceName: string;
  type: 'quota' | 'cost' | 'availability' | 'performance';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  threshold: number;
  currentValue: number;
  createdAt: Date;
  resolved: boolean;
}

/**
 * All APIs and services monitored by QIVO Mining
 */
export const MONITORED_SERVICES: APIService[] = [
  
  // ============================================================================
  // RADAR APIs - Brazilian Government
  // ============================================================================
  
  {
    id: 'anm',
    name: 'ANM Dados Abertos',
    category: 'radar',
    provider: 'Agência Nacional de Mineração',
    endpoint: 'https://dados.gov.br/api/3/action/package_show?id=sistema-de-informacoes-geograficas-da-mineracao-sigmine',
    tier: 'free',
    monthlyQuota: undefined, // unlimited
    monthlyCost: 0,
    costPerRequest: 0,
  },
  {
    id: 'cprm',
    name: 'CPRM/SGB GeoSGB',
    category: 'radar',
    provider: 'Serviço Geológico do Brasil',
    endpoint: 'https://geosgb.sgb.gov.br/geoserver/wms',
    tier: 'free',
    monthlyQuota: undefined,
    monthlyCost: 0,
    costPerRequest: 0,
  },
  {
    id: 'ibama',
    name: 'IBAMA Dados Abertos',
    category: 'radar',
    provider: 'Instituto Brasileiro do Meio Ambiente',
    endpoint: 'https://servicos.ibama.gov.br/ctf/publico/areasembargadas/ConsultaPublicaAreasEmbargadas.php',
    tier: 'free',
    monthlyQuota: undefined,
    monthlyCost: 0,
    costPerRequest: 0,
  },
  {
    id: 'anp',
    name: 'ANP Dados Abertos',
    category: 'radar',
    provider: 'Agência Nacional do Petróleo',
    endpoint: 'https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos',
    tier: 'free',
    monthlyQuota: undefined,
    monthlyCost: 0,
    costPerRequest: 0,
  },
  
  // ============================================================================
  // RADAR APIs - International
  // ============================================================================
  
  {
    id: 'gfw',
    name: 'Global Forest Watch',
    category: 'radar',
    provider: 'World Resources Institute',
    endpoint: 'https://data-api.globalforestwatch.org',
    tier: 'free',
    monthlyQuota: 10000,
    monthlyCost: 0,
    costPerRequest: 0,
  },
  {
    id: 'usgs',
    name: 'USGS Mineral Resources',
    category: 'radar',
    provider: 'United States Geological Survey',
    endpoint: 'https://mrdata.usgs.gov/api',
    tier: 'free',
    monthlyQuota: undefined,
    monthlyCost: 0,
    costPerRequest: 0,
  },
  {
    id: 'worldbank',
    name: 'World Bank Data API',
    category: 'radar',
    provider: 'World Bank',
    endpoint: 'https://api.worldbank.org/v2',
    tier: 'free',
    monthlyQuota: undefined,
    monthlyCost: 0,
    costPerRequest: 0,
  },
  {
    id: 'copernicus',
    name: 'Copernicus Data Space',
    category: 'radar',
    provider: 'European Space Agency',
    endpoint: 'https://dataspace.copernicus.eu',
    tier: 'free',
    monthlyQuota: 2000,
    monthlyCost: 0,
    costPerRequest: 0,
  },
  {
    id: 'resource_watch',
    name: 'Resource Watch',
    category: 'radar',
    provider: 'World Resources Institute',
    endpoint: 'https://api.resourcewatch.org',
    tier: 'free',
    monthlyQuota: undefined,
    monthlyCost: 0,
    costPerRequest: 0,
  },
  
  // ============================================================================
  // Infrastructure - Google Cloud
  // ============================================================================
  
  {
    id: 'gcp_cloud_run',
    name: 'Google Cloud Run',
    category: 'infrastructure',
    provider: 'Google Cloud Platform',
    tier: 'paid',
    monthlyCost: 50, // estimated
    costPerRequest: 0.0000004, // $0.40 per million requests
  },
  {
    id: 'gcp_cloud_sql',
    name: 'Google Cloud SQL',
    category: 'infrastructure',
    provider: 'Google Cloud Platform',
    tier: 'paid',
    monthlyCost: 100, // estimated
  },
  {
    id: 'gcp_secret_manager',
    name: 'Google Secret Manager',
    category: 'infrastructure',
    provider: 'Google Cloud Platform',
    tier: 'paid',
    monthlyCost: 5, // estimated
    costPerRequest: 0.00003, // $0.03 per 10,000 operations
  },
  
  // ============================================================================
  // Storage - AWS S3
  // ============================================================================
  
  {
    id: 'aws_s3',
    name: 'AWS S3',
    category: 'storage',
    provider: 'Amazon Web Services',
    tier: 'paid',
    monthlyCost: 20, // estimated
    costPerRequest: 0.0000004, // $0.40 per million requests
  },
  
  // ============================================================================
  // Payment - Stripe
  // ============================================================================
  
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payment',
    provider: 'Stripe',
    endpoint: 'https://api.stripe.com',
    tier: 'paid',
    monthlyCost: 0, // pay per transaction (2.9% + $0.30)
    costPerRequest: 0, // variable
  },
  
  // ============================================================================
  // Email - SendGrid
  // ============================================================================
  
  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'email',
    provider: 'Twilio SendGrid',
    endpoint: 'https://api.sendgrid.com',
    tier: 'free', // 100 emails/day free
    monthlyQuota: 3000, // 100/day * 30 days
    monthlyCost: 0,
    costPerRequest: 0,
  },
  
  // ============================================================================
  // AI - OpenAI
  // ============================================================================
  
  {
    id: 'openai',
    name: 'OpenAI API',
    category: 'ai',
    provider: 'OpenAI',
    endpoint: 'https://api.openai.com',
    tier: 'paid',
    monthlyCost: 50, // estimated
    costPerRequest: 0.002, // varies by model (GPT-4: $0.03/1K tokens)
  },
  
  // ============================================================================
  // Future APIs (not yet integrated)
  // ============================================================================
  
  {
    id: 'newsapi',
    name: 'NewsAPI',
    category: 'radar',
    provider: 'NewsAPI.org',
    endpoint: 'https://newsapi.org/v2',
    tier: 'paid',
    monthlyQuota: 100000,
    monthlyCost: 449,
    costPerRequest: 0.00449,
  },
];

export class APIMonitoringService {
  
  /**
   * Get all monitored services
   */
  getMonitoredServices(): APIService[] {
    return MONITORED_SERVICES;
  }
  
  /**
   * Get service by ID
   */
  getServiceById(serviceId: string): APIService | undefined {
    return MONITORED_SERVICES.find(s => s.id === serviceId);
  }
  
  /**
   * Get services by category
   */
  getServicesByCategory(category: string): APIService[] {
    return MONITORED_SERVICES.filter(s => s.category === category);
  }
  
  /**
   * Get metrics for a service
   */
  async getServiceMetrics(serviceId: string, startDate?: Date, endDate?: Date): Promise<APIMetrics | null> {
    try {
      const service = this.getServiceById(serviceId);
      if (!service) {
        return null;
      }
      
      // Query database for metrics
      // TODO: Implement actual database query
      // For now, return mock data
      
      const mockMetrics: APIMetrics = {
        serviceId: service.id,
        serviceName: service.name,
        uptime: 99.5,
        totalRequests: 1000,
        successfulRequests: 995,
        failedRequests: 5,
        errorRate: 0.5,
        avgResponseTime: 250,
        minResponseTime: 50,
        maxResponseTime: 2000,
        p95ResponseTime: 800,
        totalCost: service.monthlyCost || 0,
        costPerRequest: service.costPerRequest || 0,
        quotaUsed: service.monthlyQuota ? 500 : 0,
        quotaPercentage: service.monthlyQuota ? 50 : 0,
        status: 'operational',
        lastChecked: new Date(),
      };
      
      return mockMetrics;
    } catch (error) {
      logger.error(`[APIMonitoring] Failed to get metrics for ${serviceId}:`, error);
      return null;
    }
  }
  
  /**
   * Get metrics for all services
   */
  async getAllMetrics(startDate?: Date, endDate?: Date): Promise<APIMetrics[]> {
    const metrics: APIMetrics[] = [];
    
    for (const service of MONITORED_SERVICES) {
      const serviceMetrics = await this.getServiceMetrics(service.id, startDate, endDate);
      if (serviceMetrics) {
        metrics.push(serviceMetrics);
      }
    }
    
    return metrics;
  }
  
  /**
   * Get cost breakdown
   */
  async getCostBreakdown(startDate?: Date, endDate?: Date): Promise<CostBreakdown> {
    const metrics = await this.getAllMetrics(startDate, endDate);
    
    const byCategory: Record<string, number> = {};
    const byService: Record<string, number> = {};
    let total = 0;
    
    for (const metric of metrics) {
      const service = this.getServiceById(metric.serviceId);
      if (!service) continue;
      
      total += metric.totalCost;
      
      // By category
      if (!byCategory[service.category]) {
        byCategory[service.category] = 0;
      }
      byCategory[service.category] += metric.totalCost;
      
      // By service
      byService[service.name] = metric.totalCost;
    }
    
    return {
      total,
      byCategory,
      byService,
      trend: 'stable', // TODO: Calculate trend
      projectedMonthly: total * 30, // TODO: Better projection
    };
  }
  
  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const metrics = await this.getAllMetrics();
    
    for (const metric of metrics) {
      const service = this.getServiceById(metric.serviceId);
      if (!service) continue;
      
      // Quota alerts (>80%)
      if (service.monthlyQuota && metric.quotaPercentage > 80) {
        alerts.push({
          id: `alert_${service.id}_quota_${Date.now()}`,
          serviceId: service.id,
          serviceName: service.name,
          type: 'quota',
          severity: metric.quotaPercentage > 95 ? 'critical' : 'warning',
          message: `Quota usage at ${metric.quotaPercentage.toFixed(1)}%`,
          threshold: 80,
          currentValue: metric.quotaPercentage,
          createdAt: new Date(),
          resolved: false,
        });
      }
      
      // Cost alerts (>$100/month)
      if (metric.totalCost > 100) {
        alerts.push({
          id: `alert_${service.id}_cost_${Date.now()}`,
          serviceId: service.id,
          serviceName: service.name,
          type: 'cost',
          severity: metric.totalCost > 500 ? 'critical' : 'warning',
          message: `Monthly cost at $${metric.totalCost.toFixed(2)}`,
          threshold: 100,
          currentValue: metric.totalCost,
          createdAt: new Date(),
          resolved: false,
        });
      }
      
      // Availability alerts (<95%)
      if (metric.uptime < 95) {
        alerts.push({
          id: `alert_${service.id}_uptime_${Date.now()}`,
          serviceId: service.id,
          serviceName: service.name,
          type: 'availability',
          severity: metric.uptime < 90 ? 'critical' : 'warning',
          message: `Uptime at ${metric.uptime.toFixed(1)}%`,
          threshold: 95,
          currentValue: metric.uptime,
          createdAt: new Date(),
          resolved: false,
        });
      }
      
      // Performance alerts (>1000ms)
      if (metric.avgResponseTime > 1000) {
        alerts.push({
          id: `alert_${service.id}_latency_${Date.now()}`,
          serviceId: service.id,
          serviceName: service.name,
          type: 'performance',
          severity: metric.avgResponseTime > 3000 ? 'critical' : 'warning',
          message: `Average response time at ${metric.avgResponseTime.toFixed(0)}ms`,
          threshold: 1000,
          currentValue: metric.avgResponseTime,
          createdAt: new Date(),
          resolved: false,
        });
      }
    }
    
    return alerts;
  }
  
  /**
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<{
    totalServices: number;
    operationalServices: number;
    degradedServices: number;
    downServices: number;
    totalCost: number;
    totalRequests: number;
    avgUptime: number;
    avgResponseTime: number;
    activeAlerts: number;
  }> {
    const metrics = await this.getAllMetrics();
    const alerts = await getActiveAlerts();
    
    let totalCost = 0;
    let totalRequests = 0;
    let totalUptime = 0;
    let totalResponseTime = 0;
    let operationalServices = 0;
    let degradedServices = 0;
    let downServices = 0;
    
    for (const metric of metrics) {
      totalCost += metric.totalCost;
      totalRequests += metric.totalRequests;
      totalUptime += metric.uptime;
      totalResponseTime += metric.avgResponseTime;
      
      if (metric.status === 'operational') operationalServices++;
      else if (metric.status === 'degraded') degradedServices++;
      else if (metric.status === 'down') downServices++;
    }
    
    return {
      totalServices: MONITORED_SERVICES.length,
      operationalServices,
      degradedServices,
      downServices,
      totalCost,
      totalRequests,
      avgUptime: metrics.length > 0 ? totalUptime / metrics.length : 0,
      avgResponseTime: metrics.length > 0 ? totalResponseTime / metrics.length : 0,
      activeAlerts: alerts.length,
    };
  }
  
  /**
   * Health check for a service
   */
  async healthCheck(serviceId: string): Promise<{
    status: 'operational' | 'degraded' | 'down';
    responseTime: number;
    error?: string;
  }> {
    const service = this.getServiceById(serviceId);
    if (!service || !service.endpoint) {
      return {
        status: 'down',
        responseTime: 0,
        error: 'Service not found or no endpoint',
      };
    }
    
    try {
      const startTime = Date.now();
      const response = await fetch(service.endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: responseTime < 1000 ? 'operational' : 'degraded',
          responseTime,
        };
      } else {
        return {
          status: 'degraded',
          responseTime,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error: any) {
      return {
        status: 'down',
        responseTime: 0,
        error: error.message,
      };
    }
  }
}

// Singleton instance
let apiMonitoringService: APIMonitoringService | null = null;

export function getAPIMonitoringService(): APIMonitoringService {
  if (!apiMonitoringService) {
    apiMonitoringService = new APIMonitoringService();
  }
  return apiMonitoringService;
}

// Export for convenience
export async function getActiveAlerts(): Promise<Alert[]> {
  return getAPIMonitoringService().getActiveAlerts();
}

export async function getDashboardSummary() {
  return getAPIMonitoringService().getDashboardSummary();
}

export default getAPIMonitoringService();
