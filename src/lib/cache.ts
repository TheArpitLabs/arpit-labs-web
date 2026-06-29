import { CACHE_CONFIG } from '@/constants/constants';

/**
 * Server-side caching utilities
 * Provides in-memory caching with TTL support for API responses and data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = CACHE_CONFIG.DEFAULT_TTL * 1000) {
    this.defaultTTL = defaultTTL;
    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Set a value in the cache
   */
  set(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ? ttl * 1000 : this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instances
export const globalCache = new Cache<any>();
export const shortTermCache = new Cache<any>(CACHE_CONFIG.SHORT_TTL * 1000);
export const longTermCache = new Cache<any>(CACHE_CONFIG.LONG_TTL * 1000);
export const dynamicCache = new Cache<any>(CACHE_CONFIG.DYNAMIC_TTL * 1000);

/**
 * Cache decorator for async functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyGenerator?: (...args: Parameters<T>) => string;
    ttl?: number;
    cache?: Cache<any>;
  } = {}
): T {
  const {
    keyGenerator = (...args: Parameters<T>) => JSON.stringify(args),
    ttl,
    cache = globalCache,
  } = options;

  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Try to get from cache
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    cache.set(key, result, ttl);
    
    return result;
  }) as T;
}

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${prefix}:${sortedParams}`;
}

/**
 * Cache invalidation helper
 */
export function invalidateCache(pattern: string): void {
  const stats = globalCache.getStats();
  const regex = new RegExp(pattern);
  
  stats.keys.forEach(key => {
    if (regex.test(key)) {
      globalCache.delete(key);
    }
  });
}

/**
 * Cache warming utility
 */
export async function warmCache<T>(
  keys: string[],
  fetcher: (key: string) => Promise<T>,
  cache: Cache<any> = globalCache
): Promise<void> {
  await Promise.all(
    keys.map(async (key) => {
      try {
        const data = await fetcher(key);
        cache.set(key, data);
      } catch (error) {
        console.error(`Failed to warm cache for key: ${key}`, error);
      }
    })
  );
}

/**
 * Response caching middleware for API routes
 */
export function withResponseCache<T>(
  handler: (request: Request) => Promise<T>,
  options: {
    ttl?: number;
    cache?: Cache<any>;
    keyGenerator?: (request: Request) => string;
  } = {}
): (request: Request) => Promise<T> {
  const {
    ttl = CACHE_CONFIG.DEFAULT_TTL,
    cache = globalCache,
    keyGenerator = (request) => `${request.method}:${request.url}`,
  } = options;

  return async (request: Request) => {
    // Skip caching for non-GET requests
    if (request.method !== 'GET') {
      return handler(request);
    }

    const key = keyGenerator(request);
    const cached = cache.get(key);

    if (cached !== null) {
      return cached;
    }

    const result = await handler(request);
    cache.set(key, result, ttl);

    return result;
  };
}
