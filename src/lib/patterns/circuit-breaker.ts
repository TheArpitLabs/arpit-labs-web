/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by failing fast when a service is down
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  resetTimeout?: number;
  onStateChange?: (state: CircuitState) => void;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
}

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private nextAttemptTime?: number;
  private config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig = {}) {
    this.config = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      resetTimeout: 30000,
      onStateChange: () => {},
      ...config,
    };
  }

  /**
   * Executes a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new Error('Circuit breaker is OPEN');
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
    this.successCount++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
        this.resetCounts();
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0;
    }
  }

  /**
   * Handles failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (
      this.state === CircuitState.CLOSED &&
      this.failureCount >= this.config.failureThreshold
    ) {
      this.transitionTo(CircuitState.OPEN);
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
    }
  }

  /**
   * Checks if circuit breaker should attempt reset
   */
  private shouldAttemptReset(): boolean {
    return (
      this.nextAttemptTime !== undefined && Date.now() >= this.nextAttemptTime
    );
  }

  /**
   * Transitions to a new state
   */
  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.config.onStateChange(newState);
    }
  }

  /**
   * Resets failure and success counts
   */
  private resetCounts(): void {
    this.failureCount = 0;
    this.successCount = 0;
  }

  /**
   * Gets current circuit breaker state
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
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
    };
  }

  /**
   * Manually opens the circuit
   */
  open(): void {
    this.transitionTo(CircuitState.OPEN);
    this.nextAttemptTime = Date.now() + this.config.resetTimeout;
  }

  /**
   * Manually closes the circuit
   */
  close(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.resetCounts();
  }

  /**
   * Resets the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.resetCounts();
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttemptTime = undefined;
  }
}

/**
 * Circuit Breaker Registry
 */
class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Gets or creates a circuit breaker
   */
  get(key: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(key)) {
      this.breakers.set(key, new CircuitBreaker(config));
    }
    return this.breakers.get(key)!;
  }

  /**
   * Removes a circuit breaker
   */
  remove(key: string): void {
    this.breakers.delete(key);
  }

  /**
   * Clears all circuit breakers
   */
  clear(): void {
    this.breakers.clear();
  }

  /**
   * Gets all circuit breaker stats
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [key, breaker] of this.breakers.entries()) {
      stats[key] = breaker.getStats();
    }
    return stats;
  }

  /**
   * Internal access to breakers map
   */
  get _breakers() {
    return this.breakers;
  }
}

// Create singleton registry
const registry = new CircuitBreakerRegistry();

/**
 * Executes a function with circuit breaker protection
 */
export function withCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  config?: CircuitBreakerConfig
): Promise<T> {
  const breaker = registry.get(key, config);
  return breaker.execute(fn);
}

/**
 * Gets circuit breaker stats
 */
export function getCircuitBreakerStats(key: string): CircuitBreakerStats | undefined {
  const breaker = registry._breakers.get(key);
  return breaker?.getStats();
}

/**
 * Gets all circuit breaker stats
 */
export function getAllCircuitBreakerStats(): Record<string, CircuitBreakerStats> {
  return registry.getAllStats();
}

/**
 * Manually opens a circuit breaker
 */
export function openCircuitBreaker(key: string): void {
  const breaker = registry.get(key);
  breaker.open();
}

/**
 * Manually closes a circuit breaker
 */
export function closeCircuitBreaker(key: string): void {
  const breaker = registry.get(key);
  breaker.close();
}

/**
 * Resets a circuit breaker
 */
export function resetCircuitBreaker(key: string): void {
  const breaker = registry.get(key);
  breaker.reset();
}

/**
 * Removes a circuit breaker
 */
export function removeCircuitBreaker(key: string): void {
  registry.remove(key);
}

/**
 * Clears all circuit breakers
 */
export function clearCircuitBreakers(): void {
  registry.clear();
}
