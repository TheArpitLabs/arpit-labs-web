/**
 * Request validation utilities
 */

import { z } from 'zod';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  data?: any;
}

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: any
): ValidationResult {
  try {
    const validatedData = schema.parse(body);
    return {
      isValid: true,
      errors: {},
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      
      return {
        isValid: false,
        errors,
      };
    }
    
    return {
      isValid: false,
      errors: { _form: 'Validation failed' },
    };
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  params: Record<string, string | string[] | undefined>
): ValidationResult {
  try {
    const validatedData = schema.parse(params);
    return {
      isValid: true,
      errors: {},
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      
      return {
        isValid: false,
        errors,
      };
    }
    
    return {
      isValid: false,
      errors: { _form: 'Validation failed' },
    };
  }
}

/**
 * Validate path parameters
 */
export function validatePathParams<T>(
  schema: z.ZodSchema<T>,
  params: Record<string, string | undefined>
): ValidationResult {
  try {
    const validatedData = schema.parse(params);
    return {
      isValid: true,
      errors: {},
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      
      return {
        isValid: false,
        errors,
      };
    }
    
    return {
      isValid: false,
      errors: { _form: 'Validation failed' },
    };
  }
}

/**
 * Validate headers
 */
export function validateHeaders<T>(
  schema: z.ZodSchema<T>,
  headers: Record<string, string | undefined>
): ValidationResult {
  try {
    const validatedData = schema.parse(headers);
    return {
      isValid: true,
      errors: {},
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      
      return {
        isValid: false,
        errors,
      };
    }
    
    return {
      isValid: false,
      errors: { _form: 'Validation failed' },
    };
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),

  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  email: z.object({
    email: z.string().email('Invalid email address'),
  }),

  search: z.object({
    query: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  }),

  dateRange: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, { message: 'Start date must be before end date' }),
};

/**
 * Validate API request
 */
export function validateApiRequest<T>(
  schema: z.ZodSchema<T>,
  request: {
    body?: any;
    query?: Record<string, string | string[] | undefined>;
    params?: Record<string, string | undefined>;
    headers?: Record<string, string | undefined>;
  }
): ValidationResult {
  const results: ValidationResult[] = [];

  if (request.body) {
    results.push(validateRequestBody(schema, request.body));
  }

  if (request.query) {
    results.push(validateQueryParams(schema, request.query));
  }

  if (request.params) {
    results.push(validatePathParams(schema, request.params));
  }

  if (request.headers) {
    results.push(validateHeaders(schema, request.headers));
  }

  const hasErrors = results.some(r => !r.isValid);
  const allErrors = results.reduce((acc, r) => ({ ...acc, ...r.errors }), {});

  return {
    isValid: !hasErrors,
    errors: allErrors,
    data: results.find(r => r.data)?.data,
  };
}

/**
 * Sanitize request data
 */
export function sanitizeRequestData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized: any = {};

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];
      
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => sanitizeRequestData(item));
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeRequestData(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize request
 */
export function validateAndSanitizeRequest<T>(
  schema: z.ZodSchema<T>,
  request: {
    body?: any;
    query?: Record<string, string | string[] | undefined>;
    params?: Record<string, string | undefined>;
  }
): ValidationResult {
  const sanitized = {
    body: request.body ? sanitizeRequestData(request.body) : undefined,
    query: request.query ? sanitizeRequestData(request.query) : undefined,
    params: request.params ? sanitizeRequestData(request.params) : undefined,
  };

  return validateApiRequest(schema, sanitized);
}

/**
 * Create validation middleware
 */
export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>,
  options: {
    sanitize?: boolean;
    onError?: (errors: Record<string, string>) => any;
  } = {}
) {
  return async (request: any) => {
    const { sanitize = true, onError } = options;

    const result = sanitize 
      ? validateAndSanitizeRequest(schema, request)
      : validateApiRequest(schema, request);

    if (!result.isValid && onError) {
      return onError(result.errors);
    }

    return result;
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}): ValidationResult {
  const errors: Record<string, string> = {};
  const { maxSize = 5 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options;

  if (file.size > maxSize) {
    errors.size = `File size exceeds limit of ${maxSize / 1024 / 1024}MB`;
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.type = `File type ${file.type} is not allowed`;
  }

  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && !allowedExtensions.includes(`.${extension}`)) {
      errors.extension = `File extension .${extension} is not allowed`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate multiple files
 */
export function validateMultipleFiles(
  files: File[],
  options: {
    maxCount?: number;
    maxSize?: number;
    allowedTypes?: string[];
  }
): ValidationResult {
  const errors: Record<string, string> = {};
  const { maxCount = 10, maxSize = 5 * 1024 * 1024, allowedTypes = [] } = options;

  if (files.length > maxCount) {
    errors.count = `Maximum ${maxCount} files allowed`;
  }

  files.forEach((file, index) => {
    const result = validateFileUpload(file, { maxSize, allowedTypes });
    if (!result.isValid) {
      errors[`file_${index}`] = Object.values(result.errors).join(', ');
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate JSON body
 */
export function validateJsonBody(body: string): ValidationResult {
  try {
    const parsed = JSON.parse(body);
    return {
      isValid: true,
      errors: {},
      data: parsed,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: { body: 'Invalid JSON format' },
    };
  }
}

/**
 * Validate URL parameter
 */
export function validateUrlParam(param: string, options: {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const { required = false, pattern, minLength, maxLength } = options;

  if (required && !param) {
    errors.required = 'Parameter is required';
  }

  if (param && minLength && param.length < minLength) {
    errors.minLength = `Parameter must be at least ${minLength} characters`;
  }

  if (param && maxLength && param.length > maxLength) {
    errors.maxLength = `Parameter must be at most ${maxLength} characters`;
  }

  if (param && pattern && !pattern.test(param)) {
    errors.pattern = 'Parameter format is invalid';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: any,
  enumValues: readonly T[],
  fieldName: string = 'value'
): ValidationResult {
  if (!enumValues.includes(value)) {
    return {
      isValid: false,
      errors: {
        [fieldName]: `Must be one of: ${enumValues.join(', ')}`,
      },
    };
  }

  return {
    isValid: true,
    errors: {},
  };
}
