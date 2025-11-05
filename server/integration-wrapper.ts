/**
 * Integration Wrapper
 * Provides circuit breaker, retry logic, and caching for all external API integrations
 */

import { createCircuitBreaker } from './circuit-breaker';
import { cacheGet, cacheSet } from './redis';

export interface IntegrationOptions {
  name: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cacheTTL?: number;
  cacheEnabled?: boolean;
}

const defaultOptions: Required<Omit<IntegrationOptions, 'name'>> = {
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  cacheTTL: 86400, // 24 hours
  cacheEnabled: true,
};

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number,
  attempt: number = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (attempt >= retries) {
      throw error;
    }

    // Exponential backoff: delay * 2^(attempt-1)
    const backoffDelay = delay * Math.pow(2, attempt - 1);
    console.log(`[Retry] Attempt ${attempt}/${retries} failed, retrying in ${backoffDelay}ms...`);
    
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
    return retryWithBackoff(fn, retries, delay, attempt + 1);
  }
}

/**
 * Wrap integration function with circuit breaker, retry, and cache
 */
export function wrapIntegration<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: IntegrationOptions
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const opts = { ...defaultOptions, ...options };

  // Create circuit breaker
  const breaker = createCircuitBreaker(
    async (...args: Parameters<T>) => {
      // Retry logic
      return retryWithBackoff(
        () => fn(...args),
        opts.retries,
        opts.retryDelay
      );
    },
    {
      timeout: opts.timeout,
      name: opts.name,
    }
  );

  // Return wrapped function with cache
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // Generate cache key from function name and arguments
    const cacheKey = `integration:${opts.name}:${JSON.stringify(args)}`;

    // Try cache first
    if (opts.cacheEnabled) {
      const cached = await cacheGet<ReturnType<T>>(cacheKey);
      if (cached !== null) {
        console.log(`[Integration] ${opts.name} - Cache HIT`);
        return cached;
      }
    }

    // Execute with circuit breaker and retry
    try {
      console.log(`[Integration] ${opts.name} - Executing...`);
      const result = await breaker.fire(...args);

      // Cache successful result
      if (opts.cacheEnabled && result) {
        await cacheSet(cacheKey, result, opts.cacheTTL);
      }

      return result;
    } catch (error: any) {
      console.error(`[Integration] ${opts.name} - Failed:`, error.message);
      
      // If circuit is open, return fallback
      if (breaker.opened) {
        console.warn(`[Integration] ${opts.name} - Circuit OPEN, using fallback`);
        throw new Error(`${opts.name} service is temporarily unavailable. Please try again later.`);
      }

      throw error;
    }
  };
}

/**
 * Create wrapped integration for ANM
 */
export function createANMIntegration<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return wrapIntegration(fn, {
    name: 'ANM',
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
    cacheTTL: 86400, // 24 hours
    cacheEnabled: true,
  });
}

/**
 * Create wrapped integration for CPRM
 */
export function createCPRMIntegration<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return wrapIntegration(fn, {
    name: 'CPRM',
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
    cacheTTL: 86400, // 24 hours
    cacheEnabled: true,
  });
}

/**
 * Create wrapped integration for IBAMA
 */
export function createIBAMAIntegration<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return wrapIntegration(fn, {
    name: 'IBAMA',
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
    cacheTTL: 86400, // 24 hours
    cacheEnabled: true,
  });
}

/**
 * Create wrapped integration for ANP
 */
export function createANPIntegration<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return wrapIntegration(fn, {
    name: 'ANP',
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
    cacheTTL: 86400, // 24 hours
    cacheEnabled: true,
  });
}

/**
 * Create wrapped integration for USGS
 */
export function createUSGSIntegration<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return wrapIntegration(fn, {
    name: 'USGS',
    timeout: 15000, // USGS pode ser mais lento
    retries: 3,
    retryDelay: 2000,
    cacheTTL: 86400, // 24 hours
    cacheEnabled: true,
  });
}

/**
 * Create wrapped integration for Copernicus
 */
export function createCopernicusIntegration<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return wrapIntegration(fn, {
    name: 'Copernicus',
    timeout: 15000, // Satellite data pode ser mais lento
    retries: 3,
    retryDelay: 2000,
    cacheTTL: 86400, // 24 hours
    cacheEnabled: true,
  });
}
