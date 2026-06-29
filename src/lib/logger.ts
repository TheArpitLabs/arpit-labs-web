type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

// Allow unknown to be passed as context for flexibility
type LogContextInput = LogContext | unknown;

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContextInput): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context as LogContext | undefined));
    }
  }

  info(message: string, context?: LogContextInput): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context as LogContext | undefined));
    }
  }

  warn(message: string, context?: LogContextInput): void {
    console.warn(this.formatMessage('warn', message, context as LogContext | undefined));
  }

  error(message: string, context?: LogContextInput): void {
    console.error(this.formatMessage('error', message, context as LogContext | undefined));
  }
}

export const logger = new Logger();
