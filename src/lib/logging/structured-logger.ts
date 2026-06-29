/**
 * Structured logging infrastructure
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  includeStackTrace: boolean;
}

class Logger {
  private config: LoggerConfig;
  private requestId?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableRemote: false,
      includeStackTrace: true,
      ...config,
    };
  }

  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  clearRequestId(): void {
    this.requestId = undefined;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }

  private formatLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (this.requestId) {
      entry.requestId = this.requestId;
    }

    if (context?.userId) {
      entry.userId = context.userId;
    }

    if (this.config.includeStackTrace && level === LogLevel.ERROR || level === LogLevel.FATAL) {
      entry.stack = new Error().stack;
    }

    return entry;
  }

  private async log(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Console logging
    if (this.config.enableConsole) {
      const consoleMethod = entry.level === LogLevel.FATAL ? 'error' : entry.level;
      console[consoleMethod](`[${entry.timestamp}] [${entry.level.toUpperCase()}]`, entry.message, entry.context || '');
    }

    // Remote logging
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      try {
        await fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        });
      } catch (error) {
        console.error('Failed to send log to remote endpoint:', error);
      }
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.DEBUG, message, context);
    this.log(entry);
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.INFO, message, context);
    this.log(entry);
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.WARN, message, context);
    this.log(entry);
  }

  error(message: string, context?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.ERROR, message, context);
    this.log(entry);
  }

  fatal(message: string, context?: Record<string, any>): void {
    const entry = this.formatLogEntry(LogLevel.FATAL, message, context);
    this.log(entry);
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Create singleton logger instance
const logger = new Logger({
  level: process.env.LOG_LEVEL as LogLevel || LogLevel.INFO,
  enableConsole: process.env.NODE_ENV !== 'production',
  enableRemote: process.env.NODE_ENV === 'production',
  remoteEndpoint: process.env.LOG_REMOTE_ENDPOINT,
  includeStackTrace: process.env.NODE_ENV !== 'production',
});

export { logger };

/**
 * Create a child logger with additional context
 */
export function createChildLogger(additionalContext: Record<string, any>): {
  debug: (message: string, context?: Record<string, any>) => void;
  info: (message: string, context?: Record<string, any>) => void;
  warn: (message: string, context?: Record<string, any>) => void;
  error: (message: string, context?: Record<string, any>) => void;
  fatal: (message: string, context?: Record<string, any>) => void;
} {
  return {
    debug: (message: string, context?: Record<string, any>) => {
      logger.debug(message, { ...additionalContext, ...context });
    },
    info: (message: string, context?: Record<string, any>) => {
      logger.info(message, { ...additionalContext, ...context });
    },
    warn: (message: string, context?: Record<string, any>) => {
      logger.warn(message, { ...additionalContext, ...context });
    },
    error: (message: string, context?: Record<string, any>) => {
      logger.error(message, { ...additionalContext, ...context });
    },
    fatal: (message: string, context?: Record<string, any>) => {
      logger.fatal(message, { ...additionalContext, ...context });
    },
  };
}

/**
 * Log API request
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: Record<string, any>
): void {
  logger.info('API Request', {
    method,
    path,
    statusCode,
    duration,
    ...context,
  });
}

/**
 * Log database query
 */
export function logDatabaseQuery(
  query: string,
  duration: number,
  context?: Record<string, any>
): void {
  logger.debug('Database Query', {
    query: query.substring(0, 100), // Limit query length
    duration,
    ...context,
  });
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context?: Record<string, any>
): void {
  const level = severity === 'critical' ? LogLevel.FATAL : 
                severity === 'high' ? LogLevel.ERROR :
                severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
  
  logger[level](`Security Event: ${event}`, {
    severity,
    ...context,
  });
}

/**
 * Log performance metric
 */
export function logPerformanceMetric(
  metric: string,
  value: number,
  context?: Record<string, any>
): void {
  logger.debug('Performance Metric', {
    metric,
    value,
    ...context,
  });
}

/**
 * Log user action
 */
export function logUserAction(
  action: string,
  userId: string,
  context?: Record<string, any>
): void {
  logger.info('User Action', {
    action,
    userId,
    ...context,
  });
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: Record<string, any>): void {
  logger.error(error.message, {
    name: error.name,
    stack: error.stack,
    ...context,
  });
}
