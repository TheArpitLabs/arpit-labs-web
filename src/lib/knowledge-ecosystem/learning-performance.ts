/**
 * Learning Performance Optimization Module
 * Implements caching, query optimization, and performance tracking for learning operations
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class LearningCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL = 300000; // 5 minutes in milliseconds

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
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

const learningCache = new LearningCache();

/**
 * Generate cache key for learning operations
 */
export function generateLearningCacheKey(operation: string, params: Record<string, any>): string {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `learning:${operation}:${paramString}`;
}

/**
 * Get cached learning result
 */
export function getCachedLearningResult(key: string): any | null {
  return learningCache.get(key);
}

/**
 * Cache learning result
 */
export function cacheLearningResult(key: string, data: any, ttl?: number): void {
  learningCache.set(key, data, ttl);
}

/**
 * Clear learning cache
 */
export function clearLearningCache(pattern?: string): void {
  if (pattern) {
    learningCache.clearPattern(pattern);
  } else {
    learningCache.clear();
  }
}

/**
 * Optimize learning query parameters
 */
export function optimizeLearningQuery(params: Record<string, any>): Record<string, any> {
  const optimized: Record<string, any> = {};

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
  if (optimized.limit && optimized.limit > 50) {
    optimized.limit = 50;
  }

  if (optimized.maxDepth && optimized.maxDepth > 5) {
    optimized.maxDepth = 5;
  }

  return optimized;
}

/**
 * Calculate optimal batch size for learning operations
 */
export function calculateOptimalBatchSize(operation: string): number {
  switch (operation) {
    case "skill_extraction":
      return 20;
    case "path_generation":
      return 10;
    case "recommendation_generation":
      return 5;
    case "progress_tracking":
      return 50;
    default:
      return 15;
  }
}

/**
 * Debounce learning operations
 */
export function debounceLearningOperation<T extends (...args: any[]) => any>(
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
 * Throttle learning operations
 */
export function throttleLearningOperation<T extends (...args: any[]) => any>(
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
 * Performance metrics tracker for learning operations
 */
class LearningPerformanceTracker {
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

export const learningPerformanceTracker = new LearningPerformanceTracker();
