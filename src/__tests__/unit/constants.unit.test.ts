import { describe, it, expect } from 'vitest';
import {
  API_CONFIG,
  RATE_LIMIT_CONFIG,
  CACHE_CONFIG,
  PAGINATION_CONFIG,
  LEARNING_CONFIG,
  UPLOAD_CONFIG,
  SEARCH_CONFIG,
  UI_CONFIG,
  SECURITY_CONFIG,
  DATABASE_CONFIG,
  EXTERNAL_SERVICE_CONFIG,
  FEATURE_FLAGS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  REGEX_PATTERNS,
  DATE_FORMATS,
  ENV_CONFIG,
} from '@/constants/constants';

describe('Constants Unit Tests', () => {
  describe('API Configuration', () => {
    it('should have valid API config values', () => {
      expect(API_CONFIG.DEFAULT_TIMEOUT).toBe(30000);
      expect(API_CONFIG.RETRY_ATTEMPTS).toBe(3);
      expect(API_CONFIG.RETRY_DELAY_BASE).toBe(1000);
      expect(API_CONFIG.RETRY_DELAY_MAX).toBe(10000);
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should have valid rate limit config values', () => {
      expect(RATE_LIMIT_CONFIG.DEFAULT_LIMIT).toBe(100);
      expect(RATE_LIMIT_CONFIG.DEFAULT_WINDOW).toBe(60000);
      expect(RATE_LIMIT_CONFIG.AUTH_LIMIT).toBe(20);
      expect(RATE_LIMIT_CONFIG.ADMIN_LIMIT).toBe(50);
    });
  });

  describe('Cache Configuration', () => {
    it('should have valid cache config values', () => {
      expect(CACHE_CONFIG.DEFAULT_TTL).toBe(300);
      expect(CACHE_CONFIG.SHORT_TTL).toBe(60);
      expect(CACHE_CONFIG.LONG_TTL).toBe(3600);
      expect(CACHE_CONFIG.DYNAMIC_TTL).toBe(86400);
    });
  });

  describe('Pagination Configuration', () => {
    it('should have valid pagination config values', () => {
      expect(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE).toBe(20);
      expect(PAGINATION_CONFIG.MAX_PAGE_SIZE).toBe(100);
      expect(PAGINATION_CONFIG.MIN_PAGE_SIZE).toBe(1);
    });
  });

  describe('Learning Configuration', () => {
    it('should have valid learning config values', () => {
      expect(LEARNING_CONFIG.HOURS_PER_SKILL).toBe(6.5);
      expect(LEARNING_CONFIG.RECOMMENDATION_LIMIT).toBe(10);
    });
  });

  describe('Upload Configuration', () => {
    it('should have valid upload config values', () => {
      expect(UPLOAD_CONFIG.MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
      expect(UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
      expect(UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES).toContain('image/png');
    });
  });

  describe('Search Configuration', () => {
    it('should have valid search config values', () => {
      expect(SEARCH_CONFIG.MIN_QUERY_LENGTH).toBe(2);
      expect(SEARCH_CONFIG.MAX_QUERY_LENGTH).toBe(500);
      expect(SEARCH_CONFIG.DEFAULT_RESULTS_LIMIT).toBe(20);
    });
  });

  describe('UI Configuration', () => {
    it('should have valid UI config values', () => {
      expect(UI_CONFIG.DEBOUNCE_DELAY).toBe(300);
      expect(UI_CONFIG.TOAST_DURATION).toBe(3000);
      expect(UI_CONFIG.MODAL_ANIMATION_DURATION).toBe(200);
    });
  });

  describe('Security Configuration', () => {
    it('should have valid security config values', () => {
      expect(SECURITY_CONFIG.SESSION_TIMEOUT).toBe(24 * 60 * 60 * 1000);
      expect(SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS).toBe(5);
      expect(SECURITY_CONFIG.PASSWORD_MIN_LENGTH).toBe(8);
    });
  });

  describe('Feature Flags', () => {
    it('should have valid feature flags', () => {
      expect(typeof FEATURE_FLAGS.ENABLE_AI_FEATURES).toBe('boolean');
      expect(typeof FEATURE_FLAGS.ENABLE_LEARNING_PLATFORM).toBe('boolean');
    });
  });

  describe('Error Messages', () => {
    it('should have valid error messages', () => {
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.TIMEOUT_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.UNAUTHORIZED_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.FORBIDDEN_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.NOT_FOUND_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.VALIDATION_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.SERVER_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.CSRF_ERROR).toBeDefined();
    });
  });

  describe('Success Messages', () => {
    it('should have valid success messages', () => {
      expect(SUCCESS_MESSAGES.SAVE_SUCCESS).toBeDefined();
      expect(SUCCESS_MESSAGES.DELETE_SUCCESS).toBeDefined();
      expect(SUCCESS_MESSAGES.CREATE_SUCCESS).toBeDefined();
      expect(SUCCESS_MESSAGES.UPDATE_SUCCESS).toBeDefined();
      expect(SUCCESS_MESSAGES.LOGIN_SUCCESS).toBeDefined();
      expect(SUCCESS_MESSAGES.LOGOUT_SUCCESS).toBeDefined();
    });
  });

  describe('Regex Patterns', () => {
    it('should have valid regex patterns', () => {
      expect(REGEX_PATTERNS.EMAIL).toBeInstanceOf(RegExp);
      expect(REGEX_PATTERNS.URL).toBeInstanceOf(RegExp);
      expect(REGEX_PATTERNS.SLUG).toBeInstanceOf(RegExp);
      expect(REGEX_PATTERNS.USERNAME).toBeInstanceOf(RegExp);
      expect(REGEX_PATTERNS.PHONE).toBeInstanceOf(RegExp);
    });

    it('should validate email pattern', () => {
      expect(REGEX_PATTERNS.EMAIL.test('test@example.com')).toBe(true);
      expect(REGEX_PATTERNS.EMAIL.test('invalid')).toBe(false);
    });

    it('should validate URL pattern', () => {
      expect(REGEX_PATTERNS.URL.test('https://example.com')).toBe(true);
      expect(REGEX_PATTERNS.URL.test('not-a-url')).toBe(false);
    });

    it('should validate slug pattern', () => {
      expect(REGEX_PATTERNS.SLUG.test('valid-slug')).toBe(true);
      expect(REGEX_PATTERNS.SLUG.test('Invalid Slug')).toBe(false);
    });
  });

  describe('Date Formats', () => {
    it('should have valid date formats', () => {
      expect(DATE_FORMATS.DISPLAY).toBeDefined();
      expect(DATE_FORMATS.DISPLAY_WITH_TIME).toBeDefined();
      expect(DATE_FORMATS.ISO).toBeDefined();
      expect(DATE_FORMATS.SHORT).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    it('should have valid environment config', () => {
      expect(typeof ENV_CONFIG.isDevelopment).toBe('boolean');
      expect(typeof ENV_CONFIG.isProduction).toBe('boolean');
      expect(typeof ENV_CONFIG.isTest).toBe('boolean');
      expect(typeof ENV_CONFIG.apiUrl).toBe('string');
      expect(typeof ENV_CONFIG.supabaseUrl).toBe('string');
      expect(typeof ENV_CONFIG.supabaseAnonKey).toBe('string');
    });
  });
});
