/**
 * Queue Manager
 * 
 * Manages BullMQ queues for job processing with retry logic and dead letter queues
 */

import { Queue, Worker, Job, QueueOptions } from 'bullmq';
import { JobType, JobData, JobResult, QueueConfig, QueueHealth, RetryConfig, DeadLetterConfig } from './types';
import { supabaseServer } from '@/lib/supabase/server';
import { getAcquisitionProcessor } from '../acquisition-layer/acquisition-processor';

export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private config: QueueConfig;

  constructor(config: QueueConfig) {
    this.config = config;
  }

  /**
   * Initialize all queues
   */
  async initializeQueues(): Promise<void> {
    const queueNames: JobType[] = [
      'fetch',
      'analyze',
      'enrich',
      'quality_check',
      'moderate',
      'publish',
      'deduplicate',
      'compliance_check',
    ];

    for (const queueName of queueNames) {
      await this.createQueue(queueName);
    }
  }

  /**
   * Create a specific queue
   */
  private async createQueue(queueName: JobType): Promise<void> {
    if (this.queues.has(queueName)) {
      return;
    }

    const queueOptions: QueueOptions = {
      connection: {
        host: this.config.connection.host,
        port: this.config.connection.port,
        password: this.config.connection.password,
        db: this.config.connection.db || 0,
      },
      defaultJobOptions: {
        attempts: this.config.defaultJobOptions?.attempts || 3,
        backoff: this.config.defaultJobOptions?.backoff || {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: this.config.defaultJobOptions?.removeOnComplete || 100,
        removeOnFail: this.config.defaultJobOptions?.removeOnFail || 50,
      },
    };

    const queue = new Queue(queueName, queueOptions);
    this.queues.set(queueName, queue);
  }

  /**
   * Initialize workers for processing jobs
   */
  async initializeWorkers(): Promise<void> {
    const workerConfigs: Array<{ queueName: JobType; concurrency: number }> = [
      { queueName: 'fetch', concurrency: 5 },
      { queueName: 'analyze', concurrency: 3 },
      { queueName: 'enrich', concurrency: 2 },
      { queueName: 'quality_check', concurrency: 3 },
      { queueName: 'moderate', concurrency: 2 },
      { queueName: 'publish', concurrency: 2 },
      { queueName: 'deduplicate', concurrency: 3 },
      { queueName: 'compliance_check', concurrency: 3 },
    ];

    for (const config of workerConfigs) {
      await this.createWorker(config.queueName, config.concurrency);
    }
  }

  /**
   * Create a worker for a specific queue
   */
  private async createWorker(queueName: JobType, concurrency: number): Promise<void> {
    if (this.workers.has(queueName)) {
      return;
    }

    const worker = new Worker(
      queueName,
      async (job: Job) => {
        return await this.processJob(job);
      },
      {
        connection: {
          host: this.config.connection.host,
          port: this.config.connection.port,
          password: this.config.connection.password,
          db: this.config.connection.db || 0,
        },
        concurrency,
      }
    );

    worker.on('completed', (job: Job, result: JobResult) => {
      console.log(`Job ${job.id} in queue ${queueName} completed:`, result);
    });

    worker.on('failed', (job: Job | undefined, error: Error) => {
      console.error(`Job ${job?.id} in queue ${queueName} failed:`, error);
    });

    this.workers.set(queueName, worker);
  }

  /**
   * Process a job
   */
  private async processJob(job: Job<JobData>): Promise<JobResult> {
    const startTime = Date.now();
    const { queueItemId, jobType, metadata } = job.data;

    try {
      // Update job status in database
      await this.updateJobStatus(job.id!, 'active');

      let result: JobResult;

      switch (jobType) {
        case 'fetch':
          result = await this.processFetchJob(queueItemId, metadata);
          break;
        case 'analyze':
          result = await this.processAnalyzeJob(queueItemId, metadata);
          break;
        case 'enrich':
          result = await this.processEnrichJob(queueItemId, metadata);
          break;
        case 'quality_check':
          result = await this.processQualityCheckJob(queueItemId, metadata);
          break;
        case 'moderate':
          result = await this.processModerateJob(queueItemId, metadata);
          break;
        case 'publish':
          result = await this.processPublishJob(queueItemId, metadata);
          break;
        case 'deduplicate':
          result = await this.processDeduplicateJob(queueItemId, metadata);
          break;
        case 'compliance_check':
          result = await this.processComplianceCheckJob(queueItemId, metadata);
          break;
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }

      // Update job status to completed
      await this.updateJobStatus(job.id!, 'completed', result);

      return result;

    } catch (error) {
      const errorResult: JobResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };

      // Update job status to failed
      await this.updateJobStatus(job.id!, 'failed', errorResult);

      throw error;
    }
  }

  /**
   * Process fetch job
   */
  private async processFetchJob(queueItemId: string, metadata?: Record<string, unknown>): Promise<JobResult> {
    const processor = getAcquisitionProcessor();
    const result = await processor.processItem(queueItemId);

    return {
      success: result.success,
      data: result.data,
      error: result.error,
      processingTime: result.metadata.processingTime,
    };
  }

  /**
   * Process analyze job
   */
  private async processAnalyzeJob(queueItemId: string, metadata?: Record<string, unknown>): Promise<JobResult> {
    // This will be implemented in the AI Enrichment Engine
    const startTime = Date.now();

    // Placeholder for now
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      data: { analyzed: true },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Process enrich job
   */
  private async processEnrichJob(queueItemId: string, metadata?: Record<string, unknown>): Promise<JobResult> {
    // This will be implemented in the AI Enrichment Engine
    const startTime = Date.now();

    // Placeholder for now
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      data: { enriched: true },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Process quality check job
   */
  private async processQualityCheckJob(queueItemId: string, metadata?: Record<string, unknown>): Promise<JobResult> {
    // This will be implemented in the Quality Scoring Engine
    const startTime = Date.now();

    // Placeholder for now
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      data: { qualityChecked: true },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Process moderate job
   */
  private async processModerateJob(queueItemId: string, metadata?: Record<string, unknown>): Promise<JobResult> {
    // This will be implemented in the Moderation Layer
    const startTime = Date.now();

    // Placeholder for now
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      data: { moderated: true },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Process publish job
   */
  private async processPublishJob(queueItemId: string, metadata?: Record<string, unknown>): Promise<JobResult> {
    const startTime = Date.now();

    // Update queue item status to published
    const { error } = await supabaseServer
      .from('content_acquisition_queue')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', queueItemId);

    if (error) {
      throw new Error(`Failed to publish item: ${error.message}`);
    }

    return {
      success: true,
      data: { published: true },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Process deduplicate job
   */
  private async processDeduplicateJob(queueItemId: string, metadata?: Record<string, unknown>): Promise<JobResult> {
    // This will be implemented in the Deduplication Engine
    const startTime = Date.now();

    // Placeholder for now
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      data: { deduplicated: true },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Process compliance check job
   */
  private async processComplianceCheckJob(queueItemId: string, metadata?: Record<string, unknown>): Promise<JobResult> {
    // This will be implemented in the Compliance Engine
    const startTime = Date.now();

    // Placeholder for now
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      data: { complianceChecked: true },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Add a job to a queue
   */
  async addJob(queueName: JobType, data: JobData): Promise<Job> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    // Store job in database
    await this.storeJobInDatabase(queueName, data);

    return await queue.add(queueName, data, {
      priority: data.priority || 0,
      delay: data.delay || 0,
    });
  }

  /**
   * Add multiple jobs to a queue
   */
  async addBulkJobs(queueName: JobType, jobs: JobData[]): Promise<Job[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    // Store jobs in database
    await Promise.all(jobs.map(job => this.storeJobInDatabase(queueName, job)));

    return await queue.addBulk(
      jobs.map(job => ({
        name: queueName,
        data: job,
        opts: {
          priority: job.priority || 0,
          delay: job.delay || 0,
        },
      }))
    );
  }

  /**
   * Store job in database
   */
  private async storeJobInDatabase(queueName: JobType, data: JobData): Promise<void> {
    const { error } = await supabaseServer
      .from('acquisition_jobs')
      .insert({
        queue_id: data.queueItemId,
        job_type: queueName,
        status: 'pending',
        priority: data.priority || 0,
        data: data.metadata || {},
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`Failed to store job in database: ${error.message}`);
    }
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(jobId: string, status: string, result?: JobResult): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'active') {
      updateData.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
      if (result) {
        updateData.result = result;
      }
    }

    const { error } = await supabaseServer
      .from('acquisition_jobs')
      .update(updateData)
      .eq('job_id', jobId);

    if (error) {
      console.error(`Failed to update job status in database: ${error.message}`);
    }
  }

  /**
   * Get queue health
   */
  async getQueueHealth(queueName: JobType): Promise<QueueHealth> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      queueName,
      pendingJobs: waiting.length,
      activeJobs: active.length,
      completedJobs: completed.length,
      failedJobs: failed.length,
      delayedJobs: delayed.length,
      avgProcessingTime: 0, // Calculate from database
      lastJobCompletedAt: null, // Get from database
    };
  }

  /**
   * Get all queue health
   */
  async getAllQueueHealth(): Promise<Record<string, QueueHealth>> {
    const queueNames: JobType[] = [
      'fetch',
      'analyze',
      'enrich',
      'quality_check',
      'moderate',
      'publish',
      'deduplicate',
      'compliance_check',
    ];

    const healthPromises = queueNames.map(name => this.getQueueHealth(name));
    const healthResults = await Promise.all(healthPromises);

    const healthMap: Record<string, QueueHealth> = {};
    healthResults.forEach((health, index) => {
      healthMap[queueNames[index]] = health;
    });

    return healthMap;
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: JobType): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: JobType): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
  }

  /**
   * Clear a queue
   */
  async clearQueue(queueName: JobType): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.drain();
    await queue.clean(0, 0, 'active');
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    // Close all workers
    for (const [name, worker] of this.workers.entries()) {
      await worker.close();
      console.log(`Worker ${name} closed`);
    }

    // Close all queues
    for (const [name, queue] of this.queues.entries()) {
      await queue.close();
      console.log(`Queue ${name} closed`);
    }
  }
}

// Singleton instance
let queueManagerInstance: QueueManager | null = null;

export function getQueueManager(config?: QueueConfig): QueueManager {
  if (!queueManagerInstance) {
    const defaultConfig: QueueConfig = {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    };

    queueManagerInstance = new QueueManager(config || defaultConfig);
  }
  return queueManagerInstance;
}
