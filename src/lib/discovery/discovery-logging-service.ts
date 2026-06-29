/**
 * Discovery Logging Service
 * 
 * Logs discovery engine operations including duplicate attempts,
 * successful imports, and errors for analytics and debugging.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export interface DiscoveryLogEntry {
  repository: string;
  reason: string;
  status: 'skipped' | 'imported' | 'error' | 'pending';
  metadata?: Record<string, unknown>;
}

export class DiscoveryLoggingService {
  private supabase: any;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Log a discovery operation
   * @param entry - Log entry data
   */
  async logDiscovery(entry: DiscoveryLogEntry): Promise<void> {
    try {
      const logEntry = {
        repository: entry.repository,
        reason: entry.reason,
        status: entry.status,
        metadata: entry.metadata || {},
        created_at: new Date().toISOString()
      };

      await this.supabase
        .from('discovery_logs')
        .insert(logEntry);
    } catch (error) {
      logger.error('Failed to log discovery operation:', error);
      // Don't throw - logging shouldn't break the main flow
    }
  }

  /**
   * Log a duplicate attempt
   * @param repository - Repository URL or identifier
   * @param reason - Reason for duplicate detection
   * @param metadata - Additional metadata
   */
  async logDuplicateAttempt(
    repository: string,
    reason: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logDiscovery({
      repository,
      reason,
      status: 'skipped',
      metadata
    });
  }

  /**
   * Log a successful import
   * @param repository - Repository URL or identifier
   * @param metadata - Additional metadata
   */
  async logImportSuccess(
    repository: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logDiscovery({
      repository,
      reason: 'import_successful',
      status: 'imported',
      metadata
    });
  }

  /**
   * Log an error during discovery
   * @param repository - Repository URL or identifier
   * @param error - Error message or object
   * @param metadata - Additional metadata
   */
  async logDiscoveryError(
    repository: string,
    error: string | Error,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    await this.logDiscovery({
      repository,
      reason: errorMessage,
      status: 'error',
      metadata: {
        ...metadata,
        error_type: typeof error === 'object' ? error.constructor.name : 'string'
      }
    });
  }

  /**
   * Get discovery statistics
   * @returns Discovery operation statistics
   */
  async getDiscoveryStats(): Promise<{
    total: number;
    skipped: number;
    imported: number;
    errors: number;
    duplicateRate: number;
  }> {
    try {
      const { data: logs } = await this.supabase
        .from('discovery_logs')
        .select('status');

      if (!logs) {
        return {
          total: 0,
          skipped: 0,
          imported: 0,
          errors: 0,
          duplicateRate: 0
        };
      }

      const total = logs.length;
      const skipped = logs.filter((log: any) => log.status === 'skipped').length;
      const imported = logs.filter((log: any) => log.status === 'imported').length;
      const errors = logs.filter((log: any) => log.status === 'error').length;
      const duplicateRate = total > 0 ? Math.round((skipped / total) * 100) : 0;

      return {
        total,
        skipped,
        imported,
        errors,
        duplicateRate
      };
    } catch (error) {
      logger.error('Failed to get discovery stats:', error);
      return {
        total: 0,
        skipped: 0,
        imported: 0,
        errors: 0,
        duplicateRate: 0
      };
    }
  }

  /**
   * Get recent discovery logs
   * @param limit - Number of logs to retrieve
   * @returns Recent discovery logs
   */
  async getRecentLogs(limit: number = 20): Promise<any[]> {
    try {
      const { data: logs } = await this.supabase
        .from('discovery_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      return logs || [];
    } catch (error) {
      logger.error('Failed to get recent logs:', error);
      return [];
    }
  }

  /**
   * Get duplicate attempts by reason
   * @returns Duplicate attempts grouped by reason
   */
  async getDuplicateAttemptsByReason(): Promise<Record<string, number>> {
    try {
      const { data: logs } = await this.supabase
        .from('discovery_logs')
        .select('reason')
        .eq('status', 'skipped');

      if (!logs) {
        return {};
      }

      const grouped: Record<string, number> = {};
      for (const log of logs) {
        const reason = log.reason || 'unknown';
        grouped[reason] = (grouped[reason] || 0) + 1;
      }

      return grouped;
    } catch (error) {
      logger.error('Failed to get duplicate attempts by reason:', error);
      return {};
    }
  }
}

// Singleton instance
let discoveryLoggingService: DiscoveryLoggingService | null = null;

export function getDiscoveryLoggingService(): DiscoveryLoggingService {
  if (!discoveryLoggingService) {
    discoveryLoggingService = new DiscoveryLoggingService();
  }
  return discoveryLoggingService;
}
