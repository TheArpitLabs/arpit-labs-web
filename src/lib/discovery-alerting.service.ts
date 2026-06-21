/**
 * Discovery Alerting Service
 * Logs alerts and warnings to discovery_logs table
 */

import { supabaseServer } from '@/lib/supabase/server';

export enum AlertLevel {
  INFO = 'info',
  WARN = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AlertContext {
  pipeline_id?: string;
  source_id?: string;
  item_id?: string;
  rate_limit_remaining?: number;
  rate_limit_limit?: number;
  circuit_breaker_state?: string;
  error_code?: number;
  error_message?: string;
  [key: string]: any;
}

class DiscoveryAlertingService {
  private static instance: DiscoveryAlertingService;
  
  private constructor() {}
  
  static getInstance(): DiscoveryAlertingService {
    if (!DiscoveryAlertingService.instance) {
      DiscoveryAlertingService.instance = new DiscoveryAlertingService();
    }
    return DiscoveryAlertingService.instance;
  }
  
  /**
   * Log an alert to discovery_logs table
   */
  async logAlert(
    level: AlertLevel,
    message: string,
    context: AlertContext = {}
  ): Promise<void> {
    try {
      const supabase = supabaseServer;
      
      const { error } = await supabase
        .from('discovery_logs')
        .insert({
          log_type: 'alert',
          log_level: level,
          message,
          context,
          logged_at: new Date().toISOString(),
        });
      
      if (error) {
        console.error('[ALERTING] Failed to log alert:', error);
      }
    } catch (error) {
      console.error('[ALERTING] Error logging alert:', error);
    }
  }
  
  /**
   * Log info level alert
   */
  async info(message: string, context: AlertContext = {}): Promise<void> {
    await this.logAlert(AlertLevel.INFO, message, context);
    console.log(`[INFO] ${message}`, context);
  }
  
  /**
   * Log warning level alert
   */
  async warn(message: string, context: AlertContext = {}): Promise<void> {
    await this.logAlert(AlertLevel.WARN, message, context);
    console.warn(`[WARN] ${message}`, context);
  }
  
  /**
   * Log error level alert
   */
  async error(message: string, context: AlertContext = {}): Promise<void> {
    await this.logAlert(AlertLevel.ERROR, message, context);
    console.error(`[ERROR] ${message}`, context);
  }
  
  /**
   * Log critical level alert
   */
  async critical(message: string, context: AlertContext = {}): Promise<void> {
    await this.logAlert(AlertLevel.CRITICAL, message, context);
    console.error(`[CRITICAL] ${message}`, context);
  }
  
  /**
   * Check rate limit and log appropriate alerts
   */
  async checkRateLimitAlerts(
    remaining: number,
    limit: number,
    resetTimestamp: number
  ): Promise<void> {
    const percentage = (remaining / limit) * 100;
    
    if (remaining === 0) {
      await this.critical(
        'GitHub API rate limit exhausted',
        {
          rate_limit_remaining: remaining,
          rate_limit_limit: limit,
          reset_timestamp: resetTimestamp,
        }
      );
    } else if (remaining < 100) {
      await this.critical(
        `GitHub API rate limit critically low: ${remaining}/${limit} remaining`,
        {
          rate_limit_remaining: remaining,
          rate_limit_limit: limit,
          reset_timestamp: resetTimestamp,
          percentage_remaining: percentage.toFixed(2),
        }
      );
    } else if (remaining < 500) {
      await this.warn(
        `GitHub API rate limit warning: ${remaining}/${limit} remaining`,
        {
          rate_limit_remaining: remaining,
          rate_limit_limit: limit,
          reset_timestamp: resetTimestamp,
          percentage_remaining: percentage.toFixed(2),
        }
      );
    } else if (remaining < 1000) {
      await this.info(
        `GitHub API rate limit status: ${remaining}/${limit} remaining`,
        {
          rate_limit_remaining: remaining,
          rate_limit_limit: limit,
          reset_timestamp: resetTimestamp,
          percentage_remaining: percentage.toFixed(2),
        }
      );
    }
  }
  
  /**
   * Log circuit breaker state changes
   */
  async logCircuitBreakerState(
    state: string,
    failureCount: number,
    context: AlertContext = {}
  ): Promise<void> {
    if (state === 'open') {
      await this.critical(
        `Circuit breaker opened after ${failureCount} consecutive failures`,
        {
          circuit_breaker_state: state,
          failure_count: failureCount,
          ...context,
        }
      );
    } else if (state === 'half_open') {
      await this.warn(
        'Circuit breaker in half-open state - testing recovery',
        {
          circuit_breaker_state: state,
          failure_count: failureCount,
          ...context,
        }
      );
    } else if (state === 'closed') {
      await this.info(
        'Circuit breaker closed - normal operation resumed',
        {
          circuit_breaker_state: state,
          failure_count: failureCount,
          ...context,
        }
      );
    }
  }
  
  /**
   * Log API failure with retry information
   */
  async logApiFailure(
    statusCode: number,
    url: string,
    attempt: number,
    maxRetries: number,
    errorMessage: string
  ): Promise<void> {
    const level = statusCode >= 500 ? AlertLevel.ERROR : AlertLevel.WARN;
    
    await this.logAlert(
      level,
      `GitHub API failure: ${statusCode} ${errorMessage} (Attempt ${attempt}/${maxRetries})`,
      {
        error_code: statusCode,
        error_message: errorMessage,
        url,
        attempt,
        max_retries: maxRetries,
      }
    );
  }
  
  /**
   * Log discovery run start
   */
  async logDiscoveryRunStart(
    runId: string,
    categories: string[],
    config: any
  ): Promise<void> {
    await this.info(
      `Discovery run started: ${runId}`,
      {
        run_id: runId,
        categories,
        config,
      }
    );
  }
  
  /**
   * Log discovery run completion
   */
  async logDiscoveryRunComplete(
    runId: string,
    status: string,
    stats: {
      total_fetched: number;
      total_inserted: number;
      total_failed: number;
      duration_ms?: number;
    }
  ): Promise<void> {
    const level = status === 'completed' ? AlertLevel.INFO : AlertLevel.ERROR;
    
    await this.logAlert(
      level,
      `Discovery run ${status}: ${runId}`,
      {
        run_id: runId,
        status,
        ...stats,
      }
    );
  }
}

export const discoveryAlertingService = DiscoveryAlertingService.getInstance();
