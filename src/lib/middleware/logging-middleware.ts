/**
 * Request/Response Logging Middleware
 * Logs all incoming requests and outgoing responses
 */

export interface LoggingConfig {
  logRequests?: boolean;
  logResponses?: boolean;
  logErrors?: boolean;
  logHeaders?: boolean;
  logBody?: boolean;
  sanitizeHeaders?: string[];
  sanitizeBody?: (body: any) => any;
  logger?: (message: string, level: 'info' | 'error' | 'warn') => void;
}

/**
 * Default logger
 */
function defaultLogger(message: string, level: 'info' | 'error' | 'warn'): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

/**
 * Default configuration
 */
const defaultConfig: Required<LoggingConfig> = {
  logRequests: true,
  logResponses: true,
  logErrors: true,
  logHeaders: false,
  logBody: false,
  sanitizeHeaders: ['authorization', 'cookie', 'x-api-key'],
  sanitizeBody: (body) => body,
  logger: defaultLogger,
};

/**
 * Sanitizes headers by removing sensitive information
 */
function sanitizeHeaders(
  headers: Headers,
  sensitiveHeaders: string[]
): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of headers.entries()) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Logging middleware
 */
export function loggingMiddleware(config: LoggingConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (request: Request): Promise<Response> => {
    const startTime = Date.now();
    const url = new URL(request.url);

    // Log request
    if (finalConfig.logRequests) {
      const logData: Record<string, any> = {
        method: request.method,
        url: url.pathname + url.search,
        timestamp: new Date().toISOString(),
      };

      if (finalConfig.logHeaders) {
        logData.headers = sanitizeHeaders(
          request.headers,
          finalConfig.sanitizeHeaders
        );
      }

      if (finalConfig.logBody && request.body) {
        try {
          const body = await request.clone().json();
          logData.body = finalConfig.sanitizeBody(body);
        } catch {
          // Body is not JSON
        }
      }

      finalConfig.logger(
        `Incoming request: ${JSON.stringify(logData)}`,
        'info'
      );
    }

    // Execute request
    let response: Response;
    try {
      response = await fetch(request);
    } catch (error) {
      // Log error
      if (finalConfig.logErrors) {
        const duration = Date.now() - startTime;
        finalConfig.logger(
          `Request failed: ${request.method} ${url.pathname} - ${error} (${duration}ms)`,
          'error'
        );
      }
      throw error;
    }

    // Log response
    if (finalConfig.logResponses) {
      const duration = Date.now() - startTime;
      const logData: Record<string, any> = {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      };

      if (finalConfig.logHeaders) {
        logData.headers = sanitizeHeaders(
          response.headers,
          finalConfig.sanitizeHeaders
        );
      }

      if (finalConfig.logBody && response.body) {
        try {
          const body = await response.clone().json();
          logData.body = finalConfig.sanitizeBody(body);
        } catch {
          // Body is not JSON
        }
      }

      const level = response.ok ? 'info' : 'error';
      finalConfig.logger(
        `Outgoing response: ${JSON.stringify(logData)}`,
        level
      );
    }

    return response;
  };
}

/**
 * Default logging middleware
 */
export const defaultLoggingMiddleware = loggingMiddleware();

/**
 * Performance logger for tracking request metrics
 */
export class PerformanceLogger {
  private metrics = new Map<string, number[]>();

  /**
   * Records a request duration
   */
  recordDuration(key: string, duration: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(duration);
  }

  /**
   * Gets statistics for a key
   */
  getStats(key: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const durations = this.metrics.get(key);
    if (!durations || durations.length === 0) {
      return null;
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count,
      avg: sum / count,
      min: sorted[0],
      max: sorted[count - 1],
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };
  }

  /**
   * Clears all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Gets all keys
   */
  getKeys(): string[] {
    return Array.from(this.metrics.keys());
  }
}
