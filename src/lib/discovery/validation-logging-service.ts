/**
 * Validation Logging Service
 * 
 * Phase 5: Data Validation Layer
 * Logs validation events for analytics and debugging
 */

import { supabaseServer } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface ValidationLogEntry {
  project_id?: string;
  validation_status: 'passed' | 'failed' | 'skipped' | 'pending';
  validation_score: number;
  validation_errors: string[];
  validation_metadata: any;
  timestamp: string;
}

export interface ValidationAnalytics {
  total_validations: number;
  passed_count: number;
  failed_count: number;
  skipped_count: number;
  pending_count: number;
  average_score: number;
  score_distribution: {
    excellent: number; // 90-100
    good: number; // 70-89
    fair: number; // 50-69
    poor: number; // 0-49
  };
  most_common_errors: { error: string; count: number }[];
  validation_trends: {
    date: string;
    passed: number;
    failed: number;
    average_score: number;
  }[];
}

/**
 * Log validation event
 */
export async function logValidationEvent(entry: ValidationLogEntry) {
  try {
    // Check if discovery_logs table exists, if not create it
    await ensureDiscoveryLogsTable();

    const { error } = await supabaseServer
      .from('discovery_logs')
      .insert({
        log_type: `validation_${entry.validation_status}`,
        source: 'validation_layer',
        context: {
          project_id: entry.project_id,
          validation_status: entry.validation_status,
          validation_score: entry.validation_score,
          validation_errors: entry.validation_errors,
          validation_metadata: entry.validation_metadata,
        },
        created_at: entry.timestamp,
      });

    if (error) {
      logger.error('Error logging validation event:', error);
    }
  } catch (error) {
    logger.error('Error in logValidationEvent:', error);
  }
}

/**
 * Get validation analytics
 */
export async function getValidationAnalytics(days: number = 30): Promise<ValidationAnalytics> {
  try {
    await ensureDiscoveryLogsTable();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch validation logs
    const { data: logs, error } = await supabaseServer
      .from('discovery_logs')
      .select('context, created_at')
      .gte('created_at', startDate.toISOString())
      .like('log_type', 'validation_%');

    if (error) {
      logger.error('Error fetching validation logs:', error);
      return getEmptyAnalytics();
    }

    const validationLogs = logs || [];
    
    // Calculate basic statistics
    const totalValidations = validationLogs.length;
    const passedCount = validationLogs.filter(log => log.context?.validation_status === 'passed').length;
    const failedCount = validationLogs.filter(log => log.context?.validation_status === 'failed').length;
    const skippedCount = validationLogs.filter(log => log.context?.validation_status === 'skipped').length;
    const pendingCount = validationLogs.filter(log => log.context?.validation_status === 'pending').length;

    // Calculate average score
    const scores = validationLogs
      .map(log => log.context?.validation_score)
      .filter(score => score !== null && score !== undefined);
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;

    // Calculate score distribution
    const scoreDistribution = {
      excellent: scores.filter(s => s >= 90).length,
      good: scores.filter(s => s >= 70 && s < 90).length,
      fair: scores.filter(s => s >= 50 && s < 70).length,
      poor: scores.filter(s => s < 50).length,
    };

    // Calculate most common errors
    const errorCounts: Record<string, number> = {};
    validationLogs.forEach(log => {
      const errors = log.context?.validation_errors || [];
      errors.forEach((error: string) => {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
    });

    const mostCommonErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate validation trends by day
    const trendsByDate: Record<string, { passed: number; failed: number; scores: number[] }> = {};
    
    validationLogs.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!trendsByDate[date]) {
        trendsByDate[date] = { passed: 0, failed: 0, scores: [] };
      }
      
      if (log.context?.validation_status === 'passed') {
        trendsByDate[date].passed++;
      } else if (log.context?.validation_status === 'failed') {
        trendsByDate[date].failed++;
      }
      
      if (log.context?.validation_score !== undefined) {
        trendsByDate[date].scores.push(log.context.validation_score);
      }
    });

    const validationTrends = Object.entries(trendsByDate)
      .map(([date, data]) => ({
        date,
        passed: data.passed,
        failed: data.failed,
        average_score: data.scores.length > 0 
          ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length 
          : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_validations: totalValidations,
      passed_count: passedCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      pending_count: pendingCount,
      average_score: Math.round(averageScore),
      score_distribution: scoreDistribution,
      most_common_errors: mostCommonErrors,
      validation_trends: validationTrends,
    };
  } catch (error) {
    logger.error('Error getting validation analytics:', error);
    return getEmptyAnalytics();
  }
}

/**
 * Get validation summary for a specific project
 */
export async function getProjectValidationHistory(projectId: string) {
  try {
    await ensureDiscoveryLogsTable();

    const { data: logs, error } = await supabaseServer
      .from('discovery_logs')
      .select('*')
      .eq('context->>project_id', projectId)
      .like('log_type', 'validation_%')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching project validation history:', error);
      return [];
    }

    return logs || [];
  } catch (error) {
    logger.error('Error in getProjectValidationHistory:', error);
    return [];
  }
}

/**
 * Ensure discovery_logs table exists
 */
async function ensureDiscoveryLogsTable() {
  try {
    // Check if table exists by attempting a query
    const { error } = await supabaseServer
      .from('discovery_logs')
      .select('id')
      .limit(1);

    // If table doesn't exist, create it
    if (error && error.code === '42P01') {
      logger.info('Creating discovery_logs table...');
      await createDiscoveryLogsTable();
    }
  } catch (error) {
    logger.error('Error ensuring discovery_logs table:', error);
  }
}

/**
 * Create discovery_logs table
 */
async function createDiscoveryLogsTable() {
  try {
    const { error } = await supabaseServer.rpc('create_discovery_logs_table_if_not_exists');
    
    if (error) {
      logger.error('Error creating discovery_logs table:', error);
    }
  } catch (error) {
    logger.error('Error in createDiscoveryLogsTable:', error);
  }
}

/**
 * Get empty analytics object
 */
function getEmptyAnalytics(): ValidationAnalytics {
  return {
    total_validations: 0,
    passed_count: 0,
    failed_count: 0,
    skipped_count: 0,
    pending_count: 0,
    average_score: 0,
    score_distribution: {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    },
    most_common_errors: [],
    validation_trends: [],
  };
}
