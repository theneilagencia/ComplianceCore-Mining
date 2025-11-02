/**
 * Metrics API Router
 * Exposes metrics and monitoring data via REST endpoints
 */

import { Router } from 'express';
import { metrics } from '../monitoring/metrics';
import { featureFlags } from '../config/feature-flags';

const router = Router();

/**
 * GET /api/metrics
 * Get all metrics (API, cache, compliance)
 */
router.get('/', (req, res) => {
  try {
    const data = metrics.exportMetrics();
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Metrics API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics',
    });
  }
});

/**
 * GET /api/metrics/report
 * Get human-readable metrics report
 */
router.get('/report', (req, res) => {
  try {
    const report = metrics.generateReport();
    
    res.type('text/plain').send(report);
  } catch (error) {
    console.error('[Metrics API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
    });
  }
});

/**
 * GET /api/metrics/api
 * Get API metrics only
 */
router.get('/api', (req, res) => {
  try {
    const apiMetrics = metrics.getAllApiMetrics();
    
    res.json({
      success: true,
      data: apiMetrics,
    });
  } catch (error) {
    console.error('[Metrics API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API metrics',
    });
  }
});

/**
 * GET /api/metrics/api/:service
 * Get API metrics for specific service
 */
router.get('/api/:service', (req, res) => {
  try {
    const { service } = req.params;
    const serviceMetrics = metrics.getApiMetrics(service.toUpperCase());
    
    if (!serviceMetrics) {
      return res.status(404).json({
        success: false,
        error: `Service not found: ${service}`,
      });
    }
    
    res.json({
      success: true,
      data: serviceMetrics,
    });
  } catch (error) {
    console.error('[Metrics API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service metrics',
    });
  }
});

/**
 * GET /api/metrics/cache
 * Get cache metrics
 */
router.get('/cache', (req, res) => {
  try {
    const cacheMetrics = metrics.getAllCacheMetrics();
    
    res.json({
      success: true,
      data: cacheMetrics,
    });
  } catch (error) {
    console.error('[Metrics API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache metrics',
    });
  }
});

/**
 * GET /api/metrics/compliance
 * Get compliance metrics
 */
router.get('/compliance', (req, res) => {
  try {
    const complianceMetrics = metrics.getComplianceMetrics();
    
    res.json({
      success: true,
      data: complianceMetrics,
    });
  } catch (error) {
    console.error('[Metrics API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance metrics',
    });
  }
});

/**
 * GET /api/metrics/feature-flags
 * Get feature flags status
 */
router.get('/feature-flags', (req, res) => {
  try {
    const flags = featureFlags.getAllFlags();
    
    res.json({
      success: true,
      data: flags,
    });
  } catch (error) {
    console.error('[Metrics API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature flags',
    });
  }
});

/**
 * POST /api/metrics/reset
 * Reset all metrics (admin only)
 */
router.post('/reset', (req, res) => {
  try {
    // TODO: Add admin authentication
    metrics.reset();
    
    res.json({
      success: true,
      message: 'Metrics reset successfully',
    });
  } catch (error) {
    console.error('[Metrics API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics',
    });
  }
});

/**
 * GET /api/metrics/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  try {
    const apiMetrics = metrics.getAllApiMetrics();
    const cacheMetrics = metrics.getAllCacheMetrics();
    const flags = featureFlags.getEnabledFlags();
    
    // Calculate overall health
    const avgSuccessRate = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.successRate, 0) / apiMetrics.length
      : 0;
    
    const avgCacheHitRate = cacheMetrics.length > 0
      ? cacheMetrics.reduce((sum, m) => sum + m.hitRate, 0) / cacheMetrics.length
      : 0;
    
    const health = {
      status: avgSuccessRate >= 90 ? 'healthy' : avgSuccessRate >= 70 ? 'degraded' : 'unhealthy',
      apiSuccessRate: Math.round(avgSuccessRate * 100) / 100,
      cacheHitRate: Math.round(avgCacheHitRate * 100) / 100,
      enabledFeatures: flags.length,
      timestamp: new Date().toISOString(),
    };
    
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error('[Metrics API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch health status',
    });
  }
});

export default router;
