/**
 * Monitoring integration utilities
 * Provides comprehensive monitoring integration combining performance, error tracking, and analytics
 */

import { performanceMonitor, PerformanceMetric, measurePageLoad } from './performance-monitoring';
import { logger } from './logger';
import { logError, classifyError } from './errors';
import { eventBus, EventType } from './event-driven';
import { performanceRegressionTester, PerformanceBenchmark } from './performance-regression';

export interface MonitoringConfig {
  enablePerformanceMonitoring: boolean;
  enableErrorTracking: boolean;
  enableAnalytics: boolean;
  enableUserTracking: boolean;
  sampleRate: number;
  environment: 'development' | 'staging' | 'production';
}

export interface MonitoringEvent {
  type: string;
  timestamp: number;
  data: Record<string, any>;
  userId?: string;
  sessionId: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    duration: number;
    message?: string;
  }[];
  timestamp: number;
}

/**
 * Comprehensive monitoring integration class
 */
export class MonitoringIntegration {
  private config: MonitoringConfig;
  private sessionId: string;
  private userId?: string;
  private eventQueue: MonitoringEvent[] = [];
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enablePerformanceMonitoring: true,
      enableErrorTracking: true,
      enableAnalytics: true,
      enableUserTracking: false,
      sampleRate: 1.0,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      ...config,
    };

    this.sessionId = crypto.randomUUID();
    this.initialize();
  }

  /**
   * Initialize monitoring
   */
  private initialize(): void {
    if (this.config.enablePerformanceMonitoring) {
      this.initializePerformanceMonitoring();
    }

    if (this.config.enableErrorTracking) {
      this.initializeErrorTracking();
    }

    if (this.config.enableAnalytics) {
      this.initializeAnalytics();
    }

    // Setup event listeners
    this.setupEventListeners();

    logger.info('Monitoring integration initialized', {
      sessionId: this.sessionId,
      config: this.config,
    });
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window !== 'undefined') {
      performanceMonitor.collectWebVitals();
      measurePageLoad();
    }
  }

  /**
   * Initialize error tracking
   */
  private initializeErrorTracking(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError(event.error);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(event.reason);
      });
    }
  }

  /**
   * Initialize analytics
   */
  private initializeAnalytics(): void {
    // Track page view
    this.trackEvent('page_view', {
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    eventBus.on(EventType.SYSTEM_ERROR, (data) => {
      this.trackError(data.error);
    });

    eventBus.on(EventType.USER_LOGIN, (data) => {
      this.setUserId(data.userId);
    });

    eventBus.on(EventType.USER_LOGOUT, () => {
      this.clearUserId();
    });
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
    logger.info('User ID set for monitoring', { userId });
  }

  /**
   * Clear user ID
   */
  clearUserId(): void {
    this.userId = undefined;
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.config.enableErrorTracking) return;

    const classifiedError = classifyError(error);
    logError(classifiedError, {
      ...context,
      userId: this.userId,
      sessionId: this.sessionId,
      environment: this.config.environment,
    });

    this.trackEvent('error', {
      errorType: classifiedError.name,
      errorMessage: classifiedError.message,
      ...context,
    });
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, data?: Record<string, any>): void {
    if (!this.config.enableAnalytics) return;
    if (Math.random() > this.config.sampleRate) return;

    const event: MonitoringEvent = {
      type: eventName,
      timestamp: Date.now(),
      data: data || {},
      userId: this.userId,
      sessionId: this.sessionId,
    };

    this.eventQueue.push(event);

    // Process queue in batches
    if (this.eventQueue.length >= 10) {
      this.flushEventQueue();
    }
  }

  /**
   * Flush event queue
   */
  private async flushEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In a real implementation, this would send to analytics service
      logger.debug('Flushing monitoring events', { count: events.length });
      
      // Emit event for processing
      await eventBus.emit('monitoring:events_flushed', { events });
    } catch (error) {
      logger.error('Failed to flush monitoring events', { error });
      // Re-add events to queue on failure
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Register health check
   */
  registerHealthCheck(name: string, check: () => Promise<boolean>): void {
    this.healthChecks.set(name, check);
  }

  /**
   * Run health checks
   */
  async runHealthChecks(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = [];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    for (const [name, check] of this.healthChecks.entries()) {
      const startTime = performance.now();
      try {
        const passed = await check();
        const duration = performance.now() - startTime;

        checks.push({
          name,
          status: passed ? 'pass' : 'fail',
          duration,
        });

        if (!passed) {
          overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
        }
      } catch (error) {
        const duration = performance.now() - startTime;
        checks.push({
          name,
          status: 'fail',
          duration,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      checks,
      timestamp: Date.now(),
    };
  }

  /**
   * Get monitoring summary
   */
  getSummary(): {
    performance: ReturnType<typeof performanceMonitor.getSummary>;
    errors: number;
    events: number;
    health?: HealthCheckResult;
  } {
    return {
      performance: performanceMonitor.getSummary(),
      errors: performanceMonitor.getMetrics('error').length,
      events: this.eventQueue.length,
    };
  }

  /**
   * Export monitoring data
   */
  exportData(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      userId: this.userId,
      config: this.config,
      summary: this.getSummary(),
      timestamp: Date.now(),
    }, null, 2);
  }

  /**
   * Shutdown monitoring
   */
  async shutdown(): Promise<void> {
    // Flush remaining events
    await this.flushEventQueue();

    // Export final data
    const data = this.exportData();
    logger.info('Monitoring integration shutdown', { data });

    // Clear queues
    this.eventQueue = [];
  }
}

// Global monitoring instance
export const monitoring = new MonitoringIntegration();

/**
 * Register default health checks
 */
export function registerDefaultHealthChecks(): void {
  // API health check
  monitoring.registerHealthCheck('api', async () => {
    try {
      const response = await fetch('/api/health');
      return response.ok;
    } catch {
      return false;
    }
  });

  // Database health check
  monitoring.registerHealthCheck('database', async () => {
    try {
      // In a real implementation, this would check database connectivity
      return true;
    } catch {
      return false;
    }
  });

  // Cache health check
  monitoring.registerHealthCheck('cache', async () => {
    try {
      // In a real implementation, this would check cache connectivity
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Monitoring middleware for API routes
 */
export function withMonitoring(
  handler: (request: Request) => Promise<Response>,
  options: {
    name?: string;
    trackPerformance?: boolean;
    trackErrors?: boolean;
  } = {}
): (request: Request) => Promise<Response> {
  const { name = 'api_handler', trackPerformance = true, trackErrors = true } = options;

  return async (request: Request) => {
    const startTime = performance.now();

    try {
      const response = await handler(request);
      const duration = performance.now() - startTime;

      if (trackPerformance) {
        performanceMonitor.recordMetric(`api_${name}`, duration);
        monitoring.trackEvent('api_call', {
          name,
          method: request.method,
          url: request.url,
          duration,
          status: response.status,
        });
      }

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;

      if (trackErrors) {
        monitoring.trackError(error as Error, {
          context: name,
          method: request.method,
          url: request.url,
          duration,
        });
      }

      throw error;
    }
  };
}

/**
 * Performance monitoring decorator
 */
export function MonitorPerformance(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - startTime;

        performanceMonitor.recordMetric(`method_${methodName}`, duration);
        monitoring.trackEvent('method_call', {
          name: methodName,
          duration,
          success: true,
        });

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        monitoring.trackError(error as Error, {
          context: methodName,
          duration,
        });

        monitoring.trackEvent('method_call', {
          name: methodName,
          duration,
          success: false,
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Initialize monitoring on app startup
 */
export function initializeMonitoring(config?: Partial<MonitoringConfig>): void {
  // Create monitoring instance with config
  const monitoringInstance = new MonitoringIntegration(config);

  // Register default health checks
  registerDefaultHealthChecks();

  // Setup periodic health checks
  if (typeof window !== 'undefined') {
    setInterval(async () => {
      const health = await monitoringInstance.runHealthChecks();
      
      if (health.status !== 'healthy') {
        monitoringInstance.trackEvent('health_check_failed', {
          status: health.status,
          checks: health.checks,
        });
      }
    }, 60000); // Every minute
  }

  // Setup cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      monitoringInstance.shutdown();
    });
  }

  logger.info('Monitoring initialized', { config });
}

/**
 * Monitoring dashboard utilities
 */
export class MonitoringDashboard {
  /**
   * Get real-time metrics
   */
  static getRealTimeMetrics(): {
    performance: ReturnType<typeof performanceMonitor.getSummary>;
    health?: HealthCheckResult;
    recentEvents: MonitoringEvent[];
  } {
    return {
      performance: performanceMonitor.getSummary(),
      recentEvents: monitoring['eventQueue'].slice(-10),
    };
  }

  /**
   * Get metrics for time range
   */
  static getMetricsForTimeRange(startTime: number, endTime: number): {
    performanceMetrics: PerformanceMetric[];
    errorCount: number;
    eventCount: number;
  } {
    const allMetrics = performanceMonitor.getMetrics();
    const filteredMetrics = allMetrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );

    return {
      performanceMetrics: filteredMetrics,
      errorCount: filteredMetrics.filter(m => m.name === 'error').length,
      eventCount: filteredMetrics.length,
    };
  }

  /**
   * Generate monitoring report
   */
  static generateReport(): string {
    const summary = monitoring.getSummary();
    const health = monitoring.runHealthChecks();

    return `
# Monitoring Report

## Performance Summary
- Total Metrics: ${summary.performance.metrics.length}
- Web Vitals: ${JSON.stringify(summary.performance.webVitals, null, 2)}

## Error Summary
- Total Errors: ${summary.errors}

## Event Summary
- Queued Events: ${summary.events}

## Health Status
${health ? JSON.stringify(health, null, 2) : 'Not available'}

## Session Info
- Session ID: ${monitoring['sessionId']}
- User ID: ${monitoring['userId'] || 'Not set'}
- Environment: ${monitoring['config'].environment}
`;
  }
}

/**
 * Export monitoring utilities
 */
export const monitoringUtils = {
  initialize: initializeMonitoring,
  trackEvent: (name: string, data?: Record<string, any>) => monitoring.trackEvent(name, data),
  trackError: (error: Error, context?: Record<string, any>) => monitoring.trackError(error, context),
  getSummary: () => monitoring.getSummary(),
  exportData: () => monitoring.exportData(),
  shutdown: () => monitoring.shutdown(),
  dashboard: MonitoringDashboard,
};
