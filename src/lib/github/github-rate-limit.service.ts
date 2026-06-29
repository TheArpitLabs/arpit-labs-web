/**
 * GitHub Rate Limit Monitoring Service
 * Tracks GitHub API rate limit status and provides protection against limit exhaustion
 */

import { logger } from '@/lib/logger';

export interface RateLimitStatus {
  limit: number;
  used: number;
  remaining: number;
  reset: number; // Unix timestamp
  resetDate: Date;
  percentageUsed: number;
}

export interface RateLimitResponse {
  resources: {
    core: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
    search?: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
  };
}

class GitHubRateLimitService {
  private static instance: GitHubRateLimitService;
  
  // In-memory storage for latest rate limit data
  private coreRateLimit: RateLimitStatus | null = null;
  private searchRateLimit: RateLimitStatus | null = null;
  
  // Warning thresholds
  private readonly WARNING_THRESHOLD = 500;
  private readonly CRITICAL_THRESHOLD = 100;
  
  private constructor() {}
  
  static getInstance(): GitHubRateLimitService {
    if (!GitHubRateLimitService.instance) {
      GitHubRateLimitService.instance = new GitHubRateLimitService();
    }
    return GitHubRateLimitService.instance;
  }
  
  /**
   * Fetch current rate limit status from GitHub API
   */
  async fetchRateLimitStatus(): Promise<void> {
    try {
      const response = await fetch('https://api.github.com/rate_limit', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Arpit-Labs-Discovery',
        },
      });
      
      if (!response.ok) {
        logger.error('Failed to fetch rate limit status:', response.statusText);
        return;
      }
      
      const data: RateLimitResponse = await response.json();
      
      // Update core rate limit
      if (data.resources.core) {
        this.coreRateLimit = this.parseRateLimitData(data.resources.core);
        this.logRateLimitStatus('core', this.coreRateLimit);
      }
      
      // Update search rate limit (if available)
      if (data.resources.search) {
        this.searchRateLimit = this.parseRateLimitData(data.resources.search);
        this.logRateLimitStatus('search', this.searchRateLimit);
      }
    } catch (error) {
      logger.error('Error fetching rate limit status:', error);
    }
  }
  
  /**
   * Parse rate limit data from GitHub API response
   */
  private parseRateLimitData(data: { limit: number; used: number; remaining: number; reset: number }): RateLimitStatus {
    const resetDate = new Date(data.reset * 1000);
    const percentageUsed = (data.used / data.limit) * 100;
    
    return {
      limit: data.limit,
      used: data.used,
      remaining: data.remaining,
      reset: data.reset,
      resetDate,
      percentageUsed,
    };
  }
  
  /**
   * Log rate limit status with appropriate level
   */
  private logRateLimitStatus(type: 'core' | 'search', status: RateLimitStatus): void {
    if (status.remaining <= this.CRITICAL_THRESHOLD) {
      logger.error(`[CRITICAL] GitHub ${type} rate limit: ${status.remaining}/${status.limit} remaining. Reset at ${status.resetDate.toISOString()}`);
    } else if (status.remaining <= this.WARNING_THRESHOLD) {
      logger.warn(`[WARNING] GitHub ${type} rate limit: ${status.remaining}/${status.limit} remaining. Reset at ${status.resetDate.toISOString()}`);
    } else {
      logger.info(`[INFO] GitHub ${type} rate limit: ${status.remaining}/${status.limit} remaining. Reset at ${status.resetDate.toISOString()}`);
    }
  }
  
  /**
   * Get current core rate limit status
   */
  getCoreRateLimitStatus(): RateLimitStatus | null {
    return this.coreRateLimit;
  }
  
  /**
   * Get current search rate limit status
   */
  getSearchRateLimitStatus(): RateLimitStatus | null {
    return this.searchRateLimit;
  }
  
  /**
   * Get overall rate limit status (prioritizes search for discovery operations)
   */
  getRateLimitStatus(): RateLimitStatus | null {
    // For discovery, search API is more critical
    return this.searchRateLimit || this.coreRateLimit;
  }
  
  /**
   * Check if rate limit is critically low
   */
  isRateLimitCritical(): boolean {
    const status = this.getRateLimitStatus();
    return status ? status.remaining <= this.CRITICAL_THRESHOLD : false;
  }
  
  /**
   * Check if rate limit is at warning level
   */
  isRateLimitWarning(): boolean {
    const status = this.getRateLimitStatus();
    return status ? status.remaining <= this.WARNING_THRESHOLD : false;
  }
  
  /**
   * Check if rate limit is exhausted
   */
  isRateLimitExhausted(): boolean {
    const status = this.getRateLimitStatus();
    return status ? status.remaining === 0 : false;
  }
  
  /**
   * Get seconds until rate limit reset
   */
  getSecondsUntilReset(): number {
    const status = this.getRateLimitStatus();
    if (!status) return 0;
    
    const now = Math.floor(Date.now() / 1000);
    const secondsUntilReset = Math.max(0, status.reset - now);
    return secondsUntilReset;
  }
  
  /**
   * Update rate limit from response headers
   */
  updateFromResponseHeaders(headers: Headers): void {
    const limit = headers.get('x-ratelimit-limit');
    const used = headers.get('x-ratelimit-used');
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    
    if (limit && used && remaining && reset) {
      const status = this.parseRateLimitData({
        limit: parseInt(limit, 10),
        used: parseInt(used, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      });
      
      // Update both core and search (we don't know which type from headers)
      this.coreRateLimit = status;
      this.searchRateLimit = status;
      
      // Log with appropriate level
      if (status.remaining <= this.CRITICAL_THRESHOLD) {
        logger.error(`[CRITICAL] GitHub rate limit (from headers): ${status.remaining}/${status.limit} remaining. Reset at ${status.resetDate.toISOString()}`);
      } else if (status.remaining <= this.WARNING_THRESHOLD) {
        logger.warn(`[WARNING] GitHub rate limit (from headers): ${status.remaining}/${status.limit} remaining. Reset at ${status.resetDate.toISOString()}`);
      } else {
        logger.info(`[INFO] GitHub rate limit (from headers): ${status.remaining}/${status.limit} remaining. Reset at ${status.resetDate.toISOString()}`);
      }
    }
  }
  
  /**
   * Reset rate limit data (for testing)
   */
  reset(): void {
    this.coreRateLimit = null;
    this.searchRateLimit = null;
  }
}

export const githubRateLimitService = GitHubRateLimitService.getInstance();
