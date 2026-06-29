import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  checkRateLimit, 
  getRateLimitHeaders, 
  cleanupExpiredEntries,
  addEndpointConfig,
  removeEndpointConfig,
  getRateLimitStats,
  resetAllRateLimits
} from '@/lib/rate-limit';

describe('Rate Limiting Integration Tests', () => {
  beforeEach(() => {
    resetAllRateLimits();
  });

  afterEach(() => {
    resetAllRateLimits();
  });

  it('should allow requests within limit', () => {
    const result = checkRateLimit('user1', '/api/test');
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
    expect(result.limit).toBe(100); // default limit
  });

  it('should block requests exceeding limit', () => {
    // Make 100 requests to hit the limit
    for (let i = 0; i < 100; i++) {
      checkRateLimit('user1', '/api/test');
    }
    
    const result = checkRateLimit('user1', '/api/test');
    
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset after window expires', () => {
    // Make a request
    checkRateLimit('user1', '/api/test');
    
    // Clean up expired entries (simulating window expiry)
    cleanupExpiredEntries();
    
    // Should allow request again
    const result = checkRateLimit('user1', '/api/test');
    expect(result.allowed).toBe(true);
  });

  it('should track requests per endpoint separately', () => {
    checkRateLimit('user1', '/api/test1');
    checkRateLimit('user1', '/api/test2');
    
    const result1 = checkRateLimit('user1', '/api/test1');
    const result2 = checkRateLimit('user1', '/api/test2');
    
    expect(result1.remaining).toBe(98);
    expect(result2.remaining).toBe(98);
  });

  it('should track requests per user separately', () => {
    checkRateLimit('user1', '/api/test');
    checkRateLimit('user2', '/api/test');
    
    const result1 = checkRateLimit('user1', '/api/test');
    const result2 = checkRateLimit('user2', '/api/test');
    
    expect(result1.remaining).toBe(98);
    expect(result2.remaining).toBe(98);
  });

  it('should respect custom endpoint configuration', () => {
    addEndpointConfig('/api/custom', { limit: 10, windowMs: 60000 });
    
    const result = checkRateLimit('user1', '/api/custom');
    
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
    
    removeEndpointConfig('/api/custom');
  });

  it('should provide rate limit headers', () => {
    const result = checkRateLimit('user1', '/api/test');
    const headers = getRateLimitHeaders(result);
    
    expect(headers['X-RateLimit-Limit']).toBe('100');
    expect(headers['X-RateLimit-Remaining']).toBeDefined();
    expect(headers['X-RateLimit-Reset']).toBeDefined();
  });

  it('should include Retry-After header when rate limited', () => {
    // Exhaust the limit
    for (let i = 0; i < 100; i++) {
      checkRateLimit('user1', '/api/test');
    }
    
    const result = checkRateLimit('user1', '/api/test');
    const headers = getRateLimitHeaders(result);
    
    expect(headers['Retry-After']).toBeDefined();
  });

  it('should provide statistics', () => {
    checkRateLimit('user1', '/api/test1');
    checkRateLimit('user2', '/api/test1');
    checkRateLimit('user1', '/api/test2');
    
    const stats = getRateLimitStats();
    
    expect(stats.totalEntries).toBeGreaterThan(0);
    expect(stats.endpoints['/api/test1']).toBeDefined();
  });
});
