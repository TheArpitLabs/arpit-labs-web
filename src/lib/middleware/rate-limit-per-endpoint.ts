/**
 * API Rate Limiting Per Endpoint
 * Implements rate limiting with different limits per endpoint
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface EndpointConfig {
  [pattern: string]: RateLimitConfig;
}

/**
 * Default rate limit configurations per endpoint pattern
 */
const DEFAULT_ENDPOINT_CONFIGS: EndpointConfig = {
  // Public endpoints - more lenient
  '/api/public': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  
  // Authentication endpoints - stricter
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  },
  '/api/auth/forgot-password': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  },
  
  // API endpoints - moderate
  '/api/projects': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  '/api/domains': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  
  // Write operations - stricter
  '/api/projects/write': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  
  // Admin endpoints - very strict
  '/api/admin': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
  },
};

/**
 * Rate limit storage
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  
  /**
   * Gets the current rate limit status for a key
   */
  get(key: string): { count: number; resetTime: number } | undefined {
    return this.store.get(key);
  }
  
  /**
   * Increments the counter for a key
   */
  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.store.get(key);
    
    if (!existing || now > existing.resetTime) {
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }
    
    existing.count++;
    this.store.set(key, existing);
    return existing;
  }
  
  /**
   * Resets the counter for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }
  
  /**
   * Clears all expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new RateLimitStore();

/**
 * Finds the matching endpoint configuration
 */
function findEndpointConfig(pathname: string): RateLimitConfig | null {
  for (const [pattern, config] of Object.entries(DEFAULT_ENDPOINT_CONFIGS)) {
    if (pathname.startsWith(pattern)) {
      return config;
    }
  }
  
  // Default config for unmatched endpoints
  return {
    windowMs: 60 * 1000,
    maxRequests: 60,
  };
}

/**
 * Generates a rate limit key
 */
function generateRateLimitKey(
  identifier: string,
  pathname: string
): string {
  return `ratelimit:${identifier}:${pathname}`;
}

/**
 * Rate limit middleware
 */
export function rateLimitPerEndpoint(options?: {
  configs?: EndpointConfig;
  identifierGenerator?: (request: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) {
  const configs = options?.configs || DEFAULT_ENDPOINT_CONFIGS;
  const skipSuccessful = options?.skipSuccessfulRequests ?? false;
  const skipFailed = options?.skipFailedRequests ?? false;
  
  return async (request: Request): Promise<Response | null> => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    const config = findEndpointConfig(pathname);
    if (!config) {
      return null; // No rate limit for this endpoint
    }
    
    // Generate identifier (IP address, user ID, etc.)
    const identifier = options?.identifierGenerator 
      ? options.identifierGenerator(request)
      : getClientIdentifier(request);
    
    const key = generateRateLimitKey(identifier, pathname);
    const status = rateLimitStore.increment(key, config.windowMs);
    
    // Check if limit exceeded
    if (status.count > config.maxRequests) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((status.resetTime - Date.now()) / 1000)} seconds.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(status.resetTime).toISOString(),
            'Retry-After': Math.ceil((status.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }
    
    // Add rate limit headers to response
    const response = await fetch(request);
    const newResponse = new Response(response.body, response);
    
    newResponse.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    newResponse.headers.set('X-RateLimit-Remaining', (config.maxRequests - status.count).toString());
    newResponse.headers.set('X-RateLimit-Reset', new Date(status.resetTime).toISOString());
    
    // Skip counting based on response status
    if (skipSuccessful && newResponse.ok) {
      rateLimitStore.reset(key);
    }
    
    if (skipFailed && !newResponse.ok) {
      rateLimitStore.reset(key);
    }
    
    return newResponse;
  };
}

/**
 * Gets client identifier from request
 */
function getClientIdentifier(request: Request): string {
  // Try to get from headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded || realIp || cfConnectingIp || 'unknown';
  
  // If multiple IPs, take the first one
  const firstIp = ip.split(',')[0].trim();
  
  return firstIp;
}

/**
 * Resets rate limit for a specific endpoint
 */
export function resetRateLimit(identifier: string, pathname: string): void {
  const key = generateRateLimitKey(identifier, pathname);
  rateLimitStore.reset(key);
}

/**
 * Gets current rate limit status
 */
export function getRateLimitStatus(
  identifier: string,
  pathname: string
): { count: number; resetTime: number } | undefined {
  const key = generateRateLimitKey(identifier, pathname);
  return rateLimitStore.get(key);
}

/**
 * Cleanup expired rate limit entries
 */
export function cleanupRateLimits(): void {
  rateLimitStore.cleanup();
}
