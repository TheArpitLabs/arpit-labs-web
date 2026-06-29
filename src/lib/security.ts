/**
 * Security Utilities
 * Rate limiting, CSRF protection, input sanitization
 */

import { logger } from '@/lib/logger';

let DOMPurify: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
let sanitizerInitialized = false;

// Lazy load DOMPurify on first use (optional dependency)
async function loadDOMPurify() {
  if (sanitizerInitialized) return;
  sanitizerInitialized = true;

  try {
    // @ts-expect-error - isomorphic-dompurify is an optional dependency
    const dompurifyModule = await import('isomorphic-dompurify');
    DOMPurify = dompurifyModule.default || dompurifyModule;
  } catch (_error) {
    logger.debug('DOMPurify not available, using fallback sanitization.');
  }
}

// Simple fallback if DOMPurify is not available
function fallbackSanitize(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Rate limiting using in-memory store (should use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export function getRateLimitStatus(identifier: string, limit: number = 10) {
  const record = requestCounts.get(identifier);
  if (!record) {
    return { remaining: limit, resetTime: Date.now() + 60000 };
  }

  return {
    remaining: Math.max(0, limit - record.count),
    resetTime: record.resetTime,
  };
}

export function clearRateLimitRecord(identifier: string) {
  requestCounts.delete(identifier);
}

// Input sanitization
export function sanitizeInput(input: string): string {
  if (DOMPurify) {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }
  return fallbackSanitize(input);
}

export function sanitizeHtml(html: string): string {
  if (DOMPurify) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'a',
        'img',
        'blockquote',
        'code',
        'pre',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
    });
  }
  return fallbackSanitize(html);
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Validate URL format
export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// CSRF token generation and validation
const csrfTokens = new Map<string, { token: string; created: number }>();

export function generateCsrfToken(sessionId: string): string {
  const token = Buffer.from(Math.random().toString() + Date.now().toString()).toString('base64');

  csrfTokens.set(sessionId, {
    token,
    created: Date.now(),
  });

  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const record = csrfTokens.get(sessionId);

  if (!record) {
    return false;
  }

  // Token expires after 24 hours
  if (Date.now() - record.created > 24 * 60 * 60 * 1000) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return record.token === token;
}

// Security headers configuration
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.supabase.co",
  ].join('; '),
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '3600',
};
