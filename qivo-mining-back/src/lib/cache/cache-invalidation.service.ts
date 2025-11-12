/**
 * Cache Invalidation Strategies
 * 
 * Implements various cache invalidation patterns:
 * - Time-based expiration
 * - Event-based invalidation
 * - Tag-based invalidation
 * - Dependency-based invalidation
 * - Write-through/Write-behind
 * 
 * @module CacheInvalidation
 * @sprint SPRINT5-002
 */

import { CacheManager } from './cache-manager';
import { EventEmitter } from 'events';

/**
 * Invalidation event types
 */
export enum InvalidationEvent {
  ENTITY_CREATED = 'entity:created',
  ENTITY_UPDATED = 'entity:updated',
  ENTITY_DELETED = 'entity:deleted',
  BATCH_UPDATE = 'batch:update',
  USER_ACTION = 'user:action',
}

/**
 * Invalidation strategy type
 */
export type InvalidationStrategy =
  | 'immediate' // Invalidate immediately
  | 'lazy' // Invalidate on next access
  | 'scheduled' // Invalidate at specific time
  | 'ttl' // Time-to-live based
  | 'lru'; // Least recently used

/**
 * Invalidation rule
 */
export interface InvalidationRule {
  event: InvalidationEvent;
  patterns: string[];
  strategy: InvalidationStrategy;
  delay?: number; // For scheduled strategy
  cascade?: boolean; // Invalidate related keys
}

/**
 * Cache tag mapping
 */
interface TagMapping {
  tag: string;
  keys: Set<string>;
}

/**
 * Cache Invalidation Service
 * 
 * Manages cache invalidation strategies and rules
 */
export class CacheInvalidationService extends EventEmitter {
  private cacheManager: CacheManager;
  private rules: Map<InvalidationEvent, InvalidationRule[]>;
  private tags: Map<string, Set<string>>; // tag -> keys
  private dependencies: Map<string, Set<string>>; // key -> dependent keys
  private invalidationQueue: Array<{ pattern: string; delay: number }>;
  private scheduledInvalidations: Map<string, NodeJS.Timeout>;

  constructor(cacheManager: CacheManager) {
    super();
    this.cacheManager = cacheManager;
    this.rules = new Map();
    this.tags = new Map();
    this.dependencies = new Map();
    this.invalidationQueue = [];
    this.scheduledInvalidations = new Map();

    this.setupDefaultRules();
  }

  /**
   * Setup default invalidation rules
   */
  private setupDefaultRules(): void {
    // Technical reports invalidation
    this.addRule({
      event: InvalidationEvent.ENTITY_UPDATED,
      patterns: ['report:*', 'reports:list'],
      strategy: 'immediate',
      cascade: true,
    });

    // User data invalidation
    this.addRule({
      event: InvalidationEvent.USER_ACTION,
      patterns: ['user:*:data', 'user:*:settings'],
      strategy: 'immediate',
    });

    // Batch operations
    this.addRule({
      event: InvalidationEvent.BATCH_UPDATE,
      patterns: ['*'],
      strategy: 'scheduled',
      delay: 5000, // 5 seconds delay to batch multiple updates
    });
  }

  /**
   * Add invalidation rule
   */
  addRule(rule: InvalidationRule): void {
    const existing = this.rules.get(rule.event) || [];
    existing.push(rule);
    this.rules.set(rule.event, existing);
    
    console.log(`[CacheInvalidation] Added rule for ${rule.event}: ${rule.patterns.join(', ')}`);
  }

  /**
   * Remove invalidation rule
   */
  removeRule(event: InvalidationEvent, patterns: string[]): void {
    const existing = this.rules.get(event);
    if (!existing) return;

    const filtered = existing.filter(
      (rule) => !patterns.every((p) => rule.patterns.includes(p))
    );
    
    this.rules.set(event, filtered);
  }

  /**
   * Trigger invalidation event
   */
  async trigger(event: InvalidationEvent, metadata?: Record<string, any>): Promise<void> {
    console.log(`[CacheInvalidation] Event triggered: ${event}`, metadata);

    const rules = this.rules.get(event);
    if (!rules || rules.length === 0) {
      console.log(`[CacheInvalidation] No rules found for ${event}`);
      return;
    }

    for (const rule of rules) {
      await this.applyRule(rule, metadata);
    }

    this.emit('invalidated', { event, metadata });
  }

  /**
   * Apply invalidation rule
   */
  private async applyRule(rule: InvalidationRule, metadata?: Record<string, any>): Promise<void> {
    const patterns = this.resolvePatterns(rule.patterns, metadata);

    switch (rule.strategy) {
      case 'immediate':
        await this.invalidateImmediate(patterns, rule.cascade);
        break;

      case 'scheduled':
        this.scheduleInvalidation(patterns, rule.delay || 0);
        break;

      case 'lazy':
        // Mark for lazy invalidation (handled on next access)
        this.markForLazyInvalidation(patterns);
        break;

      case 'ttl':
        // TTL is handled by cache itself
        console.log(`[CacheInvalidation] TTL-based invalidation for: ${patterns.join(', ')}`);
        break;

      case 'lru':
        // LRU is handled by L1 cache
        console.log(`[CacheInvalidation] LRU-based invalidation for: ${patterns.join(', ')}`);
        break;
    }
  }

  /**
   * Invalidate immediately
   */
  private async invalidateImmediate(patterns: string[], cascade = false): Promise<void> {
    console.log(`[CacheInvalidation] Immediate invalidation: ${patterns.join(', ')}`);

    for (const pattern of patterns) {
      await this.cacheManager.deletePattern(pattern);

      // Cascade to dependent keys
      if (cascade) {
        const dependents = this.getDependentKeys(pattern);
        const dependentArray = Array.from(dependents);
        for (const dependent of dependentArray) {
          await this.cacheManager.delete(dependent);
        }
      }
    }
  }

  /**
   * Schedule invalidation for later
   */
  private scheduleInvalidation(patterns: string[], delay: number): void {
    console.log(`[CacheInvalidation] Scheduling invalidation in ${delay}ms: ${patterns.join(', ')}`);

    for (const pattern of patterns) {
      // Cancel existing scheduled invalidation
      const existing = this.scheduledInvalidations.get(pattern);
      if (existing) {
        clearTimeout(existing);
      }

      // Schedule new invalidation
      const timeout = setTimeout(async () => {
        await this.cacheManager.deletePattern(pattern);
        this.scheduledInvalidations.delete(pattern);
      }, delay);

      this.scheduledInvalidations.set(pattern, timeout);
    }
  }

  /**
   * Mark keys for lazy invalidation
   */
  private markForLazyInvalidation(patterns: string[]): void {
    // Add to queue for processing
    for (const pattern of patterns) {
      this.invalidationQueue.push({ pattern, delay: 0 });
    }
    
    console.log(`[CacheInvalidation] Marked for lazy invalidation: ${patterns.join(', ')}`);
  }

  /**
   * Resolve patterns with metadata placeholders
   */
  private resolvePatterns(patterns: string[], metadata?: Record<string, any>): string[] {
    if (!metadata) return patterns;

    return patterns.map((pattern) => {
      let resolved = pattern;
      
      // Replace placeholders like {userId} with actual values
      Object.entries(metadata).forEach(([key, value]) => {
        resolved = resolved.replace(`{${key}}`, String(value));
      });
      
      return resolved;
    });
  }

  /**
   * Tag cache key for grouped invalidation
   */
  tagKey(key: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag)!.add(key);
    }
  }

  /**
   * Invalidate all keys with specific tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    const keys = this.tags.get(tag);
    if (!keys || keys.size === 0) {
      console.log(`[CacheInvalidation] No keys found for tag: ${tag}`);
      return 0;
    }

    console.log(`[CacheInvalidation] Invalidating ${keys.size} keys with tag: ${tag}`);

    const keysArray = Array.from(keys);
    for (const key of keysArray) {
      await this.cacheManager.delete(key);
    }

    const count = keys.size;
    this.tags.delete(tag);
    
    return count;
  }

  /**
   * Set dependency between cache keys
   */
  setDependency(key: string, dependentKeys: string[]): void {
    if (!this.dependencies.has(key)) {
      this.dependencies.set(key, new Set());
    }

    const deps = this.dependencies.get(key)!;
    dependentKeys.forEach((dep) => deps.add(dep));
  }

  /**
   * Get dependent keys
   */
  private getDependentKeys(pattern: string): Set<string> {
    const dependents = new Set<string>();

    // Convert pattern to regex for matching
    const regex = new RegExp(pattern.replace('*', '.*'));

    this.dependencies.forEach((deps, key) => {
      if (regex.test(key)) {
        deps.forEach((dep) => dependents.add(dep));
      }
    });

    return dependents;
  }

  /**
   * Write-through: Update cache and data source together
   */
  async writeThrough<T>(
    key: string,
    value: T,
    updateFn: (value: T) => Promise<void>,
    ttl?: number
  ): Promise<void> {
    // Update data source first
    await updateFn(value);

    // Then update cache
    await this.cacheManager.set(key, value, ttl);

    console.log(`[CacheInvalidation] Write-through completed for: ${key}`);
  }

  /**
   * Write-behind: Update cache immediately, data source asynchronously
   */
  async writeBehind<T>(
    key: string,
    value: T,
    updateFn: (value: T) => Promise<void>,
    ttl?: number
  ): Promise<void> {
    // Update cache immediately
    await this.cacheManager.set(key, value, ttl);

    // Update data source in background
    setImmediate(async () => {
      try {
        await updateFn(value);
        console.log(`[CacheInvalidation] Write-behind completed for: ${key}`);
      } catch (error) {
        console.error(`[CacheInvalidation] Write-behind failed for ${key}:`, error);
        // Invalidate cache on error
        await this.cacheManager.delete(key);
      }
    });
  }

  /**
   * Process lazy invalidation queue
   */
  async processLazyQueue(): Promise<void> {
    if (this.invalidationQueue.length === 0) return;

    console.log(`[CacheInvalidation] Processing ${this.invalidationQueue.length} lazy invalidations`);

    const items = [...this.invalidationQueue];
    this.invalidationQueue = [];

    for (const item of items) {
      await this.cacheManager.deletePattern(item.pattern);
    }
  }

  /**
   * Get invalidation statistics
   */
  getStats(): {
    ruleCount: number;
    tagCount: number;
    dependencyCount: number;
    queueSize: number;
    scheduledCount: number;
  } {
    let ruleCount = 0;
    this.rules.forEach((rules) => {
      ruleCount += rules.length;
    });

    return {
      ruleCount,
      tagCount: this.tags.size,
      dependencyCount: this.dependencies.size,
      queueSize: this.invalidationQueue.length,
      scheduledCount: this.scheduledInvalidations.size,
    };
  }

  /**
   * Clear all invalidation state
   */
  clear(): void {
    this.rules.clear();
    this.tags.clear();
    this.dependencies.clear();
    this.invalidationQueue = [];
    
    // Clear scheduled invalidations
    this.scheduledInvalidations.forEach((timeout) => clearTimeout(timeout));
    this.scheduledInvalidations.clear();

    this.setupDefaultRules();
    console.log('[CacheInvalidation] Cleared all invalidation state');
  }
}

// Export singleton instance
import { cacheManager } from './cache-manager';
export const cacheInvalidation = new CacheInvalidationService(cacheManager);
