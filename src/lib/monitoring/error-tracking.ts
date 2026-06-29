/**
 * Error Tracking Integration
 * Integrates with error tracking services like Sentry
 */

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
}

export interface Breadcrumb {
  message: string;
  category?: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  timestamp?: number;
  data?: Record<string, any>;
}

export interface ErrorEvent {
  error: Error;
  context?: ErrorContext;
  breadcrumbs?: Breadcrumb[];
}

class ErrorTracker {
  private enabled = true;
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private beforeSendCallbacks: Array<(event: ErrorEvent) => ErrorEvent | null> = [];

  /**
   * Initializes the error tracker
   */
  initialize(config: {
    dsn?: string;
    environment?: string;
    release?: string;
    enabled?: boolean;
  }): void {
    this.enabled = config.enabled !== false;

    if (this.enabled) {
      // Initialize error tracking service (e.g., Sentry)
      console.log('Error tracking initialized', config);

      // Set up global error handlers
      this.setupGlobalHandlers();
    }
  }

  /**
   * Sets up global error handlers
   */
  private setupGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      window.onerror = (message, source, lineno, colno, error) => {
        this.captureException(error || new Error(String(message)));
        return false;
      };

      window.onunhandledrejection = (event) => {
        this.captureException(event.reason);
      };
    }
  }

  /**
   * Captures an exception
   */
  captureException(error: Error, context?: ErrorContext): string {
    if (!this.enabled) return 'disabled';

    const event: ErrorEvent = {
      error,
      context,
      breadcrumbs: [...this.breadcrumbs],
    };

    // Run beforeSend callbacks
    for (const callback of this.beforeSendCallbacks) {
      const result = callback(event);
      if (result === null) {
        return 'filtered';
      }
      Object.assign(event, result);
    }

    // Send to error tracking service
    console.error('Captured exception:', event);

    // Clear breadcrumbs after capture
    this.clearBreadcrumbs();

    return `event-${Date.now()}`;
  }

  /**
   * Captures a message
   */
  captureMessage(message: string, context?: ErrorContext): string {
    if (!this.enabled) return 'disabled';

    const error = new Error(message);
    return this.captureException(error, context);
  }

  /**
   * Adds a breadcrumb
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now(),
    });

    // Enforce max breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Clears breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * Registers a beforeSend callback
   */
  beforeSend(callback: (event: ErrorEvent) => ErrorEvent | null): void {
    this.beforeSendCallbacks.push(callback);
  }

  /**
   * Sets user context
   */
  setUser(user: { id?: string; email?: string; username?: string }): void {
    console.log('User context set:', user);
  }

  /**
   * Sets tag
   */
  setTag(key: string, value: string): void {
    console.log(`Tag set: ${key} = ${value}`);
  }

  /**
   * Sets extra context
   */
  setExtra(key: string, value: any): void {
    console.log(`Extra set: ${key} =`, value);
  }

  /**
   * Enables/disables error tracking
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Gets current breadcrumbs
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

/**
 * Initializes error tracking
 */
export function initializeErrorTracking(config: {
  dsn?: string;
  environment?: string;
  release?: string;
  enabled?: boolean;
}): void {
  errorTracker.initialize(config);
}

/**
 * Captures an exception
 */
export function captureException(error: Error, context?: ErrorContext): string {
  return errorTracker.captureException(error, context);
}

/**
 * Captures a message
 */
export function captureMessage(message: string, context?: ErrorContext): string {
  return errorTracker.captureMessage(message, context);
}

/**
 * Adds a breadcrumb
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  errorTracker.addBreadcrumb(breadcrumb);
}

/**
 * Clears breadcrumbs
 */
export function clearBreadcrumbs(): void {
  errorTracker.clearBreadcrumbs();
}

/**
 * Registers beforeSend callback
 */
export function onErrorBeforeSend(callback: (event: ErrorEvent) => ErrorEvent | null): void {
  errorTracker.beforeSend(callback);
}

/**
 * Sets user context
 */
export function setErrorUser(user: {
  id?: string;
  email?: string;
  username?: string;
}): void {
  errorTracker.setUser(user);
}

/**
 * Sets tag
 */
export function setErrorTag(key: string, value: string): void {
  errorTracker.setTag(key, value);
}

/**
 * Sets extra context
 */
export function setErrorExtra(key: string, value: any): void {
  errorTracker.setExtra(key, value);
}

/**
 * Enables/disables error tracking
 */
export function setErrorTrackingEnabled(enabled: boolean): void {
  errorTracker.setEnabled(enabled);
}

/**
 * Gets breadcrumbs
 */
export function getErrorBreadcrumbs(): Breadcrumb[] {
  return errorTracker.getBreadcrumbs();
}

export default errorTracker;
