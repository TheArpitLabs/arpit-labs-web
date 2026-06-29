import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { classifyError, logError } from './errors';
import { ERROR_MESSAGES } from '@/constants/constants';

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
    statusCode: number;
  };
  timestamp: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Standard error codes for API responses
 */
export enum ErrorCode {
  // General errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Authentication errors
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // CSRF errors
  CSRF_ERROR = 'CSRF_ERROR',
}

/**
 * Map error types to HTTP status codes
 */
function getStatusCodeForError(error: Error): number {
  const errorName = error.name;
  
  switch (errorName) {
    case 'ValidationError':
      return 400;
    case 'AuthenticationError':
      return 401;
    case 'AuthorizationError':
      return 403;
    case 'NetworkError':
      return 503;
    case 'TimeoutError':
      return 504;
    default:
      return 500;
  }
}

/**
 * Map error types to error codes
 */
function getErrorCodeForError(error: Error): ErrorCode {
  const errorName = error.name;
  
  switch (errorName) {
    case 'ValidationError':
      return ErrorCode.VALIDATION_ERROR;
    case 'AuthenticationError':
      return ErrorCode.AUTHENTICATION_ERROR;
    case 'AuthorizationError':
      return ErrorCode.FORBIDDEN;
    case 'NetworkError':
      return ErrorCode.NETWORK_ERROR;
    case 'DatabaseError':
      return ErrorCode.DATABASE_ERROR;
    default:
      return ErrorCode.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Create a standardized API error response
 */
export function createErrorResponse(
  error: Error,
  statusCode?: number
): NextResponse<ApiErrorResponse> {
  const classifiedError = classifyError(error);
  const status = statusCode || getStatusCodeForError(classifiedError);
  const code = getErrorCodeForError(classifiedError);
  
  // Log the error
  logError(classifiedError, { statusCode: status, errorCode: code });
  
  // Extract details from ZodError if present
  let details: unknown;
  if (classifiedError instanceof ZodError) {
    details = classifiedError.format();
  } else if ('issues' in classifiedError) {
    details = (classifiedError as { issues: unknown }).issues;
  }
  
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      message: classifiedError.message || ERROR_MESSAGES.SERVER_ERROR,
      code,
      details: status === 500 ? undefined : details, // Hide details in production for 500 errors
      statusCode: status,
    },
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(errorResponse, { status });
}

/**
 * Create a standardized API success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Wrapper for API route handlers with standardized error handling
 */
export function withApiErrorHandler<T extends (...args: unknown[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }) as T;
}

/**
 * Common error response creators for specific scenarios
 */
export const errorResponses = {
  badRequest: (message: string = ERROR_MESSAGES.VALIDATION_ERROR, details?: unknown) => {
    return NextResponse.json({
      success: false,
      error: {
        message,
        code: ErrorCode.BAD_REQUEST,
        details,
        statusCode: 400,
      },
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  },
  
  unauthorized: (message: string = ERROR_MESSAGES.UNAUTHORIZED_ERROR) => {
    return NextResponse.json({
      success: false,
      error: {
        message,
        code: ErrorCode.UNAUTHORIZED,
        statusCode: 401,
      },
      timestamp: new Date().toISOString(),
    }, { status: 401 });
  },
  
  forbidden: (message: string = ERROR_MESSAGES.FORBIDDEN_ERROR) => {
    return NextResponse.json({
      success: false,
      error: {
        message,
        code: ErrorCode.FORBIDDEN,
        statusCode: 403,
      },
      timestamp: new Date().toISOString(),
    }, { status: 403 });
  },
  
  notFound: (message: string = ERROR_MESSAGES.NOT_FOUND_ERROR) => {
    return NextResponse.json({
      success: false,
      error: {
        message,
        code: ErrorCode.NOT_FOUND,
        statusCode: 404,
      },
      timestamp: new Date().toISOString(),
    }, { status: 404 });
  },
  
  rateLimitExceeded: (retryAfter: number) => {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Rate limit exceeded. Please try again later.',
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        statusCode: 429,
      },
      timestamp: new Date().toISOString(),
    }, { 
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
      },
    });
  },
  
  csrfError: (message: string = ERROR_MESSAGES.CSRF_ERROR) => {
    return NextResponse.json({
      success: false,
      error: {
        message,
        code: ErrorCode.CSRF_ERROR,
        statusCode: 403,
      },
      timestamp: new Date().toISOString(),
    }, { status: 403 });
  },
  
  internalError: (message?: string) => {
    return NextResponse.json({
      success: false,
      error: {
        message: message || ERROR_MESSAGES.SERVER_ERROR,
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 500,
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  },
  
  validationError: (details: unknown) => {
    return NextResponse.json({
      success: false,
      error: {
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        code: ErrorCode.VALIDATION_ERROR,
        details,
        statusCode: 400,
      },
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  },
};
