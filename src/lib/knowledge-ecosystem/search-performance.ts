/**
 * Search Performance Optimization Module
 * Implements caching, pagination, and query optimization for search
 */

interface CacheEntry {
  results: any[];
  timestamp: number;
  ttl: number;
}

class SearchCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, results: any[], ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      results,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.results;
  }

  clear(): void {
    this.cache.clear();
  }

  clearPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const searchCache = new SearchCache();

/**
 * Generate cache key from search options
 */
export function generateCacheKey(query: string, mode: string, filters: any): string {
  const filtersStr = JSON.stringify(filters);
  return `${mode}:${query}:${filtersStr}`;
}

/**
 * Get cached search results
 */
export function getCachedSearch(key: string): any[] | null {
  return searchCache.get(key);
}

/**
 * Cache search results
 */
export function cacheSearch(key: string, results: any[], ttl?: number): void {
  searchCache.set(key, results, ttl);
}

/**
 * Clear search cache
 */
export function clearSearchCache(pattern?: string): void {
  if (pattern) {
    searchCache.clearPattern(pattern);
  } else {
    searchCache.clear();
  }
}

/**
 * Optimize query for search
 */
export function optimizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

/**
 * Calculate optimal page size based on query complexity
 */
export function calculateOptimalPageSize(query: string): number {
  const complexity = query.split(" ").length;
  if (complexity <= 2) return 20;
  if (complexity <= 4) return 15;
  return 10;
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for search operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Performance metrics tracker
 */
class SearchPerformanceTracker {
  private metrics: Map<string, number[]> = new Map();

  record(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
  }

  getAverage(operation: string): number {
    const durations = this.metrics.get(operation);
    if (!durations || durations.length === 0) return 0;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  getP95(operation: string): number {
    const durations = this.metrics.get(operation);
    if (!durations || durations.length === 0) return 0;
    const sorted = [...durations].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }

  getStats(operation: string): { avg: number; p95: number; count: number } {
    return {
      avg: this.getAverage(operation),
      p95: this.getP95(operation),
      count: this.metrics.get(operation)?.length || 0,
    };
  }
}

export const performanceTracker = new SearchPerformanceTracker();
