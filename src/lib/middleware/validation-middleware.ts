/**
 * Request/Response Validation Middleware
 * Validates incoming requests and outgoing responses
 */

export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'date' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  properties?: Record<string, ValidationRule>;
  items?: ValidationRule;
  custom?: (value: any) => boolean | string;
}

	export interface ValidationSchema {
  body?: Record<string, ValidationRule>;
  query?: Record<string, ValidationRule>;
  params?: Record<string, ValidationRule>;
  headers?: Record<string, ValidationRule>;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

export class Validator {
  /**
   * Validates a value against a rule
   */
  static validate(value: any, rule: ValidationRule): string | null {
    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      return 'This field is required';
    }

    // Skip validation if not required and value is empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return 'Must be a string';
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return 'Must be a number';
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return 'Must be a boolean';
        }
        break;
      case 'email':
        if (!this.isValidEmail(value)) {
          return 'Must be a valid email address';
        }
        break;
      case 'url':
        if (!this.isValidURL(value)) {
          return 'Must be a valid URL';
        }
        break;
      case 'uuid':
        if (!this.isValidUUID(value)) {
          return 'Must be a valid UUID';
        }
        break;
      case 'date':
        if (!this.isValidDate(value)) {
          return 'Must be a valid date';
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return 'Must be an array';
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return 'Must be an object';
        }
        break;
    }

    // String validations
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `Must be at least ${rule.minLength} characters`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Must be at most ${rule.maxLength} characters`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return 'Invalid format';
      }
    }

    // Number validations
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `Must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `Must be at most ${rule.max}`;
      }
    }

    // Array validations
    if (rule.type === 'array' && Array.isArray(value)) {
      if (rule.minLength && value.length < rule.minLength) {
        return `Must have at least ${rule.minLength} items`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Must have at most ${rule.maxLength} items`;
      }
      if (rule.items) {
        for (let i = 0; i < value.length; i++) {
          const error = this.validate(value[i], rule.items);
          if (error) {
            return `Item ${i + 1}: ${error}`;
          }
        }
      }
    }

    // Object validations
    if (rule.type === 'object' && typeof value === 'object' && value !== null) {
      if (rule.properties) {
        for (const [prop, propRule] of Object.entries(rule.properties)) {
          const error = this.validate(value[prop], propRule);
          if (error) {
            return `${prop}: ${error}`;
          }
        }
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      return `Must be one of: ${rule.enum.join(', ')}`;
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        return typeof result === 'string' ? result : 'Validation failed';
      }
    }

    return null;
  }

  static validateSchema(data: any, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string[]> = {};
    const sections: Array<{ key: keyof ValidationSchema; dataKey: string }> = [
      { key: 'body', dataKey: 'body' },
      { key: 'query', dataKey: 'query' },
      { key: 'params', dataKey: 'params' },
      { key: 'headers', dataKey: 'headers' },
    ];

    for (const { key, dataKey } of sections) {
      const sectionSchema = schema[key];
      if (sectionSchema) {
        for (const [field, rule] of Object.entries(sectionSchema)) {
          const error = this.validate(data[dataKey]?.[field], rule);
          if (error) {
            if (!errors[key]) errors[key] = [];
            errors[key].push(`${field}: ${error}`);
          }
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Checks if value is a valid email
   */
  private static isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Checks if value is a valid URL
   */
  private static isValidURL(value: string): boolean {
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
  private static isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * Checks if value is a valid date
   */
  private static isValidDate(value: any): boolean {
    if (typeof value === 'string') {
      return !isNaN(Date.parse(value));
    }
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    return false;
  }
}

/**
 * Creates validation middleware
 */
export function createValidationMiddleware(schema: ValidationSchema) {
  return async (request: Request): Promise<Response | null> => {
    const url = new URL(request.url);
    
    const data = {
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.clone().json().catch(() => ({}))
        : {},
      query: Object.fromEntries(url.searchParams.entries()),
      params: {}, // Would be extracted from route params
      headers: Object.fromEntries(request.headers.entries()),
    };

    const result = Validator.validateSchema(data, schema);

    if (!result.valid) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          errors: result.errors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
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
    type: 'email' as const,
  },
  url: {
    type: 'url' as const,
  },
  uuid: {
    type: 'uuid' as const,
  },
  requiredString: {
    type: 'string' as const,
    required: true,
  },
  optionalString: {
    type: 'string' as const,
    required: false,
  },
  requiredNumber: {
    type: 'number' as const,
    required: true,
  },
  optionalNumber: {
    type: 'number' as const,
    required: false,
  },
  password: {
    type: 'string' as const,
    required: true,
    minLength: 8,
  },
};
