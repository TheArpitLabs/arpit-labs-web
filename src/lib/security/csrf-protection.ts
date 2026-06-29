/**
 * CSRF protection utilities
 */

export interface CsrfToken {
  token: string;
  expiresAt: number;
}

export interface CsrfConfig {
  tokenLength: number;
  tokenExpiry: number;
  cookieName: string;
  headerName: string;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

class CsrfProtection {
  private config: CsrfConfig;
  private tokens: Map<string, CsrfToken> = new Map();

  constructor(config: Partial<CsrfConfig> = {}) {
    this.config = {
      tokenLength: 32,
      tokenExpiry: 3600000, // 1 hour
      cookieName: 'csrf_token',
      headerName: 'x-csrf-token',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      ...config,
    };
  }

  /**
   * Generate CSRF token
   */
  generateToken(): string {
    const array = new Uint8Array(this.config.tokenLength);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create CSRF token
   */
  createToken(sessionId: string): CsrfToken {
    const token = this.generateToken();
    const csrfToken: CsrfToken = {
      token,
      expiresAt: Date.now() + this.config.tokenExpiry,
    };

    this.tokens.set(sessionId, csrfToken);

    // Set cookie
    this.setCookie(token);

    return csrfToken;
  }

  /**
   * Validate CSRF token
   */
  validateToken(sessionId: string, token: string): boolean {
    const storedToken = this.tokens.get(sessionId);

    if (!storedToken) {
      return false;
    }

    // Check if token is expired
    if (Date.now() > storedToken.expiresAt) {
      this.tokens.delete(sessionId);
      return false;
    }

    // Compare tokens
    return storedToken.token === token;
  }

  /**
   * Validate CSRF token from request
   */
  validateRequest(sessionId: string, headers: Headers, body?: any): boolean {
    // Check header
    const headerToken = headers.get(this.config.headerName);
    if (headerToken && this.validateToken(sessionId, headerToken)) {
      return true;
    }

    // Check body
    if (body && body.csrfToken && this.validateToken(sessionId, body.csrfToken)) {
      return true;
    }

    return false;
  }

  /**
   * Set CSRF cookie
   */
  private setCookie(token: string): void {
    const cookieValue = `${this.config.cookieName}=${token}; Path=/; HttpOnly; SameSite=${this.config.sameSite}`;
    
    if (this.config.secure) {
      document.cookie = `${cookieValue}; Secure`;
    } else {
      document.cookie = cookieValue;
    }
  }

  /**
   * Get CSRF token from cookie
   */
  getTokenFromCookie(): string | null {
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.config.cookieName) {
        return value;
      }
    }

    return null;
  }

  /**
   * Refresh CSRF token
   */
  refreshToken(sessionId: string): CsrfToken {
    this.tokens.delete(sessionId);
    return this.createToken(sessionId);
  }

  /**
   * Revoke CSRF token
   */
  revokeToken(sessionId: string): void {
    this.tokens.delete(sessionId);
    this.clearCookie();
  }

  /**
   * Clear CSRF cookie
   */
  private clearCookie(): void {
    document.cookie = `${this.config.cookieName}=; Path=/; HttpOnly; SameSite=${this.config.sameSite}; Max-Age=0`;
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens(): void {
    const now = Date.now();
    
    for (const [sessionId, token] of this.tokens.entries()) {
      if (now > token.expiresAt) {
        this.tokens.delete(sessionId);
      }
    }
  }

  /**
   * Get token for use in forms
   */
  getTokenForForm(sessionId: string): string {
    let token = this.tokens.get(sessionId);
    
    if (!token || Date.now() > token.expiresAt) {
      token = this.createToken(sessionId);
    }

    return token.token;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CsrfConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): CsrfConfig {
    return { ...this.config };
  }
}

// Create singleton instance
const csrfProtection = new CsrfProtection();

export { csrfProtection };

/**
 * Generate CSRF token
 */
export function generateCsrfToken(sessionId: string): string {
  return csrfProtection.createToken(sessionId).token;
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(sessionId: string, token: string): boolean {
  return csrfProtection.validateToken(sessionId, token);
}

/**
 * Validate CSRF request
 */
export function validateCsrfRequest(sessionId: string, headers: Headers, body?: any): boolean {
  return csrfProtection.validateRequest(sessionId, headers, body);
}

/**
 * Get CSRF token for form
 */
export function getCsrfTokenForForm(sessionId: string): string {
  return csrfProtection.getTokenForForm(sessionId);
}

/**
 * Revoke CSRF token
 */
export function revokeCsrfToken(sessionId: string): void {
  csrfProtection.revokeToken(sessionId);
}

/**
 * Refresh CSRF token
 */
export function refreshCsrfToken(sessionId: string): string {
  return csrfProtection.refreshToken(sessionId).token;
}

/**
 * Clean up expired CSRF tokens
 */
export function cleanupExpiredCsrfTokens(): void {
  csrfProtection.cleanupExpiredTokens();
}

/**
 * CSRF middleware for API routes
 */
export function createCsrfMiddleware(options: {
  exemptPaths?: string[];
  exemptMethods?: string[];
} = {}) {
  const { exemptPaths = [], exemptMethods = ['GET', 'HEAD', 'OPTIONS'] } = options;

  return async (request: Request, sessionId: string): Promise<boolean> => {
    const url = new URL(request.url);
    const method = request.method;

    // Exempt certain paths
    if (exemptPaths.some(path => url.pathname.startsWith(path))) {
      return true;
    }

    // Exempt safe methods
    if (exemptMethods.includes(method)) {
      return true;
    }

    // Validate CSRF token
    return validateCsrfRequest(sessionId, request.headers);
  };
}

/**
 * Generate CSRF meta tags for HTML
 */
export function generateCsrfMetaTags(sessionId: string): string {
  const token = getCsrfTokenForForm(sessionId);
  return `<meta name="csrf-token" content="${token}">`;
}

/**
 * Add CSRF token to form
 */
export function addCsrfToForm(sessionId: string): string {
  const token = getCsrfTokenForForm(sessionId);
  return `<input type="hidden" name="csrfToken" value="${token}">`;
}

/**
 * Add CSRF token to headers
 */
export function addCsrfToHeaders(sessionId: string, headers: Headers): Headers {
  const token = getCsrfTokenForForm(sessionId);
  headers.set('x-csrf-token', token);
  return headers;
}

/**
 * Double submit cookie pattern
 */
export class DoubleSubmitCookie {
  private cookieName: string;
  private headerName: string;

  constructor(cookieName: string = 'csrf_token', headerName: string = 'x-csrf-token') {
    this.cookieName = cookieName;
    this.headerName = headerName;
  }

  /**
   * Generate and set token
   */
  generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    document.cookie = `${this.cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict`;
    
    return token;
  }

  /**
   * Validate token
   */
  validateToken(headers: Headers): boolean {
    const cookieToken = this.getTokenFromCookie();
    const headerToken = headers.get(this.headerName);

    return cookieToken !== null && cookieToken === headerToken;
  }

  /**
   * Get token from cookie
   */
  private getTokenFromCookie(): string | null {
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.cookieName) {
        return value;
      }
    }

    return null;
  }

  /**
   * Clear token
   */
  clearToken(): void {
    document.cookie = `${this.cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
  }
}

// Create double submit cookie instance
const doubleSubmitCookie = new DoubleSubmitCookie();

export { doubleSubmitCookie };
