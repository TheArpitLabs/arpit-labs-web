/**
 * Analytics and metrics collection utilities
 */

export interface Metric {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface UserEvent {
  eventType: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, any>;
  timestamp: string;
  page?: string;
  referrer?: string;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private events: UserEvent[] = [];
  private maxMetrics = 5000;
  private maxEvents = 10000;
  private flushInterval = 60000; // 1 minute
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushTimer();
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>, metadata?: Record<string, any>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      tags,
      metadata,
    };

    this.metrics.push(metric);

    // Evict oldest metrics if limit reached
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Record a user event
   */
  recordEvent(eventType: string, properties?: Record<string, any>, userId?: string): void {
    const event: UserEvent = {
      eventType,
      userId,
      sessionId: this.getSessionId(),
      properties,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      referrer: document.referrer,
    };

    this.events.push(event);

    // Evict oldest events if limit reached
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  /**
   * Get or generate session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Flush metrics to server
   */
  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics: this.metrics }),
      });

      // Clear flushed metrics
      this.metrics = [];
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }

  /**
   * Flush events to server
   */
  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: this.events }),
      });

      // Clear flushed events
      this.events = [];
    } catch (error) {
      console.error('Failed to flush events:', error);
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushMetrics();
      this.flushEvents();
    }, this.flushInterval);
  }

  /**
   * Stop automatic flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  /**
   * Get all events
   */
  getEvents(): UserEvent[] {
    return [...this.events];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): Metric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): UserEvent[] {
    return this.events.filter(e => e.eventType === eventType);
  }

  /**
   * Clear all metrics and events
   */
  clear(): void {
    this.metrics = [];
    this.events = [];
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

export { metricsCollector };

/**
 * Record page view
 */
export function recordPageView(page?: string, userId?: string): void {
  metricsCollector.recordEvent('page_view', {
    page: page || window.location.pathname,
    title: document.title,
    referrer: document.referrer,
  }, userId);
}

/**
 * Record user interaction
 */
export function recordInteraction(action: string, element?: string, properties?: Record<string, any>): void {
  metricsCollector.recordEvent('user_interaction', {
    action,
    element,
    ...properties,
  });
}

/**
 * Record custom metric
 */
export function recordMetric(name: string, value: number, tags?: Record<string, string>): void {
  metricsCollector.recordMetric(name, value, tags);
}

/**
 * Record timing metric
 */
export function recordTiming(name: string, duration: number, tags?: Record<string, string>): void {
  metricsCollector.recordMetric(`${name}_duration`, duration, tags);
}

/**
 * Record counter metric
 */
export function incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
  metricsCollector.recordMetric(name, value, tags);
}

/**
 * Record gauge metric
 */
export function recordGauge(name: string, value: number, tags?: Record<string, string>): void {
  metricsCollector.recordMetric(name, value, tags);
}

/**
 * Setup automatic page tracking
 */
export function setupPageTracking(userId?: string): void {
  // Track initial page view
  recordPageView(undefined, userId);

  // Track page navigation (SPA)
  let lastUrl = window.location.pathname;
  
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.pathname;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      recordPageView(currentUrl, userId);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Track history changes
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    recordPageView(window.location.pathname, userId);
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    recordPageView(window.location.pathname, userId);
  };

  window.addEventListener('popstate', () => {
    recordPageView(window.location.pathname, userId);
  });
}

/**
 * Setup automatic performance tracking
 */
export function setupPerformanceTracking(): void {
  if ('PerformanceObserver' in window) {
    // Track Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          recordMetric('lcp', (entry as any).startTime);
        } else if (entry.entryType === 'first-input') {
          recordMetric('fid', (entry as any).processingStart - (entry as any).startTime);
        } else if (entry.entryType === 'layout-shift') {
          recordMetric('cls', (entry as any).value);
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
  }

  // Track page load time
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
      recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
      recordMetric('time_to_interactive', navigation.domInteractive - navigation.fetchStart);
    }
  });
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary(): {
  totalMetrics: number;
  totalEvents: number;
  metricsByType: Record<string, number>;
  eventsByType: Record<string, number>;
  recentActivity: {
    metrics: Metric[];
    events: UserEvent[];
  };
} {
  const metrics = metricsCollector.getMetrics();
  const events = metricsCollector.getEvents();

  const metricsByType: Record<string, number> = {};
  const eventsByType: Record<string, number> = {};

  metrics.forEach(m => {
    metricsByType[m.name] = (metricsByType[m.name] || 0) + 1;
  });

  events.forEach(e => {
    eventsByType[e.eventType] = (eventsByType[e.eventType] || 0) + 1;
  });

  const recentMetrics = metrics.slice(-50);
  const recentEvents = events.slice(-50);

  return {
    totalMetrics: metrics.length,
    totalEvents: events.length,
    metricsByType,
    eventsByType,
    recentActivity: {
      metrics: recentMetrics,
      events: recentEvents,
    },
  };
}
