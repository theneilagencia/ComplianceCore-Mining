/**
 * Prometheus Metrics
 * Application performance monitoring and metrics collection
 */

import { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Create a Registry
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics({ register });

// HTTP Request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// API Integration metrics
export const apiIntegrationDuration = new Histogram({
  name: 'api_integration_duration_seconds',
  help: 'Duration of external API calls in seconds',
  labelNames: ['integration', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

export const apiIntegrationTotal = new Counter({
  name: 'api_integration_total',
  help: 'Total number of external API calls',
  labelNames: ['integration', 'status'],
  registers: [register],
});

export const apiIntegrationErrors = new Counter({
  name: 'api_integration_errors_total',
  help: 'Total number of external API errors',
  labelNames: ['integration', 'error_type'],
  registers: [register],
});

// Circuit Breaker metrics
export const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
  labelNames: ['integration'],
  registers: [register],
});

export const circuitBreakerTrips = new Counter({
  name: 'circuit_breaker_trips_total',
  help: 'Total number of circuit breaker trips',
  labelNames: ['integration'],
  registers: [register],
});

// Cache metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

// Report generation metrics
export const reportGenerationDuration = new Histogram({
  name: 'report_generation_duration_seconds',
  help: 'Duration of report generation in seconds',
  labelNames: ['standard', 'format'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [register],
});

export const reportGenerationTotal = new Counter({
  name: 'report_generation_total',
  help: 'Total number of reports generated',
  labelNames: ['standard', 'format', 'status'],
  registers: [register],
});

// KRCI Audit metrics
export const krciAuditDuration = new Histogram({
  name: 'krci_audit_duration_seconds',
  help: 'Duration of KRCI audit in seconds',
  labelNames: ['standard'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const krciAuditScore = new Histogram({
  name: 'krci_audit_score',
  help: 'KRCI audit score distribution',
  labelNames: ['standard'],
  buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  registers: [register],
});

// Authentication metrics
export const authAttempts = new Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['method', 'status'],
  registers: [register],
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  registers: [register],
});

// License metrics
export const activeLicenses = new Gauge({
  name: 'active_licenses',
  help: 'Number of active licenses by plan',
  labelNames: ['plan'],
  registers: [register],
});

// Payment metrics
export const paymentTotal = new Counter({
  name: 'payments_total',
  help: 'Total number of payments',
  labelNames: ['type', 'status'],
  registers: [register],
});

export const paymentAmount = new Histogram({
  name: 'payment_amount_usd',
  help: 'Payment amounts in USD',
  labelNames: ['type'],
  buckets: [10, 50, 100, 500, 1000, 5000, 10000],
  registers: [register],
});

// Virus scan metrics
export const virusScanDuration = new Histogram({
  name: 'virus_scan_duration_seconds',
  help: 'Duration of virus scans in seconds',
  labelNames: ['scanner'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const virusScanTotal = new Counter({
  name: 'virus_scans_total',
  help: 'Total number of virus scans',
  labelNames: ['scanner', 'result'],
  registers: [register],
});

/**
 * Middleware to track HTTP request metrics
 */
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });
  
  next();
}

/**
 * Track API integration call
 */
export function trackApiCall(
  integration: string,
  status: 'success' | 'error' | 'timeout',
  duration: number
) {
  apiIntegrationDuration.observe({ integration, status }, duration / 1000);
  apiIntegrationTotal.inc({ integration, status });
}

/**
 * Track API integration error
 */
export function trackApiError(integration: string, errorType: string) {
  apiIntegrationErrors.inc({ integration, error_type: errorType });
}

/**
 * Track circuit breaker state
 */
export function trackCircuitBreakerState(
  integration: string,
  state: 'closed' | 'open' | 'half-open'
) {
  const stateValue = state === 'closed' ? 0 : state === 'open' ? 1 : 2;
  circuitBreakerState.set({ integration }, stateValue);
}

/**
 * Track circuit breaker trip
 */
export function trackCircuitBreakerTrip(integration: string) {
  circuitBreakerTrips.inc({ integration });
}

/**
 * Track cache hit/miss
 */
export function trackCache(cacheType: string, hit: boolean) {
  if (hit) {
    cacheHits.inc({ cache_type: cacheType });
  } else {
    cacheMisses.inc({ cache_type: cacheType });
  }
}

/**
 * Track report generation
 */
export function trackReportGeneration(
  standard: string,
  format: string,
  status: 'success' | 'error',
  duration: number
) {
  reportGenerationDuration.observe({ standard, format }, duration / 1000);
  reportGenerationTotal.inc({ standard, format, status });
}

/**
 * Track KRCI audit
 */
export function trackKrciAudit(standard: string, score: number, duration: number) {
  krciAuditDuration.observe({ standard }, duration / 1000);
  krciAuditScore.observe({ standard }, score);
}

/**
 * Track authentication attempt
 */
export function trackAuthAttempt(method: string, status: 'success' | 'failure') {
  authAttempts.inc({ method, status });
}

/**
 * Update active users count
 */
export function updateActiveUsers(count: number) {
  activeUsers.set(count);
}

/**
 * Update active licenses count
 */
export function updateActiveLicenses(plan: string, count: number) {
  activeLicenses.set({ plan }, count);
}

/**
 * Track payment
 */
export function trackPayment(
  type: 'subscription' | 'one-time',
  status: 'success' | 'failed',
  amount?: number
) {
  paymentTotal.inc({ type, status });
  if (amount) {
    paymentAmount.observe({ type }, amount);
  }
}

/**
 * Track virus scan
 */
export function trackVirusScan(
  scanner: string,
  result: 'clean' | 'infected' | 'error',
  duration: number
) {
  virusScanDuration.observe({ scanner }, duration / 1000);
  virusScanTotal.inc({ scanner, result });
}
