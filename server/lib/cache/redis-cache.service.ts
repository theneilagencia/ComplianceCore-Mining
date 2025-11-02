/**
 * Redis Cache Service
 * 
 * Distributed caching layer using Redis 7.x with:
 * - Connection pooling
 * - Automatic retry logic
 * - Circuit breaker pattern
 * - Health monitoring
 * - Compression support
 * 
 * Target: 80%+ hit rate, <50ms cached response time
 * 
 * @module RedisCacheService
 * @sprint SPRINT5-002
 */

import Redis, { RedisOptions } from 'ioredis';
import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * Cache entry metadata
 */
interface CacheMetadata {
  key: string;
  size: number;
  compressed: boolean;
  createdAt: number;
  expiresAt: number;
  hits: number;
  lastAccessed: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
  avgResponseTime: number;
  errorCount: number;
}

/**
 * Redis cache configuration
 */
export interface RedisCacheConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  enableCompression?: boolean;
  compressionThreshold?: number; // bytes
  defaultTTL?: number; // seconds
  maxRetries?: number;
  retryDelay?: number;
  connectionTimeout?: number;
}

/**
 * Redis Cache Service
 * 
 * High-performance distributed caching with Redis
 */
export class RedisCacheService {
  private client!: Redis;
  private config: Omit<Required<RedisCacheConfig>, 'password'> & { password?: string };
  private stats: CacheStats;
  private responseTimes: number[];
  private isConnected: boolean;
  private circuitBreakerOpen: boolean;
  private consecutiveErrors: number;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30000; // 30s

  constructor(config: RedisCacheConfig = {}) {
    this.config = {
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || parseInt(process.env.REDIS_PORT || '6379', 10),
      password: config.password || process.env.REDIS_PASSWORD,
      db: config.db || parseInt(process.env.REDIS_DB || '0', 10),
      keyPrefix: config.keyPrefix || 'compliance:',
      enableCompression: config.enableCompression ?? true,
      compressionThreshold: config.compressionThreshold || 1024, // 1KB
      defaultTTL: config.defaultTTL || 3600, // 1 hour
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      connectionTimeout: config.connectionTimeout || 5000,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalKeys: 0,
      memoryUsage: 0,
      avgResponseTime: 0,
      errorCount: 0,
    };

    this.responseTimes = [];
    this.isConnected = false;
    this.circuitBreakerOpen = false;
    this.consecutiveErrors = 0;

    this.initializeClient();
  }

  /**
   * Initialize Redis client with connection pooling
   */
  private initializeClient(): void {
    const options: RedisOptions = {
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix,
      connectTimeout: this.config.connectionTimeout,
      maxRetriesPerRequest: this.config.maxRetries,
      retryStrategy: (times: number) => {
        if (times > this.config.maxRetries) {
          console.error('[RedisCache] Max retries exceeded');
          return null;
        }
        const delay = Math.min(times * this.config.retryDelay, 5000);
        console.log(`[RedisCache] Retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err) => {
        console.error('[RedisCache] Reconnect on error:', err.message);
        return true;
      },
    };

    this.client = new Redis(options);

    this.client.on('connect', () => {
      console.log('[RedisCache] Connected to Redis');
      this.isConnected = true;
      this.consecutiveErrors = 0;
      this.circuitBreakerOpen = false;
    });

    this.client.on('ready', () => {
      console.log('[RedisCache] Redis client ready');
    });

    this.client.on('error', (err) => {
      console.error('[RedisCache] Error:', err);
      this.stats.errorCount++;
      this.consecutiveErrors++;
      
      if (this.consecutiveErrors >= this.CIRCUIT_BREAKER_THRESHOLD) {
        this.openCircuitBreaker();
      }
    });

    this.client.on('close', () => {
      console.log('[RedisCache] Connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('[RedisCache] Reconnecting...');
    });
  }

  /**
   * Open circuit breaker to prevent cascading failures
   */
  private openCircuitBreaker(): void {
    if (this.circuitBreakerOpen) return;

    console.warn('[RedisCache] Circuit breaker opened due to consecutive errors');
    this.circuitBreakerOpen = true;

    setTimeout(() => {
      console.log('[RedisCache] Circuit breaker closed, attempting recovery');
      this.circuitBreakerOpen = false;
      this.consecutiveErrors = 0;
    }, this.CIRCUIT_BREAKER_TIMEOUT);
  }

  /**
   * Check if circuit breaker is open
   */
  private checkCircuitBreaker(): boolean {
    if (this.circuitBreakerOpen) {
      console.warn('[RedisCache] Circuit breaker is open, rejecting request');
      return false;
    }
    return true;
  }

  /**
   * Record response time
   */
  private recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    // Calculate average
    this.stats.avgResponseTime =
      this.responseTimes.reduce((sum, t) => sum + t, 0) / this.responseTimes.length;
  }

  /**
   * Compress data if it exceeds threshold
   */
  private async compressIfNeeded(data: string): Promise<{ data: Buffer | string; compressed: boolean }> {
    if (!this.config.enableCompression) {
      return { data, compressed: false };
    }

    const size = Buffer.byteLength(data, 'utf8');
    
    if (size >= this.config.compressionThreshold) {
      const compressed = await gzipAsync(Buffer.from(data, 'utf8'));
      return { data: compressed, compressed: true };
    }

    return { data, compressed: false };
  }

  /**
   * Decompress data if needed
   */
  private async decompressIfNeeded(data: Buffer | string, compressed: boolean): Promise<string> {
    if (!compressed) {
      return typeof data === 'string' ? data : data.toString('utf8');
    }

    const buffer = typeof data === 'string' ? Buffer.from(data, 'base64') : data;
    const decompressed = await gunzipAsync(buffer);
    return decompressed.toString('utf8');
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.checkCircuitBreaker()) {
      this.stats.misses++;
      return null;
    }

    const startTime = Date.now();

    try {
      const rawValue = await this.client.getBuffer(key);
      
      if (!rawValue) {
        this.stats.misses++;
        this.recordResponseTime(Date.now() - startTime);
        return null;
      }

      // Get metadata
      const metaKey = `${key}:meta`;
      const metadata = await this.client.get(metaKey);
      const meta: CacheMetadata | null = metadata ? JSON.parse(metadata) : null;

      // Decompress if needed
      const value = await this.decompressIfNeeded(rawValue, meta?.compressed || false);

      // Update hit count
      if (meta) {
        meta.hits++;
        meta.lastAccessed = Date.now();
        await this.client.set(metaKey, JSON.stringify(meta), 'KEEPTTL');
      }

      this.stats.hits++;
      this.consecutiveErrors = 0;
      this.recordResponseTime(Date.now() - startTime);
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('[RedisCache] Get error:', error);
      this.stats.errorCount++;
      this.stats.misses++;
      this.consecutiveErrors++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.checkCircuitBreaker()) {
      return false;
    }

    const startTime = Date.now();

    try {
      const jsonValue = JSON.stringify(value);
      const { data, compressed } = await this.compressIfNeeded(jsonValue);
      
      const effectiveTTL = ttl || this.config.defaultTTL;
      
      // Store value
      if (Buffer.isBuffer(data)) {
        await this.client.setex(key, effectiveTTL, data.toString('base64'));
      } else {
        await this.client.setex(key, effectiveTTL, data);
      }

      // Store metadata
      const metadata: CacheMetadata = {
        key,
        size: Buffer.byteLength(jsonValue, 'utf8'),
        compressed,
        createdAt: Date.now(),
        expiresAt: Date.now() + effectiveTTL * 1000,
        hits: 0,
        lastAccessed: Date.now(),
      };

      await this.client.setex(`${key}:meta`, effectiveTTL, JSON.stringify(metadata));

      this.consecutiveErrors = 0;
      this.recordResponseTime(Date.now() - startTime);
      
      return true;
    } catch (error) {
      console.error('[RedisCache] Set error:', error);
      this.stats.errorCount++;
      this.consecutiveErrors++;
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.checkCircuitBreaker()) {
      return false;
    }

    try {
      await this.client.del(key, `${key}:meta`);
      return true;
    } catch (error) {
      console.error('[RedisCache] Delete error:', error);
      this.stats.errorCount++;
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.checkCircuitBreaker()) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      await this.client.del(...keys);
      return keys.length;
    } catch (error) {
      console.error('[RedisCache] Delete pattern error:', error);
      this.stats.errorCount++;
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    if (!this.checkCircuitBreaker()) {
      return false;
    }

    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('[RedisCache] Has error:', error);
      return false;
    }
  }

  /**
   * Get time to live for key
   */
  async ttl(key: string): Promise<number> {
    if (!this.checkCircuitBreaker()) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('[RedisCache] TTL error:', error);
      return -1;
    }
  }

  /**
   * Extend expiration time
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.checkCircuitBreaker()) {
      return false;
    }

    try {
      await this.client.expire(key, ttl);
      await this.client.expire(`${key}:meta`, ttl);
      return true;
    } catch (error) {
      console.error('[RedisCache] Expire error:', error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    if (!this.checkCircuitBreaker()) {
      return false;
    }

    try {
      const keys = await this.client.keys(`${this.config.keyPrefix}*`);
      if (keys.length > 0) {
        // Remove prefix before deleting
        const keysWithoutPrefix = keys.map(k => k.replace(this.config.keyPrefix, ''));
        await this.client.del(...keysWithoutPrefix);
      }
      
      // Reset stats
      this.stats.hits = 0;
      this.stats.misses = 0;
      this.stats.hitRate = 0;
      
      console.log('[RedisCache] Cache cleared');
      return true;
    } catch (error) {
      console.error('[RedisCache] Clear error:', error);
      this.stats.errorCount++;
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      // Get total keys
      const keys = await this.client.keys(`${this.config.keyPrefix}*`);
      this.stats.totalKeys = keys.length;

      // Calculate hit rate
      const total = this.stats.hits + this.stats.misses;
      this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;

      // Get memory usage
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      if (memoryMatch) {
        this.stats.memoryUsage = parseInt(memoryMatch[1], 10);
      }

      return { ...this.stats };
    } catch (error) {
      console.error('[RedisCache] Stats error:', error);
      return { ...this.stats };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now();

    try {
      await this.client.ping();
      const latency = Date.now() - startTime;
      
      return {
        healthy: this.isConnected && !this.circuitBreakerOpen,
        latency,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      console.log('[RedisCache] Disconnected from Redis');
    } catch (error) {
      console.error('[RedisCache] Disconnect error:', error);
      this.client.disconnect();
    }
  }

  /**
   * Get connection status
   */
  isReady(): boolean {
    return this.isConnected && !this.circuitBreakerOpen;
  }
}

// Export singleton instance
export const redisCache = new RedisCacheService();
