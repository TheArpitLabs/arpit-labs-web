/**
 * Error tracking and monitoring utilities
 */

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  additionalData?: Record<string, any>;
}

export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  type: string;
  timestamp: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  firstSeen: string;
  lastSeen: string;
}

class ErrorTracker {
  private errors: Map<string, TrackedError> = new Map();
  private maxErrors = 1000;
  private flushInterval = 60000; // 1 minute
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushTimer();
  }

  private generateErrorId(error: Error): string {
    const stackSnippet = error.stack ? error.stack.substring(0, 50) : '';
    return `${error.name}-${error.message}-${stackSnippet}`.replace(/\s/g, '-');
  }

  private getSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      return 'critical';
    }
    if (error.message.includes('security') || error.message.includes('auth')) {
      return 'high';
    }
    if (error.message.includes('timeout') || error.message.includes('network')) {
      return 'medium';
    }
    return 'low';
  }

  track(error: Error, context: ErrorContext = {}): void {
    const errorId = this.generateErrorId(error);
    const existing = this.errors.get(errorId);
    const now = new Date().toISOString();
    const severity = this.getSeverity(error);

    if (existing) {
      existing.count++;
      existing.lastSeen = now;
      existing.context = { ...existing.context, ...context };
    } else {
      const trackedError: TrackedError = {
        id: errorId,
        message: error.message,
        stack: error.stack,
        type: error.name,
        timestamp: now,
        context,
        severity,
        count: 1,
        firstSeen: now,
        lastSeen: now,
      };

      this.errors.set(errorId, trackedError);

      // Evict oldest errors if limit reached
      if (this.errors.size > this.maxErrors) {
        const oldestKey = this.errors.keys().next().value;
        if (oldestKey) {
          this.errors.delete(oldestKey);
        }
      }
    }

    // Send critical errors immediately
    if (severity === 'critical') {
      this.flushError(errorId);
    }
  }

  private async flushError(errorId: string): Promise<void> {
    const error = this.errors.get(errorId);
    if (!error) return;

    try {
      await fetch('/api/errors/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (err) {
      console.error('Failed to flush error:', err);
    }
  }

  private async flushAllErrors(): Promise<void> {
    const errors = Array.from(this.errors.values());
    
    if (errors.length === 0) return;

    try {
      await fetch('/api/errors/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors }),
      });

      // Clear flushed errors
      this.errors.clear();
    } catch (err) {
      console.error('Failed to flush errors:', err);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushAllErrors();
    }, this.flushInterval);
  }

  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  getErrors(): TrackedError[] {
    return Array.from(this.errors.values());
  }

  getErrorById(id: string): TrackedError | undefined {
    return this.errors.get(id);
  }

  getErrorsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): TrackedError[] {
    return Array.from(this.errors.values()).filter(e => e.severity === severity);
  }

  getErrorCount(): number {
    return this.errors.size;
  }

  clearErrors(): void {
    this.errors.clear();
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

export { errorTracker };

/**
 * Track error with automatic context collection
 */
export function trackError(error: Error, additionalContext?: Record<string, any>): void {
  const context: ErrorContext = {
    url: window.location.href,
    userAgent: navigator.userAgent,
    additionalData: additionalContext,
  };

  errorTracker.track(error, context);
}

/**
 * Track promise rejection
 */
export function trackPromiseRejection(event: PromiseRejectionEvent): void {
  const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
  trackError(error, { type: 'promise_rejection' });
}

/**
 * Setup global error tracking
 */
export function setupGlobalErrorTracking(): void {
  // Track uncaught errors
  window.addEventListener('error', (event) => {
    trackError(event.error, { type: 'uncaught_error', filename: event.filename, lineno: event.lineno });
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', trackPromiseRejection);

  // Track resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      const target = event.target as HTMLElement;
      trackError(new Error(`Resource loading failed: ${target.tagName}`), {
        type: 'resource_error',
        tagName: target.tagName,
        src: (target as any).src,
      });
    }
  }, true);
}

/**
 * Create error boundary tracking
 */
export function createErrorBoundaryTracker(error: Error, errorInfo: any): void {
  trackError(error, {
    type: 'react_error_boundary',
    componentStack: errorInfo.componentStack,
  });
}

/**
 * Get error statistics
 */
export function getErrorStatistics(): {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  topErrors: TrackedError[];
} {
  const errors = errorTracker.getErrors();
  
  const bySeverity: Record<string, number> = {};
  const byType: Record<string, number> = {};
  
  errors.forEach(error => {
    bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    byType[error.type] = (byType[error.type] || 0) + 1;
  });

  const topErrors = [...errors]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total: errors.length,
    bySeverity,
    byType,
    topErrors,
  };
}
