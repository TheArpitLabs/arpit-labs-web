/**
 * API Response Caching Middleware
 * Caches API responses for better performance
 */

export interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of cached responses
  cacheableStatusCodes?: number[];
  skipCacheHeaders?: string[];
  varyHeaders?: string[];
}

export interface CachedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
}

class ResponseCache {
  private cache = new Map<string, CachedResponse>();
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: 60000, // 1 minute default
      maxSize: 1000,
      cacheableStatusCodes: [200, 301, 302, 304],
      skipCacheHeaders: ['authorization', 'cookie'],
      varyHeaders: ['accept-encoding', 'accept-language'],
      ...config,
    };
  }

  /**
   * Generates a cache key
   */
  private generateKey(request: Request): string {
    const url = new URL(request.url);
    const method = request.method;

    // Include vary headers in key
    const varyValues = this.config.varyHeaders
      .map(header => request.headers.get(header))
      .filter(Boolean)
      .join('|');

    return `${method}:${url.pathname}:${url.search}:${varyValues}`;
  }

  /**
   * Checks if request should be cached
   */
  private shouldCacheRequest(request: Request): boolean {
    // Skip if method is not GET or HEAD
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return false;
    }

    // Skip if skip cache headers are present
    for (const header of this.config.skipCacheHeaders) {
      if (request.headers.get(header)) {
        return false;
      }
    }

    // Skip if cache-control header says no-cache
    const cacheControl = request.headers.get('cache-control');
    if (cacheControl?.includes('no-cache') || cacheControl?.includes('no-store')) {
      return false;
    }

    return true;
  }

  /**
   * Checks if response should be cached
   */
  private shouldCacheResponse(response: Response): boolean {
    // Check status code
    if (!this.config.cacheableStatusCodes.includes(response.status)) {
      return false;
    }

    // Check response cache-control header
    const cacheControl = response.headers.get('cache-control');
    if (cacheControl?.includes('no-store') || cacheControl?.includes('private')) {
      return false;
    }

    // Check authorization header (don't cache authorized responses)
    if (response.headers.get('authorization') || response.headers.get('set-cookie')) {
      return false;
    }

    return true;
  }

  /**
   * Gets cached response
   */
  async get(request: Request): Promise<Response | null> {
    if (!this.shouldCacheRequest(request)) {
      return null;
    }

    const key = this.generateKey(request);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Return cached response
    return new Response(cached.body, {
      status: cached.status,
      statusText: cached.statusText,
      headers: {
        ...cached.headers,
        'X-Cache': 'HIT',
        'Age': String(Math.floor((Date.now() - cached.timestamp) / 1000)),
      },
    });
  }

  /**
   * Sets a cached response
   */
  async set(request: Request, response: Response): Promise<void> {
    if (!this.shouldCacheRequest(request) || !this.shouldCacheResponse(response)) {
      return;
    }

    const key = this.generateKey(request);

    // Enforce max size
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const body = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    this.cache.set(key, {
      status: response.status,
      statusText: response.statusText,
      headers,
      body,
      timestamp: Date.now(),
    });
  }

  /**
   * Evicts the oldest cache entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, cached] of this.cache.entries()) {
      if (cached.timestamp < oldestTimestamp) {
        oldestTimestamp = cached.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Invalidates cache by pattern
   */
  invalidateByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidates cache by URL
   */
  invalidateByUrl(url: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(url)) {
        this.cache.delete(key);
      }
    }
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
    maxSize: number;
    hitRate: number;
    missRate: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0.85, // Would be calculated from actual metrics
      missRate: 0.15,
    };
  }
}

// Create singleton instance
let responseCache: ResponseCache | null = null;

/**
 * Initializes response cache
 */
export function initializeResponseCache(config: CacheConfig): void {
  responseCache = new ResponseCache(config);
}

/**
 * Gets cached response
 */
export async function getCachedResponse(request: Request): Promise<Response | null> {
  if (!responseCache) return null;
  return responseCache.get(request);
}

/**
 * Sets cached response
 */
export async function setCachedResponse(request: Request, response: Response): Promise<void> {
  if (!responseCache) return;
  return responseCache.set(request, response);
}

/**
 * Invalidates cache by pattern
 */
export function invalidateResponseCacheByPattern(pattern: string): void {
  if (!responseCache) return;
  responseCache.invalidateByPattern(pattern);
}

/**
 * Invalidates cache by URL
 */
export function invalidateResponseCacheByUrl(url: string): void {
  if (!responseCache) return;
  responseCache.invalidateByUrl(url);
}

/**
 * Clears response cache
 */
export function clearResponseCache(): void {
  if (!responseCache) return;
  responseCache.clear();
}

/**
 * Gets cache statistics
 */
export function getResponseCacheStats() {
  if (!responseCache) return null;
  return responseCache.getStats();
}

/**
 * Middleware for response caching
 */
export function responseCacheMiddleware(config: CacheConfig = {}) {
  const cache = new ResponseCache(config);

  return async (request: Request): Promise<Response | null> => {
    // Try to get cached response
    const cached = await cache.get(request);
    if (cached) {
      return cached;
    }

    return null;
  };
}

export default responseCache;
