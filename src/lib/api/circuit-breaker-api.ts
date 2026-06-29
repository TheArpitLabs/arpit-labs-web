/**
 * API Circuit Breaker
 * Implements circuit breaker pattern for API resilience
 */

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
  halfOpenMaxCalls?: number;
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
}

class APICircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private failureHistory: number[] = [];
  private halfOpenCalls = 0;

  private config: Required<CircuitBreakerConfig> = {
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoringPeriod: 10000,
    halfOpenMaxCalls: 3,
  };

  constructor(config: CircuitBreakerConfig = {}) {
    this.config = {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 10000,
      halfOpenMaxCalls: 3,
      ...config,
    };
  }

  /**
   * Executes a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        throw new Error('Circuit breaker is OPEN - requests blocked');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handles successful execution
   */
  private onSuccess(): void {
    this.successes++;
    this.lastSuccessTime = Date.now();
    this.failures = 0;

    if (this.state === 'half-open') {
      this.halfOpenCalls++;
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        this.transitionToClosed();
      }
    }
  }

  /**
   * Handles failed execution
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    // Track failures within monitoring period
    this.failureHistory.push(Date.now());
    this.cleanupFailureHistory();

    if (this.state === 'half-open') {
      this.transitionToOpen();
    } else if (this.failures >= this.config.failureThreshold) {
      this.transitionToOpen();
    }
  }

  /**
   * Cleans up old failure history
   */
  private cleanupFailureHistory(): void {
    const now = Date.now();
    this.failureHistory = this.failureHistory.filter(
      (time) => now - time < this.config.monitoringPeriod
    );
  }

  /**
   * Checks if circuit should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime > this.config.resetTimeout;
  }

  /**
   * Transitions to closed state
   */
  private transitionToClosed(): void {
    this.state = 'closed';
    this.failures = 0;
    this.halfOpenCalls = 0;
  }

  /**
   * Transitions to open state
   */
  private transitionToOpen(): void {
    this.state = 'open';
    this.halfOpenCalls = 0;
  }

  /**
   * Transitions to half-open state
   */
  private transitionToHalfOpen(): void {
    this.state = 'half-open';
    this.halfOpenCalls = 0;
  }

  /**
   * Gets current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Gets circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime || undefined,
      lastSuccessTime: this.lastSuccessTime || undefined,
    };
  }

  /**
   * Resets the circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.failureHistory = [];
    this.halfOpenCalls = 0;
  }

  /**
   * Updates configuration
   */
  updateConfig(config: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create singleton instance
const apiCircuitBreaker = new APICircuitBreaker();

/**
 * Executes with circuit breaker protection
 */
export function executeWithCircuitBreaker<T>(fn: () => Promise<T>): Promise<T> {
  return apiCircuitBreaker.execute(fn);
}

/**
 * Gets circuit breaker state
 */
export function getCircuitBreakerState(): CircuitState {
  return apiCircuitBreaker.getState();
}

/**
 * Gets circuit breaker statistics
 */
export function getCircuitBreakerStats(): CircuitBreakerStats {
  return apiCircuitBreaker.getStats();
}

/**
 * Resets circuit breaker
 */
export function resetCircuitBreaker(): void {
  apiCircuitBreaker.reset();
}

/**
 * Updates circuit breaker configuration
 */
export function updateCircuitBreakerConfig(config: Partial<CircuitBreakerConfig>): void {
  apiCircuitBreaker.updateConfig(config);
}

/**
 * Middleware for circuit breaker
 */
export function circuitBreakerMiddleware(config?: CircuitBreakerConfig) {
  const breaker = config ? new APICircuitBreaker(config) : apiCircuitBreaker;

  return async (request: Request): Promise<Response | null> => {
    try {
      return await breaker.execute(() => fetch(request));
    } catch (error) {
      if (error instanceof Error && error.message.includes('Circuit breaker is OPEN')) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      throw error;
    }
  };
}

export default apiCircuitBreaker;
