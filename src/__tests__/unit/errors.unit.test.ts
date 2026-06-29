import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DatabaseError,
  ValidationError,
  ServerActionError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  handleDatabaseError,
  handleValidationError,
  handleServerActionError,
  handleNetworkError,
  handleAuthenticationError,
  handleAuthorizationError,
  classifyError,
  logError,
  withErrorHandler,
} from '@/lib/errors';

describe('Errors Unit Tests', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Error Classes', () => {
    it('should create DatabaseError with correct name', () => {
      const error = new DatabaseError('Database failed');
      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe('Database failed');
    });

    it('should create ValidationError with issues', () => {
      const issues = { field: 'invalid' };
      const error = new ValidationError('Validation failed', issues);
      expect(error.name).toBe('ValidationError');
      expect(error.issues).toBe(issues);
    });

    it('should create ServerActionError with correct name', () => {
      const error = new ServerActionError('Action failed');
      expect(error.name).toBe('ServerActionError');
    });

    it('should create NetworkError with correct name', () => {
      const error = new NetworkError('Network failed');
      expect(error.name).toBe('NetworkError');
    });

    it('should create AuthenticationError with correct name', () => {
      const error = new AuthenticationError('Auth failed');
      expect(error.name).toBe('AuthenticationError');
    });

    it('should create AuthorizationError with correct name', () => {
      const error = new AuthorizationError('Not authorized');
      expect(error.name).toBe('AuthorizationError');
    });
  });

  describe('Error Handlers', () => {
    it('should handle database errors', () => {
      const error = new Error('Connection failed');
      const handled = handleDatabaseError(error);
      expect(handled).toBeInstanceOf(DatabaseError);
      expect(handled.message).toBe('Connection failed');
    });

    it('should handle unknown as database error', () => {
      const handled = handleDatabaseError(null);
      expect(handled).toBeInstanceOf(DatabaseError);
      expect(handled.message).toBe('An unexpected database error occurred.');
    });

    it('should handle validation errors', () => {
      const error = new Error('Invalid input');
      const handled = handleValidationError(error);
      expect(handled).toBeInstanceOf(ValidationError);
    });

    it('should handle server action errors', () => {
      const error = new Error('Action failed');
      const handled = handleServerActionError(error);
      expect(handled).toBeInstanceOf(ServerActionError);
    });

    it('should handle network errors', () => {
      const error = new Error('Fetch failed');
      const handled = handleNetworkError(error);
      expect(handled).toBeInstanceOf(NetworkError);
    });

    it('should handle authentication errors', () => {
      const error = new Error('Not authenticated');
      const handled = handleAuthenticationError(error);
      expect(handled).toBeInstanceOf(AuthenticationError);
    });

    it('should handle authorization errors', () => {
      const error = new Error('No permission');
      const handled = handleAuthorizationError(error);
      expect(handled).toBeInstanceOf(AuthorizationError);
    });
  });

  describe('classifyError', () => {
    it('should classify database errors', () => {
      const error = new Error('supabase connection failed');
      const classified = classifyError(error);
      expect(classified).toBeInstanceOf(DatabaseError);
    });

    it('should classify validation errors', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      const classified = classifyError(error);
      expect(classified).toBeInstanceOf(ValidationError);
    });

    it('should classify network errors', () => {
      const error = new Error('network fetch failed');
      const classified = classifyError(error);
      expect(classified).toBeInstanceOf(NetworkError);
    });

    it('should classify authentication errors', () => {
      const error = new Error('unauthorized access');
      const classified = classifyError(error);
      expect(classified).toBeInstanceOf(AuthenticationError);
    });

    it('should classify authorization errors', () => {
      const error = new Error('forbidden permission');
      const classified = classifyError(error);
      expect(classified).toBeInstanceOf(AuthorizationError);
    });

    it('should default to server action error', () => {
      const error = new Error('Generic error');
      const classified = classifyError(error);
      expect(classified).toBeInstanceOf(ServerActionError);
    });

    it('should handle non-error objects', () => {
      const classified = classifyError(null);
      expect(classified).toBeInstanceOf(Error);
      expect(classified.message).toBe('An unknown error occurred');
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      
      logError(error, context);
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should log error without context', () => {
      const error = new Error('Test error');
      
      logError(error);
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('withErrorHandler', () => {
    it('should handle successful async operations', async () => {
      const fn = async () => 'success';
      const wrapped = withErrorHandler(fn, { context: 'test' });
      
      const result = await wrapped();
      expect(result).toBe('success');
    });

    it('should handle and classify errors', async () => {
      const fn = async () => {
        throw new Error('database failed');
      };
      const wrapped = withErrorHandler(fn, { context: 'test' });
      
      await expect(wrapped()).rejects.toBeInstanceOf(DatabaseError);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
