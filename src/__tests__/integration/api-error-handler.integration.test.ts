import { describe, it, expect } from 'vitest';
import { 
  createErrorResponse, 
  createSuccessResponse,
  errorResponses,
  ErrorCode
} from '@/lib/api-error-handler';

describe('API Error Handler Integration Tests', () => {
  it('should create standardized error response', () => {
    const error = new Error('Test error');
    const response = createErrorResponse(error);
    
    const data = response.json();
    expect(data).resolves.toEqual({
      success: false,
      error: {
        message: 'Test error',
        code: expect.any(String),
        statusCode: 500,
      },
      timestamp: expect.any(String),
    });
  });

  it('should create standardized success response', () => {
    const response = createSuccessResponse({ data: 'test' }, 'Success message');
    
    const data = response.json();
    expect(data).resolves.toEqual({
      success: true,
      data: { data: 'test' },
      message: 'Success message',
      timestamp: expect.any(String),
    });
  });

  it('should create bad request error response', () => {
    const response = errorResponses.badRequest('Invalid input');
    
    const data = response.json();
    expect(data).resolves.toEqual({
      success: false,
      error: {
        message: 'Invalid input',
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400,
      },
      timestamp: expect.any(String),
    });
  });

  it('should create unauthorized error response', () => {
    const response = errorResponses.unauthorized();
    
    const data = response.json();
    expect(data).resolves.toEqual({
      success: false,
      error: {
        message: expect.any(String),
        code: ErrorCode.UNAUTHORIZED,
        statusCode: 401,
      },
      timestamp: expect.any(String),
    });
  });

  it('should create forbidden error response', () => {
    const response = errorResponses.forbidden();
    
    const data = response.json();
    expect(data).resolves.toEqual({
      success: false,
      error: {
        message: expect.any(String),
        code: ErrorCode.FORBIDDEN,
        statusCode: 403,
      },
      timestamp: expect.any(String),
    });
  });

  it('should create not found error response', () => {
    const response = errorResponses.notFound();
    
    const data = response.json();
    expect(data).resolves.toEqual({
      success: false,
      error: {
        message: expect.any(String),
        code: ErrorCode.NOT_FOUND,
        statusCode: 404,
      },
      timestamp: expect.any(String),
    });
  });

  it('should create rate limit exceeded error response', () => {
    const response = errorResponses.rateLimitExceeded(60);
    
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('should create CSRF error response', () => {
    const response = errorResponses.csrfError();
    
    const data = response.json();
    expect(data).resolves.toEqual({
      success: false,
      error: {
        message: expect.any(String),
        code: ErrorCode.CSRF_ERROR,
        statusCode: 403,
      },
      timestamp: expect.any(String),
    });
  });

  it('should create validation error response with details', () => {
    const details = { field: 'email', error: 'Invalid format' };
    const response = errorResponses.validationError(details);
    
    const data = response.json();
    expect(data).resolves.toEqual({
      success: false,
      error: {
        message: expect.any(String),
        code: ErrorCode.VALIDATION_ERROR,
        details,
        statusCode: 400,
      },
      timestamp: expect.any(String),
    });
  });
});
