/**
 * Performance monitoring utilities
 * Provides performance metrics collection, Web Vitals tracking, and monitoring
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface WebVitals {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private webVitals: WebVitals = {};
  private maxMetrics: number = 1000;

  /**
   * Record a custom performance metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get metrics by name
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Get average metric value
   */
  getAverageMetric(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  /**
   * Get percentile metric value
   */
  getPercentileMetric(name: string, percentile: number = 95): number {
    const metrics = this.getMetrics(name).map(m => m.value).sort((a, b) => a - b);
    if (metrics.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * metrics.length) - 1;
    return metrics[Math.max(0, index)];
  }

  /**
   * Measure function execution time
   */
  async measureFunction<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Measure synchronous function execution time
   */
  measureSyncFunction<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get Web Vitals
   */
  getWebVitals(): WebVitals {
    return { ...this.webVitals };
  }

  /**
   * Collect Web Vitals
   */
  async collectWebVitals(): Promise<void> {
    if (typeof window === 'undefined') return;

    // First Contentful Paint
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
    if (fcpEntry) {
      this.webVitals.FCP = fcpEntry.startTime;
    }

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.webVitals.LCP = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observation failed:', e);
      }
    }

    // First Input Delay
    if ('PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0] as any;
          this.webVitals.FID = firstEntry.processingStart - firstEntry.startTime;
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observation failed:', e);
      }
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.webVitals.CLS = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observation failed:', e);
      }
    }

    // Time to First Byte
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    if (navigation) {
      this.webVitals.TTFB = navigation.responseStart - navigation.requestStart;
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    metrics: { name: string; count: number; average: number; min: number; max: number }[];
    webVitals: WebVitals;
  } {
    const metricNames = [...new Set(this.metrics.map(m => m.name))];
    const summary = metricNames.map(name => {
      const metrics = this.getMetrics(name);
      const values = metrics.map(m => m.value);
      return {
        name,
        count: metrics.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    return {
      metrics: summary,
      webVitals: this.getWebVitals(),
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure page load time
 */
export function measurePageLoad(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    if (navigation) {
      performanceMonitor.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
      performanceMonitor.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
      performanceMonitor.recordMetric('first_paint', navigation.responseStart - navigation.fetchStart);
    }
  });
}

/**
 * Measure API call performance
 */
export async function measureAPICall<T>(
  url: string,
  fn: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measureFunction(`api_call_${url}`, fn, { url });
}

/**
 * Measure render performance
 */
export function measureRender(componentName: string): () => void {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric(`render_${componentName}`, duration);
  };
}

/**
 * Memory monitoring
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  limit: number;
} | null {
  if (typeof window === 'undefined' || !(performance as any).memory) {
    return null;
  }

  const memory = (performance as any).memory;
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    limit: memory.jsHeapSizeLimit,
  };
}

/**
 * Monitor memory usage over time
 */
export function startMemoryMonitoring(interval: number = 5000): () => void {
  const intervalId = setInterval(() => {
    const usage = getMemoryUsage();
    if (usage) {
      performanceMonitor.recordMetric('memory_used', usage.used);
      performanceMonitor.recordMetric('memory_total', usage.total);
    }
  }, interval);

  return () => clearInterval(intervalId);
}

/**
 * Network performance monitoring
 */
export function getNetworkPerformance(): {
  downlink: number;
  effectiveType: string;
  rtt: number;
  saveData: boolean;
} | null {
  if (typeof window === 'undefined' || !(navigator as any).connection) {
    return null;
  }

  const connection = (navigator as any).connection;
  return {
    downlink: connection.downlink,
    effectiveType: connection.effectiveType,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
}

/**
 * Monitor network performance
 */
export function startNetworkMonitoring(): () => void {
  if (typeof window === 'undefined' || !(navigator as any).connection) {
    return () => {};
  }

  const connection = (navigator as any).connection;
  const handler = () => {
    const perf = getNetworkPerformance();
    if (perf) {
      performanceMonitor.recordMetric('network_downlink', perf.downlink);
      performanceMonitor.recordMetric('network_rtt', perf.rtt);
    }
  };

  connection.addEventListener('change', handler);
  handler(); // Initial measurement

  return () => connection.removeEventListener('change', handler);
}

/**
 * Resource timing monitoring
 */
export function getResourceTimings(): Array<{
  name: string;
  duration: number;
  size: number;
}> {
  if (typeof window === 'undefined') return [];

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  return resources.map(r => ({
    name: r.name,
    duration: r.duration,
    size: r.transferSize,
  }));
}

/**
 * Monitor slow resources
 */
export function identifySlowResources(threshold: number = 1000): string[] {
  const resources = getResourceTimings();
  return resources
    .filter(r => r.duration > threshold)
    .map(r => r.name);
}

/**
 * Performance score calculation
 */
export function calculatePerformanceScore(): {
  overall: number;
  metrics: Record<string, number>;
} {
  const summary = performanceMonitor.getSummary();
  const scores: Record<string, number> = {};

  // Score based on Web Vitals
  if (summary.webVitals.LCP) {
    scores.LCP = summary.webVitals.LCP < 2500 ? 100 : summary.webVitals.LCP < 4000 ? 50 : 0;
  }
  if (summary.webVitals.FID) {
    scores.FID = summary.webVitals.FID < 100 ? 100 : summary.webVitals.FID < 300 ? 50 : 0;
  }
  if (summary.webVitals.CLS !== undefined) {
    scores.CLS = summary.webVitals.CLS < 0.1 ? 100 : summary.webVitals.CLS < 0.25 ? 50 : 0;
  }

  // Calculate overall score
  const scoreValues = Object.values(scores);
  const overall = scoreValues.length > 0
    ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
    : 0;

  return {
    overall: Math.round(overall),
    metrics: scores,
  };
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  measurePageLoad();
  performanceMonitor.collectWebVitals();
  startMemoryMonitoring();
  startNetworkMonitoring();

  console.log('Performance monitoring initialized');
}

/**
 * Export performance report
 */
export function exportPerformanceReport(): string {
  const summary = performanceMonitor.getSummary();
  const score = calculatePerformanceScore();
  const memory = getMemoryUsage();
  const network = getNetworkPerformance();

  return JSON.stringify({
    timestamp: new Date().toISOString(),
    summary,
    score,
    memory,
    network,
    slowResources: identifySlowResources(),
  }, null, 2);
}
