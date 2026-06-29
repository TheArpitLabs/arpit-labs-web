/**
 * Additional security headers utilities
 */

export interface SecurityHeaderConfig {
  contentSecurityPolicy?: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    connectSrc: string[];
    fontSrc: string[];
    objectSrc: string[];
    mediaSrc: string[];
    frameSrc: string[];
    workerSrc: string[];
    manifestSrc: string[];
    upgradeInsecureRequests?: boolean;
  };
  xContentTypeOptions?: 'nosniff';
  referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
  permissionsPolicy?: Record<string, boolean | string[]>;
  strictTransportSecurity?: {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  contentSecurityPolicyReportOnly?: boolean;
}

/**
 * Generate Content-Security-Policy header
 */
export function generateCSP(config: SecurityHeaderConfig['contentSecurityPolicy']): string {
  if (!config) return '';

  const directives: string[] = [];

  if (config.defaultSrc) {
    directives.push(`default-src ${config.defaultSrc.join(' ')}`);
  }

  if (config.scriptSrc) {
    directives.push(`script-src ${config.scriptSrc.join(' ')}`);
  }

  if (config.styleSrc) {
    directives.push(`style-src ${config.styleSrc.join(' ')}`);
  }

  if (config.imgSrc) {
    directives.push(`img-src ${config.imgSrc.join(' ')}`);
  }

  if (config.connectSrc) {
    directives.push(`connect-src ${config.connectSrc.join(' ')}`);
  }

  if (config.fontSrc) {
    directives.push(`font-src ${config.fontSrc.join(' ')}`);
  }

  if (config.objectSrc) {
    directives.push(`object-src ${config.objectSrc.join(' ')}`);
  }

  if (config.mediaSrc) {
    directives.push(`media-src ${config.mediaSrc.join(' ')}`);
  }

  if (config.frameSrc) {
    directives.push(`frame-src ${config.frameSrc.join(' ')}`);
  }

  if (config.workerSrc) {
    directives.push(`worker-src ${config.workerSrc.join(' ')}`);
  }

  if (config.manifestSrc) {
    directives.push(`manifest-src ${config.manifestSrc.join(' ')}`);
  }

  if (config.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

/**
 * Generate Permissions-Policy header
 */
export function generatePermissionsPolicy(policy: SecurityHeaderConfig['permissionsPolicy']): string {
  if (!policy) return '';

  const directives: string[] = [];

  Object.entries(policy).forEach(([feature, value]) => {
    if (typeof value === 'boolean') {
      directives.push(`${feature}=${value ? 'self' : 'none'}`);
    } else if (Array.isArray(value)) {
      directives.push(`${feature}=(${value.join(' ')})`);
    }
  });

  return directives.join(', ');
}

/**
 * Generate Strict-Transport-Security header
 */
export function generateHSTS(config: SecurityHeaderConfig['strictTransportSecurity']): string {
  if (!config) return '';

  let header = `max-age=${config.maxAge}`;

  if (config.includeSubDomains) {
    header += '; includeSubDomains';
  }

  if (config.preload) {
    header += '; preload';
  }

  return header;
}

/**
 * Generate all security headers
 */
export function generateSecurityHeaders(config: SecurityHeaderConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  // Content-Security-Policy
  if (config.contentSecurityPolicy) {
    const csp = generateCSP(config.contentSecurityPolicy);
    const headerName = config.contentSecurityPolicyReportOnly 
      ? 'Content-Security-Policy-Report-Only' 
      : 'Content-Security-Policy';
    headers[headerName] = csp;
  }

  // X-Content-Type-Options
  if (config.xContentTypeOptions) {
    headers['X-Content-Type-Options'] = config.xContentTypeOptions;
  }

  // Referrer-Policy
  if (config.referrerPolicy) {
    headers['Referrer-Policy'] = config.referrerPolicy;
  }

  // Permissions-Policy
  if (config.permissionsPolicy) {
    headers['Permissions-Policy'] = generatePermissionsPolicy(config.permissionsPolicy);
  }

  // Strict-Transport-Security
  if (config.strictTransportSecurity) {
    headers['Strict-Transport-Security'] = generateHSTS(config.strictTransportSecurity);
  }

  // X-Frame-Options
  if (config.xFrameOptions) {
    headers['X-Frame-Options'] = config.xFrameOptions;
  }

  // Additional security headers
  headers['X-XSS-Protection'] = '1; mode=block';
  headers['X-DNS-Prefetch-Control'] = 'off';
  headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
  headers['Cross-Origin-Opener-Policy'] = 'same-origin';
  headers['Cross-Origin-Resource-Policy'] = 'same-origin';

  return headers;
}

/**
 * Default security configuration
 */
export const defaultSecurityConfig: SecurityHeaderConfig = {
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    imgSrc: ["'self'", 'data:', 'https:', 'https://images.unsplash.com'],
    connectSrc: ["'self'", 'https://*.supabase.co', 'https://api.openai.com'],
    fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    workerSrc: ["'self'", 'blob:'],
    manifestSrc: ["'self'"],
    upgradeInsecureRequests: true,
  },
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    'geolocation': ['self'],
    'microphone': ['none'],
    'camera': ['none'],
    'payment': ['none'],
    'usb': ['none'],
    'magnetometer': ['none'],
    'gyroscope': ['none'],
    'accelerometer': ['none'],
    'ambient-light-sensor': ['none'],
  },
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  xFrameOptions: 'DENY',
  contentSecurityPolicyReportOnly: false,
};

/**
 * Development security configuration (more permissive)
 */
export const developmentSecurityConfig: SecurityHeaderConfig = {
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'http://localhost:*'],
    styleSrc: ["'self'", "'unsafe-inline'", 'http://localhost:*'],
    imgSrc: ["'self'", 'data:', 'http:', 'https:'],
    connectSrc: ["'self'", 'http://localhost:*', 'https://*.supabase.co'],
    fontSrc: ["'self'", 'http://localhost:*'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'"],
    workerSrc: ["'self'", 'blob:'],
    manifestSrc: ["'self'"],
  },
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    'geolocation': ['self'],
    'microphone': ['self'],
    'camera': ['self'],
  },
  strictTransportSecurity: {
    maxAge: 0,
    includeSubDomains: false,
  },
  xFrameOptions: 'SAMEORIGIN',
  contentSecurityPolicyReportOnly: true,
};

/**
 * Get security config based on environment
 */
export function getSecurityConfig(): SecurityHeaderConfig {
  return process.env.NODE_ENV === 'production' 
    ? defaultSecurityConfig 
    : developmentSecurityConfig;
}

/**
 * Validate security headers
 */
export function validateSecurityHeaders(headers: Record<string, string>): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Content-Security-Policy',
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  requiredHeaders.forEach(header => {
    if (!headers[header]) {
      missing.push(header);
    }
  });

  // Check for weak configurations
  if (headers['X-Frame-Options'] === 'ALLOW-FROM') {
    warnings.push('X-Frame-Options ALLOW-FROM is deprecated');
  }

  if (headers['Strict-Transport-Security']?.includes('max-age=0')) {
    warnings.push('HSTS max-age is 0, HSTS is disabled');
  }

  if (!headers['Content-Security-Policy']?.includes('default-src')) {
    warnings.push('CSP missing default-src directive');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  headers: Headers,
  config: SecurityHeaderConfig = getSecurityConfig()
): Headers {
  const securityHeaders = generateSecurityHeaders(config);
  
  Object.entries(securityHeaders).forEach(([name, value]) => {
    headers.set(name, value);
  });
  
  return headers;
}
