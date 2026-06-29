/**
 * Request Batching
 * Batches multiple requests into a single request for efficiency
 */

export interface BatchConfig {
  maxBatchSize?: number;
  maxWaitTime?: number;
  batchKey?: (request: any) => string;
}

export interface BatchItem<T> {
  request: T;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export interface BatchResult<T> {
  requests: T[];
  results: any[];
  errors: any[];
}

/**
 * Request batcher
 */
export class RequestBatcher<T> {
  private batches = new Map<string, BatchItem<T>[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  private config: Required<BatchConfig>;

  constructor(
    private batchFn: (requests: T[]) => Promise<BatchResult<T>>,
    config: BatchConfig = {}
  ) {
    this.config = {
      maxBatchSize: 10,
      maxWaitTime: 100,
      batchKey: () => 'default',
      ...config,
    };
  }

  /**
   * Adds a request to a batch
   */
  async add(request: T): Promise<any> {
    return new Promise((resolve, reject) => {
      const key = this.config.batchKey(request);
      const batch = this.batches.get(key) || [];

      batch.push({ request, resolve, reject });
      this.batches.set(key, batch);

      // Check if batch is full
      if (batch.length >= this.config.maxBatchSize) {
        this.flush(key);
      } else {
        // Set timer to flush after max wait time
        this.scheduleFlush(key);
      }
    });
  }

  /**
   * Schedules a batch flush
   */
  private scheduleFlush(key: string): void {
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.flush(key);
    }, this.config.maxWaitTime);

    this.timers.set(key, timer);
  }

  /**
   * Flushes a batch
   */
  private async flush(key: string): Promise<void> {
    // Clear timer
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }

    // Get batch
    const batch = this.batches.get(key);
    if (!batch || batch.length === 0) {
      return;
    }

    // Remove batch from map
    this.batches.delete(key);

    // Execute batch
    try {
      const requests = batch.map((item) => item.request);
      const result = await this.batchFn(requests);

      // Resolve/reject individual items
      result.results.forEach((value, index) => {
        if (result.errors[index]) {
          batch[index].reject(result.errors[index]);
        } else {
          batch[index].resolve(value);
        }
      });
    } catch (error) {
      // Reject all items if batch fails
      batch.forEach((item) => {
        item.reject(error);
      });
    }
  }

  /**
   * Flushes all batches
   */
  async flushAll(): Promise<void> {
    const keys = Array.from(this.batches.keys());
    await Promise.all(keys.map((key) => this.flush(key)));
  }

  /**
   * Gets batch statistics
   */
  getStats(): { pendingBatches: number; totalPendingRequests: number } {
    let totalPendingRequests = 0;
    for (const batch of this.batches.values()) {
      totalPendingRequests += batch.length;
    }

    return {
      pendingBatches: this.batches.size,
      totalPendingRequests,
    };
  }

  /**
   * Clears all batches
   */
  clear(): void {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Reject all pending requests
    for (const batch of this.batches.values()) {
      batch.forEach((item) => {
        item.reject(new Error('Batch cleared'));
      });
    }
    this.batches.clear();
  }
}

/**
 * Batch registry for managing multiple batchers
 */
class BatchRegistry {
  private batchers = new Map<string, RequestBatcher<any>>();

  /**
   * Registers a batcher
   */
  register<T>(
    key: string,
    batchFn: (requests: T[]) => Promise<BatchResult<T>>,
    config?: BatchConfig
  ): RequestBatcher<T> {
    const batcher = new RequestBatcher(batchFn, config);
    this.batchers.set(key, batcher);
    return batcher;
  }

  /**
   * Gets a batcher
   */
  get<T>(key: string): RequestBatcher<T> | undefined {
    return this.batchers.get(key);
  }

  /**
   * Removes a batcher
   */
  remove(key: string): void {
    const batcher = this.batchers.get(key);
    if (batcher) {
      batcher.clear();
    }
    this.batchers.delete(key);
  }

  /**
   * Clears all batchers
   */
  clear(): void {
    for (const batcher of this.batchers.values()) {
      batcher.clear();
    }
    this.batchers.clear();
  }
}

// Create singleton registry
const registry = new BatchRegistry();

/**
 * Registers a request batcher
 */
export function registerBatcher<T>(
  key: string,
  batchFn: (requests: T[]) => Promise<BatchResult<T>>,
  config?: BatchConfig
): RequestBatcher<T> {
  return registry.register(key, batchFn, config);
}

/**
 * Gets a request batcher
 */
export function getBatcher<T>(key: string): RequestBatcher<T> | undefined {
  return registry.get(key);
}

/**
 * Removes a request batcher
 */
export function removeBatcher(key: string): void {
  registry.remove(key);
}

/**
 * Clears all request batchers
 */
export function clearAllBatchers(): void {
  registry.clear();
}

/**
 * Helper function to batch HTTP requests
 */
export async function batchHttpRequests(
  requests: Array<{ url: string; options?: RequestInit }>
): Promise<BatchResult<{ url: string; options?: RequestInit }>> {
  const results: any[] = [];
  const errors: any[] = [];

  await Promise.all(
    requests.map(async (request, index) => {
      try {
        const response = await fetch(request.url, request.options);
        results[index] = response;
      } catch (error) {
        errors[index] = error;
      }
    })
  );

  return {
    requests,
    results,
    errors,
  };
}
