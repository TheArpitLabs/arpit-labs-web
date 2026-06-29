/**
 * API Rate Limiting by IP
 * Implements rate limiting based on IP address
 */

export interface IPRateLimitConfig {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  whitelist?: string[];
  blacklist?: string[];
}

export interface IPRateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
}

class IPRateLimiter {
  private ipLimits = new Map<string, IPRateLimitConfig>();
  private ipRequests = new Map<string, Map<string, number[]>>();
  private defaultConfig: Required<IPRateLimitConfig>;

  constructor(defaultConfig: IPRateLimitConfig = {}) {
    this.defaultConfig = {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      whitelist: [],
      blacklist: [],
      ...defaultConfig,
    };
  }

  /**
   * Gets client IP from request
   */
  private getIP(request: Request): string {
    // Check various headers for IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    return 'unknown';
  }

  /**
   * Sets rate limit config for an IP
   */
  setIPConfig(ip: string, config: IPRateLimitConfig): void {
    this.ipLimits.set(ip, config);
  }

  /**
   * Gets config for an IP
   */
  private getIPConfig(ip: string): Required<IPRateLimitConfig> {
    return (this.ipLimits.get(ip) || this.defaultConfig) as Required<IPRateLimitConfig>;
  }

  /**
   * Checks if IP is whitelisted
   */
  private isWhitelisted(ip: string): boolean {
    return this.defaultConfig.whitelist.includes(ip) ||
           this.ipLimits.get(ip)?.whitelist?.includes(ip) ||
           false;
  }

  /**
   * Checks if IP is blacklisted
   */
  private isBlacklisted(ip: string): boolean {
    return this.defaultConfig.blacklist.includes(ip) ||
           this.ipLimits.get(ip)?.blacklist?.includes(ip) ||
           false;
  }

  /**
   * Checks if a request is allowed
   */
  async checkLimit(request: Request): Promise<IPRateLimitStatus> {
    const ip = this.getIP(request);

    // Check blacklist
    if (this.isBlacklisted(ip)) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 86400000),
        limit: 0,
      };
    }

    // Check whitelist
    if (this.isWhitelisted(ip)) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: new Date(Date.now() + 60000),
        limit: Infinity,
      };
    }

    const config = this.getIPConfig(ip);
    const now = Date.now();

    // Initialize IP request tracking
    if (!this.ipRequests.has(ip)) {
      this.ipRequests.set(ip, new Map());
    }

    const ipWindows = this.ipRequests.get(ip)!;

    // Clean up old requests
    this.cleanupOldRequests(ipWindows, now);

    // Check per-minute limit
    const minuteKey = Math.floor(now / 60000).toString();
    const minuteRequests = ipWindows.get(minuteKey) || [];
    const minuteLimit = config.requestsPerMinute;

    if (minuteRequests.length >= minuteLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date((parseInt(minuteKey) + 1) * 60000),
        limit: minuteLimit,
      };
    }

    // Check per-hour limit
    const hourKey = Math.floor(now / 3600000).toString();
    const hourRequests = this.getRequestsInWindow(ipWindows, hourKey, 60);
    const hourLimit = config.requestsPerHour;

    if (hourRequests >= hourLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date((parseInt(hourKey) + 1) * 3600000),
        limit: hourLimit,
      };
    }

    // Check per-day limit
    const dayKey = Math.floor(now / 86400000).toString();
    const dayRequests = this.getRequestsInWindow(ipWindows, dayKey, 1440);
    const dayLimit = config.requestsPerDay;

    if (dayRequests >= dayLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date((parseInt(dayKey) + 1) * 86400000),
        limit: dayLimit,
      };
    }

    // Request is allowed, record it
    minuteRequests.push(now);
    ipWindows.set(minuteKey, minuteRequests);

    // Calculate remaining requests
    const remaining = Math.min(
      minuteLimit - minuteRequests.length,
      hourLimit - hourRequests,
      dayLimit - dayRequests
    );

    return {
      allowed: true,
      remaining,
      resetTime: new Date((parseInt(minuteKey) + 1) * 60000),
      limit: minuteLimit,
    };
  }

  /**
   * Gets requests in a time window
   */
  private getRequestsInWindow(
    windows: Map<string, number[]>,
    currentKey: string,
    windowSize: number
  ): number {
    const currentNum = parseInt(currentKey);
    let count = 0;

    for (let i = 0; i < windowSize; i++) {
      const key = (currentNum - i).toString();
      const requests = windows.get(key) || [];
      count += requests.length;
    }

    return count;
  }

  /**
   * Cleans up old request records
   */
  private cleanupOldRequests(windows: Map<string, number[]>, now: number): void {
    const oneHourAgo = now - 3600000;

    for (const [key, timestamps] of windows.entries()) {
      const filtered = timestamps.filter(t => t > oneHourAgo);
      
      if (filtered.length === 0) {
        windows.delete(key);
      } else {
        windows.set(key, filtered);
      }
    }
  }

  /**
   * Resets rate limit for an IP
   */
  resetIP(ip: string): void {
    this.ipRequests.delete(ip);
  }

  /**
   * Gets rate limit status for an IP
   */
  getStatus(ip: string): IPRateLimitStatus {
    const config = this.getIPConfig(ip);
    const now = Date.now();

    if (!this.ipRequests.has(ip)) {
      return {
        allowed: true,
        remaining: config.requestsPerMinute,
        resetTime: new Date(Math.ceil(now / 60000) * 60000),
        limit: config.requestsPerMinute,
      };
    }

    const ipWindows = this.ipRequests.get(ip)!;
    const minuteKey = Math.floor(now / 60000).toString();
    const minuteRequests = ipWindows.get(minuteKey) || [];

    return {
      allowed: minuteRequests.length < config.requestsPerMinute,
      remaining: Math.max(0, config.requestsPerMinute - minuteRequests.length),
      resetTime: new Date((parseInt(minuteKey) + 1) * 60000),
      limit: config.requestsPerMinute,
    };
  }

  /**
   * Gets statistics for an IP
   */
  getIPStats(ip: string): {
    totalRequests: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  } {
    if (!this.ipRequests.has(ip)) {
      return {
        totalRequests: 0,
        requestsPerMinute: 0,
        requestsPerHour: 0,
        requestsPerDay: 0,
      };
    }

    const ipWindows = this.ipRequests.get(ip)!;
    let totalRequests = 0;

    for (const timestamps of ipWindows.values()) {
      totalRequests += timestamps.length;
    }

    const now = Date.now();
    const minuteKey = Math.floor(now / 60000).toString();
    const hourKey = Math.floor(now / 3600000).toString();
    const dayKey = Math.floor(now / 86400000).toString();

    return {
      totalRequests,
      requestsPerMinute: this.getRequestsInWindow(ipWindows, minuteKey, 1),
      requestsPerHour: this.getRequestsInWindow(ipWindows, hourKey, 60),
      requestsPerDay: this.getRequestsInWindow(ipWindows, dayKey, 1440),
    };
  }

  /**
   * Clears all IP data
   */
  clearAll(): void {
    this.ipRequests.clear();
  }
}

// Create singleton instance
const ipRateLimiter = new IPRateLimiter();

/**
 * Sets IP rate limit config
 */
export function setIPRateLimitConfig(ip: string, config: IPRateLimitConfig): void {
  ipRateLimiter.setIPConfig(ip, config);
}

/**
 * Checks if request is allowed
 */
export async function checkIPRateLimit(request: Request): Promise<IPRateLimitStatus> {
  return ipRateLimiter.checkLimit(request);
}

/**
 * Resets IP rate limit
 */
export function resetIPRateLimit(ip: string): void {
  ipRateLimiter.resetIP(ip);
}

/**
 * Gets rate limit status
 */
export function getIPRateLimitStatus(ip: string): IPRateLimitStatus {
  return ipRateLimiter.getStatus(ip);
}

/**
 * Gets IP statistics
 */
export function getIPRateLimitStats(ip: string) {
  return ipRateLimiter.getIPStats(ip);
}

/**
 * Clears all IP rate limits
 */
export function clearAllIPRateLimits(): void {
  ipRateLimiter.clearAll();
}

/**
 * Middleware for IP rate limiting
 */
export function ipRateLimitMiddleware(config?: IPRateLimitConfig) {
  const limiter = config ? new IPRateLimiter(config) : ipRateLimiter;

  return async (request: Request): Promise<Response | null> => {
    const status = await limiter.checkLimit(request);

    if (!status.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Try again after ${status.resetTime.toLocaleString()}`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': status.limit.toString(),
            'X-RateLimit-Remaining': status.remaining.toString(),
            'X-RateLimit-Reset': status.resetTime.toISOString(),
            'Retry-After': Math.ceil((status.resetTime.getTime() - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Add rate limit headers
    const response = await fetch(request);
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-RateLimit-Limit', status.limit.toString());
    newResponse.headers.set('X-RateLimit-Remaining', status.remaining.toString());
    newResponse.headers.set('X-RateLimit-Reset', status.resetTime.toISOString());

    return newResponse;
  };
}

export default ipRateLimiter;
