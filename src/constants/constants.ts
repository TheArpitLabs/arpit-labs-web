// Application-wide constants and configuration values

// API Configuration
export const API_CONFIG = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // 1 second
  RETRY_DELAY_MAX: 10000, // 10 seconds
} as const;

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  DEFAULT_LIMIT: 100, // requests per window
  DEFAULT_WINDOW: 60000, // 1 minute in milliseconds
  AUTH_LIMIT: 20, // stricter limit for auth endpoints
  ADMIN_LIMIT: 50, // limit for admin operations
  API_KEY_LIMIT: 1000, // higher limit for API key users
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 300, // 5 minutes in seconds
  SHORT_TTL: 60, // 1 minute
  LONG_TTL: 3600, // 1 hour
  DYNAMIC_TTL: 86400, // 24 hours
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
} as const;

// Learning Platform Configuration
export const LEARNING_CONFIG = {
  DEFAULT_TRACK_ID: 'default',
  HOURS_PER_SKILL: 6.5,
  DEFAULT_CAREER_TRACK: 'Full-Stack Developer',
  RECOMMENDATION_LIMIT: 10,
  PROGRESS_UPDATE_THRESHOLD: 5, // minimum progress percentage to save
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
  MAX_IMAGE_WIDTH: 4096,
  MAX_IMAGE_HEIGHT: 4096,
} as const;

// Search Configuration
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 500,
  DEFAULT_RESULTS_LIMIT: 20,
  MAX_RESULTS_LIMIT: 100,
  FUZZY_THRESHOLD: 0.7,
} as const;

// UI Configuration
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300, // milliseconds
  TOAST_DURATION: 3000, // milliseconds
  MODAL_ANIMATION_DURATION: 200, // milliseconds
  SKELETON_LOADING_DELAY: 100, // milliseconds before showing skeleton
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  CSRF_TOKEN_EXPIRY: 24 * 60 * 60, // 24 hours
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
  CONNECTION_POOL_SIZE: 20,
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  QUERY_TIMEOUT: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
} as const;

// External Service Configuration
export const EXTERNAL_SERVICE_CONFIG = {
  GITHUB_API_TIMEOUT: 30000,
  GITHUB_RATE_LIMIT: 5000, // requests per hour
  GITHUB_RETRY_ATTEMPTS: 3,
  SUPABASE_TIMEOUT: 30000,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_AI_FEATURES: true,
  ENABLE_LEARNING_PLATFORM: true,
  ENABLE_COLLABORATION: false,
  ENABLE_MARKETPLACE: false,
  ENABLE_GAMIFICATION: false,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNAUTHORIZED_ERROR: 'You need to log in to access this resource.',
  FORBIDDEN_ERROR: 'You don\'t have permission to perform this action.',
  NOT_FOUND_ERROR: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  CSRF_ERROR: 'Security validation failed. Please refresh the page.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'Changes saved successfully.',
  DELETE_SUCCESS: 'Item deleted successfully.',
  CREATE_SUCCESS: 'Item created successfully.',
  UPDATE_SUCCESS: 'Item updated successfully.',
  LOGIN_SUCCESS: 'Login successful.',
  LOGOUT_SUCCESS: 'Logout successful.',
} as const;

// Regular Expression Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  SLUG: /^[a-z0-9-]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PHONE: /^\+?[\d\s-()]+$/,
} as const;

// Date/Time Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  SHORT: 'MM/DD/YYYY',
} as const;

// Environment-specific configuration
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  get apiUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || '';
  },
  
  get supabaseUrl(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  },
  
  get supabaseAnonKey(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  },
} as const;
