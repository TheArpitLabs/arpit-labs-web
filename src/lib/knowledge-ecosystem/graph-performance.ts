/**
 * Graph Performance Optimization Module
 * Implements caching, query optimization, and performance tracking for graph operations
 */

type GraphData = Record<string, unknown> | unknown[];

interface CacheEntry {
  data: GraphData;
  timestamp: number;
  ttl: number;
}

class GraphCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL = 300000; // 5 minutes in milliseconds

  set(key: string, data: GraphData, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): GraphData | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
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

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

const graphCache = new GraphCache();

/**
 * Generate cache key for graph operations
 */
export function generateGraphCacheKey(operation: string, params: Record<string, unknown>): string {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `${operation}:${paramString}`;
}

/**
 * Get cached graph result
 */
export function getCachedGraphResult(key: string): GraphData | null {
  return graphCache.get(key);
}

/**
 * Cache graph result
 */
export function cacheGraphResult(key: string, data: GraphData, ttl?: number): void {
  graphCache.set(key, data, ttl);
}

/**
 * Clear graph cache
 */
export function clearGraphCache(pattern?: string): void {
  if (pattern) {
    graphCache.clearPattern(pattern);
  } else {
    graphCache.clear();
  }
}

/**
 * Optimize graph query parameters
 */
export function optimizeGraphQuery(params: Record<string, unknown>): Record<string, unknown> {
  const optimized: Record<string, unknown> = {};

  // Sanitize string parameters
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === "string") {
      optimized[key] = value.trim().toLowerCase();
    } else if (typeof value === "number") {
      optimized[key] = Math.max(0, value);
    } else {
      optimized[key] = value;
    }
  });

  // Set reasonable limits
  if (typeof optimized.limit === 'number' && optimized.limit > 100) {
    optimized.limit = 100;
  }

  if (typeof optimized.maxDepth === 'number' && optimized.maxDepth > 10) {
    optimized.maxDepth = 10;
  }

  return optimized;
}

/**
 * Calculate optimal batch size for graph operations
 */
export function calculateOptimalBatchSize(operation: string): number {
  switch (operation) {
    case "entity_extraction":
      return 50;
    case "relationship_creation":
      return 100;
    case "graph_traversal":
      return 20;
    case "graph_search":
      return 30;
    default:
      return 25;
  }
}

/**
 * Debounce graph operations
 */
export function debounceGraphOperation<T extends (...args: any[]) => any>(
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
 * Throttle graph operations
 */
export function throttleGraphOperation<T extends (...args: any[]) => any>(
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
 * Performance metrics tracker for graph operations
 */
class GraphPerformanceTracker {
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

  getAllStats(): Record<string, { avg: number; p95: number; count: number }> {
    const stats: Record<string, { avg: number; p95: number; count: number }> = {};
    this.metrics.forEach((_, operation) => {
      stats[operation] = this.getStats(operation);
    });
    return stats;
  }
}

export const graphPerformanceTracker = new GraphPerformanceTracker();
