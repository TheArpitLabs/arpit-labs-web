import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/lib/api/api-client';

describe('APIClient', () => {
  let client: ReturnType<typeof apiClient>;

  beforeEach(() => {
    client = apiClient({
      baseUrl: 'https://api.example.com',
      timeout: 5000,
    }) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should make GET requests', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      } as Response)
    );

    const result = await client.get('/test');
    expect(result.data).toEqual({ data: 'test' });
  });

  it('should retry failed requests', async () => {
    let attempts = 0;
    global.fetch = vi.fn(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      } as Response);
    });

    const result = await client.get('/test');
    expect(result).toEqual({ data: 'test' });
    expect(attempts).toBe(3);
  });

  it('should cache responses', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      } as Response)
    );

    await client.get('/test', { cache: true });
    await client.get('/test', { cache: true });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle timeouts', async () => {
    global.fetch = vi.fn(() =>
      new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response), 10000))
    );

    await expect(client.get('/test', { timeout: 1000 })).rejects.toThrow();
  });
});
