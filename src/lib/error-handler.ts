/**
 * Centralized error handling utilities
 */

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  SUPABASE_ERROR = 'SUPABASE_ERROR',
}

export interface AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, any>;
  isOperational: boolean;
}

/**
 * Create a custom application error
 */
export class CustomError extends Error implements AppError {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, any>;
  isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create an unauthorized error
 */
export function createUnauthorizedError(message: string = 'Unauthorized', details?: Record<string, any>): AppError {
  return new CustomError(message, ErrorCode.UNAUTHORIZED, 401, details);
}

/**
 * Create a forbidden error
 */
export function createForbiddenError(message: string = 'Forbidden', details?: Record<string, any>): AppError {
  return new CustomError(message, ErrorCode.FORBIDDEN, 403, details);
}

/**
 * Create a not found error
 */
export function createNotFoundError(message: string = 'Resource not found', details?: Record<string, any>): AppError {
  return new CustomError(message, ErrorCode.NOT_FOUND, 404, details);
}

/**
 * Create a validation error
 */
export function createValidationError(message: string = 'Validation failed', details?: Record<string, any>): AppError {
  return new CustomError(message, ErrorCode.VALIDATION_ERROR, 400, details);
}

/**
 * Create a rate limit error
 */
export function createRateLimitError(message: string = 'Rate limit exceeded', details?: Record<string, any>): AppError {
  return new CustomError(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, details);
}

/**
 * Create an internal server error
 */
export function createInternalError(message: string = 'Internal server error', details?: Record<string, any>): AppError {
  return new CustomError(message, ErrorCode.INTERNAL_ERROR, 500, details, false);
}

/**
 * Check if error is an operational error
 */
export function isOperationalError(error: Error): error is AppError {
  if (error instanceof CustomError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Handle error and convert to appropriate response
 */
export function handleError(error: Error): {
  statusCode: number;
  message: string;
  code: string;
  details?: Record<string, any>;
} {
  // If it's our custom error, use it directly
  if (error instanceof CustomError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  // Handle Supabase errors
  if (error.name === 'AuthError' || error.message.includes('Supabase')) {
    return {
      statusCode: 500,
      message: 'Database operation failed',
      code: ErrorCode.SUPABASE_ERROR,
    };
  }

  // Handle network errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return {
      statusCode: 503,
      message: 'Network error occurred',
      code: ErrorCode.NETWORK_ERROR,
    };
  }

  // Default to internal server error
  return {
    statusCode: 500,
    message: 'An unexpected error occurred',
    code: ErrorCode.INTERNAL_ERROR,
  };
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: Record<string, any>): void {
  const errorInfo: Record<string, any> = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    ...context,
  };

  if (error instanceof CustomError) {
    errorInfo.code = error.code;
    errorInfo.statusCode = error.statusCode;
    errorInfo.details = error.details;
  }

  console.error('[ERROR]', JSON.stringify(errorInfo, null, 2));
}

/**
 * Async error handler wrapper
 */
export function asyncHandler<T>(
  fn: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        logError(error);
        throw error;
      }
      throw createInternalError('An unexpected error occurred');
    }
  };
}

/**
 * Validate required environment variables
 */
export function validateRequiredEnvVars(vars: string[]): void {
  const missing = vars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new CustomError(
      `Missing required environment variables: ${missing.join(', ')}`,
      ErrorCode.INTERNAL_ERROR,
      500,
      { missing }
    );
  }
}

/**
 * Sanitize error message for client (remove sensitive information)
 */
export function sanitizeErrorMessage(message: string): string {
  // Remove file paths
  let sanitized = message.replace(/\/[\w\-\/\.]+/g, '[path]');
  
  // Remove stack traces
  sanitized = sanitized.replace(/at .+:\d+:\d+/g, '[stack]');
  
  // Remove database connection strings
  sanitized = sanitized.replace(/postgresql:\/\/[^@]+@[^\/]+/g, 'postgresql://[user]@[host]');
  
  // Remove API keys
  sanitized = sanitized.replace(/api[_-]?key[=:][\w\-]+/gi, 'api_key=[REDACTED]');
  sanitized = sanitized.replace(/token[=:][\w\-\.]+/gi, 'token=[REDACTED]');
  
  return sanitized;
}
