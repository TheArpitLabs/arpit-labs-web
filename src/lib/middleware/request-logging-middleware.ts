/**
 * API Request Logging Middleware
 * Logs incoming API requests for debugging and monitoring
 */

export interface RequestLoggingConfig {
  logHeaders?: boolean;
  logBody?: boolean;
  logQuery?: boolean;
  excludePaths?: string[];
  excludeHeaders?: string[];
  sanitizeHeaders?: string[];
}

export interface RequestLogEntry {
  timestamp: number;
  method: string;
  url: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  correlationId?: string;
}

class RequestLogger {
  private config: Required<RequestLoggingConfig>;
  private logs: RequestLogEntry[] = [];
  private readonly maxLogs = 1000;

  constructor(config: RequestLoggingConfig = {}) {
    this.config = {
      logHeaders: true,
      logBody: false,
      logQuery: true,
      excludePaths: ['/health', '/metrics'],
      excludeHeaders: ['authorization', 'cookie', 'set-cookie'],
      sanitizeHeaders: ['authorization', 'cookie', 'api-key'],
      ...config,
    };
  }

  log(request: Request, correlationId?: string): RequestLogEntry {
    const url = new URL(request.url);

    if (this.config.excludePaths.some(path => url.pathname.includes(path))) {
      return this.createLogEntry(request, correlationId);
    }

    const entry: RequestLogEntry = {
      timestamp: Date.now(),
      method: request.method,
      url: request.url,
      correlationId,
    };

    if (this.config.logHeaders) {
      entry.headers = this.extractHeaders(request);
    }

    if (this.config.logQuery) {
      entry.query = Object.fromEntries(url.searchParams.entries());
    }

    if (this.config.logBody && request.method !== 'GET' && request.method !== 'HEAD') {
      entry.body = '[Body logging enabled - would be parsed]';
    }

    this.addLog(entry);
    console.log('[Request]', JSON.stringify(entry, null, 2));

    return entry;
  }

  private extractHeaders(request: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const [key, value] of request.headers.entries()) {
      if (!this.config.excludeHeaders.includes(key.toLowerCase())) {
        headers[key] = this.config.sanitizeHeaders.includes(key.toLowerCase()) ? '[REDACTED]' : value;
      }
    }
    return headers;
  }

  private createLogEntry(request: Request, correlationId?: string): RequestLogEntry {
    return { timestamp: Date.now(), method: request.method, url: request.url, correlationId };
  }

  private addLog(entry: RequestLogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs(): RequestLogEntry[] {
    return [...this.logs];
  }

  getLogsByCorrelationId(correlationId: string): RequestLogEntry[] {
    return this.logs.filter(log => log.correlationId === correlationId);
  }

  getLogsByMethod(method: string): RequestLogEntry[] {
    return this.logs.filter(log => log.method === method);
  }

  getLogsByURL(pattern: string): RequestLogEntry[] {
    const regex = new RegExp(pattern);
    return this.logs.filter(log => regex.test(log.url));
  }

  clearLogs(): void {
    this.logs = [];
  }

  getStats(): { totalLogs: number; byMethod: Record<string, number>; oldestLog?: number; newestLog?: number } {
    const byMethod: Record<string, number> = {};
    for (const log of this.logs) {
      byMethod[log.method] = (byMethod[log.method] || 0) + 1;
    }
    return {
      totalLogs: this.logs.length,
      byMethod,
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp,
    };
  }

  updateConfig(config: Partial<RequestLoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

const requestLogger = new RequestLogger();

export function initializeRequestLogger(config: RequestLoggingConfig): void {
  requestLogger.updateConfig(config);
}

export function logRequest(request: Request, correlationId?: string): RequestLogEntry {
  return requestLogger.log(request, correlationId);
}

export function getRequestLogs(): RequestLogEntry[] {
  return requestLogger.getLogs();
}

export function getRequestLogsByCorrelationId(correlationId: string): RequestLogEntry[] {
  return requestLogger.getLogsByCorrelationId(correlationId);
}

export function clearRequestLogs(): void {
  requestLogger.clearLogs();
}

export function getRequestLogStats() {
  return requestLogger.getStats();
}

export function requestLoggingMiddleware(config?: RequestLoggingConfig) {
  const logger = config ? new RequestLogger(config) : requestLogger;
  return async (request: Request): Promise<Response | null> => {
    logger.log(request);
    return null;
  };
}

export default requestLogger;
