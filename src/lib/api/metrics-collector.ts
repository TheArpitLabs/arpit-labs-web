/**
 * API Metrics Collection
 * Collects and aggregates API performance metrics
 */

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface MetricSummary {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50?: number;
  p95?: number;
  p99?: number;
}

class MetricsCollector {
  private metrics = new Map<string, Metric[]>();
  private maxMetricsPerName = 10000;

  /**
   * Records a metric
   */
  record(metric: Metric): void {
    const name = metric.name;

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Enforce max metrics
    if (metrics.length > this.maxMetricsPerName) {
      metrics.shift();
    }
  }

  /**
   * Records a counter metric
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.record({
      name,
      value,
      timestamp: Date.now(),
      tags,
    });
  }

  /**
   * Records a gauge metric
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.record({
      name,
      value,
      timestamp: Date.now(),
      tags,
    });
  }

  /**
   * Records a histogram metric
   */
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    this.record({
      name,
      value,
      timestamp: Date.now(),
      tags,
    });
  }

  /**
   * Records a timing metric
   */
  timing(name: string, duration: number, tags?: Record<string, string>): void {
    this.histogram(name, duration, tags);
  }

  /**
   * Gets metrics by name
   */
  getMetrics(name: string): Metric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Gets all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Gets metric summary
   */
  getSummary(name: string): MetricSummary | null {
    const metrics = this.metrics.get(name);

    if (!metrics || metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);

    return {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: values[0],
      max: values[values.length - 1],
      p50: values[Math.floor(values.length * 0.5)],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)],
    };
  }

  /**
   * Gets metrics filtered by tags
   */
  getMetricsByTags(name: string, tags: Record<string, string>): Metric[] {
    const metrics = this.metrics.get(name) || [];

    return metrics.filter(metric => {
      if (!metric.tags) return false;

      for (const [key, value] of Object.entries(tags)) {
        if (metric.tags[key] !== value) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Gets metrics in time range
   */
  getMetricsInTimeRange(name: string, startTime: number, endTime: number): Metric[] {
    const metrics = this.metrics.get(name) || [];

    return metrics.filter(metric => metric.timestamp >= startTime && metric.timestamp <= endTime);
  }

  /**
   * Clears metrics by name
   */
  clearMetrics(name: string): void {
    this.metrics.delete(name);
  }

  /**
   * Clears all metrics
   */
  clearAll(): void {
    this.metrics.clear();
  }

  /**
   * Gets overall statistics
   */
  getStats(): {
    totalMetrics: number;
    metricCount: number;
    oldestMetric?: number;
    newestMetric?: number;
  } {
    let totalMetrics = 0;
    let oldestMetric: number | undefined;
    let newestMetric: number | undefined;

    for (const metrics of this.metrics.values()) {
      totalMetrics += metrics.length;
      
      for (const metric of metrics) {
        if (!oldestMetric || metric.timestamp < oldestMetric) {
          oldestMetric = metric.timestamp;
        }
        if (!newestMetric || metric.timestamp > newestMetric) {
          newestMetric = metric.timestamp;
        }
      }
    }

    return {
      totalMetrics,
      metricCount: this.metrics.size,
      oldestMetric,
      newestMetric,
    };
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

/**
 * Records a metric
 */
export function recordMetric(metric: Metric): void {
  metricsCollector.record(metric);
}

/**
 * Increments a counter
 */
export function incrementCounter(name: string, value?: number, tags?: Record<string, string>): void {
  metricsCollector.increment(name, value, tags);
}

/**
 * Records a gauge
 */
export function recordGauge(name: string, value: number, tags?: Record<string, string>): void {
  metricsCollector.gauge(name, value, tags);
}

/**
 * Records a histogram
 */
export function recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
  metricsCollector.histogram(name, value, tags);
}

/**
 * Records a timing
 */
export function recordTiming(name: string, duration: number, tags?: Record<string, string>): void {
  metricsCollector.timing(name, duration, tags);
}

/**
 * Gets metrics
 */
export function getMetrics(name: string): Metric[] {
  return metricsCollector.getMetrics(name);
}

/**
 * Gets metric summary
 */
export function getMetricSummary(name: string): MetricSummary | null {
  return metricsCollector.getSummary(name);
}

/**
 * Clears metrics
 */
export function clearMetrics(name: string): void {
  metricsCollector.clearMetrics(name);
}

/**
 * Clears all metrics
 */
export function clearAllMetrics(): void {
  metricsCollector.clearAll();
}

/**
 * Gets metrics statistics
 */
export function getMetricsStats() {
  return metricsCollector.getStats();
}

/**
 * Helper to time a function
 */
export async function timeFunction<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    recordTiming(name, duration, tags);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    recordTiming(`${name}_error`, duration, tags);
    throw error;
  }
}

export default metricsCollector;
