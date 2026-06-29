import { RATE_LIMIT_CONFIG } from "@/constants/constants";
import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

// In-memory store for rate limits (in production, use Redis or similar)
const requests = new Map<string, RateLimitEntry>();

// Endpoint-specific rate limit configurations
const endpointConfigs = new Map<string, RateLimitConfig>();

// Initialize default endpoint configurations
function initializeEndpointConfigs() {
  // Auth endpoints - stricter limits
  endpointConfigs.set('/api/auth/login', { limit: RATE_LIMIT_CONFIG.AUTH_LIMIT, windowMs: RATE_LIMIT_CONFIG.DEFAULT_WINDOW });
  endpointConfigs.set('/api/auth/register', { limit: RATE_LIMIT_CONFIG.AUTH_LIMIT, windowMs: RATE_LIMIT_CONFIG.DEFAULT_WINDOW });
  endpointConfigs.set('/api/auth/logout', { limit: RATE_LIMIT_CONFIG.AUTH_LIMIT, windowMs: RATE_LIMIT_CONFIG.DEFAULT_WINDOW });
  
  // Admin endpoints
  endpointConfigs.set('/api/admin', { limit: RATE_LIMIT_CONFIG.ADMIN_LIMIT, windowMs: RATE_LIMIT_CONFIG.DEFAULT_WINDOW });
  
  // Learning API
  endpointConfigs.set('/api/learning', { limit: RATE_LIMIT_CONFIG.DEFAULT_LIMIT, windowMs: RATE_LIMIT_CONFIG.DEFAULT_WINDOW });
  
  // General API endpoints
  endpointConfigs.set('/api', { limit: RATE_LIMIT_CONFIG.DEFAULT_LIMIT, windowMs: RATE_LIMIT_CONFIG.DEFAULT_WINDOW });
}

initializeEndpointConfigs();

/**
 * Get rate limit configuration for a specific endpoint
 */
function getEndpointConfig(endpoint: string): RateLimitConfig {
  // Check for exact match first
  if (endpointConfigs.has(endpoint)) {
    return endpointConfigs.get(endpoint)!;
  }
  
  // Check for prefix match
  for (const [key, config] of endpointConfigs.entries()) {
    if (endpoint.startsWith(key)) {
      return config;
    }
  }
  
  // Default configuration
  return { limit: RATE_LIMIT_CONFIG.DEFAULT_LIMIT, windowMs: RATE_LIMIT_CONFIG.DEFAULT_WINDOW };
}

/**
 * Check if a request is allowed based on rate limits
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  customConfig?: Partial<RateLimitConfig>
): { allowed: boolean; remaining: number; resetAt: number; limit: number } {
  const config = customConfig 
    ? { ...getEndpointConfig(endpoint), ...customConfig }
    : getEndpointConfig(endpoint);
  
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();
  const entry = requests.get(key);
  
  // Reset if window has expired
  if (!entry || entry.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + config.windowMs });
    return { 
      allowed: true, 
      remaining: config.limit - 1, 
      resetAt: now + config.windowMs,
      limit: config.limit
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.limit) {
    logger.warn('Rate limit exceeded', { 
      identifier, 
      endpoint, 
      count: entry.count,
      limit: config.limit 
    });
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt: entry.resetAt,
      limit: config.limit
    };
  }
  
  // Increment counter
  entry.count += 1;
  requests.set(key, entry);
  
  return { 
    allowed: true, 
    remaining: config.limit - entry.count, 
    resetAt: entry.resetAt,
    limit: config.limit
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: { allowed: boolean; remaining: number; resetAt: number; limit: number }) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
    ...(result.allowed ? {} : { 'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString() }),
  };
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupExpiredEntries() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of requests.entries()) {
    if (entry.resetAt <= now) {
      requests.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
  }
  
  return cleaned;
}

/**
 * Add custom endpoint configuration
 */
export function addEndpointConfig(endpoint: string, config: RateLimitConfig) {
  endpointConfigs.set(endpoint, config);
}

/**
 * Remove endpoint configuration (reverts to default)
 */
export function removeEndpointConfig(endpoint: string) {
  endpointConfigs.delete(endpoint);
}

/**
 * Get current rate limit status for an identifier
 */
export function getRateLimitStatus(identifier: string, endpoint: string) {
  const key = `${identifier}:${endpoint}`;
  const entry = requests.get(key);
  const config = getEndpointConfig(endpoint);
  
  if (!entry) {
    return {
      count: 0,
      remaining: config.limit,
      resetAt: Date.now() + config.windowMs,
      limit: config.limit,
    };
  }
  
  return {
    count: entry.count,
    remaining: Math.max(0, config.limit - entry.count),
    resetAt: entry.resetAt,
    limit: config.limit,
  };
}

/**
 * Reset rate limits for a specific identifier (for testing/admin)
 */
export function resetRateLimit(identifier: string, endpoint?: string) {
  if (endpoint) {
    const key = `${identifier}:${endpoint}`;
    requests.delete(key);
  } else {
    // Reset all for this identifier
    for (const key of requests.keys()) {
      if (key.startsWith(`${identifier}:`)) {
        requests.delete(key);
      }
    }
  }
}

/**
 * Reset all rate limits (for testing)
 */
export function resetAllRateLimits() {
  requests.clear();
}

/**
 * Get statistics about current rate limits
 */
export function getRateLimitStats() {
  const stats = {
    totalEntries: requests.size,
    endpoints: {} as Record<string, number>,
  };
  
  for (const key of requests.keys()) {
    const endpoint = key.split(':')[1] || 'unknown';
    stats.endpoints[endpoint] = (stats.endpoints[endpoint] || 0) + 1;
  }
  
  return stats;
}
