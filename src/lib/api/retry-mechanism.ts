/**
 * API Retry Mechanism
 * Automatically retries failed API requests with exponential backoff
 */

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: Array<string | RegExp>;
  retryableStatusCodes?: number[];
  onRetry?: (attempt: number, error: Error) => void;
}

class RetryMechanism {
  private defaultConfig: Required<RetryConfig> = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'],
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    onRetry: () => {},
  };

  /**
   * Checks if an error is retryable
   */
  private isRetryableError(error: Error, config: Required<RetryConfig>): boolean {
    // Check error message
    for (const pattern of config.retryableErrors) {
      if (typeof pattern === 'string' && error.message.includes(pattern)) {
        return true;
      }
      if (pattern instanceof RegExp && pattern.test(error.message)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if a status code is retryable
   */
  private isRetryableStatusCode(status: number, config: Required<RetryConfig>): boolean {
    return config.retryableStatusCodes.includes(status);
  }

  /**
   * Calculates delay with exponential backoff
   */
  private calculateDelay(attempt: number, config: Required<RetryConfig>): number {
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
      config.maxDelay
    );
    // Add jitter to prevent thundering herd
    return delay * (0.5 + Math.random());
  }

  /**
   * Retries a function with exponential backoff
   */
  async retry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> {
    const mergedConfig = { ...this.defaultConfig, ...config } as Required<RetryConfig>;
    let lastError: Error;

    for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        const isRetryable =
          this.isRetryableError(lastError, mergedConfig) ||
          (lastError as any).status
            ? this.isRetryableStatusCode((lastError as any).status, mergedConfig)
            : false;

        if (!isRetryable || attempt === mergedConfig.maxRetries) {
          throw lastError;
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt, mergedConfig);
        
        if (mergedConfig.onRetry) {
          mergedConfig.onRetry(attempt + 1, lastError);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Retries a fetch request
   */
  async retryFetch(
    url: string | Request,
    init?: RequestInit,
    config?: RetryConfig
  ): Promise<Response> {
    return this.retry(async () => fetch(url, init), config);
  }

  /**
   * Updates default configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
}

// Create singleton instance
const retryMechanism = new RetryMechanism();

/**
 * Retries a function
 */
export function retry<T>(fn: () => Promise<T>, config?: RetryConfig): Promise<T> {
  return retryMechanism.retry(fn, config);
}

/**
 * Retries a fetch request
 */
export function retryFetch(
  url: string | Request,
  init?: RequestInit,
  config?: RetryConfig
): Promise<Response> {
  return retryMechanism.retryFetch(url, init, config);
}

/**
 * Updates retry configuration
 */
export function updateRetryConfig(config: Partial<RetryConfig>): void {
  retryMechanism.updateConfig(config);
}

/**
 * Middleware for retry mechanism
 */
export function retryMiddleware(config?: RetryConfig) {
  return async (request: Request): Promise<Response> => {
    return retryMechanism.retryFetch(request, undefined, config);
  };
}

export default retryMechanism;
