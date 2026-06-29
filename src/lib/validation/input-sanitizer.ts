/**
 * Input sanitization utilities to prevent XSS, SQL injection, and other attacks
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user input for database queries (basic SQL injection prevention)
 * Note: Use parameterized queries for actual database operations
 */
export function sanitizeSqlInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

/**
 * Sanitize URL to prevent open redirect attacks
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w\.\-@]/g, '');
}

/**
 * Sanitize username (alphanumeric, underscore, hyphen)
 */
export function sanitizeUsername(username: string): string {
  if (!username) return '';
  
  return username
    .trim()
    .replace(/[^\w\-]/g, '');
}

/**
 * Sanitize file name to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';
  
  return fileName
    .replace(/[^\w\.\-]/g, '')
    .replace(/\.{2,}/g, '.') // Prevent directory traversal
    .replace(/^\.+/, ''); // Remove leading dots
}

/**
 * Sanitize phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  return phone.replace(/[^\d\+\-\(\)\s]/g, '');
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(input: string, defaultValue: number = 0): number {
  if (!input) return defaultValue;
  
  const num = parseFloat(input);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Sanitize JSON input
 */
export function sanitizeJson(input: string): object | null {
  if (!input) return null;
  
  try {
    // Parse and validate JSON structure
    const parsed = JSON.parse(input);
    
    // Remove any potentially dangerous keys
    const safe = JSON.parse(JSON.stringify(parsed, (key, value) => {
      // Block prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return value;
    }));
    
    return safe;
  } catch {
    return null;
  }
}

/**
 * Sanitize array input
 */
export function sanitizeArray<T>(input: any[], validator: (item: any) => boolean): T[] {
  if (!Array.isArray(input)) return [];
  
  return input.filter(validator) as T[];
}

/**
 * Remove null and undefined values from object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const sanitized: Partial<T> = {};
  
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      sanitized[key] = obj[key];
    }
  }
  
  return sanitized;
}

/**
 * Trim and limit string length
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  
  return input.trim().slice(0, maxLength);
}

/**
 * Validate and sanitize boolean input
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    return input.toLowerCase() === 'true' || input === '1';
  }
  if (typeof input === 'number') {
    return input === 1;
  }
  return false;
}
