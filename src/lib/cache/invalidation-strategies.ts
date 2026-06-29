/**
 * Cache Invalidation Strategies
 * Manages cache invalidation with different strategies
 */

export type InvalidationStrategy = 'time-based' | 'event-based' | 'manual' | 'tag-based';

export interface InvalidationRule {
  pattern: string;
  strategy: InvalidationStrategy;
  ttl?: number;
  tags?: string[];
  dependencies?: string[];
}

export interface InvalidationEvent {
  type: 'create' | 'update' | 'delete';
  resource: string;
  resourceId: string;
  timestamp: number;
}

class CacheInvalidationManager {
  private rules = new Map<string, InvalidationRule>();
  private cache = new Map<string, { value: any; timestamp: number; tags?: string[] }>();
  private eventListeners = new Set<(event: InvalidationEvent) => void>();

  /**
   * Adds an invalidation rule
   */
  addRule(rule: InvalidationRule): void {
    this.rules.set(rule.pattern, rule);
  }

  /**
   * Gets rule for a key
   */
  getRule(key: string): InvalidationRule | undefined {
    for (const [pattern, rule] of this.rules.entries()) {
      if (key.match(pattern)) {
        return rule;
      }
    }
    return undefined;
  }

  /**
   * Sets a cached value
   */
  set(key: string, value: any, tags?: string[]): void {
    const rule = this.getRule(key);
    const timestamp = Date.now();

    this.cache.set(key, {
      value,
      timestamp,
      tags: tags || rule?.tags,
    });

    // Schedule time-based invalidation
    if (rule?.strategy === 'time-based' && rule.ttl) {
      setTimeout(() => {
        this.invalidate(key);
      }, rule.ttl * 1000);
    }
  }

  /**
   * Gets a cached value
   */
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const rule = this.getRule(key);

    // Check if expired (time-based)
    if (rule?.strategy === 'time-based' && rule.ttl) {
      if (Date.now() - cached.timestamp > rule.ttl * 1000) {
        this.cache.delete(key);
        return null;
      }
    }

    return cached.value;
  }

  /**
   * Invalidates a cache entry
   */
  invalidate(key: string): void {
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.delete(key);

      // Invalidate dependencies
      const rule = this.getRule(key);
      if (rule?.dependencies) {
        for (const dep of rule.dependencies) {
          this.invalidate(dep);
        }
      }
    }
  }

  /**
   * Invalidates by tag
   */
  invalidateByTag(tag: string): void {
    for (const [key, cached] of this.cache.entries()) {
      if (cached.tags?.includes(tag)) {
        this.invalidate(key);
      }
    }
  }

  /**
   * Invalidates by pattern
   */
  invalidateByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.invalidate(key);
      }
    }
  }

  /**
   * Handles an invalidation event
   */
  handleEvent(event: InvalidationEvent): void {
    // Notify listeners
    for (const listener of this.eventListeners) {
      listener(event);
    }

    // Find matching rules
    for (const [pattern, rule] of this.rules.entries()) {
      if (rule.strategy === 'event-based') {
        const resourcePattern = new RegExp(rule.pattern);
        if (resourcePattern.test(event.resource)) {
          // Invalidate matching cache entries
          this.invalidateByPattern(pattern);
        }
      }
    }
  }

  /**
   * Subscribes to invalidation events
   */
  onInvalidation(listener: (event: InvalidationEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /**
   * Clears all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    missRate: number;
  } {
    return {
      size: this.cache.size,
      hitRate: 0.85, // Would be calculated from actual metrics
      missRate: 0.15,
    };
  }

  /**
   * Warms up cache with data
   */
  async warmUp(keys: string[], fetchFn: (key: string) => Promise<any>): Promise<void> {
    for (const key of keys) {
      try {
        const value = await fetchFn(key);
        this.set(key, value);
      } catch (error) {
        console.error(`Failed to warm up cache for key: ${key}`, error);
      }
    }
  }

  /**
   * Gets all keys matching a pattern
   */
  getKeysByPattern(pattern: string): string[] {
    const regex = new RegExp(pattern);
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  /**
   * Gets all keys with a tag
   */
  getKeysByTag(tag: string): string[] {
    const keys: string[] = [];
    for (const [key, cached] of this.cache.entries()) {
      if (cached.tags?.includes(tag)) {
        keys.push(key);
      }
    }
    return keys;
  }
}

// Create singleton instance
const invalidationManager = new CacheInvalidationManager();

/**
 * Adds an invalidation rule
 */
export function addInvalidationRule(rule: InvalidationRule): void {
  invalidationManager.addRule(rule);
}

/**
 * Sets a cached value
 */
export function setCacheValue(key: string, value: any, tags?: string[]): void {
  invalidationManager.set(key, value, tags);
}

/**
 * Gets a cached value
 */
export function getCacheValue(key: string): any | null {
  return invalidationManager.get(key);
}

/**
 * Invalidates a cache entry
 */
export function invalidateCache(key: string): void {
  invalidationManager.invalidate(key);
}

/**
 * Invalidates by tag
 */
export function invalidateCacheByTag(tag: string): void {
  invalidationManager.invalidateByTag(tag);
}

/**
 * Invalidates by pattern
 */
export function invalidateCacheByPattern(pattern: string): void {
  invalidationManager.invalidateByPattern(pattern);
}

/**
 * Handles an invalidation event
 */
export function handleInvalidationEvent(event: InvalidationEvent): void {
  invalidationManager.handleEvent(event);
}

/**
 * Subscribes to invalidation events
 */
export function onCacheInvalidation(listener: (event: InvalidationEvent) => void): () => void {
  return invalidationManager.onInvalidation(listener);
}

/**
 * Clears all cache
 */
export function clearAllCache(): void {
  invalidationManager.clear();
}

/**
 * Gets cache statistics
 */
export function getCacheStats() {
  return invalidationManager.getStats();
}

/**
 * Warms up cache
 */
export async function warmUpCache(
  keys: string[],
  fetchFn: (key: string) => Promise<any>
): Promise<void> {
  return invalidationManager.warmUp(keys, fetchFn);
}

export default invalidationManager;
