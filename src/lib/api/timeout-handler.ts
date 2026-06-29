/**
 * API Timeout Handling
 * Handles API request timeouts with configurable options
 */

export interface TimeoutConfig {
  timeout?: number;
  onTimeout?: () => void;
  errorMessage?: string;
}

class TimeoutHandler {
  /**
   * Wraps a promise with a timeout
   */
  async withTimeout<T>(
    promise: Promise<T>,
    config: TimeoutConfig = {}
  ): Promise<T> {
    const { timeout = 30000, onTimeout, errorMessage = 'Request timeout' } = config;

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        if (onTimeout) {
          onTimeout();
        }
        reject(new Error(errorMessage));
        clearTimeout(timer);
      }, timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Wraps a fetch request with timeout
   */
  async fetchWithTimeout(
    url: string | Request,
    init?: RequestInit,
    config?: TimeoutConfig
  ): Promise<Response> {
    const { timeout = 30000 } = config || {};

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(config?.errorMessage || 'Request timeout');
      }
      throw error;
    }
  }

  /**
   * Creates a timeout for async operations
   */
  createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), ms);
    });
  }

  /**
   * Debounces a function
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        timeout = null;
        func(...args);
      };

      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttles a function
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

// Create singleton instance
const timeoutHandler = new TimeoutHandler();

/**
 * Wraps promise with timeout
 */
export function withTimeout<T>(promise: Promise<T>, config?: TimeoutConfig): Promise<T> {
  return timeoutHandler.withTimeout(promise, config);
}

/**
 * Fetches with timeout
 */
export function fetchWithTimeout(
  url: string | Request,
  init?: RequestInit,
  config?: TimeoutConfig
): Promise<Response> {
  return timeoutHandler.fetchWithTimeout(url, init, config);
}

/**
 * Creates timeout promise
 */
export function createTimeout(ms: number): Promise<never> {
  return timeoutHandler.createTimeout(ms);
}

/**
 * Debounces a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  return timeoutHandler.debounce(func, wait);
}

/**
 * Throttles a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  return timeoutHandler.throttle(func, limit);
}

export default timeoutHandler;
