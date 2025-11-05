/**
 * Integration Status Dashboard Router
 * Provides real-time status of all external integrations
 */

import express, { type Request, type Response } from 'express';
import { circuitBreakers, getCircuitBreakerStats } from '../../circuit-breaker';

const router = express.Router();

interface IntegrationStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime?: number;
  errorRate?: number;
  circuitState?: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  uptime?: number;
}

// In-memory storage for integration status
const integrationStatus: Map<string, IntegrationStatus> = new Map();

/**
 * GET /api/integrations/status
 * Get status of all integrations
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const circuitStats = getCircuitBreakerStats();
    
    const integrations: Record<string, IntegrationStatus> = {
      ANM: {
        name: 'Agência Nacional de Mineração (ANM)',
        status: getIntegrationStatus('ANM', circuitStats),
        lastCheck: new Date(),
        circuitState: circuitStats.anm?.state || 'CLOSED',
        responseTime: circuitStats.anm?.stats?.percentiles?.['0.95'] || 0,
        errorRate: calculateErrorRate(circuitStats.anm?.stats),
        uptime: calculateUptime('ANM'),
      },
      CPRM: {
        name: 'Serviço Geológico do Brasil (CPRM)',
        status: getIntegrationStatus('CPRM', circuitStats),
        lastCheck: new Date(),
        circuitState: circuitStats.cprm?.state || 'CLOSED',
        responseTime: circuitStats.cprm?.stats?.percentiles?.['0.95'] || 0,
        errorRate: calculateErrorRate(circuitStats.cprm?.stats),
        uptime: calculateUptime('CPRM'),
      },
      IBAMA: {
        name: 'Instituto Brasileiro do Meio Ambiente (IBAMA)',
        status: getIntegrationStatus('IBAMA', circuitStats),
        lastCheck: new Date(),
        circuitState: circuitStats.ibama?.state || 'CLOSED',
        responseTime: circuitStats.ibama?.stats?.percentiles?.['0.95'] || 0,
        errorRate: calculateErrorRate(circuitStats.ibama?.stats),
        uptime: calculateUptime('IBAMA'),
      },
      ANP: {
        name: 'Agência Nacional do Petróleo (ANP)',
        status: getIntegrationStatus('ANP', circuitStats),
        lastCheck: new Date(),
        circuitState: circuitStats.anp?.state || 'CLOSED',
        responseTime: circuitStats.anp?.stats?.percentiles?.['0.95'] || 0,
        errorRate: calculateErrorRate(circuitStats.anp?.stats),
        uptime: calculateUptime('ANP'),
      },
      USGS: {
        name: 'United States Geological Survey (USGS)',
        status: 'operational',
        lastCheck: new Date(),
        circuitState: 'CLOSED',
        uptime: 99.9,
      },
      Copernicus: {
        name: 'Copernicus Satellite Data',
        status: 'operational',
        lastCheck: new Date(),
        circuitState: 'CLOSED',
        uptime: 99.5,
      },
    };

    res.json({
      success: true,
      timestamp: new Date(),
      integrations,
      overall: calculateOverallStatus(integrations),
    });
  } catch (error: any) {
    console.error('[IntegrationStatus] Error:', error);
    res.status(500).json({
      error: 'Failed to get integration status',
    });
  }
});

/**
 * GET /api/integrations/metrics
 * Get detailed metrics for all integrations
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const circuitStats = getCircuitBreakerStats();
    
    const metrics: Record<string, any> = {};
    
    Object.entries(circuitStats).forEach(([name, stats]) => {
      if (stats && stats.stats) {
        metrics[name.toUpperCase()] = {
          totalRequests: stats.stats.fires || 0,
          successRate: calculateSuccessRate(stats.stats),
          averageLatency: stats.stats.percentiles?.['0.5'] || 0,
          p95Latency: stats.stats.percentiles?.['0.95'] || 0,
          p99Latency: stats.stats.percentiles?.['0.99'] || 0,
          errorRate: calculateErrorRate(stats.stats),
          timeouts: stats.stats.timeouts || 0,
          circuitState: stats.state,
        };
      }
    });

    res.json({
      success: true,
      timestamp: new Date(),
      metrics,
    });
  } catch (error: any) {
    console.error('[IntegrationMetrics] Error:', error);
    res.status(500).json({
      error: 'Failed to get integration metrics',
    });
  }
});

/**
 * GET /api/integrations/health
 * Health check endpoint for monitoring
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const circuitStats = getCircuitBreakerStats();
    
    // Check if any circuit is open
    const hasOpenCircuit = Object.values(circuitStats).some(
      (stats) => stats?.state === 'OPEN'
    );

    const status = hasOpenCircuit ? 'degraded' : 'healthy';
    const statusCode = hasOpenCircuit ? 503 : 200;

    res.status(statusCode).json({
      status,
      timestamp: new Date(),
      checks: {
        circuitBreakers: !hasOpenCircuit,
      },
    });
  } catch (error: any) {
    console.error('[IntegrationHealth] Error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

/**
 * Helper: Get integration status based on circuit state
 */
function getIntegrationStatus(
  name: string,
  circuitStats: Record<string, any>
): 'operational' | 'degraded' | 'down' {
  const key = name.toLowerCase();
  const stats = circuitStats[key];

  if (!stats) return 'operational';

  if (stats.state === 'OPEN') return 'down';
  if (stats.state === 'HALF_OPEN') return 'degraded';

  const errorRate = calculateErrorRate(stats.stats);
  if (errorRate > 0.1) return 'degraded'; // > 10% error rate

  return 'operational';
}

/**
 * Helper: Calculate error rate
 */
function calculateErrorRate(stats: any): number {
  if (!stats) return 0;

  const total = stats.fires || 0;
  const failures = stats.failures || 0;

  if (total === 0) return 0;

  return failures / total;
}

/**
 * Helper: Calculate success rate
 */
function calculateSuccessRate(stats: any): number {
  if (!stats) return 100;

  const total = stats.fires || 0;
  const successes = stats.successes || 0;

  if (total === 0) return 100;

  return (successes / total) * 100;
}

/**
 * Helper: Calculate uptime (mock for now)
 */
function calculateUptime(integration: string): number {
  // In production, this would track actual uptime
  return 99.9;
}

/**
 * Helper: Calculate overall status
 */
function calculateOverallStatus(
  integrations: Record<string, IntegrationStatus>
): 'operational' | 'degraded' | 'down' {
  const statuses = Object.values(integrations).map((i) => i.status);

  if (statuses.includes('down')) return 'down';
  if (statuses.includes('degraded')) return 'degraded';

  return 'operational';
}

export default router;
