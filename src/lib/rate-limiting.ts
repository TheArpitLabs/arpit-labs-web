/**
 * Rate limiting utilities to prevent API abuse
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupExpiredEntries();
  
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired one
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }
  
  // Increment count
  entry.count++;
  
  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get rate limit headers
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number,
  limit: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
    'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
  };
}

/**
 * Rate limit by IP address
 */
export function rateLimitByIp(
  ip: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute default
) {
  return checkRateLimit(ip, limit, windowMs);
}

/**
 * Rate limit by user ID
 */
export function rateLimitByUser(
  userId: string,
  limit: number = 200,
  windowMs: number = 60000 // 1 minute default
) {
  return checkRateLimit(userId, limit, windowMs);
}

/**
 * Rate limit by API key
 */
export function rateLimitByApiKey(
  apiKey: string,
  limit: number = 1000,
  windowMs: number = 3600000 // 1 hour default
) {
  return checkRateLimit(apiKey, limit, windowMs);
}

/**
 * Rate limit by endpoint
 */
export function rateLimitByEndpoint(
  endpoint: string,
  limit: number = 50,
  windowMs: number = 60000 // 1 minute default
) {
  return checkRateLimit(endpoint, limit, windowMs);
}

/**
 * Combined rate limiting (IP + User + Endpoint)
 */
export function combinedRateLimit(
  ip: string,
  userId?: string,
  endpoint?: string,
  limits: {
    ip?: number;
    user?: number;
    endpoint?: number;
  } = {},
  windowMs: number = 60000
) {
  const ipCheck = rateLimitByIp(ip, limits.ip || 100, windowMs);
  
  if (!ipCheck.allowed) {
    return ipCheck;
  }
  
  if (userId) {
    const userCheck = rateLimitByUser(userId, limits.user || 200, windowMs);
    if (!userCheck.allowed) {
      return userCheck;
    }
  }
  
  if (endpoint) {
    const endpointCheck = rateLimitByEndpoint(endpoint, limits.endpoint || 50, windowMs);
    if (!endpointCheck.allowed) {
      return endpointCheck;
    }
  }
  
  return ipCheck;
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  // Try various headers for IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a hash of the request if no IP found
  return 'unknown';
}
