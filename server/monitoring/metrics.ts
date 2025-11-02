/**
 * Metrics & Monitoring System
 * Tracks API performance, cache efficiency, and compliance scores
 * 
 * USAGE:
 * ```typescript
 * import { metrics } from '@/server/monitoring/metrics';
 * 
 * metrics.trackApiCall('ANM', 'success', 250);
 * metrics.trackCacheHit('CPRM');
 * metrics.trackComplianceScore(85);
 * ```
 */

export interface ApiMetrics {
  service: string;
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  errorCalls: number;
  notFoundCalls: number;
  totalResponseTime: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  lastCall: Date | null;
}

export interface CacheMetrics {
  service: string;
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  evictions: number;
}

export interface ComplianceMetrics {
  totalReports: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  scoreDistribution: {
    range: string;
    count: number;
  }[];
  topKRCIViolations: {
    code: string;
    count: number;
  }[];
}

/**
 * Metrics Manager
 */
class MetricsManager {
  private apiMetrics: Map<string, ApiMetrics> = new Map();
  private cacheMetrics: Map<string, CacheMetrics> = new Map();
  private complianceScores: number[] = [];
  private krciViolations: Map<string, number> = new Map();

  constructor() {
    // Initialize metrics for official integrations
    ['ANM', 'CPRM', 'IBAMA', 'ANP'].forEach((service) => {
      this.initializeApiMetrics(service);
      this.initializeCacheMetrics(service);
    });
  }

  /**
   * Initialize API metrics for a service
   */
  private initializeApiMetrics(service: string): void {
    this.apiMetrics.set(service, {
      service,
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      errorCalls: 0,
      notFoundCalls: 0,
      totalResponseTime: 0,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      successRate: 0,
      lastCall: null,
    });
  }

  /**
   * Initialize cache metrics for a service
   */
  private initializeCacheMetrics(service: string): void {
    this.cacheMetrics.set(service, {
      service,
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalKeys: 0,
      evictions: 0,
    });
  }

  /**
   * Track API call
   */
  trackApiCall(
    service: string,
    status: 'success' | 'failed' | 'error' | 'not_found',
    responseTime: number
  ): void {
    const metrics = this.apiMetrics.get(service);
    if (!metrics) {
      console.warn(`[Metrics] Unknown service: ${service}`);
      return;
    }

    metrics.totalCalls++;
    metrics.lastCall = new Date();
    metrics.totalResponseTime += responseTime;

    // Update status counts
    switch (status) {
      case 'success':
        metrics.successCalls++;
        break;
      case 'failed':
        metrics.failedCalls++;
        break;
      case 'error':
        metrics.errorCalls++;
        break;
      case 'not_found':
        metrics.notFoundCalls++;
        break;
    }

    // Update response time stats
    metrics.avgResponseTime = metrics.totalResponseTime / metrics.totalCalls;
    metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
    metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);

    // Update success rate
    metrics.successRate = (metrics.successCalls / metrics.totalCalls) * 100;

    // Log slow requests
    if (responseTime > 5000) {
      console.warn(
        `[Metrics] Slow API call: ${service} took ${responseTime}ms`
      );
    }
  }

  /**
   * Track cache hit
   */
  trackCacheHit(service: string): void {
    const metrics = this.cacheMetrics.get(service);
    if (!metrics) {
      console.warn(`[Metrics] Unknown service: ${service}`);
      return;
    }

    metrics.hits++;
    metrics.hitRate = (metrics.hits / (metrics.hits + metrics.misses)) * 100;
  }

  /**
   * Track cache miss
   */
  trackCacheMiss(service: string): void {
    const metrics = this.cacheMetrics.get(service);
    if (!metrics) {
      console.warn(`[Metrics] Unknown service: ${service}`);
      return;
    }

    metrics.misses++;
    metrics.hitRate = (metrics.hits / (metrics.hits + metrics.misses)) * 100;
  }

  /**
   * Track cache eviction
   */
  trackCacheEviction(service: string): void {
    const metrics = this.cacheMetrics.get(service);
    if (!metrics) {
      console.warn(`[Metrics] Unknown service: ${service}`);
      return;
    }

    metrics.evictions++;
  }

  /**
   * Track compliance score
   */
  trackComplianceScore(score: number): void {
    if (score < 0 || score > 100) {
      console.warn(`[Metrics] Invalid compliance score: ${score}`);
      return;
    }

    this.complianceScores.push(score);

    // Keep only last 1000 scores
    if (this.complianceScores.length > 1000) {
      this.complianceScores.shift();
    }
  }

  /**
   * Track KRCI violation
   */
  trackKRCIViolation(code: string): void {
    const count = this.krciViolations.get(code) || 0;
    this.krciViolations.set(code, count + 1);
  }

  /**
   * Get API metrics for a service
   */
  getApiMetrics(service: string): ApiMetrics | undefined {
    return this.apiMetrics.get(service);
  }

  /**
   * Get all API metrics
   */
  getAllApiMetrics(): ApiMetrics[] {
    return Array.from(this.apiMetrics.values());
  }

  /**
   * Get cache metrics for a service
   */
  getCacheMetrics(service: string): CacheMetrics | undefined {
    return this.cacheMetrics.get(service);
  }

  /**
   * Get all cache metrics
   */
  getAllCacheMetrics(): CacheMetrics[] {
    return Array.from(this.cacheMetrics.values());
  }

  /**
   * Get compliance metrics
   */
  getComplianceMetrics(): ComplianceMetrics {
    if (this.complianceScores.length === 0) {
      return {
        totalReports: 0,
        avgScore: 0,
        minScore: 0,
        maxScore: 0,
        scoreDistribution: [],
        topKRCIViolations: [],
      };
    }

    const sum = this.complianceScores.reduce((a, b) => a + b, 0);
    const avg = sum / this.complianceScores.length;
    const min = Math.min(...this.complianceScores);
    const max = Math.max(...this.complianceScores);

    // Calculate score distribution
    const distribution = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 },
    ];

    this.complianceScores.forEach((score) => {
      if (score <= 20) distribution[0].count++;
      else if (score <= 40) distribution[1].count++;
      else if (score <= 60) distribution[2].count++;
      else if (score <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    // Get top 10 KRCI violations
    const topViolations = Array.from(this.krciViolations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([code, count]) => ({ code, count }));

    return {
      totalReports: this.complianceScores.length,
      avgScore: Math.round(avg * 100) / 100,
      minScore: min,
      maxScore: max,
      scoreDistribution: distribution,
      topKRCIViolations: topViolations,
    };
  }

  /**
   * Generate metrics report
   */
  generateReport(): string {
    const apiMetrics = this.getAllApiMetrics();
    const cacheMetrics = this.getAllCacheMetrics();
    const complianceMetrics = this.getComplianceMetrics();

    let report = '\n=== METRICS REPORT ===\n\n';

    // API Metrics
    report += '📊 API Metrics:\n';
    apiMetrics.forEach((m) => {
      report += `\n  ${m.service}:\n`;
      report += `    Total Calls: ${m.totalCalls}\n`;
      report += `    Success Rate: ${m.successRate.toFixed(2)}%\n`;
      report += `    Avg Response Time: ${m.avgResponseTime.toFixed(0)}ms\n`;
      report += `    Min/Max: ${m.minResponseTime}ms / ${m.maxResponseTime}ms\n`;
      report += `    Errors: ${m.errorCalls} | Not Found: ${m.notFoundCalls}\n`;
    });

    // Cache Metrics
    report += '\n💾 Cache Metrics:\n';
    cacheMetrics.forEach((m) => {
      report += `\n  ${m.service}:\n`;
      report += `    Hit Rate: ${m.hitRate.toFixed(2)}%\n`;
      report += `    Hits: ${m.hits} | Misses: ${m.misses}\n`;
      report += `    Evictions: ${m.evictions}\n`;
    });

    // Compliance Metrics
    report += '\n📈 Compliance Metrics:\n';
    report += `  Total Reports: ${complianceMetrics.totalReports}\n`;
    report += `  Avg Score: ${complianceMetrics.avgScore}\n`;
    report += `  Min/Max: ${complianceMetrics.minScore} / ${complianceMetrics.maxScore}\n`;
    report += '\n  Score Distribution:\n';
    complianceMetrics.scoreDistribution.forEach((d) => {
      report += `    ${d.range}: ${d.count}\n`;
    });

    if (complianceMetrics.topKRCIViolations.length > 0) {
      report += '\n  Top KRCI Violations:\n';
      complianceMetrics.topKRCIViolations.forEach((v, i) => {
        report += `    ${i + 1}. ${v.code}: ${v.count} violations\n`;
      });
    }

    report += '\n======================\n';

    return report;
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): {
    api: ApiMetrics[];
    cache: CacheMetrics[];
    compliance: ComplianceMetrics;
    timestamp: string;
  } {
    return {
      api: this.getAllApiMetrics(),
      cache: this.getAllCacheMetrics(),
      compliance: this.getComplianceMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.apiMetrics.clear();
    this.cacheMetrics.clear();
    this.complianceScores = [];
    this.krciViolations.clear();

    // Re-initialize
    ['ANM', 'CPRM', 'IBAMA', 'ANP'].forEach((service) => {
      this.initializeApiMetrics(service);
      this.initializeCacheMetrics(service);
    });

    console.log('[Metrics] All metrics reset');
  }
}

// Singleton instance
export const metrics = new MetricsManager();
