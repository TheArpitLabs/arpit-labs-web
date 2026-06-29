/**
 * GitHub API Failure Recovery
 * Handles automatic retry logic for specific HTTP error codes
 */

import { retryWithBackoff, shouldRetryHttpError, logRetry } from '@/lib/retry-with-backoff';
import { githubRateLimitService } from './github-rate-limit.service';
import { logger } from '@/lib/logger';

export interface GitHubApiRecoveryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  logFailures?: boolean;
  updateRateLimit?: boolean;
}

export interface GitHubApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  attempts: number;
}

const RETRYABLE_STATUS_CODES = [403, 429, 500, 502, 503, 504];
const NON_RETRYABLE_STATUS_CODES = [401, 404, 422];

class GitHubApiRecovery {
  private static instance: GitHubApiRecovery;
  private failureLog: Array<{ timestamp: Date; status: number; url: string; error: string }> = [];
  private options: Required<GitHubApiRecoveryOptions>;
  
  private constructor(options: GitHubApiRecoveryOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries || 5,
      initialDelayMs: options.initialDelayMs || 1000,
      maxDelayMs: options.maxDelayMs || 32000,
      logFailures: options.logFailures !== false,
      updateRateLimit: options.updateRateLimit !== false,
    };
  }
  
  static getInstance(options?: GitHubApiRecoveryOptions): GitHubApiRecovery {
    if (!GitHubApiRecovery.instance) {
      GitHubApiRecovery.instance = new GitHubApiRecovery(options);
    }
    return GitHubApiRecovery.instance;
  }
  
  /**
   * Execute GitHub API request with automatic recovery
   */
  async execute<T>(
    url: string,
    fetchOptions: RequestInit = {}
  ): Promise<GitHubApiResponse<T>> {
    const startTime = Date.now();
    
    try {
      const result = await retryWithBackoff(
        async () => {
          const response = await fetch(url, {
            ...fetchOptions,
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Arpit-Labs-Discovery',
              ...fetchOptions.headers,
            },
          });
          
          // Update rate limit from response headers
          if (this.options.updateRateLimit) {
            githubRateLimitService.updateFromResponseHeaders(response.headers);
          }
          
          // Check if response is ok
          if (!response.ok) {
            const error = this.createApiError(response.status, response.statusText, url);
            throw error;
          }
          
          return response;
        },
        {
          maxRetries: this.options.maxRetries,
          initialDelayMs: this.options.initialDelayMs,
          maxDelayMs: this.options.maxDelayMs,
          shouldRetry: (error) => this.shouldRetry(error),
          onRetry: (error, attempt, delayMs) => {
            if (this.options.logFailures) {
              logRetry(error, attempt, delayMs);
            }
            this.logFailure(error, url);
          },
        }
      );
      
      const response = result.data as Response;
      const data = await response.json() as T;
      
      return {
        data,
        status: response.status,
        headers: response.headers,
        attempts: result.attempts,
      };
    } catch (error) {
      // Log final failure if all retries exhausted
      if (this.options.logFailures) {
        logger.error(`[API RECOVERY] All retries exhausted for ${url}:`, error);
      }
      throw error;
    }
  }
  
  /**
   * Determine if error should be retried
   */
  private shouldRetry(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    // Check for non-retryable status codes
    for (const code of NON_RETRYABLE_STATUS_CODES) {
      if (errorMessage.includes(`${code}`)) {
        return false;
      }
    }
    
    // Check for retryable status codes
    for (const code of RETRYABLE_STATUS_CODES) {
      if (errorMessage.includes(`${code}`)) {
        return true;
      }
    }
    
    // Use default HTTP error retry logic
    return shouldRetryHttpError(error, 1);
  }
  
  /**
   * Create API error with context
   */
  private createApiError(status: number, statusText: string, url: string): Error {
    let message = `GitHub API error: ${status} ${statusText}`;
    
    // Add specific context for common errors
    if (status === 403) {
      message += ' (Rate limit exceeded or forbidden)';
    } else if (status === 429) {
      message += ' (Too many requests)';
    } else if (status === 401) {
      message += ' (Unauthorized - check credentials)';
    } else if (status === 404) {
      message += ' (Not found)';
    } else if (status === 422) {
      message += ' (Unprocessable entity - validation error)';
    } else if (status >= 500) {
      message += ' (Server error - GitHub is experiencing issues)';
    }
    
    const error = new Error(message);
    (error as any).status = status;
    (error as any).url = url;
    return error;
  }
  
  /**
   * Log failure for monitoring
   */
  private logFailure(error: Error, url: string): void {
    const status = (error as any).status || 0;
    this.failureLog.push({
      timestamp: new Date(),
      status,
      url,
      error: error.message,
    });
    
    // Keep only last 100 failures
    if (this.failureLog.length > 100) {
      this.failureLog.shift();
    }
  }
  
  /**
   * Get failure log
   */
  getFailureLog(): Array<{ timestamp: Date; status: number; url: string; error: string }> {
    return [...this.failureLog];
  }
  
  /**
   * Get failure statistics
   */
  getFailureStats(): {
    total: number;
    byStatus: Record<number, number>;
    recent: number;
  } {
    const byStatus: Record<number, number> = {};
    
    for (const failure of this.failureLog) {
      byStatus[failure.status] = (byStatus[failure.status] || 0) + 1;
    }
    
    // Count failures in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recent = this.failureLog.filter(f => f.timestamp > fiveMinutesAgo).length;
    
    return {
      total: this.failureLog.length,
      byStatus,
      recent,
    };
  }
  
  /**
   * Clear failure log
   */
  clearFailureLog(): void {
    this.failureLog = [];
  }
  
  /**
   * Update options
   */
  updateOptions(options: Partial<GitHubApiRecoveryOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

export const githubApiRecovery = GitHubApiRecovery.getInstance();
