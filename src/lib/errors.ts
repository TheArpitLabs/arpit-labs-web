import { ZodError } from "zod";
import { logger } from './logger';

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ValidationError extends Error {
  issues: unknown;

  constructor(message: string, issues: unknown) {
    super(message);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export class ServerActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServerActionError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function handleDatabaseError(error: unknown) {
  if (error instanceof Error) {
    return new DatabaseError(error.message);
  }
  return new DatabaseError("An unexpected database error occurred.");
}

export function handleValidationError(error: unknown) {
  if (error instanceof ZodError) {
    return new ValidationError("Validation failed.", error.format());
  }
  if (error instanceof Error) {
    return new ValidationError(error.message, undefined);
  }
  return new ValidationError("Validation failed.", undefined);
}

export function handleServerActionError(error: unknown) {
  if (error instanceof Error) {
    return new ServerActionError(error.message);
  }
  return new ServerActionError("An unknown server action error occurred.");
}

export function handleNetworkError(error: unknown) {
  if (error instanceof Error) {
    return new NetworkError(error.message);
  }
  return new NetworkError("A network error occurred.");
}

export function handleAuthenticationError(error: unknown) {
  if (error instanceof Error) {
    return new AuthenticationError(error.message);
  }
  return new AuthenticationError("Authentication failed.");
}

export function handleAuthorizationError(error: unknown) {
  if (error instanceof Error) {
    return new AuthorizationError(error.message);
  }
  return new AuthorizationError("You don't have permission to perform this action.");
}

// Global error classification
export function classifyError(error: unknown): Error {
  if (error instanceof Error) {
    // Check for specific error types
    if (error.name === 'DatabaseError' || error.message.includes('database') || error.message.includes('supabase')) {
      return handleDatabaseError(error);
    }
    if (error.name === 'ValidationError' || error instanceof ZodError) {
      return handleValidationError(error);
    }
    if (error.name === 'NetworkError' || error.message.includes('network') || error.message.includes('fetch')) {
      return handleNetworkError(error);
    }
    if (error.name === 'AuthenticationError' || error.message.includes('auth') || error.message.includes('unauthorized')) {
      return handleAuthenticationError(error);
    }
    if (error.name === 'AuthorizationError' || error.message.includes('permission') || error.message.includes('forbidden')) {
      return handleAuthorizationError(error);
    }
    // Default to server action error
    return handleServerActionError(error);
  }
  
  return new Error("An unknown error occurred");
}

// Global error logging
export function logError(error: Error, context?: Record<string, unknown>) {
  const errorData = {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  // Log using logger
  logger.error('Error logged', errorData);

  // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
  // if (typeof window !== 'undefined') {
  //   Sentry.captureException(error, { extra: context });
  // }
}

// Global error handler for async operations
export function withErrorHandler<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      const classifiedError = classifyError(error);
      logError(classifiedError, context);
      throw classifiedError;
    }
  }) as T;
}
