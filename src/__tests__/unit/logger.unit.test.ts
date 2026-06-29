import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '@/lib/logger';

describe('Logger Unit Tests', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log debug messages in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    
    logger.debug('Test debug message', { key: 'value' });
    
    expect(console.debug).toHaveBeenCalled();
  });

  it('should not log debug messages in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    
    logger.debug('Test debug message', { key: 'value' });
    
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('should log info messages in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    
    logger.info('Test info message', { key: 'value' });
    
    expect(console.info).toHaveBeenCalled();
  });

  it('should log warn messages regardless of environment', () => {
    logger.warn('Test warn message', { key: 'value' });
    
    expect(console.warn).toHaveBeenCalled();
  });

  it('should log error messages regardless of environment', () => {
    logger.error('Test error message', { key: 'value' });
    
    expect(console.error).toHaveBeenCalled();
  });

  it('should format messages with timestamp', () => {
    vi.stubEnv('NODE_ENV', 'development');
    
    logger.info('Test message');
    
    const call = vi.mocked(console.info).mock.calls[0];
    const message = call[0] as string;
    
    expect(message).toContain('[INFO]');
    expect(message).toContain('Test message');
  });

  it('should include context in formatted message', () => {
    vi.stubEnv('NODE_ENV', 'development');
    
    logger.info('Test message', { key: 'value', number: 123 });
    
    const call = vi.mocked(console.info).mock.calls[0];
    const message = call[0] as string;
    
    expect(message).toContain('key');
    expect(message).toContain('value');
  });
});
