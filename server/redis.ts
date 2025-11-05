/**
 * Redis Client Configuration
 * Distributed cache for sessions, API responses, and temporary data
 */

import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * Initialize Redis client
 */
export function initRedis(): Redis {
  if (redis) {
    return redis;
  }

  const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;

  if (!redisUrl) {
    console.warn('[Redis] No REDIS_URL configured - using in-memory cache fallback');
    // Return mock Redis client for development
    return createMockRedis();
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Reconnect on READONLY error
          return true;
        }
        return false;
      },
      enableReadyCheck: true,
      enableOfflineQueue: true,
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redis.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
    });

    redis.on('close', () => {
      console.warn('[Redis] Connection closed');
    });

    return redis;
  } catch (error: any) {
    console.error('[Redis] Initialization failed:', error.message);
    return createMockRedis();
  }
}

/**
 * Get Redis client instance
 */
export function getRedis(): Redis {
  if (!redis) {
    return initRedis();
  }
  return redis;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('[Redis] Connection closed gracefully');
  }
}

/**
 * Cache helper functions
 */
export async function cacheSet(
  key: string,
  value: any,
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    const client = getRedis();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
    console.log(`[Cache] SET ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error: any) {
    console.error('[Cache] SET failed:', error.message);
  }
}

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  try {
    const client = getRedis();
    const data = await client.get(key);
    if (data) {
      console.log(`[Cache] HIT ${key}`);
      return JSON.parse(data) as T;
    }
    console.log(`[Cache] MISS ${key}`);
    return null;
  } catch (error: any) {
    console.error('[Cache] GET failed:', error.message);
    return null;
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const client = getRedis();
    await client.del(key);
    console.log(`[Cache] DEL ${key}`);
  } catch (error: any) {
    console.error('[Cache] DEL failed:', error.message);
  }
}

export async function cacheExists(key: string): Promise<boolean> {
  try {
    const client = getRedis();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error: any) {
    console.error('[Cache] EXISTS failed:', error.message);
    return false;
  }
}

/**
 * Mock Redis client for development (in-memory)
 */
function createMockRedis(): Redis {
  const mockCache = new Map<string, { value: string; expiresAt: number }>();

  const mockRedis = {
    setex: async (key: string, ttl: number, value: string) => {
      const expiresAt = Date.now() + ttl * 1000;
      mockCache.set(key, { value, expiresAt });
      return 'OK';
    },
    get: async (key: string) => {
      const item = mockCache.get(key);
      if (item) {
        if (Date.now() < item.expiresAt) {
          return item.value;
        } else {
          mockCache.delete(key);
        }
      }
      return null;
    },
    del: async (key: string) => {
      mockCache.delete(key);
      return 1;
    },
    exists: async (key: string) => {
      const item = mockCache.get(key);
      if (item && Date.now() < item.expiresAt) {
        return 1;
      }
      return 0;
    },
    quit: async () => {
      mockCache.clear();
    },
    on: () => {},
  } as any;

  console.log('[Redis] Using in-memory mock cache (development mode)');
  return mockRedis;
}
