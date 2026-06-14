/**
 * Background Job Scheduler
 * Manages scheduled and recurring background tasks
 */

import { queueManager } from './queue-manager';

export interface ScheduleConfig {
  interval: number; // milliseconds
  immediate?: boolean;
}

export interface RecurringJob {
  name: string;
  handler: () => Promise<void>;
  interval: number;
  immediate?: boolean;
  lastRun?: Date;
  nextRun?: Date;
  enabled: boolean;
}

class BackgroundJobScheduler {
  private jobs: Map<string, RecurringJob> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  /**
   * Register a recurring job
   */
  registerJob(job: Omit<RecurringJob, 'lastRun' | 'nextRun' | 'enabled'> & { immediate?: boolean }): void {
    const recurringJob: RecurringJob = {
      ...job,
      enabled: true,
      lastRun: undefined,
      nextRun: job.immediate ? new Date() : new Date(Date.now() + job.interval),
    };

    this.jobs.set(job.name, recurringJob);
  }

  /**
   * Unregister a job
   */
  unregisterJob(name: string): void {
    this.jobs.delete(name);
    
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
  }

  /**
   * Enable a job
   */
  enableJob(name: string): void {
    const job = this.jobs.get(name);
    if (job) {
      job.enabled = true;
      job.nextRun = new Date(Date.now() + job.interval);
    }
  }

  /**
   * Disable a job
   */
  disableJob(name: string): void {
    const job = this.jobs.get(name);
    if (job) {
      job.enabled = false;
      job.nextRun = undefined;
    }
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[BackgroundJobScheduler] Starting scheduler...');
    
    this.schedule();
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('[BackgroundJobScheduler] Stopping scheduler...');
    
    // Clear all intervals
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }

  /**
   * Schedule jobs
   */
  private schedule(): void {
    // Check every minute for jobs to run
    const checkInterval = setInterval(() => {
      if (!this.isRunning) return;
      
      this.checkAndRunJobs();
    }, 60000); // 1 minute
    
    this.intervals.set('scheduler', checkInterval);
  }

  /**
   * Check and run due jobs
   */
  private async checkAndRunJobs(): Promise<void> {
    const now = new Date();
    
    for (const [name, job] of this.jobs.entries()) {
      if (!job.enabled || !job.nextRun) continue;
      
      if (now >= job.nextRun) {
        try {
          console.log(`[BackgroundJobScheduler] Running job: ${name}`);
          await job.handler();
          
          job.lastRun = now;
          job.nextRun = new Date(Date.now() + job.interval);
        } catch (error) {
          console.error(`[BackgroundJobScheduler] Job ${name} failed:`, error);
        }
      }
    }
  }

  /**
   * Get job status
   */
  getJobStatus(name: string): RecurringJob | null {
    return this.jobs.get(name) || null;
  }

  /**
   * Get all job statuses
   */
  getAllJobStatuses(): RecurringJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(name: string): Promise<void> {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job ${name} not found`);
    }

    console.log(`[BackgroundJobScheduler] Manually triggering job: ${name}`);
    await job.handler();
    
    job.lastRun = new Date();
    job.nextRun = new Date(Date.now() + job.interval);
  }
}

// Singleton instance
export const backgroundJobScheduler = new BackgroundJobScheduler();

// Common background jobs for intelligence ecosystem
export const registerIntelligenceJobs = (): void => {
  // Trend Analysis Job (runs every hour)
  backgroundJobScheduler.registerJob({
    name: 'trend_analysis',
    interval: 60 * 60 * 1000, // 1 hour
    handler: async () => {
      await queueManager.addJob('trend_analysis', {}, 'medium');
    },
  });

  // Contributor Sync Job (runs every 6 hours)
  backgroundJobScheduler.registerJob({
    name: 'contributor_sync',
    interval: 6 * 60 * 60 * 1000, // 6 hours
    handler: async () => {
      await queueManager.addJob('contributor_sync', {}, 'medium');
    },
  });

  // Discovery Pipeline Job (runs every 2 hours)
  backgroundJobScheduler.registerJob({
    name: 'discovery_pipeline',
    interval: 2 * 60 * 60 * 1000, // 2 hours
    handler: async () => {
      await queueManager.addJob('discovery_pipeline', {}, 'high');
    },
  });

  // Research Indexing Job (runs every 4 hours)
  backgroundJobScheduler.registerJob({
    name: 'research_indexing',
    interval: 4 * 60 * 60 * 1000, // 4 hours
    handler: async () => {
      await queueManager.addJob('research_indexing', {}, 'medium');
    },
  });

  // Dataset Indexing Job (runs every 8 hours)
  backgroundJobScheduler.registerJob({
    name: 'dataset_indexing',
    interval: 8 * 60 * 60 * 1000, // 8 hours
    handler: async () => {
      await queueManager.addJob('dataset_indexing', {}, 'low');
    },
  });

  // Organization Sync Job (runs every 12 hours)
  backgroundJobScheduler.registerJob({
    name: 'organization_sync',
    interval: 12 * 60 * 60 * 1000, // 12 hours
    handler: async () => {
      await queueManager.addJob('organization_sync', {}, 'low');
    },
  });

  // Cache Cleanup Job (runs every 30 minutes)
  backgroundJobScheduler.registerJob({
    name: 'cache_cleanup',
    interval: 30 * 60 * 1000, // 30 minutes
    handler: async () => {
      const { redisCache } = await import('./redis-cache');
      await redisCache.clearExpired();
    },
  });

  // Metrics Cleanup Job (runs daily)
  backgroundJobScheduler.registerJob({
    name: 'metrics_cleanup',
    interval: 24 * 60 * 60 * 1000, // 24 hours
    handler: async () => {
      const { metrics } = await import('./metrics');
      // Keep only last 7 days of metrics
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      
      for (const name of metrics.getMetricNames()) {
        const recentMetrics = metrics.getMetricsInRange(name, cutoffDate, new Date());
        metrics.clear(name);
        for (const metric of recentMetrics) {
          metrics.record(metric.name, metric.value, metric.tags);
        }
      }
    },
  });

  // Audit Log Cleanup Job (runs weekly)
  backgroundJobScheduler.registerJob({
    name: 'audit_cleanup',
    interval: 7 * 24 * 60 * 60 * 1000, // 7 days
    handler: async () => {
      const { auditLogger } = await import('./audit-logger');
      // Keep logs for 90 days
      auditLogger.clearOldLogs(90);
    },
  });
};
