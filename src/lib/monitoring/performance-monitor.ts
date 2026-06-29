/**
 * Performance monitoring utilities
 */

export interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoadedTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
}

/**
 * Get page load performance metrics
 */
export function getPageLoadMetrics(): PerformanceMetrics {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
    domContentLoadedTime: navigation.domContentLoadedEventEnd - navigation.fetchStart,
    firstContentfulPaint: 0, // Will be measured separately
    largestContentfulPaint: 0, // Will be measured separately
    firstInputDelay: 0, // Will be measured separately
    cumulativeLayoutShift: 0, // Will be measured separately
    timeToInteractive: navigation.domInteractive - navigation.fetchStart,
    totalBlockingTime: 0, // Will be calculated separately
  };
}

/**
 * Get resource timing metrics
 */
export function getResourceTimingMetrics(): ResourceTiming[] {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return resources.map(resource => ({
    name: resource.name,
    duration: resource.duration,
    size: resource.transferSize,
    type: resource.initiatorType,
  }));
}

/**
 * Measure First Contentful Paint
 */
export function measureFirstContentfulPaint(): Promise<number> {
  return new Promise((resolve) => {
    if (!('PerformanceObserver' in window)) {
      resolve(0);
      return;
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries[0]?.startTime || 0;
      observer.disconnect();
      resolve(fcp);
    });

    observer.observe({ type: 'paint', buffered: true });
  });
}

/**
 * Measure Largest Contentful Paint
 */
export function measureLargestContentfulPaint(): Promise<number> {
  return new Promise((resolve) => {
    if (!('PerformanceObserver' in window)) {
      resolve(0);
      return;
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcp = entries[entries.length - 1]?.startTime || 0;
      observer.disconnect();
      resolve(lcp);
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  });
}

/**
 * Measure First Input Delay
 */
export function measureFirstInputDelay(): Promise<number> {
  return new Promise((resolve) => {
    if (!('PerformanceObserver' in window)) {
      resolve(0);
      return;
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const entry = entries[0] as any;
      const fid = entry?.processingStart - entry?.startTime || 0;
      observer.disconnect();
      resolve(fid);
    });

    observer.observe({ type: 'first-input', buffered: true });
  });
}

/**
 * Measure Cumulative Layout Shift
 */
export function measureCumulativeLayoutShift(): Promise<number> {
  return new Promise((resolve) => {
    if (!('PerformanceObserver' in window)) {
      resolve(0);
      return;
    }

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    // Resolve after 5 seconds
    setTimeout(() => {
      observer.disconnect();
      resolve(clsValue);
    }, 5000);
  });
}

/**
 * Calculate Total Blocking Time
 */
export function calculateTotalBlockingTime(): number {
  const longTasks = performance.getEntriesByType('longtask');
  let totalBlockingTime = 0;
  
  longTasks.forEach((task) => {
    const start = task.startTime;
    const duration = task.duration;
    const fcp = 0; // Would need actual FCP value
    const tti = 0; // Would need actual TTI value
    
    if (start >= fcp && start < tti) {
      totalBlockingTime += duration - 50;
    }
  });
  
  return totalBlockingTime;
}

/**
 * Get all Core Web Vitals
 */
export async function getCoreWebVitals(): Promise<{
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  tbt: number;
}> {
  const [fcp, lcp, fid, cls] = await Promise.all([
    measureFirstContentfulPaint(),
    measureLargestContentfulPaint(),
    measureFirstInputDelay(),
    measureCumulativeLayoutShift(),
  ]);
  
  const tbt = calculateTotalBlockingTime();
  
  return { fcp, lcp, fid, cls, tbt };
}

/**
 * Monitor performance over time
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private interval: NodeJS.Timeout | null = null;

  startMonitoring(intervalMs: number = 60000): void {
    this.interval = setInterval(() => {
      const metrics = getPageLoadMetrics();
      this.metrics.push(metrics);
      
      // Keep only last 100 measurements
      if (this.metrics.length > 100) {
        this.metrics.shift();
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const sum = this.metrics.reduce((acc, metric) => ({
      pageLoadTime: acc.pageLoadTime + metric.pageLoadTime,
      domContentLoadedTime: acc.domContentLoadedTime + metric.domContentLoadedTime,
      timeToInteractive: acc.timeToInteractive + metric.timeToInteractive,
    }), { pageLoadTime: 0, domContentLoadedTime: 0, timeToInteractive: 0 });

    return {
      pageLoadTime: sum.pageLoadTime / this.metrics.length,
      domContentLoadedTime: sum.domContentLoadedTime / this.metrics.length,
      timeToInteractive: sum.timeToInteractive / this.metrics.length,
    };
  }
}

/**
 * Report performance metrics to analytics
 */
export async function reportPerformanceMetrics(): Promise<void> {
  try {
    const metrics = await getCoreWebVitals();
    const pageMetrics = getPageLoadMetrics();
    const resourceMetrics = getResourceTimingMetrics();

    await fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coreWebVitals: metrics,
        pageMetrics,
        resourceMetrics,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });
  } catch (error) {
    console.error('Failed to report performance metrics:', error);
  }
}

/**
 * Mark performance timing
 */
export function markPerformance(name: string): void {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(name);
  }
}

/**
 * Measure performance between marks
 */
export function measurePerformance(name: string, startMark: string, endMark: string): number {
  if ('performance' in window && 'measure' in performance) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      return measure?.duration || 0;
    } catch (error) {
      console.error('Failed to measure performance:', error);
      return 0;
    }
  }
  return 0;
}

/**
 * Clear performance marks
 */
export function clearPerformanceMarks(): void {
  if ('performance' in window && 'clearMarks' in performance) {
    performance.clearMarks();
  }
  if ('performance' in window && 'clearMeasures' in performance) {
    performance.clearMeasures();
  }
}

/**
 * Get memory usage (if available)
 */
export function getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

/**
 * Monitor memory leaks
 */
export function monitorMemoryLeaks(threshold: number = 50 * 1024 * 1024): void {
  const memory = getMemoryUsage();
  if (memory && memory.usedJSHeapSize > threshold) {
    console.warn('Potential memory leak detected:', {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    });
  }
}
