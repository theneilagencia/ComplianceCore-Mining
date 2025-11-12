/**
 * Performance Optimization Utilities
 * 
 * Utilitários para otimizar performance da aplicação:
 * - Memoização de funções pesadas
 * - Debounce para inputs
 * - Throttle para eventos
 * - Cache com TTL
 * - Request deduplication
 * 
 * @module performance-utils
 */

/**
 * Cache simples com TTL (Time To Live)
 */
export class TTLCache<K, V> {
  private cache = new Map<K, { value: V; expires: number }>();
  private ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    // Default: 5 minutos
    this.ttl = ttlMs;
  }

  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl,
    });
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) return undefined;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Cleanup expired entries first
    const now = Date.now();
    const keysToDelete: K[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expires) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach((key) => this.cache.delete(key));
    return this.cache.size;
  }
}

/**
 * Memoiza uma função assíncrona com cache TTL
 * 
 * @example
 * ```typescript
 * const expensiveFunction = async (id: string) => {
 *   // Heavy computation
 *   return result;
 * };
 * 
 * const memoized = memoizeAsync(expensiveFunction, 5 * 60 * 1000);
 * const result = await memoized('key'); // Cached for 5 minutes
 * ```
 */
export function memoizeAsync<Args extends any[], Result>(
  fn: (...args: Args) => Promise<Result>,
  ttlMs?: number,
  keyFn?: (...args: Args) => string
): (...args: Args) => Promise<Result> {
  const cache = new TTLCache<string, Result>(ttlMs);

  return async (...args: Args): Promise<Result> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    const cached = cache.get(key);
    if (cached !== undefined) {
      console.log(`[CACHE HIT] ${key.slice(0, 50)}...`);
      return cached;
    }

    console.log(`[CACHE MISS] ${key.slice(0, 50)}...`);
    const result = await fn(...args);
    cache.set(key, result);
    
    return result;
  };
}

/**
 * Debounce: atrasa a execução de uma função até que pare de ser chamada
 * 
 * @example
 * ```typescript
 * const handleSearch = debounce((query: string) => {
 *   // Perform search
 * }, 300);
 * 
 * input.addEventListener('input', (e) => handleSearch(e.target.value));
 * ```
 */
export function debounce<Args extends any[]>(
  fn: (...args: Args) => void,
  delayMs: number
): (...args: Args) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Throttle: limita execuções de uma função a uma vez por intervalo
 * 
 * @example
 * ```typescript
 * const handleScroll = throttle(() => {
 *   // Handle scroll
 * }, 100);
 * 
 * window.addEventListener('scroll', handleScroll);
 * ```
 */
export function throttle<Args extends any[]>(
  fn: (...args: Args) => void,
  intervalMs: number
): (...args: Args) => void {
  let lastCall = 0;

  return (...args: Args) => {
    const now = Date.now();
    
    if (now - lastCall >= intervalMs) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Request deduplication: evita múltiplas requisições simultâneas iguais
 * 
 * @example
 * ```typescript
 * const fetchUser = dedupeAsync(async (id: string) => {
 *   return await api.getUser(id);
 * });
 * 
 * // Only one request will be made even if called multiple times
 * const [user1, user2, user3] = await Promise.all([
 *   fetchUser('123'),
 *   fetchUser('123'),
 *   fetchUser('123'),
 * ]);
 * ```
 */
export function dedupeAsync<Args extends any[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyFn?: (...args: Args) => string
): (...args: Args) => Promise<Result> {
  const pending = new Map<string, Promise<Result>>();

  return async (...args: Args): Promise<Result> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    const existing = pending.get(key);
    if (existing) {
      console.log(`[DEDUPE] Reusing pending request: ${key.slice(0, 50)}...`);
      return existing;
    }

    const promise = fn(...args).finally(() => {
      pending.delete(key);
    });

    pending.set(key, promise);
    return promise;
  };
}

/**
 * Batch processor: agrupa múltiplas operações em batches
 * 
 * @example
 * ```typescript
 * const batchedFetch = createBatchProcessor(
 *   async (ids: string[]) => {
 *     return await api.getUsersBatch(ids);
 *   },
 *   { maxBatchSize: 10, waitMs: 50 }
 * );
 * 
 * // These will be batched into a single request
 * const user1 = await batchedFetch('1');
 * const user2 = await batchedFetch('2');
 * const user3 = await batchedFetch('3');
 * ```
 */
export function createBatchProcessor<K, V>(
  batchFn: (keys: K[]) => Promise<Map<K, V>>,
  options: {
    maxBatchSize?: number;
    waitMs?: number;
  } = {}
): (key: K) => Promise<V> {
  const { maxBatchSize = 50, waitMs = 10 } = options;
  
  let currentBatch: Array<{
    key: K;
    resolve: (value: V) => void;
    reject: (error: any) => void;
  }> = [];
  let timeoutId: NodeJS.Timeout | null = null;

  const processBatch = async () => {
    if (currentBatch.length === 0) return;

    const batch = [...currentBatch];
    currentBatch = [];
    timeoutId = null;

    const keys = batch.map((item) => item.key);
    
    try {
      const results = await batchFn(keys);
      
      for (const item of batch) {
        const result = results.get(item.key);
        if (result !== undefined) {
          item.resolve(result);
        } else {
          item.reject(new Error(`No result for key: ${item.key}`));
        }
      }
    } catch (error) {
      for (const item of batch) {
        item.reject(error);
      }
    }
  };

  return (key: K): Promise<V> => {
    return new Promise((resolve, reject) => {
      currentBatch.push({ key, resolve, reject });

      if (currentBatch.length >= maxBatchSize) {
        // Flush immediately if batch is full
        if (timeoutId) clearTimeout(timeoutId);
        processBatch();
      } else if (!timeoutId) {
        // Schedule batch processing
        timeoutId = setTimeout(processBatch, waitMs);
      }
    });
  };
}

/**
 * Lazy initializer: inicializa recursos apenas quando necessário
 * 
 * @example
 * ```typescript
 * const heavyResource = lazyInit(async () => {
 *   // Expensive initialization
 *   return new HeavyResource();
 * });
 * 
 * // Resource is only initialized on first call
 * const resource = await heavyResource.get();
 * ```
 */
export function lazyInit<T>(
  initFn: () => Promise<T>
): {
  get: () => Promise<T>;
  reset: () => void;
  isInitialized: () => boolean;
} {
  let instance: T | null = null;
  let initializing: Promise<T> | null = null;

  return {
    get: async (): Promise<T> => {
      if (instance) return instance;
      
      if (initializing) return initializing;

      initializing = initFn().then((result) => {
        instance = result;
        initializing = null;
        return result;
      });

      return initializing;
    },
    
    reset: (): void => {
      instance = null;
      initializing = null;
    },
    
    isInitialized: (): boolean => {
      return instance !== null;
    },
  };
}

/**
 * Rate limiter: limita número de execuções por período
 * 
 * @example
 * ```typescript
 * const limiter = createRateLimiter(5, 1000); // 5 calls per second
 * 
 * for (let i = 0; i < 10; i++) {
 *   await limiter.acquire();
 *   await api.call();
 * }
 * ```
 */
export function createRateLimiter(
  maxCalls: number,
  windowMs: number
): {
  acquire: () => Promise<void>;
  reset: () => void;
} {
  let calls: number[] = [];

  const limiter = {
    acquire: async (): Promise<void> => {
      const now = Date.now();
      
      // Remove old calls outside the window
      calls = calls.filter((timestamp) => now - timestamp < windowMs);
      
      if (calls.length >= maxCalls) {
        const oldestCall = calls[0];
        const waitTime = windowMs - (now - oldestCall);
        
        console.log(`[RATE LIMIT] Waiting ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime + 1));
        return limiter.acquire(); // Retry
      }
      
      calls.push(now);
    },
    
    reset: (): void => {
      calls = [];
    },
  };

  return limiter;
}

/**
 * Performance monitor: monitora tempo de execução
 * 
 * @example
 * ```typescript
 * const monitor = createPerformanceMonitor();
 * 
 * monitor.start('operation');
 * // ... do work
 * monitor.end('operation');
 * 
 * console.log(monitor.getStats()); // { operation: { count: 1, avg: 123, ... } }
 * ```
 */
export function createPerformanceMonitor() {
  const timers = new Map<string, number>();
  const stats = new Map<
    string,
    {
      count: number;
      total: number;
      avg: number;
      min: number;
      max: number;
    }
  >();

  return {
    start: (name: string): void => {
      timers.set(name, performance.now());
    },

    end: (name: string): number => {
      const start = timers.get(name);
      if (!start) {
        console.warn(`No timer started for: ${name}`);
        return 0;
      }

      const duration = performance.now() - start;
      timers.delete(name);

      const stat = stats.get(name) || {
        count: 0,
        total: 0,
        avg: 0,
        min: Infinity,
        max: 0,
      };

      stat.count++;
      stat.total += duration;
      stat.avg = stat.total / stat.count;
      stat.min = Math.min(stat.min, duration);
      stat.max = Math.max(stat.max, duration);

      stats.set(name, stat);

      console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
      return duration;
    },

    getStats: (name?: string) => {
      if (name) {
        return stats.get(name);
      }
      return Object.fromEntries(stats.entries());
    },

    reset: (name?: string): void => {
      if (name) {
        stats.delete(name);
        timers.delete(name);
      } else {
        stats.clear();
        timers.clear();
      }
    },
  };
}
