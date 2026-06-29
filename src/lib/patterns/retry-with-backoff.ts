/**
 * Retry with Exponential Backoff
 * Implements retry logic with exponential backoff and jitter
 */

export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryableErrors?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Calculates delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number,
  jitter: boolean
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  if (jitter) {
    // Add random jitter (±25%)
    const jitterAmount = cappedDelay * 0.25;
    const randomJitter = Math.random() * jitterAmount * 2 - jitterAmount;
    return Math.max(0, cappedDelay + randomJitter);
  }

  return cappedDelay;
}

/**
 * Checks if an error is retryable
 */
function isRetryableError(
  error: any,
  customCheck?: (error: any) => boolean
): boolean {
  if (customCheck) {
    return customCheck(error);
  }

  // Default retryable errors
  if (!error) return false;

  // Network errors
  if (error.name === 'NetworkError' || error.name === 'TimeoutError') {
    return true;
  }

  // HTTP status codes
  if (error.response) {
    const status = error.response.status;
    // Retry on 5xx errors and 429 (Too Many Requests)
    return status >= 500 || status === 429;
  }

  return false;
}

/**
 * Sleep function for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes a function with retry logic
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
    retryableErrors,
    onRetry,
  } = config;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error, retryableErrors)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        initialDelay,
        maxDelay,
        backoffMultiplier,
        jitter
      );

      // Call onRetry callback
      if (onRetry) {
        onRetry(attempt, error);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Creates a retry wrapper function
 */
export function createRetryWrapper<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): () => Promise<T> {
  return () => retryWithBackoff(fn, config);
}

/**
 * Retry decorator for class methods
 */
export function Retry(config: RetryConfig = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return retryWithBackoff(() => originalMethod.apply(this, args), config);
    };

    return descriptor;
  };
}

/**
 * Default retryable error checker for HTTP requests
 */
export function isRetryableHTTPError(error: any): boolean {
  if (!error || !error.response) {
    return false;
  }

  const status = error.response.status;
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return retryableStatuses.includes(status);
}

/**
 * Retry configuration presets
 */
export const RetryPresets = {
  conservative: {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    jitter: true,
  },
  moderate: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
  },
  aggressive: {
    maxAttempts: 3,
    initialDelay: 500,
    maxDelay: 10000,
    backoffMultiplier: 1.5,
    jitter: false,
  },
};
