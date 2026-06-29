/**
 * Request Deduplication
 * Prevents duplicate requests and handles idempotency
 */

export interface DeduplicationConfig {
  ttl?: number; // Time to live for deduplication cache in ms
  maxSize?: number; // Maximum number of cached requests
  keyGenerator?: (request: Request) => string;
}

interface CachedRequest {
  timestamp: number;
  response?: Response;
  promise?: Promise<Response>;
}

/**
 * Request deduplicator
 */
class RequestDeduplicator {
  private cache = new Map<string, CachedRequest>();
  private config: Required<DeduplicationConfig>;

  constructor(config: DeduplicationConfig = {}) {
    this.config = {
      ttl: 60000, // 1 minute default
      maxSize: 1000,
      keyGenerator: this.defaultKeyGenerator.bind(this),
      ...config,
    };
  }

  /**
   * Default key generator
   */
  private defaultKeyGenerator(request: Request): string {
    const url = new URL(request.url);
    const method = request.method;
    const body = request.body ? '[body]' : '';
    return `${method}:${url.pathname}${url.search}:${body}`;
  }

  /**
   * Generates a deduplication key
   */
  private generateKey(request: Request): string {
    return this.config.keyGenerator(request);
  }

  /**
   * Checks if a request is a duplicate
   */
  isDuplicate(request: Request): boolean {
    const key = this.generateKey(request);
    const cached = this.cache.get(key);

    if (!cached) {
      return false;
    }

    // Check if cache entry has expired
    if (Date.now() - cached.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Gets cached response for a duplicate request
   */
  getCachedResponse(request: Request): Response | undefined {
    const key = this.generateKey(request);
    const cached = this.cache.get(key);
    return cached?.response;
  }

  /**
   * Caches a request and its response
   */
  cacheRequest(request: Request, response: Response): void {
    const key = this.generateKey(request);

    // Enforce max size
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      timestamp: Date.now(),
      response: response.clone(),
    });

    // Schedule cleanup
    setTimeout(() => {
      this.cache.delete(key);
    }, this.config.ttl);
  }

  /**
   * Caches a request with a promise (for in-flight requests)
   */
  cacheRequestPromise(
    request: Request,
    promise: Promise<Response>
  ): Promise<Response> {
    const key = this.generateKey(request);

    // Enforce max size
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      timestamp: Date.now(),
      promise,
    });

    // Clean up after promise resolves
    promise.finally(() => {
      setTimeout(() => {
        this.cache.delete(key);
      }, this.config.ttl);
    });

    return promise;
  }

  /**
   * Gets or creates a cached promise
   */
  getOrCreatePromise(
    request: Request,
    factory: () => Promise<Response>
  ): Promise<Response> {
    const key = this.generateKey(request);
    const cached = this.cache.get(key);

    if (cached?.promise) {
      return cached.promise;
    }

    const promise = factory();
    return this.cacheRequestPromise(request, promise);
  }

  /**
   * Evicts the oldest cache entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clears expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      ttl: this.config.ttl,
    };
  }
}

// Create default instance
const defaultDeduplicator = new RequestDeduplicator();

/**
 * Deduplicate a request
 */
export function deduplicateRequest(
  request: Request,
  fetchFn: () => Promise<Response>
): Promise<Response> {
  if (defaultDeduplicator.isDuplicate(request)) {
    const cached = defaultDeduplicator.getCachedResponse(request);
    if (cached) {
      return Promise.resolve(cached);
    }
  }

  return defaultDeduplicator.getOrCreatePromise(request, fetchFn);
}

/**
 * Configure request deduplication
 */
export function configureDeduplication(config: DeduplicationConfig): void {
  Object.assign(defaultDeduplicator, new RequestDeduplicator(config));
}

/**
 * Clear deduplication cache
 */
export function clearDeduplicationCache(): void {
  defaultDeduplicator.clear();
}

/**
 * Cleanup expired entries
 */
export function cleanupDeduplicationCache(): void {
  defaultDeduplicator.cleanup();
}

/**
 * Get deduplication statistics
 */
export function getDeduplicationStats() {
  return defaultDeduplicator.getStats();
}

/**
 * Middleware for request deduplication
 */
export function deduplicationMiddleware(request: Request): Response | null {
  if (defaultDeduplicator.isDuplicate(request)) {
    const cached = defaultDeduplicator.getCachedResponse(request);
    if (cached) {
      return cached;
    }
  }

  return null;
}

/**
 * Idempotency key handler
 */
export class IdempotencyKeyHandler {
  private cache = new Map<string, { response: Response; timestamp: number }>();
  private ttl: number;

  constructor(ttl: number = 86400000) {
    // 24 hours default
    this.ttl = ttl;
  }

  /**
   * Extracts idempotency key from request
   */
  extractKey(request: Request): string | null {
    return request.headers.get('Idempotency-Key');
  }

  /**
   * Checks if request has been processed
   */
  isProcessed(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) {
      return false;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Gets cached response
   */
  getCachedResponse(key: string): Response | undefined {
    return this.cache.get(key)?.response;
  }

  /**
   * Caches response
   */
  cacheResponse(key: string, response: Response): void {
    this.cache.set(key, {
      response: response.clone(),
      timestamp: Date.now(),
    });

    // Cleanup after TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, this.ttl);
  }

  /**
   * Clears cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Create default idempotency handler
const defaultIdempotencyHandler = new IdempotencyKeyHandler();

/**
 * Handle idempotency key
 */
export function handleIdempotencyKey(
  request: Request,
  fetchFn: () => Promise<Response>
): Promise<Response> {
  const key = defaultIdempotencyHandler.extractKey(request);

  if (!key) {
    return fetchFn();
  }

  if (defaultIdempotencyHandler.isProcessed(key)) {
    const cached = defaultIdempotencyHandler.getCachedResponse(key);
    if (cached) {
      return Promise.resolve(cached);
    }
  }

  const promise = fetchFn();
  promise.then((response) => {
    if (response.ok) {
      defaultIdempotencyHandler.cacheResponse(key, response);
    }
  });

  return promise;
}
