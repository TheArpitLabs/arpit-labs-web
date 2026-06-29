/**
 * Enhanced API client with retry logic, caching, and error handling
 */

import { handleError } from '../error-handler';
import { logApiRequest } from '../logging/structured-logger';
import { withCache } from '../cache/api-cache';

export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  enableCache?: boolean;
  cacheTimeout?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  cached: boolean;
}

class ApiClient {
  private options: ApiClientOptions;

  constructor(options: ApiClientOptions = {}) {
    this.options = {
      baseUrl: '',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      enableCache: false,
      cacheTimeout: 60000,
      headers: {},
      ...options,
    };
  }

  /**
   * Build full URL
   */
  private buildUrl(endpoint: string): string {
    const baseUrl = this.options.baseUrl || '';
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Build cache key
   */
  private buildCacheKey(method: string, url: string, body?: any): string {
    return `${method}:${url}:${JSON.stringify(body)}`;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options: {
      headers?: Record<string, string>;
      timeout?: number;
      retries?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const startTime = Date.now();
    let lastError: Error | null = null;

    // Check cache for GET requests
    if (method === 'GET' && this.options.enableCache && !options.skipCache) {
      const cacheKey = this.buildCacheKey(method, url);
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return {
          data: cached,
          status: 200,
          headers: new Headers(),
          cached: true,
        };
      }
    }

    // Retry logic
    const maxRetries = options.retries ?? this.options.retries ?? 3;
    const retryDelay = this.options.retryDelay ?? 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(
          url,
          {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...this.options.headers,
              ...options.headers,
            },
            body: data ? JSON.stringify(data) : undefined,
          },
          options.timeout ?? this.options.timeout ?? 30000
        );

        const duration = Date.now() - startTime;

        // Log API request
        logApiRequest(method, endpoint, response.status, duration);

        // Handle error responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const responseData = await response.json();

        // Cache successful GET requests
        if (method === 'GET' && this.options.enableCache && !options.skipCache) {
          const cacheKey = this.buildCacheKey(method, url);
          this.setCache(cacheKey, responseData);
        }

        return {
          data: responseData,
          status: response.status,
          headers: response.headers,
          cached: false,
        };

      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw error;
        }

        // Wait before retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get from cache
   */
  private getFromCache<T>(key: string): T | null {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    try {
      const item = JSON.parse(cached);
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return item.data as T;
    } catch {
      return null;
    }
  }

  /**
   * Set cache
   */
  private setCache(key: string, data: any): void {
    const item = {
      data,
      expiry: Date.now() + (this.options.cacheTimeout ?? 60000),
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('http:')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: { headers?: Record<string, string>; skipCache?: boolean }): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  /**
   * Set default header
   */
  setHeader(key: string, value: string): void {
    if (this.options.headers) {
      this.options.headers[key] = value;
    }
  }

  /**
   * Remove default header
   */
  removeHeader(key: string): void {
    if (this.options.headers) {
      delete this.options.headers[key];
    }
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.setHeader('Authorization', `Bearer ${token}`);
  }

  /**
   * Remove authentication token
   */
  removeAuthToken(): void {
    this.removeHeader('Authorization');
  }
}

// Create default API client instance
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  enableCache: true,
  cacheTimeout: 60000,
});

/**
 * Create custom API client
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}

/**
 * API request decorator with error handling
 */
export function withApiHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const handled = handleError(error as Error);
      throw new Error(handled.message);
    }
  }) as T;
}

/**
 * Batch API requests
 */
export async function batchRequests<T>(
  requests: Array<() => Promise<ApiResponse<T>>>
): Promise<ApiResponse<T>[]> {
  return Promise.all(requests.map(req => req()));
}

/**
 * Sequential API requests
 */
export async function sequentialRequests<T>(
  requests: Array<() => Promise<ApiResponse<T>>>
): Promise<ApiResponse<T>[]> {
  const results: ApiResponse<T>[] = [];

  for (const request of requests) {
    try {
      const result = await request();
      results.push(result);
    } catch (error) {
      results.push({
        data: null as T,
        status: 500,
        headers: new Headers(),
        cached: false,
      });
    }
  }

  return results;
}

/**
 * Request with progress tracking
 */
export async function requestWithProgress<T>(
  request: () => Promise<ApiResponse<T>>,
  onProgress: (progress: number) => void
): Promise<ApiResponse<T>> {
  // Simulate progress for demonstration
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 10;
    if (progress < 100) {
      onProgress(progress);
    }
  }, 100);

  try {
    const result = await request();
    clearInterval(progressInterval);
    onProgress(100);
    return result;
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
}
