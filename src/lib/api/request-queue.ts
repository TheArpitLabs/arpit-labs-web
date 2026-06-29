/**
 * API Request Queuing
 * Queues API requests for controlled processing
 */

export interface QueueConfig {
  maxConcurrent?: number;
  maxQueueSize?: number;
  timeout?: number;
  priority?: boolean;
}

export interface QueuedRequest<T = any> {
  id: string;
  request: Request;
  resolve: (value: Response) => void;
  reject: (reason?: any) => void;
  priority?: number;
  timestamp: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private activeRequests = 0;
  private config: Required<QueueConfig>;
  private processing = false;

  constructor(config: QueueConfig = {}) {
    this.config = {
      maxConcurrent: 10,
      maxQueueSize: 1000,
      timeout: 30000,
      priority: false,
      ...config,
    };
  }

  /**
   * Adds a request to the queue
   */
  async add<T = any>(
    request: Request,
    options?: { priority?: number }
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const id = `req-${Date.now()}-${Math.random().toString(36).substring(2)}`;

      // Check queue size
      if (this.queue.length >= this.config.maxQueueSize) {
        reject(new Error('Queue is full'));
        return;
      }

      const queuedRequest: QueuedRequest = {
        id,
        request,
        resolve,
        reject,
        priority: options?.priority || 0,
        timestamp: Date.now(),
      };

      this.queue.push(queuedRequest);

      if (this.config.priority) {
        this.sortQueue();
      }

      this.process();
    });
  }

  /**
   * Sorts queue by priority
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      if (b.priority !== undefined && a.priority !== undefined) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Processes the queue
   */
  private async process(): Promise<void> {
    if (this.processing) return;
    if (this.activeRequests >= this.config.maxConcurrent) return;
    if (this.queue.length === 0) return;

    this.processing = true;

    while (
      this.queue.length > 0 &&
      this.activeRequests < this.config.maxConcurrent
    ) {
      const queuedRequest = this.queue.shift();
      if (!queuedRequest) break;

      this.activeRequests++;

      // Process request
      this.processRequest(queuedRequest).finally(() => {
        this.activeRequests--;
        this.process();
      });
    }

    this.processing = false;
  }

  /**
   * Processes a single request
   */
  private async processRequest(queuedRequest: QueuedRequest): Promise<void> {
    const { request, resolve, reject } = queuedRequest;

    try {
      // Add timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.config.timeout);
      });

      const response = await Promise.race([fetch(request), timeoutPromise]);
      resolve(response);
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Gets queue statistics
   */
  getStats(): {
    queueSize: number;
    activeRequests: number;
    maxConcurrent: number;
    maxQueueSize: number;
  } {
    return {
      queueSize: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.config.maxConcurrent,
      maxQueueSize: this.config.maxQueueSize,
    };
  }

  /**
   * Clears the queue
   */
  clear(): void {
    // Reject all pending requests
    for (const queuedRequest of this.queue) {
      queuedRequest.reject(new Error('Queue cleared'));
    }
    this.queue = [];
  }

  /**
   * Pauses queue processing
   */
  pause(): void {
    this.processing = true;
  }

  /**
   * Resumes queue processing
   */
  resume(): void {
    this.processing = false;
    this.process();
  }

  /**
   * Updates configuration
   */
  updateConfig(config: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create singleton instance
let requestQueue: RequestQueue | null = null;

/**
 * Initializes request queue
 */
export function initializeRequestQueue(config: QueueConfig): void {
  requestQueue = new RequestQueue(config);
}

/**
 * Adds request to queue
 */
export async function queueRequest(
  request: Request,
  options?: { priority?: number }
): Promise<Response> {
  if (!requestQueue) {
    requestQueue = new RequestQueue();
  }
  return requestQueue.add(request, options);
}

/**
 * Gets queue statistics
 */
export function getQueueStats() {
  if (!requestQueue) return null;
  return requestQueue.getStats();
}

/**
 * Clears queue
 */
export function clearRequestQueue(): void {
  if (requestQueue) {
    requestQueue.clear();
  }
}

/**
 * Pauses queue processing
 */
export function pauseRequestQueue(): void {
  if (requestQueue) {
    requestQueue.pause();
  }
}

/**
 * Resumes queue processing
 */
export function resumeRequestQueue(): void {
  if (requestQueue) {
    requestQueue.resume();
  }
}

/**
 * Middleware for request queuing
 */
export function requestQueueMiddleware(config?: QueueConfig) {
  const queue = config ? new RequestQueue(config) : new RequestQueue();

  return async (request: Request): Promise<Response | null> => {
    return queue.add(request);
  };
}

export default requestQueue;
