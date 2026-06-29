/**
 * Redirect management utilities
 */

export interface RedirectRule {
  from: string;
  to: string;
  permanent?: boolean;
  statusCode?: 301 | 302 | 307 | 308;
  conditions?: {
    locale?: string[];
    userAgent?: string[];
    headers?: Record<string, string>;
  };
}

export interface RedirectConfig {
  rules: RedirectRule[];
  defaultStatusCode: 301 | 302 | 307 | 308;
  enableTrailingSlash: boolean;
  enableLowerCase: boolean;
}

class RedirectManager {
  private config: RedirectConfig;

  constructor(config: Partial<RedirectConfig> = {}) {
    this.config = {
      rules: [],
      defaultStatusCode: 301,
      enableTrailingSlash: true,
      enableLowerCase: false,
      ...config,
    };
  }

  /**
   * Add redirect rule
   */
  addRule(rule: RedirectRule): void {
    this.config.rules.push(rule);
  }

  /**
   * Remove redirect rule
   */
  removeRule(from: string): void {
    this.config.rules = this.config.rules.filter(rule => rule.from !== from);
  }

  /**
   * Get redirect for path
   */
  getRedirect(path: string, options?: {
    locale?: string;
    userAgent?: string;
    headers?: Record<string, string>;
  }): { to: string; statusCode: number } | null {
    const normalizedPath = this.normalizePath(path);
    
    for (const rule of this.config.rules) {
      if (this.matchesRule(normalizedPath, rule, options)) {
        return {
          to: rule.to,
          statusCode: rule.statusCode || this.config.defaultStatusCode,
        };
      }
    }

    return null;
  }

  /**
   * Normalize path
   */
  private normalizePath(path: string): string {
    let normalized = path;

    // Remove trailing slash if disabled
    if (!this.config.enableTrailingSlash && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    // Add trailing slash if enabled
    if (this.config.enableTrailingSlash && !normalized.endsWith('/') && normalized !== '/') {
      normalized += '/';
    }

    // Convert to lowercase if enabled
    if (this.config.enableLowerCase) {
      normalized = normalized.toLowerCase();
    }

    return normalized;
  }

  /**
   * Check if path matches rule
   */
  private matchesRule(
    path: string,
    rule: RedirectRule,
    options?: {
      locale?: string;
      userAgent?: string;
      headers?: Record<string, string>;
    }
  ): boolean {
    // Check exact match
    if (rule.from === path) {
      return this.checkConditions(rule, options);
    }

    // Check pattern match
    if (rule.from.includes('*')) {
      const pattern = rule.from.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(path)) {
        return this.checkConditions(rule, options);
      }
    }

    return false;
  }

  /**
   * Check rule conditions
   */
  private checkConditions(
    rule: RedirectRule,
    options?: {
      locale?: string;
      userAgent?: string;
      headers?: Record<string, string>;
    }
  ): boolean {
    if (!rule.conditions) return true;

    // Check locale
    if (rule.conditions.locale && options?.locale) {
      if (!rule.conditions.locale.includes(options.locale)) {
        return false;
      }
    }

    // Check user agent
    if (rule.conditions.userAgent && options?.userAgent) {
      if (!rule.conditions.userAgent.some(ua => options.userAgent!.includes(ua))) {
        return false;
      }
    }

    // Check headers
    if (rule.conditions.headers && options?.headers) {
      for (const [key, value] of Object.entries(rule.conditions.headers)) {
        if (options.headers[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get all rules
   */
  getRules(): RedirectRule[] {
    return [...this.config.rules];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RedirectConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): RedirectConfig {
    return { ...this.config };
  }
}

// Create singleton instance
const redirectManager = new RedirectManager();

export { redirectManager };

/**
 * Add redirect rule
 */
export function addRedirect(rule: RedirectRule): void {
  redirectManager.addRule(rule);
}

/**
 * Get redirect for path
 */
export function getRedirect(
  path: string,
  options?: {
    locale?: string;
    userAgent?: string;
    headers?: Record<string, string>;
  }
): { to: string; statusCode: number } | null {
  return redirectManager.getRedirect(path, options);
}

/**
 * Common redirect rules
 */
export const commonRedirectRules: RedirectRule[] = [
  {
    from: '/home',
    to: '/',
    permanent: true,
    statusCode: 301,
  },
  {
    from: '/index.html',
    to: '/',
    permanent: true,
    statusCode: 301,
  },
  {
    from: '/index.htm',
    to: '/',
    permanent: true,
    statusCode: 301,
  },
];

/**
 * Setup common redirects
 */
export function setupCommonRedirects(): void {
  commonRedirectRules.forEach(rule => {
    redirectManager.addRule(rule);
  });
}

/**
 * Create redirect response
 */
export function createRedirectResponse(
  to: string,
  statusCode: number = 301
): Response {
  return new Response(null, {
    status: statusCode,
    headers: {
      Location: to,
    },
  });
}

/**
 * Check if path should be redirected
 */
export function shouldRedirect(path: string): boolean {
  return redirectManager.getRedirect(path) !== null;
}

/**
 * Normalize URL
 */
export function normalizeUrl(url: string, options: {
  trailingSlash?: boolean;
  lowercase?: boolean;
  removeWww?: boolean;
} = {}): string {
  const { trailingSlash = true, lowercase = false, removeWww = false } = options;

  try {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;

    // Handle trailing slash
    if (trailingSlash && !pathname.endsWith('/') && pathname !== '/') {
      pathname += '/';
    } else if (!trailingSlash && pathname.endsWith('/') && pathname !== '/') {
      pathname = pathname.slice(0, -1);
    }

    // Convert to lowercase
    if (lowercase) {
      pathname = pathname.toLowerCase();
    }

    // Remove www
    if (removeWww && urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = urlObj.hostname.slice(4);
    }

    urlObj.pathname = pathname;
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Validate redirect URL
 */
export function validateRedirectUrl(url: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    const urlObj = new URL(url);
    
    // Check for protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: 'Invalid protocol',
      };
    }

    // Check for open redirect
    if (urlObj.hostname !== window.location.hostname) {
      return {
        isValid: false,
        error: 'External redirect not allowed',
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL',
    };
  }
}

/**
 * Create safe redirect
 */
export function createSafeRedirect(
  to: string,
  fallback: string = '/'
): string {
  const validation = validateRedirectUrl(to);
  return validation.isValid ? to : fallback;
}

/**
 * Track redirect
 */
export function trackRedirect(from: string, to: string): void {
  // Send analytics event
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'redirect', {
      from,
      to,
    });
  }
}
