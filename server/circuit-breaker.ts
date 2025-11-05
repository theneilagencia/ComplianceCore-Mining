/**
 * Circuit Breaker Configuration
 * Protects against cascading failures in external API integrations
 */

import CircuitBreaker from 'opossum';

export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  rollingCountTimeout?: number;
  rollingCountBuckets?: number;
  name?: string;
}

const defaultOptions: CircuitBreakerOptions = {
  timeout: 10000, // 10 seconds
  errorThresholdPercentage: 50, // Open circuit after 50% errors
  resetTimeout: 30000, // Try again after 30 seconds
  rollingCountTimeout: 10000, // 10 second window
  rollingCountBuckets: 10, // 10 buckets in window
};

/**
 * Create a circuit breaker for an async function
 */
export function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CircuitBreakerOptions = {}
): CircuitBreaker<Parameters<T>, ReturnType<T>> {
  const opts = { ...defaultOptions, ...options };
  
  const breaker = new CircuitBreaker(fn, {
    timeout: opts.timeout,
    errorThresholdPercentage: opts.errorThresholdPercentage,
    resetTimeout: opts.resetTimeout,
    rollingCountTimeout: opts.rollingCountTimeout,
    rollingCountBuckets: opts.rollingCountBuckets,
    name: opts.name || fn.name || 'anonymous',
  });

  // Event listeners for monitoring
  breaker.on('open', () => {
    console.warn(`[CircuitBreaker] ${opts.name || 'Circuit'} OPENED - Too many failures`);
  });

  breaker.on('halfOpen', () => {
    console.log(`[CircuitBreaker] ${opts.name || 'Circuit'} HALF-OPEN - Testing recovery`);
  });

  breaker.on('close', () => {
    console.log(`[CircuitBreaker] ${opts.name || 'Circuit'} CLOSED - Back to normal`);
  });

  breaker.on('timeout', () => {
    console.warn(`[CircuitBreaker] ${opts.name || 'Circuit'} TIMEOUT - Request took too long`);
  });

  breaker.on('reject', () => {
    console.warn(`[CircuitBreaker] ${opts.name || 'Circuit'} REJECTED - Circuit is open`);
  });

  breaker.on('fallback', (result) => {
    console.log(`[CircuitBreaker] ${opts.name || 'Circuit'} FALLBACK - Using fallback value`);
  });

  return breaker;
}

/**
 * Circuit breakers for external APIs
 */
export const circuitBreakers = {
  anm: null as CircuitBreaker<any, any> | null,
  cprm: null as CircuitBreaker<any, any> | null,
  ibama: null as CircuitBreaker<any, any> | null,
  anp: null as CircuitBreaker<any, any> | null,
  usgs: null as CircuitBreaker<any, any> | null,
  copernicus: null as CircuitBreaker<any, any> | null,
};

/**
 * Initialize circuit breaker for ANM API
 */
export function initANMCircuitBreaker(fn: (...args: any[]) => Promise<any>) {
  circuitBreakers.anm = createCircuitBreaker(fn, {
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    name: 'ANM_API',
  });
  return circuitBreakers.anm;
}

/**
 * Initialize circuit breaker for CPRM API
 */
export function initCPRMCircuitBreaker(fn: (...args: any[]) => Promise<any>) {
  circuitBreakers.cprm = createCircuitBreaker(fn, {
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    name: 'CPRM_API',
  });
  return circuitBreakers.cprm;
}

/**
 * Initialize circuit breaker for IBAMA API
 */
export function initIBAMACircuitBreaker(fn: (...args: any[]) => Promise<any>) {
  circuitBreakers.ibama = createCircuitBreaker(fn, {
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    name: 'IBAMA_API',
  });
  return circuitBreakers.ibama;
}

/**
 * Initialize circuit breaker for ANP API
 */
export function initANPCircuitBreaker(fn: (...args: any[]) => Promise<any>) {
  circuitBreakers.anp = createCircuitBreaker(fn, {
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    name: 'ANP_API',
  });
  return circuitBreakers.anp;
}

/**
 * Get circuit breaker stats for monitoring
 */
export function getCircuitBreakerStats() {
  const stats: Record<string, any> = {};
  
  Object.entries(circuitBreakers).forEach(([name, breaker]) => {
    if (breaker) {
      stats[name] = {
        state: breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
        stats: breaker.stats,
      };
    }
  });
  
  return stats;
}
