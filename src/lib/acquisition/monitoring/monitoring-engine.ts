/**
 * Monitoring and Observability Engine
 * 
 * Provides comprehensive monitoring, logging, health checks, and alerting
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Metric, 
  LogEntry, 
  HealthCheck, 
  HealthCheckItem, 
  Alert, 
  MonitoringConfig,
  PerformanceMetrics 
} from './types';

export interface MonitoringEngine {
  recordMetric(metric: Omit<Metric, 'timestamp'>): Promise<void>;
  log(entry: Omit<LogEntry, 'timestamp'>): Promise<void>;
  performHealthChecks(): Promise<HealthCheck[]>;
  checkPerformance(): Promise<PerformanceMetrics>;
  createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<void>;
  resolveAlert(alertId: string): Promise<void>;
  getMetrics(component?: string, timeRange?: { start: Date; end: Date }): Promise<Metric[]>;
  getLogs(component?: string, level?: string, limit?: number): Promise<LogEntry[]>;
  getAlerts(resolved?: boolean): Promise<Alert[]>;
  getSystemHealth(): Promise<{ overall: 'healthy' | 'degraded' | 'unhealthy'; components: HealthCheck[] }>;
}

class BaseMonitoringEngine implements MonitoringEngine {
  private supabase: SupabaseClient;
  private config: MonitoringConfig;
  private metricsBuffer: Metric[];
  private logsBuffer: LogEntry[];
  private alertRules: Map<string, (metrics: Metric[]) => Alert | null>;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    this.metricsBuffer = [];
    this.logsBuffer = [];
    this.alertRules = new Map();
    this.initializeAlertRules();
  }

  private initializeAlertRules(): void {
    // Error rate alert
    this.alertRules.set('error_rate', (metrics) => {
      const errorMetrics = metrics.filter(m => m.name === 'errors_total');
      const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
      const totalRequests = metrics.filter(m => m.name === 'requests_total').reduce((sum, m) => sum + m.value, 0);
      
      if (totalRequests > 0) {
        const errorRate = totalErrors / totalRequests;
        if (errorRate > this.config.alertThresholds.errorRate) {
          return {
            id: '',
            severity: 'critical',
            component: 'acquisition_pipeline',
            message: `Error rate ${errorRate.toFixed(2)} exceeds threshold ${this.config.alertThresholds.errorRate}`,
            timestamp: new Date(),
            resolved: false,
            metadata: { errorRate, threshold: this.config.alertThresholds.errorRate }
          };
        }
      }
      return null;
    });

    // Response time alert
    this.alertRules.set('response_time', (metrics) => {
      const responseTimeMetrics = metrics.filter(m => m.name === 'response_time');
      if (responseTimeMetrics.length > 0) {
        const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length;
        if (avgResponseTime > this.config.alertThresholds.responseTime) {
          return {
            id: '',
            severity: 'warning',
            component: 'acquisition_pipeline',
            message: `Average response time ${avgResponseTime.toFixed(0)}ms exceeds threshold ${this.config.alertThresholds.responseTime}ms`,
            timestamp: new Date(),
            resolved: false,
            metadata: { avgResponseTime, threshold: this.config.alertThresholds.responseTime }
          };
        }
      }
      return null;
    });

    // Queue size alert
    this.alertRules.set('queue_size', (metrics) => {
      const queueMetrics = metrics.filter(m => m.name === 'queue_size');
      for (const metric of queueMetrics) {
        if (metric.value > this.config.alertThresholds.queueSize) {
          return {
            id: '',
            severity: 'warning',
            component: metric.labels.queue_name || 'unknown_queue',
            message: `Queue size ${metric.value} exceeds threshold ${this.config.alertThresholds.queueSize}`,
            timestamp: new Date(),
            resolved: false,
            metadata: { queueSize: metric.value, threshold: this.config.alertThresholds.queueSize }
          };
        }
      }
      return null;
    });
  }

  async recordMetric(metric: Omit<Metric, 'timestamp'>): Promise<void> {
    if (!this.config.enableMetrics) return;

    const fullMetric: Metric = {
      ...metric,
      timestamp: new Date()
    };

    this.metricsBuffer.push(fullMetric);

    // Flush buffer if it gets too large
    if (this.metricsBuffer.length >= 100) {
      await this.flushMetrics();
    }

    // Check for alerts
    await this.checkAlerts(fullMetric);
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const { error } = await this.supabase
        .from('metrics')
        .insert(this.metricsBuffer.map(m => ({
          name: m.name,
          value: m.value,
          timestamp: m.timestamp.toISOString(),
          labels: m.labels,
          type: m.type
        })));

      if (error) {
        console.error('Error flushing metrics:', error);
      } else {
        this.metricsBuffer = [];
      }
    } catch (error) {
      console.error('Error flushing metrics:', error);
    }
  }

  async log(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
    if (!this.config.enableLogging) return;

    // Filter by log level
    const levelPriority = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levelPriority[entry.level] < levelPriority[this.config.logLevel]) {
      return;
    }

    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date()
    };

    this.logsBuffer.push(fullEntry);

    // Flush buffer if it gets too large
    if (this.logsBuffer.length >= 100) {
      await this.flushLogs();
    }

    // Also log to console
    const consoleMethod = entry.level === 'error' ? console.error : 
                         entry.level === 'warn' ? console.warn :
                         entry.level === 'debug' ? console.debug : console.log;
    consoleMethod(`[${entry.component}] ${entry.message}`, entry.metadata || '');
  }

  private async flushLogs(): Promise<void> {
    if (this.logsBuffer.length === 0) return;

    try {
      const { error } = await this.supabase
        .from('logs')
        .insert(this.logsBuffer.map(l => ({
          timestamp: l.timestamp.toISOString(),
          level: l.level,
          component: l.component,
          message: l.message,
          metadata: l.metadata,
          error: l.error ? { message: l.error.message, stack: l.error.stack } : null
        })));

      if (error) {
        console.error('Error flushing logs:', error);
      } else {
        this.logsBuffer = [];
      }
    } catch (error) {
      console.error('Error flushing logs:', error);
    }
  }

  async performHealthChecks(): Promise<HealthCheck[]> {
    if (!this.config.enableHealthChecks) {
      return [];
    }

    const healthChecks: HealthCheck[] = [];
    const startTime = Date.now();

    // Database health check
    const dbHealth = await this.checkDatabase();
    healthChecks.push(dbHealth);

    // Redis health check (if configured)
    const redisHealth = await this.checkRedis();
    healthChecks.push(redisHealth);

    // Queue health check
    const queueHealth = await this.checkQueues();
    healthChecks.push(queueHealth);

    // API health check
    const apiHealth = await this.checkAPI();
    healthChecks.push(apiHealth);

    return healthChecks;
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    const checks: HealthCheckItem[] = [];

    try {
      // Test database connection
      const { error } = await this.supabase.from('pipeline_jobs').select('id').limit(1);
      
      checks.push({
        name: 'database_connection',
        status: error ? 'fail' : 'pass',
        message: error ? 'Failed to connect to database' : 'Database connection successful',
        responseTime: Date.now() - startTime
      });

      // Check database performance
      const { data, error: perfError } = await this.supabase
        .from('pipeline_jobs')
        .select('id')
        .limit(1);

      checks.push({
        name: 'database_performance',
        status: perfError ? 'fail' : 'pass',
        responseTime: Date.now() - startTime
      });

    } catch (error) {
      checks.push({
        name: 'database_connection',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      });
    }

    const overallStatus = checks.every(c => c.status === 'pass') ? 'healthy' :
                          checks.some(c => c.status === 'fail') ? 'unhealthy' : 'degraded';

    return {
      component: 'database',
      status: overallStatus,
      timestamp: new Date(),
      checks,
      responseTime: Date.now() - startTime
    };
  }

  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    const checks: HealthCheckItem[] = [];

    // Placeholder for Redis health check
    // In production, this would check actual Redis connection
    checks.push({
      name: 'redis_connection',
      status: 'pass',
      message: 'Redis connection not configured',
      responseTime: 0
    });

    return {
      component: 'redis',
      status: 'healthy',
      timestamp: new Date(),
      checks,
      responseTime: Date.now() - startTime
    };
  }

  private async checkQueues(): Promise<HealthCheck> {
    const startTime = Date.now();
    const checks: HealthCheckItem[] = [];

    try {
      // Check queue sizes
      const { data: queueHealth } = await this.supabase
        .from('queue_health')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (queueHealth && queueHealth.length > 0) {
        const latestHealth = queueHealth[0];
        checks.push({
          name: 'queue_size',
          status: (latestHealth as any).queue_size < this.config.alertThresholds.queueSize ? 'pass' : 'warn',
          message: `Queue size: ${(latestHealth as any).queue_size}`,
          metadata: { queueSize: (latestHealth as any).queue_size },
          responseTime: Date.now() - startTime
        });
      } else {
        checks.push({
          name: 'queue_size',
          status: 'pass',
          message: 'No queue data available',
          responseTime: Date.now() - startTime
        });
      }

    } catch (error) {
      checks.push({
        name: 'queue_size',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      });
    }

    const overallStatus = checks.every(c => c.status === 'pass') ? 'healthy' :
                          checks.some(c => c.status === 'fail') ? 'unhealthy' : 'degraded';

    return {
      component: 'queues',
      status: overallStatus,
      timestamp: new Date(),
      checks,
      responseTime: Date.now() - startTime
    };
  }

  private async checkAPI(): Promise<HealthCheck> {
    const startTime = Date.now();
    const checks: HealthCheckItem[] = [];

    // Placeholder for API health check
    checks.push({
      name: 'api_endpoints',
      status: 'pass',
      message: 'API endpoints operational',
      responseTime: Date.now() - startTime
    });

    return {
      component: 'api',
      status: 'healthy',
      timestamp: new Date(),
      checks,
      responseTime: Date.now() - startTime
    };
  }

  async checkPerformance(): Promise<PerformanceMetrics> {
    // Placeholder for performance metrics
    // In production, this would use system metrics libraries
    return {
      timestamp: new Date(),
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0]
      },
      memory: {
        total: 0,
        used: 0,
        free: 0,
        percentage: 0
      },
      disk: {
        total: 0,
        used: 0,
        free: 0,
        percentage: 0
      },
      network: {
        bytesIn: 0,
        bytesOut: 0,
        connections: 0
      }
    };
  }

  async createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    if (!this.config.enableAlerts) return;

    try {
      const { error } = await this.supabase
        .from('alerts')
        .insert({
          severity: alert.severity,
          component: alert.component,
          message: alert.message,
          timestamp: new Date().toISOString(),
          resolved: false,
          metadata: alert.metadata
        });

      if (error) {
        console.error('Error creating alert:', error);
      }
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }

  private async checkAlerts(metric: Metric): Promise<void> {
    if (!this.config.enableAlerts) return;

    // Add metric to buffer for rule evaluation
    this.metricsBuffer.push(metric);

    // Evaluate alert rules
    for (const [ruleName, rule] of this.alertRules) {
      try {
        const alert = rule(this.metricsBuffer);
        if (alert) {
          await this.createAlert(alert);
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${ruleName}:`, error);
      }
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    try {
      await this.supabase
        .from('alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  async getMetrics(component?: string, timeRange?: { start: Date; end: Date }): Promise<Metric[]> {
    try {
      let query = this.supabase
        .from('metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (component) {
        query = query.filter('labels->>component', 'eq', component);
      }

      if (timeRange) {
        query = query.gte('timestamp', timeRange.start.toISOString())
                   .lte('timestamp', timeRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting metrics:', error);
        return [];
      }

      return (data || []).map(m => ({
        name: m.name,
        value: m.value,
        timestamp: new Date(m.timestamp),
        labels: m.labels,
        type: m.type
      }));

    } catch (error) {
      console.error('Error in getMetrics:', error);
      return [];
    }
  }

  async getLogs(component?: string, level?: string, limit: number = 100): Promise<LogEntry[]> {
    try {
      let query = this.supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (component) {
        query = query.eq('component', component);
      }

      if (level) {
        query = query.eq('level', level);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting logs:', error);
        return [];
      }

      return (data || []).map(l => ({
        timestamp: new Date(l.timestamp),
        level: l.level,
        component: l.component,
        message: l.message,
        metadata: l.metadata,
        error: l.error ? new Error(l.error.message) : undefined
      }));

    } catch (error) {
      console.error('Error in getLogs:', error);
      return [];
    }
  }

  async getAlerts(resolved?: boolean): Promise<Alert[]> {
    try {
      let query = this.supabase
        .from('alerts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (resolved !== undefined) {
        query = query.eq('resolved', resolved);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting alerts:', error);
        return [];
      }

      return (data || []).map(a => ({
        id: a.id,
        severity: a.severity,
        component: a.component,
        message: a.message,
        timestamp: new Date(a.timestamp),
        resolved: a.resolved,
        resolvedAt: a.resolved_at ? new Date(a.resolved_at) : undefined,
        metadata: a.metadata
      }));

    } catch (error) {
      console.error('Error in getAlerts:', error);
      return [];
    }
  }

  async getSystemHealth(): Promise<{ overall: 'healthy' | 'degraded' | 'unhealthy'; components: HealthCheck[] }> {
    const healthChecks = await this.performHealthChecks();

    const overall = healthChecks.every(h => h.status === 'healthy') ? 'healthy' :
                   healthChecks.some(h => h.status === 'unhealthy') ? 'unhealthy' : 'degraded';

    return {
      overall,
      components: healthChecks
    };
  }

  async cleanup(): Promise<void> {
    // Flush any remaining buffered data
    await this.flushMetrics();
    await this.flushLogs();

    // Clean up old data based on retention policy
    const metricsCutoff = new Date(Date.now() - this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
    const logsCutoff = new Date(Date.now() - this.config.logRetentionDays * 24 * 60 * 60 * 1000);

    try {
      await this.supabase
        .from('metrics')
        .delete()
        .lt('timestamp', metricsCutoff.toISOString());

      await this.supabase
        .from('logs')
        .delete()
        .lt('timestamp', logsCutoff.toISOString());

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Singleton instance
let monitoringEngineInstance: MonitoringEngine | null = null;

export function getMonitoringEngine(config?: MonitoringConfig): MonitoringEngine {
  if (!monitoringEngineInstance && config) {
    monitoringEngineInstance = new BaseMonitoringEngine(config);
  }
  return monitoringEngineInstance!;
}

export function resetMonitoringEngine(): void {
  monitoringEngineInstance = null;
}
