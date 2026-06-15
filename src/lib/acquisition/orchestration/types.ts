/**
 * Orchestration Types
 * 
 * Defines the interfaces and types for pipeline orchestration and scheduling
 */

export interface PipelineJob {
  id: string;
  name: string;
  type: 'discovery' | 'acquisition' | 'enrichment' | 'indexing' | 'maintenance';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  config: Record<string, unknown>;
  schedule?: JobSchedule;
  progress: number;
  result?: JobResult;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobSchedule {
  type: 'once' | 'interval' | 'cron';
  interval?: number; // milliseconds
  cronExpression?: string;
  timezone?: string;
  nextRun?: Date;
  lastRun?: Date;
  enabled: boolean;
}

export interface JobResult {
  success: boolean;
  data: Record<string, unknown>;
  metrics: {
    itemsProcessed: number;
    itemsSucceeded: number;
    itemsFailed: number;
    duration: number;
  };
}

export interface PipelineStage {
  name: string;
  order: number;
  enabled: boolean;
  config: Record<string, unknown>;
  dependencies: string[];
}

export interface PipelineConfig {
  name: string;
  description: string;
  stages: PipelineStage[];
  enabled: boolean;
  maxConcurrency: number;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
}

export interface OrchestratorConfig {
  enableScheduling: boolean;
  enableRetry: boolean;
  maxConcurrentJobs: number;
  jobTimeout: number; // milliseconds
  heartbeatInterval: number; // milliseconds
  enableMetrics: boolean;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
