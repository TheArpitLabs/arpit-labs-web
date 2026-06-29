/**
 * Form validation utilities
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */
export const commonSchemas = {
  email: z.string().email('Invalid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  
  url: z.string().url('Invalid URL'),
  
  phone: z.string()
    .regex(/^[+]?[\d\s\-()]+$/, 'Invalid phone number')
    .min(10, 'Phone number must be at least 10 digits'),
  
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  
  projectName: z.string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be at most 100 characters'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be at most 5000 characters'),
  
  category: z.enum(['AI', 'IoT', 'Software', 'Hardware', 'Cybersecurity', 'Robotics', 'Data Science', 'Other']),
  
  domain: z.string()
    .min(2, 'Domain must be at least 2 characters')
    .max(50, 'Domain must be at most 50 characters'),
  
  subdomain: z.string()
    .min(2, 'Subdomain must be at least 2 characters')
    .max(50, 'Subdomain must be at most 50 characters'),
};

/**
 * Form field validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  data?: any;
}

/**
 * Validate form data against schema
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: any
): ValidationResult {
  try {
    const validatedData = schema.parse(data);
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
 * Real-time field validation
 */
export function validateField<T>(
  schema: z.ZodSchema<T>,
  field: string,
  value: any
): { isValid: boolean; error?: string } {
  try {
    const fieldSchema = (schema as any).shape?.[field];
    if (fieldSchema) {
      fieldSchema.parse(value);
      return { isValid: true };
    }
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find(err => err.path[0] === field);
      return {
        isValid: false,
        error: fieldError?.message || 'Invalid value',
      };
    }
    return { isValid: false, error: 'Validation failed' };
  }
}

/**
 * Password strength checker
 */
export function checkPasswordStrength(password: string): {
  score: number;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Add at least 8 characters');

  if (password.length >= 12) score += 1;
  else feedback.push('Consider using 12+ characters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 4) strength = 'good';
  else if (score >= 3) strength = 'fair';

  return { score, strength, feedback };
}

/**
 * Confirm password validation
 */
export function validateConfirmPassword(password: string, confirmPassword: string): {
  isValid: boolean;
  error?: string;
} {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: 'Passwords do not match',
    };
  }
  return { isValid: true };
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): { isValid: boolean; error?: string } {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = [] } = options;

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSize / 1024 / 1024}MB`,
    };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate URL with custom rules
 */
export function validateUrl(url: string, options: {
  requireHttps?: boolean;
  allowedDomains?: string[];
} = {}): { isValid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    if (options.requireHttps && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'URL must use HTTPS',
      };
    }

    if (options.allowedDomains && !options.allowedDomains.includes(parsed.hostname)) {
      return {
        isValid: false,
        error: `URL must be from one of: ${options.allowedDomains.join(', ')}`,
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
 * Sanitize and validate user input
 */
export function sanitizeAndValidate(input: string, maxLength: number = 1000): {
  sanitized: string;
  isValid: boolean;
  error?: string;
} {
  const sanitized = input.trim().slice(0, maxLength);
  
  if (sanitized.length === 0) {
    return {
      sanitized,
      isValid: false,
      error: 'This field is required',
    };
  }

  return { sanitized, isValid: true };
}

/**
 * Create dynamic form schema
 */
export function createFormSchema(fields: Record<string, z.ZodTypeAny>): z.ZodObject<any> {
  return z.object(fields);
}

/**
 * Validate form on blur
 */
export function validateOnBlur<T>(
  schema: z.ZodSchema<T>,
  field: string,
  value: any,
  onError: (field: string, error: string) => void,
  onSuccess?: (field: string) => void
): void {
  const result = validateField(schema, field, value);
  
  if (!result.isValid) {
    onError(field, result.error || 'Invalid value');
  } else if (onSuccess) {
    onSuccess(field);
  }
}

/**
 * Validate form on change
 */
export function validateOnChange<T>(
  schema: z.ZodSchema<T>,
  field: string,
  value: any,
  onError: (field: string, error: string) => void,
  onSuccess?: (field: string) => void
): void {
  // Only validate if field has been touched
  const result = validateField(schema, field, value);
  
  if (!result.isValid) {
    onError(field, result.error || 'Invalid value');
  } else if (onSuccess) {
    onSuccess(field);
  }
}
