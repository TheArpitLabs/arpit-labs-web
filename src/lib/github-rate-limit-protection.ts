/**
 * GitHub Rate Limit Protection
 * Provides rate limit checking and automatic pause/resume functionality
 */

import { githubRateLimitService, RateLimitStatus } from './github-rate-limit.service';

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  waitTimeMs?: number;
  status?: RateLimitStatus;
}

export interface RateLimitProtectionOptions {
  pauseThreshold?: number;
  stopThreshold?: number;
  onRateLimitReached?: (status: RateLimitStatus) => void;
  onRateLimitWarning?: (status: RateLimitStatus) => void;
}

class GitHubRateLimitProtection {
  private static instance: GitHubRateLimitProtection;
  private isPaused: boolean = false;
  private pauseTimeout: NodeJS.Timeout | null = null;
  private options: Required<RateLimitProtectionOptions>;
  
  private constructor(options: RateLimitProtectionOptions = {}) {
    this.options = {
      pauseThreshold: options.pauseThreshold || 100,
      stopThreshold: options.stopThreshold || 0,
      onRateLimitReached: options.onRateLimitReached || (() => {}),
      onRateLimitWarning: options.onRateLimitWarning || (() => {}),
    };
  }
  
  static getInstance(options?: RateLimitProtectionOptions): GitHubRateLimitProtection {
    if (!GitHubRateLimitProtection.instance) {
      GitHubRateLimitProtection.instance = new GitHubRateLimitProtection(options);
    }
    return GitHubRateLimitProtection.instance;
  }
  
  /**
   * Check if request is allowed based on rate limit status
   */
  async checkRateLimit(): Promise<RateLimitCheckResult> {
    // If currently paused, don't allow requests
    if (this.isPaused) {
      return {
        allowed: false,
        reason: 'Discovery is paused due to rate limit',
      };
    }
    
    // Fetch latest rate limit status
    await githubRateLimitService.fetchRateLimitStatus();
    const status = githubRateLimitService.getRateLimitStatus();
    
    if (!status) {
      // If we don't have rate limit data, allow request but log warning
      console.warn('[RATE LIMIT] No rate limit data available, proceeding with caution');
      return { allowed: true };
    }
    
    // Check if rate limit is exhausted
    if (status.remaining <= this.options.stopThreshold) {
      const waitTimeMs = this.getSecondsUntilReset() * 1000;
      
      console.error(`[RATE LIMIT] Rate limit exhausted. Waiting ${waitTimeMs}ms until reset`);
      this.options.onRateLimitReached(status);
      
      // Auto-pause and schedule resume
      this.pauseDiscovery(waitTimeMs);
      
      return {
        allowed: false,
        reason: 'Rate limit exhausted',
        waitTimeMs,
        status,
      };
    }
    
    // Check if rate limit is at pause threshold
    if (status.remaining <= this.options.pauseThreshold) {
      const waitTimeMs = this.getSecondsUntilReset() * 1000;
      
      console.warn(`[RATE LIMIT] Rate limit at threshold. Pausing for ${waitTimeMs}ms`);
      this.options.onRateLimitWarning(status);
      
      // Auto-pause and schedule resume
      this.pauseDiscovery(waitTimeMs);
      
      return {
        allowed: false,
        reason: 'Rate limit at pause threshold',
        waitTimeMs,
        status,
      };
    }
    
    // Rate limit is healthy, allow request
    return {
      allowed: true,
      status,
    };
  }
  
  /**
   * Get seconds until rate limit reset
   */
  private getSecondsUntilReset(): number {
    return githubRateLimitService.getSecondsUntilReset();
  }
  
  /**
   * Pause discovery for specified duration
   */
  private pauseDiscovery(durationMs: number): void {
    if (this.isPaused) {
      return; // Already paused
    }
    
    this.isPaused = true;
    console.log(`[RATE LIMIT] Pausing discovery for ${durationMs}ms`);
    
    // Clear any existing timeout
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
    }
    
    // Schedule resume
    this.pauseTimeout = setTimeout(() => {
      this.resumeDiscovery();
    }, durationMs);
  }
  
  /**
   * Resume discovery
   */
  private resumeDiscovery(): void {
    if (!this.isPaused) {
      return;
    }
    
    this.isPaused = false;
    this.pauseTimeout = null;
    console.log('[RATE LIMIT] Resuming discovery');
  }
  
  /**
   * Manually pause discovery
   */
  pause(): void {
    if (this.isPaused) {
      return;
    }
    
    this.isPaused = true;
    console.log('[RATE LIMIT] Discovery manually paused');
    
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }
  }
  
  /**
   * Manually resume discovery
   */
  resume(): void {
    this.resumeDiscovery();
  }
  
  /**
   * Check if discovery is currently paused
   */
  isDiscoveryPaused(): boolean {
    return this.isPaused;
  }
  
  /**
   * Get current pause status
   */
  getPauseStatus(): { paused: boolean; waitTimeMs?: number } {
    if (!this.isPaused || !this.pauseTimeout) {
      return { paused: false };
    }
    
    // We can't easily get remaining time from a timeout in Node.js
    return { paused: true };
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }
    this.isPaused = false;
  }
}

export const githubRateLimitProtection = GitHubRateLimitProtection.getInstance();
