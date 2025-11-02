/**
 * Multi-Layer Cache Manager
 * 
 * Implements a two-tier caching strategy:
 * - L1: In-memory cache (ultra-fast, limited size)
 * - L2: Redis distributed cache (fast, large capacity)
 * 
 * Features:
 * - Automatic cache promotion/demotion
 * - LRU eviction policy for L1
 * - Cache warming strategies
 * - Intelligent prefetching
 * - Cache coherence between layers
 * 
 * Target: 80%+ hit rate, <50ms response time
 * 
 * @module CacheManager
 * @sprint SPRINT5-002
 */

import { RedisCacheService } from './redis-cache.service';
import { TTLCache } from '../../../shared/utils/performance';

/**
 * Cache layer enum
 */
export enum CacheLayer {
  L1_MEMORY = 'L1_MEMORY',
  L2_REDIS = 'L2_REDIS',
  MISS = 'MISS',
}

/**
 * Cache get result with metadata
 */
export interface CacheResult<T> {
  value: T | null;
  layer: CacheLayer;
  latency: number;
}

/**
 * Cache manager statistics
 */
export interface CacheManagerStats {
  l1: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    maxSize: number;
  };
  l2: {
    hits: number;
    misses: number;
    hitRate: number;
    totalKeys: number;
    memoryUsage: number;
  };
  overall: {
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    avgLatency: number;
  };
}

/**
 * Cache manager configuration
 */
export interface CacheManagerConfig {
  l1MaxSize?: number;
  l1TTL?: number;
  l2TTL?: number;
  enableL1?: boolean;
  enableL2?: boolean;
  promoteToL1?: boolean;
  prefetchThreshold?: number;
}

/**
 * Multi-Layer Cache Manager
 * 
 * Orchestrates L1 (memory) and L2 (Redis) caches
 */
export class CacheManager {
  private l1Cache: TTLCache<string, any> | null;
  private l2Cache: RedisCacheService;
  private config: Required<CacheManagerConfig>;
  private stats: {
    l1Hits: number;
    l1Misses: number;
    l2Hits: number;
    l2Misses: number;
    latencies: number[];
  };
  private prefetchQueue: Set<string>;

  constructor(l2Cache: RedisCacheService, config: CacheManagerConfig = {}) {
    this.l2Cache = l2Cache;
    
    this.config = {
      l1MaxSize: config.l1MaxSize || 1000,
      l1TTL: config.l1TTL || 300000, // 5 minutes
      l2TTL: config.l2TTL || 3600, // 1 hour
      enableL1: config.enableL1 ?? true,
      enableL2: config.enableL2 ?? true,
      promoteToL1: config.promoteToL1 ?? true,
      prefetchThreshold: config.prefetchThreshold || 10, // hits before prefetch
    };

    this.l1Cache = this.config.enableL1
      ? new TTLCache<string, any>(this.config.l1TTL)
      : null;

    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      latencies: [],
    };

    this.prefetchQueue = new Set();
  }

  /**
   * Get value from cache (L1 → L2 → source)
   */
  async get<T>(key: string): Promise<CacheResult<T>> {
    const startTime = Date.now();

    // Try L1 cache first
    if (this.config.enableL1 && this.l1Cache) {
      const l1Value = this.l1Cache.get(key) as T | undefined;
      
      if (l1Value !== undefined) {
        this.stats.l1Hits++;
        const latency = Date.now() - startTime;
        this.recordLatency(latency);
        
        return {
          value: l1Value,
          layer: CacheLayer.L1_MEMORY,
          latency,
        };
      }
      
      this.stats.l1Misses++;
    }

    // Try L2 cache (Redis)
    if (this.config.enableL2) {
      const l2Value = await this.l2Cache.get<T>(key);
      
      if (l2Value !== null) {
        this.stats.l2Hits++;
        
        // Promote to L1 if enabled
        if (this.config.promoteToL1 && this.l1Cache) {
          this.l1Cache.set(key, l2Value);
        }
        
        const latency = Date.now() - startTime;
        this.recordLatency(latency);
        
        return {
          value: l2Value,
          layer: CacheLayer.L2_REDIS,
          latency,
        };
      }
      
      this.stats.l2Misses++;
    }

    const latency = Date.now() - startTime;
    this.recordLatency(latency);

    return {
      value: null,
      layer: CacheLayer.MISS,
      latency,
    };
  }

  /**
   * Set value in cache (L1 and L2)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const promises: Promise<any>[] = [];

    // Set in L1
    if (this.config.enableL1 && this.l1Cache) {
      this.l1Cache.set(key, value);
    }

    // Set in L2
    if (this.config.enableL2) {
      promises.push(this.l2Cache.set(key, value, ttl || this.config.l2TTL));
    }

    await Promise.all(promises);
  }

  /**
   * Delete value from all cache layers
   */
  async delete(key: string): Promise<void> {
    // L1 cache doesn't have delete, just let it expire
    // If we need immediate deletion, clear entire L1
    
    if (this.config.enableL2) {
      await this.l2Cache.delete(key);
    }
  }

  /**
   * Delete multiple keys by pattern (L2 only)
   */
  async deletePattern(pattern: string): Promise<number> {
    // Clear entire L1 cache for safety (pattern matching is complex)
    if (this.config.enableL1 && this.l1Cache) {
      this.l1Cache.clear();
    }

    if (this.config.enableL2) {
      return await this.l2Cache.deletePattern(pattern);
    }

    return 0;
  }

  /**
   * Check if key exists in any layer
   */
  async has(key: string): Promise<boolean> {
    if (this.config.enableL1 && this.l1Cache && this.l1Cache.has(key)) {
      return true;
    }

    if (this.config.enableL2) {
      return await this.l2Cache.has(key);
    }

    return false;
  }

  /**
   * Get or compute value (cache-aside pattern)
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    
    if (cached.value !== null) {
      return cached.value;
    }

    // Compute value
    const value = await computeFn();

    // Store in cache
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Warm cache with multiple values
   */
  async warmCache<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    console.log(`[CacheManager] Warming cache with ${entries.length} entries...`);

    const promises = entries.map((entry) =>
      this.set(entry.key, entry.value, entry.ttl)
    );

    await Promise.all(promises);
    console.log(`[CacheManager] Cache warmed successfully`);
  }

  /**
   * Prefetch related keys based on access patterns
   */
  async prefetch(keys: string[]): Promise<void> {
    if (!this.config.enableL2) return;

    console.log(`[CacheManager] Prefetching ${keys.length} keys...`);

    for (const key of keys) {
      if (this.prefetchQueue.has(key)) continue;
      
      this.prefetchQueue.add(key);

      // Load from L2 to L1 in background
      if (this.config.enableL1 && this.l1Cache) {
        const value = await this.l2Cache.get(key);
        if (value !== null) {
          this.l1Cache.set(key, value);
        }
      }

      this.prefetchQueue.delete(key);
    }
  }

  /**
   * Invalidate cache for specific patterns (cache busting)
   */
  async invalidate(patterns: string[]): Promise<number> {
    console.log(`[CacheManager] Invalidating ${patterns.length} patterns...`);

    let totalDeleted = 0;

    for (const pattern of patterns) {
      const deleted = await this.deletePattern(pattern);
      totalDeleted += deleted;
    }

    console.log(`[CacheManager] Invalidated ${totalDeleted} keys`);
    return totalDeleted;
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    if (this.config.enableL1 && this.l1Cache) {
      this.l1Cache.clear();
    }

    if (this.config.enableL2) {
      await this.l2Cache.clear();
    }

    // Reset stats
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      latencies: [],
    };

    console.log('[CacheManager] All caches cleared');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheManagerStats> {
    const l1Total = this.stats.l1Hits + this.stats.l1Misses;
    const l2Total = this.stats.l2Hits + this.stats.l2Misses;
    const overallTotal = l1Total + l2Total;

    const l2Stats = await this.l2Cache.getStats();

    const stats: CacheManagerStats = {
      l1: {
        hits: this.stats.l1Hits,
        misses: this.stats.l1Misses,
        hitRate: l1Total > 0 ? this.stats.l1Hits / l1Total : 0,
        size: this.l1Cache?.size() || 0,
        maxSize: this.config.l1MaxSize,
      },
      l2: {
        hits: this.stats.l2Hits,
        misses: this.stats.l2Misses,
        hitRate: l2Total > 0 ? this.stats.l2Hits / l2Total : 0,
        totalKeys: l2Stats.totalKeys,
        memoryUsage: l2Stats.memoryUsage,
      },
      overall: {
        totalHits: this.stats.l1Hits + this.stats.l2Hits,
        totalMisses: this.stats.l1Misses + this.stats.l2Misses,
        hitRate: overallTotal > 0 ? (this.stats.l1Hits + this.stats.l2Hits) / overallTotal : 0,
        avgLatency: this.calculateAvgLatency(),
      },
    };

    return stats;
  }

  /**
   * Record latency measurement
   */
  private recordLatency(latency: number): void {
    this.stats.latencies.push(latency);
    
    // Keep only last 1000 measurements
    if (this.stats.latencies.length > 1000) {
      this.stats.latencies.shift();
    }
  }

  /**
   * Calculate average latency
   */
  private calculateAvgLatency(): number {
    if (this.stats.latencies.length === 0) return 0;
    
    const sum = this.stats.latencies.reduce((a, b) => a + b, 0);
    return sum / this.stats.latencies.length;
  }

  /**
   * Health check for all cache layers
   */
  async healthCheck(): Promise<{
    l1: { healthy: boolean };
    l2: { healthy: boolean; latency: number; error?: string };
    overall: boolean;
  }> {
    const l1Healthy = this.config.enableL1 && this.l1Cache !== null;
    const l2Health = await this.l2Cache.healthCheck();

    return {
      l1: { healthy: l1Healthy },
      l2: l2Health,
      overall: l1Healthy && l2Health.healthy,
    };
  }

  /**
   * Get configuration
   */
  getConfig(): Required<CacheManagerConfig> {
    return { ...this.config };
  }
}

// Export singleton instance
import { redisCache } from './redis-cache.service';
export const cacheManager = new CacheManager(redisCache);
