/**
 * API Response Caching Strategies
 * Different caching strategies for different use cases
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
  metadata?: Record<string, any>;
}

export interface CacheStrategy {
  shouldCache(key: string, data: any): boolean;
  getTTL(key: string, data: any): number;
  shouldEvict(entry: CacheEntry<any>): boolean;
}

/**
 * Time-based cache strategy
 */
export class TimeBasedStrategy implements CacheStrategy {
  constructor(private defaultTTL: number = 60000) {}

  shouldCache(): boolean {
    return true;
  }

  getTTL(): number {
    return this.defaultTTL;
  }

  shouldEvict(entry: CacheEntry<any>): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }
}

/**
 * Size-based cache strategy
 */
export class SizeBasedStrategy implements CacheStrategy {
  private maxSize: number;
  private currentSize = 0;

  constructor(maxSize: number = 10 * 1024 * 1024) {
    // 10MB default
    this.maxSize = maxSize;
  }

  shouldCache(key: string, data: any): boolean {
    const size = this.estimateSize(data);
    return size < this.maxSize;
  }

  getTTL(): number {
    return 60000; // Default 1 minute
  }

  shouldEvict(entry: CacheEntry<any>): boolean {
    // Evict if cache is full
    return this.currentSize > this.maxSize;
  }

  private estimateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Approximate size in bytes
  }

  updateSize(delta: number): void {
    this.currentSize += delta;
  }
}

/**
 * LRU (Least Recently Used) cache strategy
 */
export class LRUStrategy implements CacheStrategy {
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  shouldCache(): boolean {
    return true;
  }

  getTTL(): number {
    return 60000; // Default 1 minute
  }

  shouldEvict(entry: CacheEntry<any>, key?: string): boolean {
    if (!key) return false;
    
    // Evict if we're over the max size
    if (this.accessOrder.size > this.maxSize) {
      return key === this.getLRUKey();
    }
    
    return false;
  }

  recordAccess(key: string): void {
    this.accessCounter++;
    this.accessOrder.set(key, this.accessCounter);
  }

  private getLRUKey(): string {
    let lruKey = '';
    let lruTime = Infinity;

    for (const [key, time] of this.accessOrder.entries()) {
      if (time < lruTime) {
        lruTime = time;
        lruKey = key;
      }
    }

    return lruKey;
  }

  removeKey(key: string): void {
    this.accessOrder.delete(key);
  }
}

/**
 * Stale-while-revalidate cache strategy
 */
export class StaleWhileRevalidateStrategy implements CacheStrategy {
  constructor(
    private staleTTL: number = 60000,
    private freshTTL: number = 10000
  ) {}

  shouldCache(): boolean {
    return true;
  }

  getTTL(): number {
    return this.staleTTL;
  }

  shouldEvict(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.staleTTL;
  }

  isStale(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.freshTTL;
  }
}

/**
 * Cache strategy registry
 */
class CacheStrategyRegistry {
  private strategies = new Map<string, CacheStrategy>();

  register(key: string, strategy: CacheStrategy): void {
    this.strategies.set(key, strategy);
  }

  get(key: string): CacheStrategy | undefined {
    return this.strategies.get(key);
  }

  remove(key: string): void {
    this.strategies.delete(key);
  }
}

// Create singleton registry
const registry = new CacheStrategyRegistry();

/**
 * Register a cache strategy
 */
export function registerCacheStrategy(
  key: string,
  strategy: CacheStrategy
): void {
  registry.register(key, strategy);
}

/**
 * Get a cache strategy
 */
export function getCacheStrategy(key: string): CacheStrategy | undefined {
  return registry.get(key);
}

/**
 * Remove a cache strategy
 */
export function removeCacheStrategy(key: string): void {
  registry.remove(key);
}

/**
 * Default cache strategies
 */
export const DefaultStrategies = {
  timeBased: new TimeBasedStrategy(60000),
  shortLived: new TimeBasedStrategy(10000),
  longLived: new TimeBasedStrategy(3600000),
  sizeBased: new SizeBasedStrategy(10 * 1024 * 1024),
  lru: new LRUStrategy(1000),
  staleWhileRevalidate: new StaleWhileRevalidateStrategy(60000, 10000),
};

// Register default strategies
Object.entries(DefaultStrategies).forEach(([key, strategy]) => {
  registerCacheStrategy(key, strategy);
});
