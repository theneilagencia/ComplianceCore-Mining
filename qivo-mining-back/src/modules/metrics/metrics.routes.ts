/**
 * Metrics Routes - Express routes for metrics and alerting endpoints
 * 
 * Exposes endpoints for:
 * - Prometheus metrics export
 * - Metrics query and visualization
 * - Alert management
 * - Health monitoring
 */

import { Router, Request, Response } from 'express';
import { metricsService } from './metrics.service';
import { AlertingService } from './alerting.service';
import type { AlertRule } from './alerting.service';

const router = Router();
let alertingService: AlertingService;

/**
 * Initialize alerting service
 */
export function initializeAlerting(service: AlertingService): void {
  alertingService = service;
}

/**
 * GET /api/metrics
 * Get current metrics in JSON format
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const metrics = await metricsService.getMetrics();
    const stats = await metricsService.getStats();

    res.json({
      success: true,
      data: {
        metrics,
        stats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/metrics/prometheus
 * Export metrics in Prometheus format
 */
router.get('/prometheus', async (req: Request, res: Response) => {
  try {
    const metrics = await metricsService.exportPrometheus();
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    console.error('Error exporting Prometheus metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/metrics/stats
 * Get metrics service statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await metricsService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching metrics stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/metrics/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await metricsService.healthCheck();

    res.status(health.status === 'healthy' ? 200 : 503).json({
      success: health.status === 'healthy',
      data: health,
    });
  } catch (error) {
    console.error('Error checking metrics health:', error);
    res.status(503).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/metrics/reset
 * Reset all metrics (admin only)
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    metricsService.reset();

    res.json({
      success: true,
      message: 'Metrics reset successfully',
    });
  } catch (error) {
    console.error('Error resetting metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Alert Management Routes

/**
 * GET /api/metrics/alerts
 * Get active alerts
 */
router.get('/alerts', (req: Request, res: Response) => {
  try {
    if (!alertingService) {
      return res.status(503).json({
        success: false,
        error: 'Alerting service not initialized',
      });
    }

    const alerts = alertingService.getActiveAlerts();

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/metrics/alerts/history
 * Get alert history
 */
router.get('/alerts/history', (req: Request, res: Response) => {
  try {
    if (!alertingService) {
      return res.status(503).json({
        success: false,
        error: 'Alerting service not initialized',
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const history = alertingService.getAlertHistory(limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/metrics/alerts/stats
 * Get alert statistics
 */
router.get('/alerts/stats', (req: Request, res: Response) => {
  try {
    if (!alertingService) {
      return res.status(503).json({
        success: false,
        error: 'Alerting service not initialized',
      });
    }

    const stats = alertingService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/metrics/alerts/:alertId/resolve
 * Resolve an alert
 */
router.post('/alerts/:alertId/resolve', (req: Request, res: Response) => {
  try {
    if (!alertingService) {
      return res.status(503).json({
        success: false,
        error: 'Alerting service not initialized',
      });
    }

    const { alertId } = req.params;
    alertingService.resolveAlert(alertId);

    res.json({
      success: true,
      message: 'Alert resolved successfully',
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/metrics/alerts/:alertId/acknowledge
 * Acknowledge an alert
 */
router.post('/alerts/:alertId/acknowledge', (req: Request, res: Response) => {
  try {
    if (!alertingService) {
      return res.status(503).json({
        success: false,
        error: 'Alerting service not initialized',
      });
    }

    const { alertId } = req.params;
    const userId = req.body.userId || 'system';
    
    alertingService.acknowledgeAlert(alertId, userId);

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/metrics/alerts/rules
 * Get all alert rules
 */
router.get('/alerts/rules', (req: Request, res: Response) => {
  try {
    if (!alertingService) {
      return res.status(503).json({
        success: false,
        error: 'Alerting service not initialized',
      });
    }

    const rules = alertingService.getRules();

    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/metrics/alerts/rules
 * Create a new alert rule
 */
router.post('/alerts/rules', (req: Request, res: Response) => {
  try {
    if (!alertingService) {
      return res.status(503).json({
        success: false,
        error: 'Alerting service not initialized',
      });
    }

    const rule: AlertRule = req.body;
    alertingService.addRule(rule);

    res.status(201).json({
      success: true,
      message: 'Alert rule created successfully',
      data: rule,
    });
  } catch (error) {
    console.error('Error creating alert rule:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/metrics/alerts/rules/:ruleId
 * Update an alert rule
 */
router.put('/alerts/rules/:ruleId', (req: Request, res: Response) => {
  try {
    if (!alertingService) {
      return res.status(503).json({
        success: false,
        error: 'Alerting service not initialized',
      });
    }

    const { ruleId } = req.params;
    const updates = req.body;
    
    alertingService.updateRule(ruleId, updates);

    res.json({
      success: true,
      message: 'Alert rule updated successfully',
    });
  } catch (error) {
    console.error('Error updating alert rule:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/metrics/alerts/rules/:ruleId
 * Delete an alert rule
 */
router.delete('/alerts/rules/:ruleId', (req: Request, res: Response) => {
  try {
    if (!alertingService) {
      return res.status(503).json({
        success: false,
        error: 'Alerting service not initialized',
      });
    }

    const { ruleId } = req.params;
    alertingService.removeRule(ruleId);

    res.json({
      success: true,
      message: 'Alert rule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
