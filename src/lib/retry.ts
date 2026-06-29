import { API_CONFIG } from "@/constants/constants";
import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxAttempts: API_CONFIG.RETRY_ATTEMPTS,
  baseDelay: API_CONFIG.RETRY_DELAY_BASE,
  maxDelay: API_CONFIG.RETRY_DELAY_MAX,
  backoffMultiplier: 2,
  shouldRetry: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx errors
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
    ];
    
    const isNetworkError = retryableErrors.some(err => 
      error.name.includes(err) || error.message.includes(err)
    );
    
    const is5xxError = error.message.includes('500') || 
                      error.message.includes('502') || 
                      error.message.includes('503') || 
                      error.message.includes('504');
    
    return isNetworkError || is5xxError;
  },
  onRetry: (attempt: number, error: Error) => {
    logger.warn(`Retry attempt ${attempt} after error: ${error.message}`, { errorName: error.name });
  },
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const exponentialDelay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  const delay = Math.min(exponentialDelay + jitter, maxDelay);
  return Math.floor(delay);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultRetryOptions, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (!opts.shouldRetry(lastError)) {
        throw lastError;
      }

      // Don't retry on the last attempt
      if (attempt === opts.maxAttempts) {
        throw lastError;
      }

      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        opts.baseDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      // Call retry callback if provided
      if (opts.onRetry) {
        opts.onRetry(attempt, lastError);
      }

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Max retry attempts exceeded');
}

/**
 * Retry wrapper for async functions with context
 */
export function createRetryWrapper<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    return withRetry(() => fn(...args), options);
  }) as T;
}

/**
 * Retry with specific error types
 */
export function withRetryForErrors<T>(
  fn: () => Promise<T>,
  retryableErrorTypes: string[],
  options: Omit<RetryOptions, 'shouldRetry'> = {}
): Promise<T> {
  return withRetry(fn, {
    ...options,
    shouldRetry: (error: Error) => {
      return retryableErrorTypes.some(type => 
        error.name === type || error.constructor.name === type
      );
    },
  });
}

/**
 * Retry with timeout
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retryOptions: RetryOptions = {}
): Promise<T> {
  return withRetry(async () => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });

    return Promise.race([fn(), timeoutPromise]);
  }, retryOptions);
}

/**
 * Circuit breaker integration with retry
 */
export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  retryOptions?: RetryOptions;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.options.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await withRetry(fn, this.options.retryOptions);
      
      if (this.state === 'half-open') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.options.failureThreshold) {
        this.state = 'open';
        logger.error('Circuit breaker opened due to failures', { 
          failures: this.failures,
          threshold: this.options.failureThreshold 
        });
      }

      throw error;
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}

/**
 * Create a circuit breaker instance
 */
export function createCircuitBreaker(
  failureThreshold: number = 5,
  recoveryTimeout: number = 60000,
  retryOptions?: RetryOptions
): CircuitBreaker {
  return new CircuitBreaker({
    failureThreshold,
    recoveryTimeout,
    retryOptions,
  });
}
