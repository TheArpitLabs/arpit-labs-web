/**
 * Monitoring and Observability Types
 * 
 * Defines the interfaces and types for system monitoring
 */

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  labels: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  message: string;
  metadata?: Record<string, unknown>;
  error?: Error;
}

export interface HealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: HealthCheckItem[];
  responseTime: number;
}

export interface HealthCheckItem {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  responseTime?: number;
  metadata?: Record<string, unknown>;
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, unknown>;
}

export interface MonitoringConfig {
  enableMetrics: boolean;
  enableLogging: boolean;
  enableHealthChecks: boolean;
  enableAlerts: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  metricsRetentionDays: number;
  logRetentionDays: number;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    queueSize: number;
    memoryUsage: number;
  };
}

export interface PerformanceMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
}
