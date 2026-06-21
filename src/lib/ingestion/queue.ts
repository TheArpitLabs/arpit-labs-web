/**
 * Asynchronous Ingestion Queue with Dynamic Throttling
 * 
 * This module implements a queue manager using BullMQ and ioredis to:
 * - Decouple background crawlers from the Next.js runtime process
 * - Configure worker concurrency dynamically based on API constraints
 * - Implement robust exponential backoff retry parameters
 * - Handle SCM rate-limiting gracefully
 * - Prevent Redis database bloating
 */

import { Queue, Worker, Job, QueueOptions, WorkerOptions } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface IngestionJobData {
  url: string;
  provider: string;
  priority?: number;
  attempts?: number;
  metadata?: Record<string, any>;
}

export interface QueueConfig {
  connection: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  concurrency: {
    maxWorkers: number;
    rateLimit: number; // requests per second
    avgJobLatency: number; // milliseconds
  };
  retry: {
    initialDelay: number; // milliseconds
    maxAttempts: number;
    backoffMultiplier: number;
  };
}

// ============================================================================
// QUEUE CONFIGURATION
// ============================================================================

const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  concurrency: {
    maxWorkers: 5,
    rateLimit: 10, // 10 requests per second default
    avgJobLatency: 1000, // 1 second default
  },
  retry: {
    initialDelay: 5000, // 5 seconds
    maxAttempts: 5,
    backoffMultiplier: 2,
  },
};

// ============================================================================
// DYNAMIC CONCURRENCY CALCULATION
// ============================================================================

/**
 * Calculate optimal concurrency based on rate limits and job latency
 * 
 * Formula: Optimal Concurrency = ceil(R * (T_job / 1000) * 1.2)
 * Where:
 * - R is the rate limit in requests/sec
 * - T_job is the average job execution latency in milliseconds
 * - 1.2 is a safety factor for variance
 */
export function calculateOptimalConcurrency(
  rateLimit: number,
  avgJobLatency: number
): number {
  const optimalConcurrency = Math.ceil(rateLimit * (avgJobLatency / 1000) * 1.2);
  
  // Ensure at least 1 worker and no more than 20 to prevent overwhelming
  return Math.max(1, Math.min(optimalConcurrency, 20));
}

// ============================================================================
// QUEUE MANAGER
// ============================================================================

export class IngestionQueueManager {
  private queue: Queue;
  private worker: Worker | null = null;
  private redis: Redis;
  private config: QueueConfig;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
    
    this.redis = new Redis(this.config.connection);
    
    const queueOptions: QueueOptions = {
      connection: this.config.connection,
      defaultJobOptions: {
        removeOnComplete: { age: 86400 }, // Remove completed jobs after 24 hours
        removeOnFail: { age: 604800 }, // Remove failed jobs after 7 days
        attempts: this.config.retry.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: this.config.retry.initialDelay,
        },
      },
    };

    this.queue = new Queue('ingestion-queue', queueOptions);
  }

  /**
   * Add a job to the ingestion queue
   */
  async addJob(data: IngestionJobData, options?: { priority?: number }): Promise<Job> {
    const jobOptions = {
      priority: options?.priority || 0,
      attempts: data.attempts || this.config.retry.maxAttempts,
    };

    return await this.queue.add('process-ingestion', data, jobOptions);
  }

  /**
   * Add multiple jobs in bulk
   */
  async addBulkJobs(jobs: IngestionJobData[]): Promise<Job[]> {
    const jobData = jobs.map((job, index) => ({
      name: 'process-ingestion',
      data: job,
      opts: {
        priority: job.priority || 0,
        attempts: job.attempts || this.config.retry.maxAttempts,
      },
    }));

    return await this.queue.addBulk(jobData);
  }

  /**
   * Start the worker with dynamic concurrency
   */
  async startWorker(processor: (job: Job) => Promise<void>): Promise<void> {
    if (this.worker) {
      console.warn('Worker is already running');
      return;
    }

    // Calculate optimal concurrency
    const optimalConcurrency = calculateOptimalConcurrency(
      this.config.concurrency.rateLimit,
      this.config.concurrency.avgJobLatency
    );

    logger.debug(`Starting worker with concurrency: ${optimalConcurrency}`);

    const workerOptions: WorkerOptions = {
      connection: this.config.connection,
      concurrency: optimalConcurrency,
      limiter: {
        max: this.config.concurrency.rateLimit,
        duration: 1000, // per second
      },
    };

    this.worker = new Worker(
      'ingestion-queue',
      async (job: Job) => {
        try {
          await processor(job);
        } catch (error) {
          console.error(`Job ${job.id} failed:`, error);
          
          // Check if it's a rate limit error
          if (this.isRateLimitError(error)) {
            await this.handleRateLimit(error);
          }
          
          throw error;
        }
      },
      workerOptions
    );

    this.worker.on('completed', (job: Job) => {
      logger.debug(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job: Job | undefined, error: Error) => {
      console.error(`Job ${job?.id} failed:`, error.message);
    });

    this.worker.on('error', (error: Error) => {
      console.error('Worker error:', error);
    });
  }

  /**
   * Stop the worker gracefully
   */
  async stopWorker(): Promise<void> {
    if (!this.worker) {
      console.warn('No worker is running');
      return;
    }

    await this.worker.close();
    this.worker = null;
    logger.debug('Worker stopped');
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    await this.queue.pause();
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    await this.queue.resume();
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    await this.stopWorker();
    await this.queue.close();
    await this.redis.quit();
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: any): boolean {
    if (error?.statusCode === 429 || error?.statusCode === 403) {
      return true;
    }
    if (error?.message?.includes('rate limit')) {
      return true;
    }
    return false;
  }

  /**
   * Handle rate limit errors by reading headers and pausing
   */
  private async handleRateLimit(error: any): Promise<void> {
    let resetTime = 0;

    // Try to extract reset time from headers
    if (error?.response?.headers) {
      const resetHeader = error.response.headers.get('x-ratelimit-reset');
      const retryAfterHeader = error.response.headers.get('retry-after');

      if (resetHeader) {
        resetTime = parseInt(resetHeader) * 1000; // Convert to milliseconds
      } else if (retryAfterHeader) {
        resetTime = Date.now() + parseInt(retryAfterHeader) * 1000;
      }
    }

    // Default to 60 seconds if no header found
    if (resetTime === 0) {
      resetTime = Date.now() + 60000;
    }

    const waitTime = Math.max(0, resetTime - Date.now());
    logger.warn(`Rate limit hit. Pausing for ${waitTime}ms`);

    // Pause the queue temporarily
    await this.pause();

    // Resume after the reset time
    setTimeout(async () => {
      await this.resume();
    }, waitTime);
  }

  /**
   * Update configuration dynamically
   */
  async updateConfig(newConfig: Partial<QueueConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    // Restart worker with new configuration if it's running
    if (this.worker) {
      await this.stopWorker();
      // Note: The caller needs to restart the worker with the new processor
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let queueManagerInstance: IngestionQueueManager | null = null;

export function getQueueManager(): IngestionQueueManager {
  if (!queueManagerInstance) {
    queueManagerInstance = new IngestionQueueManager();
  }
  return queueManagerInstance;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  attempt: number,
  initialDelay: number,
  multiplier: number
): number {
  return initialDelay * Math.pow(multiplier, attempt - 1);
}

/**
 * Validate Redis connection
 */
export async function validateRedisConnection(config: QueueConfig['connection']): Promise<boolean> {
  try {
    const redis = new Redis(config);
    await redis.ping();
    await redis.quit();
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}
