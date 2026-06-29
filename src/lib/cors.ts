/**
 * CORS configuration utilities
 */

export interface CorsOptions {
  origin: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * Default CORS configuration
 */
export const defaultCorsOptions: CorsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://axiora.com', 'https://www.axiora.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  exposedHeaders: ['X-CSRF-Token', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null, options: CorsOptions): boolean {
  if (!origin) return false;
  
  if (typeof options.origin === 'function') {
    return options.origin(origin);
  }
  
  if (Array.isArray(options.origin)) {
    return options.origin.includes(origin);
  }
  
  return options.origin === origin;
}

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(origin: string | null, options: CorsOptions = defaultCorsOptions): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (origin && isOriginAllowed(origin, options)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  if (options.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  if (options.methods) {
    headers['Access-Control-Allow-Methods'] = options.methods.join(', ');
  }
  
  if (options.allowedHeaders) {
    headers['Access-Control-Allow-Headers'] = options.allowedHeaders.join(', ');
  }
  
  if (options.exposedHeaders) {
    headers['Access-Control-Expose-Headers'] = options.exposedHeaders.join(', ');
  }
  
  if (options.maxAge) {
    headers['Access-Control-Max-Age'] = options.maxAge.toString();
  }
  
  return headers;
}

/**
 * Handle preflight OPTIONS request
 */
export function handlePreflightRequest(origin: string | null, options: CorsOptions = defaultCorsOptions): Response {
  const headers = getCorsHeaders(origin, options);
  
  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(response: Response, origin: string | null, options: CorsOptions = defaultCorsOptions): Response {
  const headers = getCorsHeaders(origin, options);
  
  const newResponse = new Response(response.body, response);
  
  Object.entries(headers).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  
  return newResponse;
}

/**
 * Strict CORS options for admin routes
 */
export const adminCorsOptions: CorsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://axiora.com', 'https://www.axiora.com']
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400,
};

/**
 * Public CORS options for public API routes
 */
export const publicCorsOptions: CorsOptions = {
  origin: '*', // Allow all origins for public endpoints
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
  maxAge: 86400,
};
