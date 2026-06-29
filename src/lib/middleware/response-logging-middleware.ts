/**
 * API Response Logging Middleware
 * Logs API responses for debugging and monitoring
 */

export interface ResponseLoggingConfig {
  logHeaders?: boolean;
  logBody?: boolean;
  logStatus?: boolean;
  excludeStatusCodes?: number[];
  maxBodySize?: number;
}

export interface ResponseLogEntry {
  timestamp: number;
  status: number;
  statusText: string;
  headers?: Record<string, string>;
  body?: any;
  duration?: number;
  correlationId?: string;
}

class ResponseLogger {
  private config: Required<ResponseLoggingConfig>;
  private logs: ResponseLogEntry[] = [];
  private readonly maxLogs = 1000;
  private requestStartTimes = new Map<string, number>();

  constructor(config: ResponseLoggingConfig = {}) {
    this.config = {
      logHeaders: true,
      logBody: false,
      logStatus: true,
      excludeStatusCodes: [],
      maxBodySize: 1024,
      ...config,
    };
  }

  recordRequestStart(correlationId: string): void {
    this.requestStartTimes.set(correlationId, Date.now());
  }

  async log(response: Response, correlationId?: string): Promise<ResponseLogEntry> {
    if (this.config.excludeStatusCodes.includes(response.status)) {
      return this.createLogEntry(response, correlationId);
    }

    const startTime = correlationId ? this.requestStartTimes.get(correlationId) : undefined;
    const duration = startTime ? Date.now() - startTime : undefined;

    const entry: ResponseLogEntry = {
      timestamp: Date.now(),
      status: response.status,
      statusText: response.statusText,
      correlationId,
      duration,
    };

    if (this.config.logHeaders) {
      entry.headers = this.extractHeaders(response);
    }

    if (this.config.logBody) {
      entry.body = await this.extractBody(response);
    }

    this.addLog(entry);

    if (correlationId) {
      this.requestStartTimes.delete(correlationId);
    }

    console.log('[Response]', JSON.stringify(entry, null, 2));
    return entry;
  }

  private extractHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => headers[key] = value);
    return headers;
  }

  private async extractBody(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const body = await response.clone().json();
        const bodyStr = JSON.stringify(body);
        if (bodyStr.length > this.config.maxBodySize) {
          return '[Body truncated due to size]';
        }
        return body;
      }

      const body = await response.clone().text();
      if (body.length > this.config.maxBodySize) {
        return '[Body truncated due to size]';
      }
      return body;
    } catch {
      return '[Failed to parse body]';
    }
  }

  private createLogEntry(response: Response, correlationId?: string): ResponseLogEntry {
    return {
      timestamp: Date.now(),
      status: response.status,
      statusText: response.statusText,
      correlationId,
    };
  }

  private addLog(entry: ResponseLogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs(): ResponseLogEntry[] {
    return [...this.logs];
  }

  getLogsByCorrelationId(correlationId: string): ResponseLogEntry[] {
    return this.logs.filter(log => log.correlationId === correlationId);
  }

  getLogsByStatusCode(statusCode: number): ResponseLogEntry[] {
    return this.logs.filter(log => log.status === statusCode);
  }

  getErrorLogs(): ResponseLogEntry[] {
    return this.logs.filter(log => log.status >= 400);
  }

  clearLogs(): void {
    this.logs = [];
  }

  getStats(): { totalLogs: number; errorCount: number; averageDuration?: number; byStatusCode: Record<number, number>; oldestLog?: number; newestLog?: number } {
    const byStatusCode: Record<number, number> = {};
    let totalDuration = 0;
    let durationCount = 0;

    for (const log of this.logs) {
      byStatusCode[log.status] = (byStatusCode[log.status] || 0) + 1;
      if (log.duration !== undefined) {
        totalDuration += log.duration;
        durationCount++;
      }
    }

    return {
      totalLogs: this.logs.length,
      errorCount: this.logs.filter(log => log.status >= 400).length,
      averageDuration: durationCount > 0 ? totalDuration / durationCount : undefined,
      byStatusCode,
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp,
    };
  }

  updateConfig(config: Partial<ResponseLoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

const responseLogger = new ResponseLogger();

export function initializeResponseLogger(config: ResponseLoggingConfig): void {
  responseLogger.updateConfig(config);
}

export function recordResponseRequestStart(correlationId: string): void {
  responseLogger.recordRequestStart(correlationId);
}

export async function logResponse(response: Response, correlationId?: string): Promise<ResponseLogEntry> {
  return responseLogger.log(response, correlationId);
}

export function getResponseLogs(): ResponseLogEntry[] {
  return responseLogger.getLogs();
}

export function getErrorLogs(): ResponseLogEntry[] {
  return responseLogger.getErrorLogs();
}

export function clearResponseLogs(): void {
  responseLogger.clearLogs();
}

export function getResponseLogStats() {
  return responseLogger.getStats();
}

export function responseLoggingMiddleware(config?: ResponseLoggingConfig) {
  const logger = config ? new ResponseLogger(config) : responseLogger;
  return async (request: Request): Promise<Response | null> => {
    const correlationId = request.headers.get('x-correlation-id') || undefined;
    if (correlationId) {
      logger.recordRequestStart(correlationId);
    }
    const response = await fetch(request);
    await logger.log(response.clone(), correlationId);
    return response;
  };
}

export default responseLogger;
