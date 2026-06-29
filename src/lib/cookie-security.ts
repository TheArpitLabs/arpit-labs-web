/**
 * Cookie security utilities
 */

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
}

/**
 * Default secure cookie options
 */
export const defaultSecureCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

/**
 * Get cookie options for production
 */
export function getProductionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
  };
}

/**
 * Get cookie options for development
 */
export function getDevelopmentCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  };
}

/**
 * Get appropriate cookie options based on environment
 */
export function getCookieOptions(): CookieOptions {
  return process.env.NODE_ENV === 'production' 
    ? getProductionCookieOptions()
    : getDevelopmentCookieOptions();
}

/**
 * Set a secure cookie
 */
export function setSecureCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  const cookieOptions = { ...getCookieOptions(), ...options };
  
  let cookieString = `${name}=${encodeURIComponent(value)}`;
  
  if (cookieOptions.httpOnly) {
    cookieString += '; HttpOnly';
  }
  
  if (cookieOptions.secure) {
    cookieString += '; Secure';
  }
  
  if (cookieOptions.sameSite) {
    cookieString += `; SameSite=${cookieOptions.sameSite}`;
  }
  
  if (cookieOptions.path) {
    cookieString += `; Path=${cookieOptions.path}`;
  }
  
  if (cookieOptions.domain) {
    cookieString += `; Domain=${cookieOptions.domain}`;
  }
  
  if (cookieOptions.maxAge) {
    cookieString += `; Max-Age=${cookieOptions.maxAge}`;
  }
  
  if (cookieOptions.expires) {
    cookieString += `; Expires=${cookieOptions.expires.toUTCString()}`;
  }
  
  document.cookie = cookieString;
}

/**
 * Get a cookie value
 */
export function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  
  return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, options: Partial<CookieOptions> = {}): void {
  const cookieOptions = { ...getCookieOptions(), ...options, maxAge: 0 };
  setSecureCookie(name, '', cookieOptions);
}

/**
 * Check if cookies are enabled
 */
export function areCookiesEnabled(): boolean {
  try {
    document.cookie = 'test=1';
    const enabled = document.cookie.indexOf('test=') !== -1;
    document.cookie = 'test=; Max-Age=-1';
    return enabled;
  } catch {
    return false;
  }
}

/**
 * Validate cookie security
 */
export function validateCookieSecurity(cookieString: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!cookieString.includes('HttpOnly')) {
    issues.push('Missing HttpOnly flag');
  }
  
  if (process.env.NODE_ENV === 'production' && !cookieString.includes('Secure')) {
    issues.push('Missing Secure flag in production');
  }
  
  if (!cookieString.includes('SameSite')) {
    issues.push('Missing SameSite attribute');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Get all cookies as object
 */
export function getAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {};
  const cookieStrings = document.cookie.split(';');
  
  for (const cookieString of cookieStrings) {
    const [name, value] = cookieString.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  }
  
  return cookies;
}

/**
 * Clear all cookies
 */
export function clearAllCookies(): void {
  const cookies = getAllCookies();
  Object.keys(cookies).forEach(name => {
    deleteCookie(name);
  });
}

/**
 * Set authentication cookie with proper security
 */
export function setAuthCookie(token: string, expiresIn: number = 3600): void {
  const expires = new Date(Date.now() + expiresIn * 1000);
  setSecureCookie('auth_token', token, {
    ...getCookieOptions(),
    expires,
    maxAge: expiresIn,
  });
}

/**
 * Get authentication token from cookie
 */
export function getAuthToken(): string | null {
  return getCookie('auth_token');
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(): void {
  deleteCookie('auth_token');
}

/**
 * Set refresh token cookie
 */
export function setRefreshToken(token: string, expiresIn: number = 86400 * 7): void {
  const expires = new Date(Date.now() + expiresIn * 1000);
  setSecureCookie('refresh_token', token, {
    ...getCookieOptions(),
    expires,
    maxAge: expiresIn,
  });
}

/**
 * Get refresh token from cookie
 */
export function getRefreshToken(): string | null {
  return getCookie('refresh_token');
}

/**
 * Clear refresh token cookie
 */
export function clearRefreshToken(): void {
  deleteCookie('refresh_token');
}

/**
 * Set session cookie
 */
export function setSessionCookie(sessionId: string, expiresIn: number = 1800): void {
  const expires = new Date(Date.now() + expiresIn * 1000);
  setSecureCookie('session_id', sessionId, {
    ...getCookieOptions(),
    expires,
    maxAge: expiresIn,
  });
}

/**
 * Get session ID from cookie
 */
export function getSessionId(): string | null {
  return getCookie('session_id');
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(): void {
  deleteCookie('session_id');
}
