/**
 * XSS protection utilities
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, char => map[char]);
}

/**
 * Escape JavaScript string
 */
export function escapeJsString(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f');
}

/**
 * Escape CSS value
 */
export function escapeCss(text: string): string {
  return text.replace(/[<>"'&\\]/g, char => `\\${char.charCodeAt(0).toString(16)} `);
}

/**
 * Escape URL parameter
 */
export function escapeUrlParam(text: string): string {
  return encodeURIComponent(text);
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }

    // Remove javascript: and data: protocols
    if (url.startsWith('javascript:') || url.startsWith('data:')) {
      return '';
    }

    return urlObj.toString();
  } catch {
    return '';
  }
}

/**
 * Check if string contains potential XSS payload
 */
export function containsXss(text: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /onload\(/i,
    /onerror\(/i,
    /onclick\(/i,
    /onmouseover\(/i,
    /fromCharCode/i,
    /&#x/i,
    /&#/i,
  ];

  return xssPatterns.some(pattern => pattern.test(text));
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string, options: {
  allowHtml?: boolean;
  maxLength?: number;
  trim?: boolean;
} = {}): string {
  const { allowHtml = false, maxLength, trim = true } = options;

  let sanitized = input;

  if (trim) {
    sanitized = sanitized.trim();
  }

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  if (!allowHtml) {
    sanitized = escapeHtml(sanitized);
  }

  return sanitized;
}

/**
 * Create CSP nonce
 */
export function createNonce(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0].toString(36);
}

/**
 * Validate CSP nonce
 */
export function validateNonce(nonce: string): boolean {
  return /^[a-z0-9]+$/i.test(nonce);
}

/**
 * Sanitize JSON for safe parsing
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json);
    
    // Check for dangerous patterns
    const jsonString = JSON.stringify(parsed);
    if (containsXss(jsonString)) {
      return fallback;
    }

    return parsed;
  } catch {
    return fallback;
  }
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return escapeHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * DOMPurify-like HTML sanitizer (simplified version)
 */
export function sanitizeDomHtml(html: string, options: {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
} = {}): string {
  const { allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'], allowedAttributes = {} } = options;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const elements = tempDiv.querySelectorAll('*');

  elements.forEach(element => {
    // Remove disallowed tags
    if (!allowedTags.includes(element.tagName.toLowerCase())) {
      element.remove();
      return;
    }

    // Remove disallowed attributes
    const attrs = Array.from(element.attributes);
    attrs.forEach(attr => {
      const allowed = allowedAttributes[element.tagName.toLowerCase()] || [];
      if (!allowed.includes(attr.name)) {
        element.removeAttribute(attr.name);
      }
    });

    // Remove event handlers
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        element.removeAttribute(attr.name);
      }
    });
  });

  return tempDiv.innerHTML;
}

/**
 * Validate and sanitize attribute value
 */
export function sanitizeAttributeValue(value: string): string {
  return value
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Check for script injection in JSON
 */
export function detectScriptInJson(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    const jsonString = JSON.stringify(parsed);
    return containsXss(jsonString);
  } catch {
    return false;
  }
}

/**
 * Safe innerHTML setter
 */
export function safeSetInnerHTML(element: HTMLElement, html: string): void {
  element.innerHTML = sanitizeDomHtml(html);
}

/**
 * Safe document.write replacement
 */
export function safeWrite(html: string): void {
  // document.write is dangerous, use DOM manipulation instead
  const div = document.createElement('div');
  safeSetInnerHTML(div, html);
  document.body.appendChild(div);
}

/**
 * Validate and sanitize href attribute
 */
export function sanitizeHref(href: string): string {
  if (href.startsWith('javascript:') || href.startsWith('data:')) {
    return '#';
  }

  try {
    const url = new URL(href, window.location.origin);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
      return '#';
    }
    return url.toString();
  } catch {
    return '#';
  }
}

/**
 * Content Security Policy helper
 */
export const cspHelper = {
  generateNonce: createNonce,
  validateNonce: validateNonce,
  addNonceToScript: (script: HTMLScriptElement, nonce: string): void => {
    script.setAttribute('nonce', nonce);
  },
  addNonceToStyle: (style: HTMLStyleElement, nonce: string): void => {
    style.setAttribute('nonce', nonce);
  },
};
