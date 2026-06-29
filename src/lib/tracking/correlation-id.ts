/**
 * Request Correlation ID Tracking
 * Tracks requests across services with correlation IDs
 */

export interface CorrelationConfig {
  headerName?: string;
  generateIfMissing?: boolean;
  includeInLogs?: boolean;
  includeInErrors?: boolean;
}

class CorrelationIDTracker {
  private config: Required<CorrelationConfig>;
  private currentID: string | null = null;

  constructor(config: CorrelationConfig = {}) {
    this.config = {
      headerName: 'x-correlation-id',
      generateIfMissing: true,
      includeInLogs: true,
      includeInErrors: true,
      ...config,
    };
  }

  /**
   * Generates a correlation ID
   */
  generateID(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Extracts or generates correlation ID from request
   */
  getID(request: Request): string {
    const headerID = request.headers.get(this.config.headerName);

    if (headerID) {
      this.currentID = headerID;
      return headerID;
    }

    if (this.config.generateIfMissing) {
      const newID = this.generateID();
      this.currentID = newID;
      return newID;
    }

    this.currentID = null;
    return '';
  }

  /**
   * Gets current correlation ID
   */
  getCurrentID(): string | null {
    return this.currentID;
  }

  /**
   * Sets current correlation ID
   */
  setCurrentID(id: string): void {
    this.currentID = id;
  }

  /**
   * Clears current correlation ID
   */
  clearCurrentID(): void {
    this.currentID = null;
  }

  /**
   * Adds correlation ID to headers
   */
  addToHeaders(headers: Headers): Headers {
    if (this.currentID) {
      headers.set(this.config.headerName, this.currentID);
    }
    return headers;
  }

  /**
   * Adds correlation ID to error
   */
  addToError(error: Error): Error {
    if (this.currentID && this.config.includeInErrors) {
      (error as any).correlationID = this.currentID;
    }
    return error;
  }

  /**
   * Adds correlation ID to log entry
   */
  addToLog(logEntry: any): any {
    if (this.currentID && this.config.includeInLogs) {
      logEntry.correlationID = this.currentID;
    }
    return logEntry;
  }

  /**
   * Creates a child correlation ID for sub-operations
   */
  createChildID(): string {
    if (!this.currentID) {
      return this.generateID();
    }

    return `${this.currentID}-${Math.random().toString(36).substring(2, 6)}`;
  }

  /**
   * Updates configuration
   */
  updateConfig(config: Partial<CorrelationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create singleton instance
const correlationTracker = new CorrelationIDTracker();

/**
 * Generates a correlation ID
 */
export function generateCorrelationID(): string {
  return correlationTracker.generateID();
}

/**
 * Gets correlation ID from request
 */
export function getCorrelationID(request: Request): string {
  return correlationTracker.getID(request);
}

/**
 * Gets current correlation ID
 */
export function getCurrentCorrelationID(): string | null {
  return correlationTracker.getCurrentID();
}

/**
 * Sets current correlation ID
 */
export function setCurrentCorrelationID(id: string): void {
  correlationTracker.setCurrentID(id);
}

/**
 * Clears current correlation ID
 */
export function clearCorrelationID(): void {
  correlationTracker.clearCurrentID();
}

/**
 * Adds correlation ID to headers
 */
export function addCorrelationIDToHeaders(headers: Headers): Headers {
  return correlationTracker.addToHeaders(headers);
}

/**
 * Adds correlation ID to error
 */
export function addCorrelationIDToError(error: Error): Error {
  return correlationTracker.addToError(error);
}

/**
 * Adds correlation ID to log
 */
export function addCorrelationIDToLog(logEntry: any): any {
  return correlationTracker.addToLog(logEntry);
}

/**
 * Creates child correlation ID
 */
export function createChildCorrelationID(): string {
  return correlationTracker.createChildID();
}

/**
 * Middleware for correlation ID tracking
 */
export function correlationIDMiddleware(config?: CorrelationConfig) {
  const tracker = config ? new CorrelationIDTracker(config) : correlationTracker;

  return async (request: Request): Promise<Response | null> => {
    const correlationID = tracker.getID(request);

    if (correlationID) {
      // Add correlation ID to request headers for downstream services
      const newRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      newRequest.headers.set(tracker['config'].headerName, correlationID);

      // Execute request
      const response = await fetch(newRequest);

      // Add correlation ID to response headers
      const newResponse = new Response(response.body, response);
      newResponse.headers.set(tracker['config'].headerName, correlationID);

      return newResponse;
    }

    return null;
  };
}

export default correlationTracker;
