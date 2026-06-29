/**
 * GitHub Circuit Breaker
 * Implements circuit breaker pattern to prevent cascading failures
 */

import { logger } from '@/lib/logger';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  monitoringPeriodMs?: number;
  onCircuitOpen?: () => void;
  onCircuitHalfOpen?: () => void;
  onCircuitClosed?: () => void;
}

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  openSince: Date | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

class GitHubCircuitBreaker {
  private static instance: GitHubCircuitBreaker;
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: Date | null = null;
  private lastSuccessTime: Date | null = null;
  private openSince: Date | null = null;
  private resetTimeout: NodeJS.Timeout | null = null;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private options: Required<CircuitBreakerOptions>;
  
  private constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 10,
      resetTimeoutMs: options.resetTimeoutMs || 5 * 60 * 1000, // 5 minutes
      monitoringPeriodMs: options.monitoringPeriodMs || 60 * 1000, // 1 minute
      onCircuitOpen: options.onCircuitOpen || (() => {}),
      onCircuitHalfOpen: options.onCircuitHalfOpen || (() => {}),
      onCircuitClosed: options.onCircuitClosed || (() => {}),
    };
  }
  
  static getInstance(options?: CircuitBreakerOptions): GitHubCircuitBreaker {
    if (!GitHubCircuitBreaker.instance) {
      GitHubCircuitBreaker.instance = new GitHubCircuitBreaker(options);
    }
    return GitHubCircuitBreaker.instance;
  }
  
  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;
    
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      throw new Error('Circuit breaker is OPEN - requests are temporarily blocked');
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
   * Handle successful execution
   */
  private onSuccess(): void {
    this.totalSuccesses++;
    this.lastSuccessTime = new Date();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      // If we get enough successes in half-open state, close the circuit
      if (this.successCount >= 3) {
        this.closeCircuit();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }
  
  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.state === CircuitState.CLOSED) {
      // Check if we've exceeded failure threshold
      if (this.failureCount >= this.options.failureThreshold) {
        this.openCircuit();
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state opens the circuit again
      this.openCircuit();
    }
  }
  
  /**
   * Open the circuit
   */
  private openCircuit(): void {
    if (this.state === CircuitState.OPEN) {
      return; // Already open
    }
    
    this.state = CircuitState.OPEN;
    this.openSince = new Date();
    this.failureCount = 0;
    this.successCount = 0;
    
    logger.error('[CIRCUIT BREAKER] Circuit opened due to consecutive failures');
    this.options.onCircuitOpen();
    
    // Schedule automatic reset
    this.scheduleReset();
  }
  
  /**
   * Close the circuit
   */
  private closeCircuit(): void {
    if (this.state === CircuitState.CLOSED) {
      return; // Already closed
    }
    
    this.state = CircuitState.CLOSED;
    this.openSince = null;
    this.failureCount = 0;
    this.successCount = 0;
    
    logger.info('[CIRCUIT BREAKER] Circuit closed - requests are allowed');
    this.options.onCircuitClosed();
    
    // Clear any pending reset
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }
  }
  
  /**
   * Move to half-open state
   */
  private halfOpenCircuit(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      return; // Already half-open
    }
    
    this.state = CircuitState.HALF_OPEN;
    this.failureCount = 0;
    this.successCount = 0;
    
    logger.info('[CIRCUIT BREAKER] Circuit half-open - testing with limited requests');
    this.options.onCircuitHalfOpen();
  }
  
  /**
   * Schedule automatic circuit reset
   */
  private scheduleReset(): void {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
    
    this.resetTimeout = setTimeout(() => {
      this.halfOpenCircuit();
    }, this.options.resetTimeoutMs);
  }
  
  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      openSince: this.openSince,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }
  
  /**
   * Check if circuit is allowing requests
   */
  isRequestAllowed(): boolean {
    return this.state !== CircuitState.OPEN;
  }
  
  /**
   * Manually open the circuit
   */
  open(): void {
    this.openCircuit();
  }
  
  /**
   * Manually close the circuit
   */
  close(): void {
    this.closeCircuit();
  }
  
  /**
   * Manually reset the circuit
   */
  reset(): void {
    this.closeCircuit();
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
  }
  
  /**
   * Update options
   */
  updateOptions(options: Partial<CircuitBreakerOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }
  }
}

export const githubCircuitBreaker = GitHubCircuitBreaker.getInstance();
