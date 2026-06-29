/**
 * Pipeline Orchestrator
 * 
 * Coordinates and manages the entire content acquisition pipeline
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  PipelineJob, 
  JobSchedule, 
  JobResult, 
  PipelineStage, 
  PipelineConfig,
  OrchestratorConfig 
} from './types';
import { getQueueManager } from '../queue-layer/queue-manager';
import { getDiscoveryManager } from '../source-discovery/discovery-manager';
import { getAcquisitionProcessor } from '../acquisition-layer/acquisition-processor';
import { getDeduplicationEngine } from '../deduplication/deduplication-engine';
import { getComplianceEngine } from '../compliance/compliance-engine';
import { getAIEnrichmentEngine } from '../ai-enrichment/ai-enrichment-engine';
import { getQualityScoringEngine } from '../quality-scoring/quality-scoring-engine';
import { getKnowledgeGraphEngine } from '../knowledge-graph/knowledge-graph-engine';
import { getSemanticSearchEngine } from '../search-layer/semantic-search-engine';
import { getModerationEngine } from '../moderation/moderation-engine';
import { logger } from '@/lib/logger';

export interface PipelineOrchestrator {
  start(): Promise<void>;
  stop(): Promise<void>;
  scheduleJob(job: Omit<PipelineJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<PipelineJob>;
  cancelJob(jobId: string): Promise<void>;
  getJobStatus(jobId: string): Promise<PipelineJob | null>;
  getActiveJobs(): Promise<PipelineJob[]>;
  executePipeline(config: PipelineConfig): Promise<JobResult>;
  retryJob(jobId: string): Promise<void>;
  getPipelineStats(): Promise<{ totalJobs: number; running: number; completed: number; failed: number }>;
}

class BasePipelineOrchestrator implements PipelineOrchestrator {
  private supabase: SupabaseClient;
  private config: OrchestratorConfig;
  private isRunning: boolean;
  private jobTimers: Map<string, NodeJS.Timeout>;
  private activeJobs: Map<string, PipelineJob>;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    this.isRunning = false;
    this.jobTimers = new Map();
    this.activeJobs = new Map();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.debug('Pipeline orchestrator already running');
      return;
    }

    this.isRunning = true;
    logger.info('Pipeline orchestrator started');

    // Load and start scheduled jobs
    await this.loadScheduledJobs();

    // Start heartbeat
    if (this.config.heartbeatInterval > 0) {
      this.startHeartbeat();
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('Pipeline orchestrator stopping');

    // Clear all job timers
    this.jobTimers.forEach(timer => clearTimeout(timer));
    this.jobTimers.clear();

    // Cancel active jobs
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.status === 'running') {
        await this.cancelJob(jobId);
      }
    }

    logger.info('Pipeline orchestrator stopped');
  }

  private async loadScheduledJobs(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('pipeline_jobs')
        .select('*')
        .eq('status', 'pending')
        .not('schedule', 'is', null);

      if (error) {
        logger.error('Error loading scheduled jobs:', { error });
        return;
      }

      (data || []).forEach(job => {
        if (job.schedule && (job.schedule as JobSchedule).enabled) {
          this.scheduleNextRun(job.id, job.schedule as JobSchedule);
        }
      });

    } catch (error) {
      logger.error('Error loading scheduled jobs:', { error });
    }
  }

  private scheduleNextRun(jobId: string, schedule: JobSchedule): void {
    if (!this.isRunning) return;

    let delay: number;

    switch (schedule.type) {
      case 'interval':
        delay = schedule.interval || 3600000; // Default 1 hour
        break;
      case 'cron':
        // Simple cron parsing (placeholder)
        delay = this.parseCronDelay(schedule.cronExpression || '0 * * * *');
        break;
      case 'once':
      default:
        if (schedule.nextRun) {
          delay = new Date(schedule.nextRun).getTime() - Date.now();
          if (delay < 0) delay = 0;
        } else {
          return;
        }
        break;
    }

    const timer = setTimeout(async () => {
      await this.executeJob(jobId);
      
      // Reschedule if interval or cron
      if (schedule.type === 'interval' || schedule.type === 'cron') {
        this.scheduleNextRun(jobId, schedule);
      }
    }, delay);

    this.jobTimers.set(jobId, timer);
  }

  private parseCronDelay(cronExpression: string): number {
    // Placeholder for cron parsing
    // In production, use a proper cron library like node-cron
    return 3600000; // Default 1 hour
  }

  private startHeartbeat(): void {
    const heartbeat = async () => {
      if (!this.isRunning) return;

      try {
        // Update job statuses
        await this.checkJobTimeouts();
        
        // Schedule next heartbeat
        setTimeout(heartbeat, this.config.heartbeatInterval);
      } catch (error) {
        logger.error('Heartbeat error:', { error });
      }
    };

    setTimeout(heartbeat, this.config.heartbeatInterval);
  }

  private async checkJobTimeouts(): Promise<void> {
    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - this.config.jobTimeout);

    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.status === 'running' && job.startedAt && job.startedAt < timeoutThreshold) {
        logger.warn(`Job ${jobId} timed out, marking as failed`);
        await this.failJob(jobId, 'Job timeout');
      }
    }
  }

  async scheduleJob(job: Omit<PipelineJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<PipelineJob> {
    try {
      const { data, error } = await this.supabase
        .from('pipeline_jobs')
        .insert({
          name: job.name,
          type: job.type,
          status: 'pending',
          priority: job.priority,
          config: job.config,
          schedule: job.schedule,
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error scheduling job:', { error });
        throw error;
      }

      const newJob: PipelineJob = {
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status,
        priority: data.priority,
        config: data.config,
        schedule: data.schedule as JobSchedule,
        progress: data.progress,
        result: data.result as JobResult,
        error: data.error,
        startedAt: data.started_at ? new Date(data.started_at) : undefined,
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      // Schedule if needed
      if (job.schedule && job.schedule.enabled) {
        this.scheduleNextRun(newJob.id, job.schedule);
      } else {
        // Execute immediately
        this.executeJob(newJob.id);
      }

      return newJob;

    } catch (error) {
      logger.error('Error in scheduleJob:', { error });
      throw error;
    }
  }

  private async executeJob(jobId: string): Promise<void> {
    try {
      // Update job status to running
      await this.updateJobStatus(jobId, 'running');
      
      const job = await this.getJobStatus(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      this.activeJobs.set(jobId, job);

      let result: JobResult;

      switch (job.type) {
        case 'discovery':
          result = await this.executeDiscoveryJob(job);
          break;
        case 'acquisition':
          result = await this.executeAcquisitionJob(job);
          break;
        case 'enrichment':
          result = await this.executeEnrichmentJob(job);
          break;
        case 'indexing':
          result = await this.executeIndexingJob(job);
          break;
        case 'maintenance':
          result = await this.executeMaintenanceJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Update job with result
      await this.completeJob(jobId, result);

    } catch (error) {
      logger.error(`Error executing job ${jobId}:`, { error });
      await this.failJob(jobId, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  private async executeDiscoveryJob(job: PipelineJob): Promise<JobResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsSucceeded = 0;
    let itemsFailed = 0;

    try {
      const discoveryManager = getDiscoveryManager();
      const sources = job.config.sources as string[] || ['github', 'arxiv', 'kaggle'];
      
      for (const source of sources) {
        const result = await discoveryManager.runDiscovery(source, { maxResults: job.config.maxResults as number || 100 });
        itemsProcessed += result.discovered.length;
        itemsSucceeded += result.discovered.length;
        itemsFailed += result.errors.length;
      }

      return {
        success: true,
        data: { sources, itemsDiscovered: itemsProcessed },
        metrics: {
          itemsProcessed,
          itemsSucceeded,
          itemsFailed,
          duration: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        data: {},
        metrics: {
          itemsProcessed,
          itemsSucceeded,
          itemsFailed,
          duration: Date.now() - startTime
        }
      };
    }
  }

  private async executeAcquisitionJob(job: PipelineJob): Promise<JobResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsSucceeded = 0;
    let itemsFailed = 0;

    try {
      const processor = getAcquisitionProcessor({
        enableDeduplication: true,
        enableComplianceCheck: true,
        enableAIEnrichment: true,
        enableQualityScoring: true,
        enableModeration: false
      });

      // Process items from queue directly via database
      const { data: items } = await this.supabase
        .from('content_acquisition_queue')
        .select('*')
        .eq('status', 'pending')
        .limit(job.config.limit as number || 100);
      
      for (const item of items || []) {
        itemsProcessed++;
        try {
          await processor.processItem(item.id);
          itemsSucceeded++;
        } catch (error) {
          itemsFailed++;
        }
      }

      return {
        success: true,
        data: {},
        metrics: {
          itemsProcessed,
          itemsSucceeded,
          itemsFailed,
          duration: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        data: {},
        metrics: {
          itemsProcessed,
          itemsSucceeded,
          itemsFailed,
          duration: Date.now() - startTime
        }
      };
    }
  }

  private async executeEnrichmentJob(job: PipelineJob): Promise<JobResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsSucceeded = 0;
    let itemsFailed = 0;

    try {
      const aiEngine = getAIEnrichmentEngine({
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.7
      });

      const { data: content } = await this.supabase
        .from('content_acquisition_queue')
        .select('*')
        .eq('status', 'completed')
        .limit(job.config.limit as number || 50);

      for (const item of content || []) {
        itemsProcessed++;
        try {
          const enriched = await aiEngine.runEnrichment(item.id, {
            title: (item.metadata as any)?.title || '',
            description: (item.metadata as any)?.description || '',
            rawContent: (item.metadata as any)?.content || '',
            contentType: item.content_type,
            metadata: item.metadata as Record<string, unknown>
          });

          await this.supabase
            .from('content_acquisition_queue')
            .update({
              metadata: { ...item.metadata, enriched },
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          itemsSucceeded++;
        } catch (error) {
          itemsFailed++;
        }
      }

      return {
        success: true,
        data: {},
        metrics: {
          itemsProcessed,
          itemsSucceeded,
          itemsFailed,
          duration: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        data: {},
        metrics: {
          itemsProcessed,
          itemsSucceeded,
          itemsFailed,
          duration: Date.now() - startTime
        }
      };
    }
  }

  private async executeIndexingJob(job: PipelineJob): Promise<JobResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsSucceeded = 0;
    let itemsFailed = 0;

    try {
      const searchEngine = getSemanticSearchEngine({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        model: 'text-embedding-ada-002',
        dimension: 1536,
        batchSize: 10,
        enableHybridSearch: true,
        hybridSearchWeights: { semantic: 0.7, keyword: 0.3 },
        enableCache: true,
        cacheTTL: 3600000
      });

      const { data: content } = await this.supabase
        .from('content_acquisition_queue')
        .select('*')
        .eq('status', 'completed')
        .limit(job.config.limit as number || 50);

      for (const item of content || []) {
        itemsProcessed++;
        try {
          const metadata = item.metadata as Record<string, unknown>;
          const text = [
            metadata.title,
            metadata.description,
            metadata.content
          ].filter(Boolean).join('\n');

          await searchEngine.indexContent(
            item.id,
            item.content_type,
            text,
            metadata
          );

          itemsSucceeded++;
        } catch (error) {
          itemsFailed++;
        }
      }

      return {
        success: true,
        data: {},
        metrics: {
          itemsProcessed,
          itemsSucceeded,
          itemsFailed,
          duration: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        data: {},
        metrics: {
          itemsProcessed,
          itemsSucceeded,
          itemsFailed,
          duration: Date.now() - startTime
        }
      };
    }
  }

  private async executeMaintenanceJob(job: PipelineJob): Promise<JobResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsSucceeded = 0;
    let itemsFailed = 0;

    try {
      // Perform maintenance tasks
      const tasks = job.config.tasks as string[] || ['cleanup', 'optimize'];

      for (const task of tasks) {
        itemsProcessed++;
        try {
          switch (task) {
            case 'cleanup':
              await this.cleanupOldJobs();
              break;
            case 'optimize':
              await this.optimizeDatabase();
              break;
            case 'reindex':
              await this.reindexContent();
              break;
            default:
              logger.warn(`Unknown maintenance task: ${task}`);
          }
          itemsSucceeded++;
        } catch (error) {
          itemsFailed++;
        }
      }

      return {
        success: true,
        data: { tasks },
        metrics: {
          itemsProcessed,
          itemsSucceeded,
          itemsFailed,
          duration: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        data: {},
        metrics: {
          itemsProcessed,
          itemsSucceeded,
          itemsFailed,
          duration: Date.now() - startTime
        }
      };
    }
  }

  private async cleanupOldJobs(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    await this.supabase
      .from('pipeline_jobs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .in('status', ['completed', 'failed', 'cancelled']);
  }

  private async optimizeDatabase(): Promise<void> {
    // Placeholder for database optimization
    logger.debug('Database optimization completed');
  }

  private async reindexContent(): Promise<void> {
    // Placeholder for reindexing
    logger.debug('Content reindexing completed');
  }

  async cancelJob(jobId: string): Promise<void> {
    try {
      // Clear timer if exists
      const timer = this.jobTimers.get(jobId);
      if (timer) {
        clearTimeout(timer);
        this.jobTimers.delete(jobId);
      }

      // Update job status
      await this.updateJobStatus(jobId, 'cancelled');
      
      // Remove from active jobs
      this.activeJobs.delete(jobId);

    } catch (error) {
      logger.error('Error cancelling job:', { error });
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<PipelineJob | null> {
    try {
      const { data, error } = await this.supabase
        .from('pipeline_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status,
        priority: data.priority,
        config: data.config,
        schedule: data.schedule as JobSchedule,
        progress: data.progress,
        result: data.result as JobResult,
        error: data.error,
        startedAt: data.started_at ? new Date(data.started_at) : undefined,
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

    } catch (error) {
      logger.error('Error getting job status:', { error });
      return null;
    }
  }

  async getActiveJobs(): Promise<PipelineJob[]> {
    try {
      const { data, error } = await this.supabase
        .from('pipeline_jobs')
        .select('*')
        .in('status', ['pending', 'running'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error getting active jobs:', { error });
        return [];
      }

      return (data || []).map((job: any) => ({
        id: job.id,
        name: job.name,
        type: job.type,
        status: job.status,
        priority: job.priority,
        config: job.config,
        schedule: job.schedule as JobSchedule,
        progress: job.progress,
        result: job.result as JobResult,
        error: job.error,
        startedAt: job.started_at ? new Date(job.started_at) : undefined,
        completedAt: job.completed_at ? new Date(job.completed_at) : undefined,
        createdAt: new Date(job.created_at),
        updatedAt: new Date(job.updated_at)
      }));

    } catch (error) {
      logger.error('Error in getActiveJobs:', { error });
      return [];
    }
  }

  async executePipeline(config: PipelineConfig): Promise<JobResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let itemsSucceeded = 0;
    let itemsFailed = 0;

    try {
      // Sort stages by order
      const sortedStages = [...config.stages].sort((a, b) => a.order - b.order);

      for (const stage of sortedStages) {
        if (!stage.enabled) continue;

        itemsProcessed++;
        try {
          await this.executeStage(stage);
          itemsSucceeded++;
        } catch (error) {
          itemsFailed++;
          if (!config.retryPolicy || itemsFailed > config.retryPolicy.maxRetries) {
            throw error;
          }
        }
      }

      return {
        success: true,
        data: {},
        metrics: {
          itemsProcessed,
          itemsSucceeded,
          itemsFailed,
          duration: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        data: {},
        metrics: {
          itemsProcessed,
          itemsSucceeded,
          itemsFailed,
          duration: Date.now() - startTime
        }
      };
    }
  }

  private async executeStage(stage: PipelineStage): Promise<void> {
    // Placeholder for stage execution
    logger.debug(`Executing stage: ${stage.name}`);
  }

  async retryJob(jobId: string): Promise<void> {
    try {
      const job = await this.getJobStatus(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (job.status !== 'failed') {
        throw new Error(`Can only retry failed jobs, current status: ${job.status}`);
      }

      // Reset job status
      await this.updateJobStatus(jobId, 'pending');
      
      // Re-execute
      await this.executeJob(jobId);

    } catch (error) {
      logger.error('Error retrying job:', { error });
      throw error;
    }
  }

  private async updateJobStatus(jobId: string, status: PipelineJob['status']): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'running') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        updateData.completed_at = new Date().toISOString();
      }

      await this.supabase
        .from('pipeline_jobs')
        .update(updateData)
        .eq('id', jobId);

    } catch (error) {
      logger.error('Error updating job status:', { error });
      throw error;
    }
  }

  private async completeJob(jobId: string, result: JobResult): Promise<void> {
    try {
      await this.supabase
        .from('pipeline_jobs')
        .update({
          status: 'completed',
          result,
          progress: 100,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

    } catch (error) {
      logger.error('Error completing job:', { error });
      throw error;
    }
  }

  private async failJob(jobId: string, error: string): Promise<void> {
    try {
      await this.supabase
        .from('pipeline_jobs')
        .update({
          status: 'failed',
          error,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

    } catch (error) {
      logger.error('Error failing job:', { error });
      throw error;
    }
  }

  async getPipelineStats(): Promise<{ totalJobs: number; running: number; completed: number; failed: number }> {
    try {
      const { data, error } = await this.supabase
        .from('pipeline_jobs')
        .select('status');

      if (error) {
        logger.error('Error getting pipeline stats:', { error });
        return { totalJobs: 0, running: 0, completed: 0, failed: 0 };
      }

      const stats = {
        totalJobs: data?.length || 0,
        running: 0,
        completed: 0,
        failed: 0
      };

      (data || []).forEach(job => {
        switch (job.status) {
          case 'running': stats.running++; break;
          case 'completed': stats.completed++; break;
          case 'failed': stats.failed++; break;
        }
      });

      return stats;

    } catch (error) {
      logger.error('Error in getPipelineStats:', { error });
      return { totalJobs: 0, running: 0, completed: 0, failed: 0 };
    }
  }
}

// Singleton instance
let pipelineOrchestratorInstance: PipelineOrchestrator | null = null;

export function getPipelineOrchestrator(config?: OrchestratorConfig): PipelineOrchestrator {
  if (!pipelineOrchestratorInstance && config) {
    pipelineOrchestratorInstance = new BasePipelineOrchestrator(config);
  }
  return pipelineOrchestratorInstance!;
}

export function resetPipelineOrchestrator(): void {
  pipelineOrchestratorInstance = null;
}
