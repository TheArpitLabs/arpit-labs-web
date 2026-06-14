/**
 * Queue Manager for Background Jobs
 * Handles job scheduling, processing, and monitoring
 */

export interface Job {
  id: string;
  type: string;
  payload: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

export interface JobHandler {
  type: string;
  handler: (job: Job) => Promise<any>;
}

class QueueManager {
  private queues: Map<string, Job[]> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing: Set<string> = new Set();
  private isRunning: boolean = false;

  /**
   * Register a job handler
   */
  registerHandler(handler: JobHandler): void {
    this.handlers.set(handler.type, handler);
  }

  /**
   * Add a job to the queue
   */
  async addJob(type: string, payload: any, priority: Job['priority'] = 'medium'): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Job = {
      id: jobId,
      type,
      payload,
      priority,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      scheduledAt: new Date(),
    };

    const queue = this.queues.get(type) || [];
    queue.push(job);
    
    // Sort by priority
    queue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    this.queues.set(type, queue);
    
    return jobId;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Job | null {
    for (const queue of this.queues.values()) {
      const job = queue.find(j => j.id === jobId);
      if (job) return job;
    }
    return null;
  }

  /**
   * Start processing jobs
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[QueueManager] Starting job processing...');
    
    this.process();
  }

  /**
   * Stop processing jobs
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('[QueueManager] Stopping job processing...');
    
    // Wait for current jobs to complete
    while (this.processing.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Process jobs
   */
  private async process(): Promise<void> {
    while (this.isRunning) {
      try {
        for (const [type, queue] of this.queues.entries()) {
          const pendingJob = queue.find(j => j.status === 'pending');
          
          if (pendingJob && !this.processing.has(pendingJob.id)) {
            this.processing.add(pendingJob.id);
            this.processJob(pendingJob, type).finally(() => {
              this.processing.delete(pendingJob.id);
            });
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('[QueueManager] Error in process loop:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job, queueType: string): Promise<void> {
    const handler = this.handlers.get(job.type);
    
    if (!handler) {
      console.error(`[QueueManager] No handler for job type: ${job.type}`);
      job.status = 'failed';
      job.error = 'No handler registered';
      return;
    }

    job.status = 'processing';
    job.startedAt = new Date();
    job.attempts++;

    try {
      console.log(`[QueueManager] Processing job ${job.id} (${job.type})`);
      const result = await handler.handler(job);
      
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      
      console.log(`[QueueManager] Completed job ${job.id}`);
    } catch (error) {
      console.error(`[QueueManager] Job ${job.id} failed:`, error);
      
      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : String(error);
        job.completedAt = new Date();
      } else {
        job.status = 'pending';
        // Exponential backoff
        const backoffMs = Math.pow(2, job.attempts) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {
      totalJobs: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      byType: {},
    };

    for (const [type, queue] of this.queues.entries()) {
      const typeStats = {
        total: queue.length,
        pending: queue.filter(j => j.status === 'pending').length,
        processing: queue.filter(j => j.status === 'processing').length,
        completed: queue.filter(j => j.status === 'completed').length,
        failed: queue.filter(j => j.status === 'failed').length,
      };

      stats.byType[type] = typeStats;
      stats.totalJobs += typeStats.total;
      stats.pending += typeStats.pending;
      stats.processing += typeStats.processing;
      stats.completed += typeStats.completed;
      stats.failed += typeStats.failed;
    }

    return stats;
  }

  /**
   * Clear completed jobs
   */
  clearCompleted(): void {
    for (const [type, queue] of this.queues.entries()) {
      const filtered = queue.filter(j => j.status !== 'completed');
      this.queues.set(type, filtered);
    }
  }

  /**
   * Clear failed jobs
   */
  clearFailed(): void {
    for (const [type, queue] of this.queues.entries()) {
      const filtered = queue.filter(j => j.status !== 'failed');
      this.queues.set(type, filtered);
    }
  }
}

// Singleton instance
export const queueManager = new QueueManager();
