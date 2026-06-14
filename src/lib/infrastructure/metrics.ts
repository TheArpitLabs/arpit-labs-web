/**
 * Metrics Collection System
 * Tracks performance, usage, and system health metrics
 */

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface MetricSummary {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  private maxMetricsPerName: number = 1000;

  /**
   * Record a metric
   */
  record(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      tags,
    };

    const metrics = this.metrics.get(name) || [];
    metrics.push(metric);

    // Keep only the most recent metrics
    if (metrics.length > this.maxMetricsPerName) {
      metrics.shift();
    }

    this.metrics.set(name, metrics);
  }

  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    const metrics = this.metrics.get(name) || [];
    const lastMetric = metrics[metrics.length - 1];
    
    const newValue = lastMetric ? lastMetric.value + value : value;
    this.record(name, newValue, tags);
  }

  /**
   * Record a timing (duration in milliseconds)
   */
  timing(name: string, duration: number, tags?: Record<string, string>): void {
    this.record(`${name}_duration`, duration, tags);
    this.record(`${name}_count`, 1, tags);
  }

  /**
   * Record a gauge (current value)
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.record(name, value, tags);
  }

  /**
   * Get metrics for a name
   */
  getMetrics(name: string): Metric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get summary statistics for a metric
   */
  getSummary(name: string): MetricSummary | null {
    const metrics = this.metrics.get(name);
    
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, v) => acc + v, 0);

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p50: values[Math.floor(values.length * 0.5)],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)],
    };
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Clear metrics for a name
   */
  clear(name: string): void {
    this.metrics.delete(name);
  }

  /**
   * Clear all metrics
   */
  clearAll(): void {
    this.metrics.clear();
  }

  /**
   * Get metrics within a time range
   */
  getMetricsInRange(name: string, startTime: Date, endTime: Date): Metric[] {
    const metrics = this.metrics.get(name) || [];
    return metrics.filter(m => 
      m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  /**
   * Get recent metrics (last N)
   */
  getRecentMetrics(name: string, count: number): Metric[] {
    const metrics = this.metrics.get(name) || [];
    return metrics.slice(-count);
  }

  /**
   * Export metrics as JSON
   */
  export(): Record<string, Metric[]> {
    const exportData: Record<string, Metric[]> = {};
    
    for (const [name, metrics] of this.metrics.entries()) {
      exportData[name] = metrics;
    }
    
    return exportData;
  }

  /**
   * Get system health metrics
   */
  getHealthMetrics(): Record<string, any> {
    return {
      totalMetrics: Array.from(this.metrics.values()).reduce((acc, m) => acc + m.length, 0),
      metricNames: this.getMetricNames().length,
      timestamp: new Date(),
    };
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

// Common metric helpers
export const apiMetrics = {
  recordRequest: (endpoint: string, duration: number, status: number) => {
    metrics.timing(`api_request_${endpoint}`, duration, { status: String(status) });
    metrics.increment(`api_request_count`, 1, { endpoint, status: String(status) });
  },

  recordError: (endpoint: string, error: string) => {
    metrics.increment(`api_error_count`, 1, { endpoint, error });
  },

  recordCacheHit: (key: string) => {
    metrics.increment('cache_hit', 1, { key });
  },

  recordCacheMiss: (key: string) => {
    metrics.increment('cache_miss', 1, { key });
  },
};

export const dbMetrics = {
  recordQuery: (query: string, duration: number) => {
    metrics.timing(`db_query_${query}`, duration);
    metrics.increment('db_query_count', 1, { query });
  },

  recordError: (operation: string, error: string) => {
    metrics.increment('db_error_count', 1, { operation, error });
  },

  recordConnection: (pool: string, active: number, idle: number) => {
    metrics.gauge('db_connection_active', active, { pool });
    metrics.gauge('db_connection_idle', idle, { pool });
  },
};

export const jobMetrics = {
  recordJobStart: (type: string) => {
    metrics.increment('job_started', 1, { type });
  },

  recordJobComplete: (type: string, duration: number) => {
    metrics.timing(`job_duration_${type}`, duration);
    metrics.increment('job_completed', 1, { type });
  },

  recordJobFailure: (type: string, error: string) => {
    metrics.increment('job_failed', 1, { type, error });
  },
};
