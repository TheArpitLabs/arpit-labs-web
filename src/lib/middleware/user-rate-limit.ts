/**
 * API Rate Limiting Per User
 * Implements rate limiting on a per-user basis
 */

export interface UserRateLimitConfig {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstAllowance?: number;
}

export interface UserRateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
}

class UserRateLimiter {
  private userLimits = new Map<string, UserRateLimitConfig>();
  private userRequests = new Map<string, Map<string, number[]>>(); // userId -> window -> timestamps
  private defaultConfig: Required<UserRateLimitConfig>;

  constructor(defaultConfig: UserRateLimitConfig = {}) {
    this.defaultConfig = {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstAllowance: 10,
      ...defaultConfig,
    };
  }

  /**
   * Sets rate limit config for a user
   */
  setUserConfig(userId: string, config: UserRateLimitConfig): void {
    this.userLimits.set(userId, config);
  }

  /**
   * Gets config for a user
   */
  private getUserConfig(userId: string): Required<UserRateLimitConfig> {
    return (this.userLimits.get(userId) || this.defaultConfig) as Required<UserRateLimitConfig>;
  }

  /**
   * Checks if a request is allowed
   */
  async checkLimit(userId: string): Promise<UserRateLimitStatus> {
    const config = this.getUserConfig(userId);
    const now = Date.now();

    // Initialize user request tracking
    if (!this.userRequests.has(userId)) {
      this.userRequests.set(userId, new Map());
    }

    const userWindows = this.userRequests.get(userId)!;

    // Clean up old requests
    this.cleanupOldRequests(userWindows, now);

    // Check per-minute limit
    const minuteKey = Math.floor(now / 60000).toString();
    const minuteRequests = userWindows.get(minuteKey) || [];
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
    const hourRequests = this.getRequestsInWindow(userWindows, hourKey, 60);
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
    const dayRequests = this.getRequestsInWindow(userWindows, dayKey, 1440);
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
    userWindows.set(minuteKey, minuteRequests);

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
      // Remove timestamps older than 1 hour
      const filtered = timestamps.filter(t => t > oneHourAgo);
      
      if (filtered.length === 0) {
        windows.delete(key);
      } else {
        windows.set(key, filtered);
      }
    }
  }

  /**
   * Resets rate limit for a user
   */
  resetUser(userId: string): void {
    this.userRequests.delete(userId);
  }

  /**
   * Gets rate limit status for a user
   */
  getStatus(userId: string): UserRateLimitStatus {
    const config = this.getUserConfig(userId);
    const now = Date.now();

    if (!this.userRequests.has(userId)) {
      return {
        allowed: true,
        remaining: config.requestsPerMinute,
        resetTime: new Date(Math.ceil(now / 60000) * 60000),
        limit: config.requestsPerMinute,
      };
    }

    const userWindows = this.userRequests.get(userId)!;
    const minuteKey = Math.floor(now / 60000).toString();
    const minuteRequests = userWindows.get(minuteKey) || [];

    return {
      allowed: minuteRequests.length < config.requestsPerMinute,
      remaining: Math.max(0, config.requestsPerMinute - minuteRequests.length),
      resetTime: new Date((parseInt(minuteKey) + 1) * 60000),
      limit: config.requestsPerMinute,
    };
  }

  /**
   * Gets statistics for a user
   */
  getUserStats(userId: string): {
    totalRequests: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  } {
    if (!this.userRequests.has(userId)) {
      return {
        totalRequests: 0,
        requestsPerMinute: 0,
        requestsPerHour: 0,
        requestsPerDay: 0,
      };
    }

    const userWindows = this.userRequests.get(userId)!;
    let totalRequests = 0;

    for (const timestamps of userWindows.values()) {
      totalRequests += timestamps.length;
    }

    const now = Date.now();
    const minuteKey = Math.floor(now / 60000).toString();
    const hourKey = Math.floor(now / 3600000).toString();
    const dayKey = Math.floor(now / 86400000).toString();

    return {
      totalRequests,
      requestsPerMinute: this.getRequestsInWindow(userWindows, minuteKey, 1),
      requestsPerHour: this.getRequestsInWindow(userWindows, hourKey, 60),
      requestsPerDay: this.getRequestsInWindow(userWindows, dayKey, 1440),
    };
  }

  /**
   * Clears all user data
   */
  clearAll(): void {
    this.userRequests.clear();
  }
}

// Create singleton instance
const userRateLimiter = new UserRateLimiter();

/**
 * Sets user rate limit config
 */
export function setUserRateLimitConfig(userId: string, config: UserRateLimitConfig): void {
  userRateLimiter.setUserConfig(userId, config);
}

/**
 * Checks if request is allowed
 */
export async function checkUserRateLimit(userId: string): Promise<UserRateLimitStatus> {
  return userRateLimiter.checkLimit(userId);
}

/**
 * Resets user rate limit
 */
export function resetUserRateLimit(userId: string): void {
  userRateLimiter.resetUser(userId);
}

/**
 * Gets rate limit status
 */
export function getUserRateLimitStatus(userId: string): UserRateLimitStatus {
  return userRateLimiter.getStatus(userId);
}

/**
 * Gets user statistics
 */
export function getUserRateLimitStats(userId: string) {
  return userRateLimiter.getUserStats(userId);
}

/**
 * Clears all user rate limits
 */
export function clearAllUserRateLimits(): void {
  userRateLimiter.clearAll();
}

/**
 * Middleware for user rate limiting
 */
export function userRateLimitMiddleware(getUserId: (request: Request) => string | null) {
  return async (request: Request): Promise<Response | null> => {
    const userId = getUserId(request);

    if (!userId) {
      return null; // No user ID, skip rate limiting
    }

    const status = await userRateLimiter.checkLimit(userId);

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

export default userRateLimiter;
