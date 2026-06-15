/**
 * Queue Layer Types
 * 
 * Defines the interfaces and types for queue-based job processing
 */

import { AcquisitionStatus } from '../acquisition-layer/types';

export type JobType = 
  | 'fetch' 
  | 'analyze' 
  | 'enrich' 
  | 'quality_check' 
  | 'moderate' 
  | 'publish' 
  | 'deduplicate' 
  | 'compliance_check';

export type JobStatus = 'pending' | 'active' | 'completed' | 'failed' | 'delayed';

export interface QueueConfig {
  connection: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    delay?: number;
    removeOnComplete?: number;
    removeOnFail?: number;
  };
}

export interface JobData {
  queueItemId: string;
  jobType: JobType;
  priority?: number;
  delay?: number;
  metadata?: Record<string, unknown>;
}

export interface JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  processingTime: number;
}

export interface QueueHealth {
  queueName: string;
  pendingJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  delayedJobs: number;
  avgProcessingTime: number;
  lastJobCompletedAt: Date | null;
}

export interface QueueStats {
  totalQueues: number;
  totalJobs: number;
  totalCompleted: number;
  totalFailed: number;
  successRate: number;
  avgProcessingTime: number;
  queues: Record<string, QueueHealth>;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffStrategy: 'exponential' | 'fixed' | 'linear';
  initialDelay: number;
  maxDelay: number;
  multiplier?: number;
}

export interface DeadLetterConfig {
  enabled: boolean;
  maxRetries: number;
  ttl: number; // Time to live in milliseconds
}
