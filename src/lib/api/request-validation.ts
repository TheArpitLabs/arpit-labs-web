/**
 * API Request Validation
 * Validates incoming API requests before processing
 */

export interface RequestValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'uuid';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export interface RequestValidationConfig {
  body?: RequestValidationRule[];
  query?: RequestValidationRule[];
  params?: RequestValidationRule[];
  headers?: RequestValidationRule[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
}

class RequestValidator {
  /**
   * Validates a value against a rule
   */
  private validateValue(value: any, rule: RequestValidationRule): string | null {
    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      return `${rule.field} is required`;
    }

    // Skip validation if not required and value is empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${rule.field} must be a string`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${rule.field} must be a number`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${rule.field} must be a boolean`;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return `${rule.field} must be an array`;
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return `${rule.field} must be an object`;
        }
        break;
      case 'email':
        if (!this.isValidEmail(value)) {
          return `${rule.field} must be a valid email`;
        }
        break;
      case 'url':
        if (!this.isValidURL(value)) {
          return `${rule.field} must be a valid URL`;
        }
        break;
      case 'uuid':
        if (!this.isValidUUID(value)) {
          return `${rule.field} must be a valid UUID`;
        }
        break;
    }

    // String validations
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${rule.field} must be at least ${rule.minLength} characters`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${rule.field} must be at most ${rule.maxLength} characters`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return `${rule.field} has invalid format`;
      }
    }

    // Number validations
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `${rule.field} must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `${rule.field} must be at most ${rule.max}`;
      }
    }

    // Array validations
    if (rule.type === 'array' && Array.isArray(value)) {
      if (rule.minLength && value.length < rule.minLength) {
        return `${rule.field} must have at least ${rule.minLength} items`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${rule.field} must have at most ${rule.maxLength} items`;
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      return `${rule.field} must be one of: ${rule.enum.join(', ')}`;
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        return typeof result === 'string' ? result : `${rule.field} validation failed`;
      }
    }

    return null;
  }

  /**
   * Validates a request
   */
  validateRequest(
    request: Request,
    config: RequestValidationConfig
  ): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    // Validate body
    if (config.body) {
      // This would need to parse the body based on content type
      // For now, skip as body parsing requires async
    }

    // Validate query parameters
    if (config.query) {
      const url = new URL(request.url);
      for (const rule of config.query) {
        const value = url.searchParams.get(rule.field);
        const error = this.validateValue(value, rule);
        if (error) {
          errors.push({ field: rule.field, message: error });
        }
      }
    }

    // Validate headers
    if (config.headers) {
      for (const rule of config.headers) {
        const value = request.headers.get(rule.field);
        const error = this.validateValue(value, rule);
        if (error) {
          errors.push({ field: rule.field, message: error });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates request body
   */
  async validateBody(body: any, rules: RequestValidationRule[]): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string }> = [];

    for (const rule of rules) {
      const value = body[rule.field];
      const error = this.validateValue(value, rule);
      if (error) {
        errors.push({ field: rule.field, message: error });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks if value is a valid email
   */
  private isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Checks if value is a valid URL
   */
  private isValidURL(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if value is a valid UUID
   */
  private isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}

// Create singleton instance
const requestValidator = new RequestValidator();

/**
 * Validates a request
 */
export function validateAPIRequest(
  request: Request,
  config: RequestValidationConfig
): ValidationResult {
  return requestValidator.validateRequest(request, config);
}

/**
 * Validates request body
 */
export async function validateAPIBody(
  body: any,
  rules: RequestValidationRule[]
): Promise<ValidationResult> {
  return requestValidator.validateBody(body, rules);
}

/**
 * Middleware for request validation
 */
export function requestValidationMiddleware(config: RequestValidationConfig) {
  return async (request: Request): Promise<Response | null> => {
    const result = requestValidator.validateRequest(request, config);

    if (!result.valid) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          errors: result.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return null;
  };
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  email: {
    field: 'email',
    type: 'email' as const,
    required: true,
  },
  password: {
    field: 'password',
    type: 'string' as const,
    required: true,
    minLength: 8,
  },
  url: {
    field: 'url',
    type: 'url' as const,
    required: false,
  },
  uuid: {
    field: 'id',
    type: 'uuid' as const,
    required: true,
  },
};

export default requestValidator;
