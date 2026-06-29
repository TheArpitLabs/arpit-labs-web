import { REGEX_PATTERNS } from "@/constants/constants";

/**
 * Content sanitization utilities
 * Provides XSS prevention, HTML sanitization, and input validation
 */

/**
 * Basic HTML entity encoding
 */
export function encodeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Decode HTML entities
 */
export function decodeHTML(text: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
  };
  
  return text.replace(/&(amp|lt|gt|quot|#x27|#x2F);/g, (match) => map[match]);
}

/**
 * Strip HTML tags from content
 */
export function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize HTML content (basic implementation)
 * In production, use a library like DOMPurify
 */
export function sanitizeHTML(html: string): string {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (except for images)
  sanitized = sanitized.replace(/data:(?!image\/)/gi, '');
  
  // Remove iframe, object, embed tags
  sanitized = sanitized.replace(/<(iframe|object|embed)\b[^>]*>.*?<\/\1>/gim, '');
  
  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '');
  
  return sanitized;
}

/**
 * Sanitize URL to prevent javascript: and other dangerous protocols
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';
  
  const trimmed = url.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => trimmed.toLowerCase().startsWith(protocol))) {
    return '';
  }
  
  // Ensure URL starts with http:// or https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  const trimmed = email.trim().toLowerCase();
  
  if (!REGEX_PATTERNS.EMAIL.test(trimmed)) {
    return '';
  }
  
  return trimmed;
}

/**
 * Sanitize user input for text fields
 */
export function sanitizeTextInput(input: string, options: {
  maxLength?: number;
  allowHTML?: boolean;
  trim?: boolean;
} = {}): string {
  const { maxLength = 1000, allowHTML = false, trim = true } = options;
  
  let sanitized = input;
  
  if (trim) {
    sanitized = sanitized.trim();
  }
  
  if (!allowHTML) {
    sanitized = stripHTML(sanitized);
  } else {
    sanitized = sanitizeHTML(sanitized);
  }
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize markdown content
 */
export function sanitizeMarkdown(markdown: string): string {
  // Remove HTML tags from markdown
  let sanitized = stripHTML(markdown);
  
  // Remove potentially dangerous markdown features
  sanitized = sanitized.replace(/!\[.*?\]\(javascript:.*?\)/gi, ''); // Image links with javascript:
  sanitized = sanitized.replace(/\[.*?\]\(javascript:.*?\)/gi, ''); // Links with javascript:
  
  return sanitized;
}

/**
 * Validate JSON input
 */
export function validateJSON(json: string): boolean {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize JSON input
 */
export function sanitizeJSON(json: string): string | null {
  if (!validateJSON(json)) {
    return null;
  }
  
  try {
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';
  
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '').replace(/\//g, '').replace(/\\/g, '');
  
  // Remove special characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }
  
  return sanitized.trim();
}

/**
 * Sanitize SQL input (basic prevention)
 * In production, use parameterized queries
 */
export function sanitizeSQL(input: string): string {
  if (!input) return '';
  
  // Remove SQL comments
  let sanitized = input.replace(/--/g, '').replace(/\/\*/g, '').replace(/\*\//g, '');
  
  // Remove common SQL injection patterns
  const sqlPatterns = [
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b/gi,
    /\b(UNION|JOIN|WHERE|OR|AND)\b/gi,
    /['"]/g,
    /;/g,
  ];
  
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const sanitized = phone.replace(/\D/g, '');
  
  // Validate length (basic check)
  if (sanitized.length < 10 || sanitized.length > 15) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitize slug for URLs
 */
export function sanitizeSlug(slug: string): string {
  if (!slug) return '';
  
  let sanitized = slug.toLowerCase().trim();
  
  // Replace spaces and special characters with hyphens
  sanitized = sanitized.replace(/[^a-z0-9\s-]/g, '');
  sanitized = sanitized.replace(/\s+/g, '-');
  
  // Remove consecutive hyphens
  sanitized = sanitized.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  
  return sanitized;
}

/**
 * Content security policy helper
 */
export function getCSPDirectives(): Record<string, string> {
  return {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: https: blob:",
    'font-src': "'self' data:",
    'connect-src': "'self' https:",
    'media-src': "'self' https:",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
    'frame-ancestors': "'self'",
    'frame-src': "'none'",
  };
}

/**
 * Generate CSP meta tag
 */
export function getCSPMetaTag(): string {
  const directives = getCSPDirectives();
  const cspString = Object.entries(directives)
    .map(([key, value]) => `${key} ${value}`)
    .join('; ');
  
  return `<meta http-equiv="Content-Security-Policy" content="${cspString}">`;
}

/**
 * Validate content against allowed tags (for rich text editors)
 */
export function validateAllowedTags(html: string, allowedTags: string[]): boolean {
  const tagRegex = /<(\w+)[^>]*>/g;
  let match;
  
  while ((match = tagRegex.exec(html)) !== null) {
    const tagName = match[1].toLowerCase();
    if (!allowedTags.includes(tagName)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Remove disallowed attributes from HTML
 */
export function removeDisallowedAttributes(html: string, allowedAttributes: string[]): string {
  return html.replace(/<(\w+)([^>]*)>/g, (match, tagName, attributes) => {
    let sanitizedAttributes = attributes;
    
    // Remove on* event handlers
    sanitizedAttributes = sanitizedAttributes.replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    
    // Keep only allowed attributes
    const attrRegex = /(\w+)=("[^"]*"|'[^']*'|[^\s>]+)/g;
    const keptAttributes: string[] = [];
    let attrMatch;
    
    while ((attrMatch = attrRegex.exec(sanitizedAttributes)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      if (allowedAttributes.includes(attrName)) {
        keptAttributes.push(attrMatch[0]);
      }
    }
    
    return `<${tagName}${keptAttributes.length > 0 ? ' ' + keptAttributes.join(' ') : ''}>`;
  });
}

/**
 * Sanitize user-generated content comprehensively
 */
export function sanitizeUserContent(content: string, contentType: 'text' | 'html' | 'markdown' = 'text'): string {
  if (!content) return '';
  
  switch (contentType) {
    case 'html':
      return sanitizeHTML(content);
    case 'markdown':
      return sanitizeMarkdown(content);
    case 'text':
    default:
      return sanitizeTextInput(content, { allowHTML: false });
  }
}
