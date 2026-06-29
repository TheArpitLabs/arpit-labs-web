/**
 * API response caching utilities
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Set cache entry
 */
export function setCache(key: string, data: any, ttl: number = 60000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Get cache entry
 */
export function getCache(key: string): any | null {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  const now = Date.now();
  const age = now - entry.timestamp;
  
  if (age > entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Check if cache entry exists and is valid
 */
export function hasCache(key: string): boolean {
  return getCache(key) !== null;
}

/**
 * Delete cache entry
 */
export function deleteCache(key: string): void {
  cache.delete(key);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  
  for (const [key, entry] of cache.entries()) {
    const age = now - entry.timestamp;
    if (age > entry.ttl) {
      cache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
  hitRate: number;
} {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    hitRate: 0, // Would need to track hits/misses
  };
}

/**
 * Cache decorator for API functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = 60000
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    const cached = getCache(key);
    if (cached !== null) {
      return cached;
    }
    
    const result = await fn(...args);
    setCache(key, result, ttl);
    
    return result;
  }) as T;
}

/**
 * Cache with invalidation
 */
export function withCacheInvalidation<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  invalidationKeys: string[],
  ttl: number = 60000
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Invalidate related cache entries
    invalidationKeys.forEach(invalidationKey => {
      deleteCache(invalidationKey);
    });
    
    const result = await fn(...args);
    setCache(key, result, ttl);
    
    return result;
  }) as T;
}

/**
 * Cache with fallback
 */
export function withCacheFallback<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  fallback: any,
  ttl: number = 60000
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    try {
      const cached = getCache(key);
      if (cached !== null) {
        return cached;
      }
      
      const result = await fn(...args);
      setCache(key, result, ttl);
      
      return result;
    } catch (error) {
      // Return cached data if available, even if expired
      const entry = cache.get(key);
      if (entry) {
        return entry.data;
      }
      
      // Return fallback if no cache available
      return fallback;
    }
  }) as T;
}

/**
 * Cache with refresh
 */
export function withCacheRefresh<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  refreshInterval: number = 300000, // 5 minutes
  ttl: number = 60000
): T {
  // Start background refresh
  const startRefresh = (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    setInterval(async () => {
      try {
        const result = await fn(...args);
        setCache(key, result, ttl);
      } catch (error) {
        console.error('Cache refresh failed:', error);
      }
    }, refreshInterval);
  };

  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Start refresh on first call
    startRefresh(...args);
    
    const cached = getCache(key);
    if (cached !== null) {
      return cached;
    }
    
    const result = await fn(...args);
    setCache(key, result, ttl);
    
    return result;
  }) as T;
}

/**
 * Cache with stale-while-revalidate
 */
export function withStaleWhileRevalidate<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = 60000,
  staleTtl: number = 300000 // 5 minutes
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    const entry = cache.get(key);
    
    if (entry) {
      const now = Date.now();
      const age = now - entry.timestamp;
      
      // Return stale data and revalidate in background
      if (age > ttl && age < staleTtl) {
        fn(...args).then(result => {
          setCache(key, result, ttl);
        }).catch(error => {
          console.error('Cache revalidation failed:', error);
        });
        
        return entry.data;
      }
      
      // Return fresh data
      if (age <= ttl) {
        return entry.data;
      }
    }
    
    // No cache or expired, fetch fresh data
    const result = await fn(...args);
    setCache(key, result, ttl);
    
    return result;
  }) as T;
}

/**
 * Cache with conditional caching
 */
export function withConditionalCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  shouldCache: (result: any) => boolean,
  ttl: number = 60000
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    const cached = getCache(key);
    if (cached !== null) {
      return cached;
    }
    
    const result = await fn(...args);
    
    if (shouldCache(result)) {
      setCache(key, result, ttl);
    }
    
    return result;
  }) as T;
}

/**
 * Cache with size limit
 */
const MAX_CACHE_SIZE = 1000;

export function withSizeLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = 60000
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    const cached = getCache(key);
    if (cached !== null) {
      return cached;
    }
    
    // Evict oldest entries if cache is full
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = Array.from(cache.keys())[0];
      cache.delete(oldestKey);
    }
    
    const result = await fn(...args);
    setCache(key, result, ttl);
    
    return result;
  }) as T;
}
