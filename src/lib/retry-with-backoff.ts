/**
 * Exponential Backoff Retry Utility
 * Provides retry logic with exponential backoff for API calls
 */

import { logger } from '@/lib/logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

export interface RetryResult<T> {
  data: T;
  attempts: number;
  totalDelayMs: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 32000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
  onRetry: () => {},
};

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(delay, options.maxDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let totalDelayMs = 0;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      const data = await fn();
      return {
        data,
        attempts: attempt,
        totalDelayMs,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      if (attempt === opts.maxRetries || !opts.shouldRetry(lastError, attempt)) {
        throw lastError;
      }
      
      // Calculate delay
      const delayMs = calculateDelay(attempt, opts);
      totalDelayMs += delayMs;
      
      // Call onRetry callback
      opts.onRetry(lastError, attempt, delayMs);
      
      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed');
}

/**
 * Default retry condition for HTTP errors
 */
export function shouldRetryHttpError(error: Error, attempt: number): boolean {
  const retryableStatusCodes = [403, 429, 500, 502, 503, 504];
  const nonRetryableStatusCodes = [401, 404, 422];
  
  // Try to extract status code from error message
  const errorMessage = error.message.toLowerCase();
  
  // Check for non-retryable errors
  for (const code of nonRetryableStatusCodes) {
    if (errorMessage.includes(`${code}`)) {
      return false;
    }
  }
  
  // Check for retryable errors
  for (const code of retryableStatusCodes) {
    if (errorMessage.includes(`${code}`)) {
      return true;
    }
  }
  
  // Check for rate limit specific messages
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return true;
  }
  
  // Check for server error messages
  if (errorMessage.includes('server error') || errorMessage.includes('service unavailable')) {
    return true;
  }
  
  // Default: don't retry unknown errors
  return false;
}

/**
 * Default onRetry callback for logging
 */
export function logRetry(error: Error, attempt: number, delayMs: number): void {
  logger.warn(`[RETRY] Attempt ${attempt} failed: ${error.message}. Retrying in ${delayMs}ms...`);
}

/**
 * Convenience function for HTTP requests with retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const opts = {
    ...retryOptions,
    shouldRetry: retryOptions.shouldRetry || shouldRetryHttpError,
    onRetry: retryOptions.onRetry || logRetry,
  };

  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }
      
      return response;
    },
    opts
  ).then(result => result.data);
}
