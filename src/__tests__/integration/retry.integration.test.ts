import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, createRetryWrapper, CircuitBreaker, createCircuitBreaker } from '@/lib/retry';

describe('Retry Logic Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should retry failed operations with exponential backoff', async () => {
    let attempts = 0;
    const failingFn = vi.fn(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Network error');
      }
      return 'success';
    });

    const result = await withRetry(failingFn, {
      maxAttempts: 3,
      baseDelay: 100,
      maxDelay: 1000,
    });

    expect(result).toBe('success');
    expect(failingFn).toHaveBeenCalledTimes(3);
  });

  it('should fail after max attempts', async () => {
    const failingFn = vi.fn(() => {
      throw new Error('Network error');
    });

    await expect(
      withRetry(failingFn, {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
      })
    ).rejects.toThrow('Network error');

    expect(failingFn).toHaveBeenCalledTimes(3);
  });

  it('should not retry non-retryable errors', async () => {
    const failingFn = vi.fn(() => {
      throw new Error('Validation error');
    });

    await expect(
      withRetry(failingFn, {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        shouldRetry: (error) => !error.message.includes('Validation'),
      })
    ).rejects.toThrow('Validation error');

    expect(failingFn).toHaveBeenCalledTimes(1);
  });

  it('should call onRetry callback', async () => {
    const onRetry = vi.fn();
    const failingFn = vi.fn(() => {
      throw new Error('Network error');
    });

    await expect(
      withRetry(failingFn, {
        maxAttempts: 2,
        baseDelay: 100,
        maxDelay: 1000,
        onRetry,
      })
    ).rejects.toThrow();

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('Circuit Breaker Integration Tests', () => {
  it('should open circuit after failure threshold', async () => {
    const circuitBreaker = createCircuitBreaker(3, 60000);
    const failingFn = vi.fn(() => {
      throw new Error('Service unavailable');
    });

    // Fail 3 times to open circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingFn)).rejects.toThrow();
    }

    expect(circuitBreaker.getState()).toBe('open');

    // Should fail immediately when circuit is open
    await expect(circuitBreaker.execute(failingFn)).rejects.toThrow('Circuit breaker is OPEN');
  });

  it('should close circuit after recovery timeout', async () => {
    vi.useRealTimers();
    const circuitBreaker = createCircuitBreaker(2, 100); // 100ms recovery timeout
    const failingFn = vi.fn(() => {
      throw new Error('Service unavailable');
    });

    // Fail 2 times to open circuit
    for (let i = 0; i < 2; i++) {
      await expect(circuitBreaker.execute(failingFn)).rejects.toThrow();
    }

    expect(circuitBreaker.getState()).toBe('open');

    // Wait for recovery timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should be in half-open state
    const successFn = vi.fn(async () => 'success');
    const result = await circuitBreaker.execute(successFn);
    
    expect(result).toBe('success');
    expect(circuitBreaker.getState()).toBe('closed');
  });

  it('should track failure count', async () => {
    const circuitBreaker = createCircuitBreaker(5, 60000);
    const failingFn = vi.fn(async () => {
      throw new Error('Service unavailable');
    });

    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingFn)).rejects.toThrow();
    }

    expect(circuitBreaker.getFailures()).toBe(3);
  });
});
