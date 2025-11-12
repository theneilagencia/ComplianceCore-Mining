/**
 * Metrics Service - Prometheus-compatible Metrics Collection
 * 
 * Collects and exposes system metrics for monitoring and observability:
 * - Response time tracking (p50, p95, p99)
 * - Error rate monitoring
 * - Cache hit rate analysis
 * - OCR accuracy metrics
 * - System resource usage
 * 
 * Prometheus-compatible exports for Grafana integration
 * Real-time SSE integration for dashboard updates
 */

import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import { SSEEventType, type SSEService } from '../sse/sse.service';

export interface MetricValue {
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface MetricSnapshot {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels?: Partial<Record<string, string | number>>;
  timestamp: Date;
}

export interface MetricsConfig {
  enablePrometheus: boolean;
  enableSSE: boolean;
  collectionInterval: number; // ms
  histogramBuckets: number[];
  defaultLabels?: Record<string, string>;
}

export interface MetricStats {
  totalMetrics: number;
  activeMetrics: number;
  collectionInterval: number;
  uptime: number;
  lastCollection: Date;
}

/**
 * MetricsService - Central metrics collection and exposure
 */
export class MetricsService {
  private registry: Registry;
  private sseService?: SSEService;
  private config: MetricsConfig;
  private collectionTimer?: NodeJS.Timeout;
  private startTime: Date;

  // Application Metrics
  private httpRequestDuration: Histogram;
  private httpRequestTotal: Counter;
  private httpRequestErrors: Counter;
  private cacheHitRate: Gauge;
  private cacheHits: Counter;
  private cacheMisses: Counter;
  private ocrAccuracy: Gauge;
  private ocrProcessingTime: Histogram;
  private ocrTotal: Counter;
  private ocrErrors: Counter;
  private uploadTotal: Counter;
  private uploadSize: Histogram;
  private activeConnections: Gauge;
  private queueSize: Gauge;

  constructor(config: Partial<MetricsConfig> = {}) {
    this.config = {
      enablePrometheus: true,
      enableSSE: true,
      collectionInterval: 10000, // 10s
      histogramBuckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      ...config,
    };

    this.startTime = new Date();
    this.registry = new Registry();

    // Add default labels
    if (this.config.defaultLabels) {
      this.registry.setDefaultLabels(this.config.defaultLabels);
    }

    // Initialize metrics
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: this.config.histogramBuckets,
      registers: [this.registry],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.registry],
    });

    this.cacheHitRate = new Gauge({
      name: 'cache_hit_rate',
      help: 'Cache hit rate percentage',
      labelNames: ['cache_layer'],
      registers: [this.registry],
    });

    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_layer'],
      registers: [this.registry],
    });

    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_layer'],
      registers: [this.registry],
    });

    this.ocrAccuracy = new Gauge({
      name: 'ocr_accuracy_percentage',
      help: 'OCR accuracy percentage',
      labelNames: ['document_type'],
      registers: [this.registry],
    });

    this.ocrProcessingTime = new Histogram({
      name: 'ocr_processing_duration_seconds',
      help: 'OCR processing duration in seconds',
      labelNames: ['document_type', 'page_count'],
      buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
      registers: [this.registry],
    });

    this.ocrTotal = new Counter({
      name: 'ocr_processes_total',
      help: 'Total number of OCR processes',
      labelNames: ['document_type', 'status'],
      registers: [this.registry],
    });

    this.ocrErrors = new Counter({
      name: 'ocr_errors_total',
      help: 'Total number of OCR errors',
      labelNames: ['document_type', 'error_type'],
      registers: [this.registry],
    });

    this.uploadTotal = new Counter({
      name: 'uploads_total',
      help: 'Total number of file uploads',
      labelNames: ['status', 'file_type'],
      registers: [this.registry],
    });

    this.uploadSize = new Histogram({
      name: 'upload_size_bytes',
      help: 'Upload file size in bytes',
      labelNames: ['file_type'],
      buckets: [1024, 10240, 102400, 1024000, 10240000, 102400000],
      registers: [this.registry],
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['connection_type'],
      registers: [this.registry],
    });

    this.queueSize = new Gauge({
      name: 'queue_size',
      help: 'Current queue size',
      labelNames: ['queue_name'],
      registers: [this.registry],
    });

    // Collect default Node.js metrics
    if (this.config.enablePrometheus) {
      collectDefaultMetrics({ register: this.registry });
    }
  }

  /**
   * Set SSE service for real-time metric updates
   */
  setSSEService(sseService: SSEService): void {
    this.sseService = sseService;
  }

  /**
   * Start automatic metric collection
   */
  start(): void {
    if (this.collectionTimer) {
      return;
    }

    this.collectionTimer = setInterval(() => {
      this.emitMetricsUpdate();
    }, this.config.collectionInterval);
  }

  /**
   * Stop automatic metric collection
   */
  stop(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = undefined;
    }
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number
  ): void {
    const labels = { method, route, status_code: statusCode.toString() };
    
    this.httpRequestDuration.observe(labels, duration);
    this.httpRequestTotal.inc(labels);

    if (statusCode >= 400) {
      this.httpRequestErrors.inc({
        method,
        route,
        error_type: statusCode >= 500 ? 'server_error' : 'client_error',
      });
    }

    this.emitMetricsUpdate();
  }

  /**
   * Record cache metrics
   */
  recordCacheHit(layer: string): void {
    this.cacheHits.inc({ cache_layer: layer });
    this.updateCacheHitRate(layer);
    this.emitMetricsUpdate();
  }

  recordCacheMiss(layer: string): void {
    this.cacheMisses.inc({ cache_layer: layer });
    this.updateCacheHitRate(layer);
    this.emitMetricsUpdate();
  }

  private async updateCacheHitRate(layer: string): Promise<void> {
    const hits = await this.getMetricValue('cache_hits_total', { cache_layer: layer });
    const misses = await this.getMetricValue('cache_misses_total', { cache_layer: layer });
    
    if (hits !== undefined && misses !== undefined) {
      const total = hits + misses;
      const rate = total > 0 ? (hits / total) * 100 : 0;
      this.cacheHitRate.set({ cache_layer: layer }, rate);
    }
  }

  /**
   * Record OCR metrics
   */
  recordOCRProcess(
    documentType: string,
    accuracy: number,
    duration: number,
    pageCount: number,
    success: boolean
  ): void {
    this.ocrAccuracy.set({ document_type: documentType }, accuracy);
    this.ocrProcessingTime.observe(
      { document_type: documentType, page_count: pageCount.toString() },
      duration
    );
    this.ocrTotal.inc({
      document_type: documentType,
      status: success ? 'success' : 'failure',
    });

    this.emitMetricsUpdate();
  }

  recordOCRError(documentType: string, errorType: string): void {
    this.ocrErrors.inc({ document_type: documentType, error_type: errorType });
    this.emitMetricsUpdate();
  }

  /**
   * Record upload metrics
   */
  recordUpload(status: string, fileType: string, size: number): void {
    this.uploadTotal.inc({ status, file_type: fileType });
    this.uploadSize.observe({ file_type: fileType }, size);
    this.emitMetricsUpdate();
  }

  /**
   * Update connection count
   */
  setActiveConnections(type: string, count: number): void {
    this.activeConnections.set({ connection_type: type }, count);
    this.emitMetricsUpdate();
  }

  /**
   * Update queue size
   */
  setQueueSize(queueName: string, size: number): void {
    this.queueSize.set({ queue_name: queueName }, size);
    this.emitMetricsUpdate();
  }

  /**
   * Get Prometheus metrics export
   */
  async exportPrometheus(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics in JSON format
   */
  async getMetrics(): Promise<MetricSnapshot[]> {
    const metrics = await this.registry.getMetricsAsJSON();
    
    const snapshots: MetricSnapshot[] = [];
    
    for (const metric of metrics) {
      if (metric.type === 0 || metric.type === 1) { // counter or gauge
        for (const v of metric.values) {
          snapshots.push({
            name: metric.name,
            type: metric.type === 0 ? 'counter' : 'gauge',
            value: v.value,
            labels: v.labels,
            timestamp: new Date(),
          });
        }
      } else if (metric.type === 2) { // histogram
        // Return histogram percentiles
        for (const v of metric.values) {
          snapshots.push({
            name: `${metric.name}_p50`,
            type: 'histogram',
            value: v.value || 0,
            labels: v.labels,
            timestamp: new Date(),
          });
        }
      }
    }
    
    return snapshots;
  }

  /**
   * Get specific metric value
   */
  private async getMetricValue(
    name: string,
    labels?: Record<string, string>
  ): Promise<number | undefined> {
    const metrics = await this.registry.getMetricsAsJSON();
    const metric = metrics.find((m) => m.name === name);
    
    if (!metric) {
      return undefined;
    }

    if (!labels) {
      return metric.values[0]?.value;
    }

    const matchingValue = metric.values.find((v) => {
      if (!v.labels) return false;
      return Object.entries(labels).every(
        ([key, value]) => v.labels![key] === value
      );
    });

    return matchingValue?.value;
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<MetricStats> {
    const uptime = Date.now() - this.startTime.getTime();
    const metrics = await this.registry.getMetricsAsJSON();
    
    return {
      totalMetrics: metrics.length,
      activeMetrics: metrics.filter(m => m.values.length > 0).length,
      collectionInterval: this.config.collectionInterval,
      uptime,
      lastCollection: new Date(),
    };
  }

  /**
   * Emit metrics update via SSE
   */
  private async emitMetricsUpdate(): Promise<void> {
    if (!this.config.enableSSE || !this.sseService) {
      return;
    }

    try {
      const metrics = await this.getMetrics();
      const stats = await this.getStats();

      this.sseService.broadcast({
        type: SSEEventType.METRICS_UPDATED,
        data: {
          metrics,
          stats,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to emit metrics update:', error);
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.registry.clear();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: string }> {
    try {
      const metrics = await this.registry.getMetricsAsJSON();
      
      if (metrics.length === 0) {
        return {
          status: 'unhealthy',
          details: 'No metrics registered',
        };
      }

      return {
        status: 'healthy',
        details: `${metrics.length} metrics registered`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Singleton instance
export const metricsService = new MetricsService({
  enablePrometheus: true,
  enableSSE: true,
  collectionInterval: 10000,
  defaultLabels: {
    app: 'compliancecore-mining',
    env: process.env.NODE_ENV || 'development',
  },
});
