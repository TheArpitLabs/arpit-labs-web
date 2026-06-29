/**
 * API Request Batching
 * Batches multiple API requests into a single request
 */

export interface BatchRequest<T> {
  id: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: T;
}

export interface BatchResponse<T> {
  id: string;
  status: number;
  statusText: string;
  headers?: Record<string, string>;
  data?: T;
  error?: string;
}

export interface BatchOptions {
  maxBatchSize?: number;
  maxWaitTime?: number;
  batchEndpoint?: string;
}

class APIBatcher {
  private queue: BatchRequest<any>[] = [];
  private config: Required<BatchOptions>;
  private timer: NodeJS.Timeout | null = null;

  constructor(config: BatchOptions = {}) {
    this.config = {
      maxBatchSize: 10,
      maxWaitTime: 100,
      batchEndpoint: '/api/batch',
      ...config,
    };
  }

  /**
   * Adds a request to the batch queue
   */
  async add<T>(request: BatchRequest<T>): Promise<BatchResponse<T>> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        ...request,
        resolve: resolve as any,
        reject: reject as any,
      } as any);

      // Check if we should flush
      if (this.queue.length >= this.config.maxBatchSize) {
        this.flush();
      } else {
        this.scheduleFlush();
      }
    });
  }

  /**
   * Schedules a batch flush
   */
  private scheduleFlush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flush();
    }, this.config.maxWaitTime);
  }

  /**
   * Flushes the batch queue
   */
  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0, this.config.maxBatchSize);

    try {
      const responses = await this.executeBatch(batch);

      for (let i = 0; i < batch.length; i++) {
        const request = batch[i] as any;
        const response = responses[i];

        if (response.error) {
          request.reject(new Error(response.error));
        } else {
          request.resolve(response);
        }
      }
    } catch (error) {
      for (const request of batch as any[]) {
        request.reject(error);
      }
    }
  }

  /**
   * Executes a batch of requests
   */
  private async executeBatch<T>(requests: BatchRequest<T>[]): Promise<BatchResponse<T>[]> {
    // In a real implementation, this would send to a batch endpoint
    // For now, execute requests individually
    const responses: BatchResponse<T>[] = [];

    for (const request of requests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        const data = response.ok && response.headers.get('content-type')?.includes('json')
          ? await response.json()
          : undefined;

        responses.push({
          id: request.id,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data,
        });
      } catch (error) {
        responses.push({
          id: request.id,
          status: 0,
          statusText: 'Network Error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return responses;
  }

  /**
   * Gets queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clears the queue
   */
  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Reject all pending requests
    for (const request of this.queue as any[]) {
      request.reject(new Error('Batch cleared'));
    }

    this.queue = [];
  }
}

// Create singleton instance
const apiBatcher = new APIBatcher();

/**
 * Adds a request to the batch
 */
export async function addBatchRequest<T>(request: BatchRequest<T>): Promise<BatchResponse<T>> {
  return apiBatcher.add(request);
}

/**
 * Gets batch queue size
 */
export function getBatchQueueSize(): number {
  return apiBatcher.getQueueSize();
}

/**
 * Clears the batch queue
 */
export function clearBatchQueue(): void {
  apiBatcher.clear();
}

/**
 * Middleware for batch request handling
 */
export function batchRequestMiddleware(config: BatchOptions = {}) {
  const batcher = new APIBatcher(config);

  return async (request: Request): Promise<Response | null> => {
    const url = new URL(request.url);

    if (url.pathname === config.batchEndpoint || url.pathname === '/api/batch') {
      const body = await request.json();
      const requests = body.requests as BatchRequest<any>[];

      const responses = await batcher['executeBatch'](requests);

      return new Response(JSON.stringify({ responses }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return null;
  };
}

export default apiBatcher;
