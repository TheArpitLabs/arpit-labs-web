/**
 * Request/Response Transformation Middleware
 * Transforms requests and responses for consistency and security
 */

export interface TransformOptions {
  // Request transformations
  trimStrings?: boolean;
  lowercaseHeaders?: boolean;
  removeNullValues?: boolean;
  sanitizeInput?: boolean;
  
  // Response transformations
  standardizeDates?: boolean;
  removeSensitiveHeaders?: boolean;
  addSecurityHeaders?: boolean;
  compressResponse?: boolean;
}

/**
 * Default transformation options
 */
const DEFAULT_OPTIONS: TransformOptions = {
  trimStrings: true,
  lowercaseHeaders: true,
  removeNullValues: true,
  sanitizeInput: true,
  standardizeDates: true,
  removeSensitiveHeaders: true,
  addSecurityHeaders: true,
  compressResponse: false,
};

/**
 * Transforms a request
 */
export async function transformRequest(
  request: Request,
  options: TransformOptions = DEFAULT_OPTIONS
): Promise<Request> {
  let url = request.url;
  let headers = new Headers(request.headers);
  let body = request.body;
  
  // Lowercase headers
  if (options.lowercaseHeaders) {
    headers = lowercaseHeaders(headers);
  }
  
  // Transform body if present
  if (request.headers.get('content-type')?.includes('application/json')) {
    const json = await request.json();
    const transformed = transformRequestBody(json, options);
    const bodyString = JSON.stringify(transformed);
    headers.set('content-length', bodyString.length.toString());
    
    return new Request(url, {
      method: request.method,
      headers,
      body: bodyString,
    });
  }
  
  // Return original request if no transformation needed
  return request;
}

/**
 * Transforms request body
 */
function transformRequestBody(
  data: any,
  options: TransformOptions
): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const result: any = Array.isArray(data) ? [] : {};
  
  for (const key in data) {
    if (!data.hasOwnProperty(key)) continue;
    
    let value = data[key];
    
    // Trim strings
    if (options.trimStrings && typeof value === 'string') {
      value = value.trim();
    }
    
    // Remove null values
    if (options.removeNullValues && value === null) {
      continue;
    }
    
    // Sanitize input
    if (options.sanitizeInput && typeof value === 'string') {
      value = sanitizeString(value);
    }
    
    // Recursively transform nested objects
    if (typeof value === 'object' && value !== null) {
      value = transformRequestBody(value, options);
    }
    
    result[key] = value;
  }
  
  return result;
}

/**
 * Transforms a response
 */
export async function transformResponse(
  response: Response,
  options: TransformOptions = DEFAULT_OPTIONS
): Promise<Response> {
  let headers = new Headers(response.headers);
  let body = response.body;
  
  // Remove sensitive headers
  if (options.removeSensitiveHeaders) {
    headers = removeSensitiveHeaders(headers);
  }
  
  // Add security headers
  if (options.addSecurityHeaders) {
    headers = addSecurityHeaders(headers);
  }
  
  // Transform body if JSON
  if (response.headers.get('content-type')?.includes('application/json')) {
    const json = await response.json();
    const transformed = transformResponseBody(json, options);
    const bodyString = JSON.stringify(transformed);
    headers.set('content-length', bodyString.length.toString());
    
    return new Response(bodyString, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  
  // Return original response if no transformation needed
  return response;
}

/**
 * Transforms response body
 */
function transformResponseBody(
  data: any,
  options: TransformOptions
): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const result: any = Array.isArray(data) ? [] : {};
  
  for (const key in data) {
    if (!data.hasOwnProperty(key)) continue;
    
    let value = data[key];
    
    // Standardize dates
    if (options.standardizeDates) {
      value = standardizeDate(value);
    }
    
    // Recursively transform nested objects
    if (typeof value === 'object' && value !== null) {
      value = transformResponseBody(value, options);
    }
    
    result[key] = value;
  }
  
  return result;
}

/**
 * Lowercases all header names
 */
function lowercaseHeaders(headers: Headers): Headers {
  const newHeaders = new Headers();
  
  for (const [key, value] of headers.entries()) {
    newHeaders.set(key.toLowerCase(), value);
  }
  
  return newHeaders;
}

/**
 * Removes sensitive headers
 */
function removeSensitiveHeaders(headers: Headers): Headers {
  const sensitiveHeaders = [
    'x-powered-by',
    'server',
    'x-aspnet-version',
    'x-aspnetmvc-version',
  ];
  
  for (const header of sensitiveHeaders) {
    headers.delete(header);
  }
  
  return headers;
}

/**
 * Adds security headers
 */
function addSecurityHeaders(headers: Headers): Headers {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return headers;
}

/**
 * Sanitizes a string to prevent XSS
 */
function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Standardizes date values to ISO format
 */
function standardizeDate(value: any): any {
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  if (typeof value === 'string' && !isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  
  return value;
}

/**
 * Creates a transformation middleware
 */
export function createTransformMiddleware(options?: TransformOptions) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return async (request: Request): Promise<Response> => {
    // Transform request
    const transformedRequest = await transformRequest(request, opts);
    
    // Fetch with transformed request
    const response = await fetch(transformedRequest);
    
    // Transform response
    return transformResponse(response, opts);
  };
}
