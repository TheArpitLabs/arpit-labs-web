/**
 * API Response Sanitization
 * Sanitizes API responses to remove sensitive data
 */

export interface SanitizationRule {
  field: string;
  action: 'remove' | 'mask' | 'truncate';
  maskChar?: string;
  maskLength?: number;
  maxLength?: number;
}

export interface SanitizationConfig {
  rules: SanitizationRule[];
  removeNulls?: boolean;
  removeUndefined?: boolean;
}

class ResponseSanitizer {
  /**
   * Sanitizes a response object
   */
  sanitize<T>(data: T, config: SanitizationConfig): T {
    let result = data;

    // Remove nulls if configured
    if (config.removeNulls) {
      result = this.removeNulls(result) as T;
    }

    // Remove undefined if configured
    if (config.removeUndefined) {
      result = this.removeUndefined(result) as T;
    }

    // Apply sanitization rules
    for (const rule of config.rules) {
      result = this.applyRule(result, rule) as T;
    }

    return result;
  }

  /**
   * Removes null values from an object
   */
  private removeNulls(data: any): any {
    if (data === null) return undefined;
    if (typeof data !== 'object') return data;
    if (Array.isArray(data)) {
      return data.map(item => this.removeNulls(item)).filter(item => item !== undefined);
    }

    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null) {
        result[key] = this.removeNulls(value);
      }
    }
    return result;
  }

  /**
   * Removes undefined values from an object
   */
  private removeUndefined(data: any): any {
    if (data === undefined) return undefined;
    if (typeof data !== 'object') return data;
    if (Array.isArray(data)) {
      return data.map(item => this.removeUndefined(item)).filter(item => item !== undefined);
    }

    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = this.removeUndefined(value);
      }
    }
    return result;
  }

  /**
   * Applies a sanitization rule
   */
  private applyRule(data: any, rule: SanitizationRule): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.applyRule(item, rule));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === rule.field) {
        result[key] = this.sanitizeField(value, rule);
      } else if (typeof value === 'object') {
        result[key] = this.applyRule(value, rule);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Sanitizes a single field
   */
  private sanitizeField(value: any, rule: SanitizationRule): any {
    switch (rule.action) {
      case 'remove':
        return undefined;
      case 'mask':
        return this.maskValue(value, rule);
      case 'truncate':
        return this.truncateValue(value, rule);
      default:
        return value;
    }
  }

  /**
   * Masks a value
   */
  private maskValue(value: any, rule: SanitizationRule): any {
    if (typeof value !== 'string') return value;

    const maskChar = rule.maskChar || '*';
    const maskLength = rule.maskLength || 4;

    if (value.length <= maskLength) {
      return maskChar.repeat(value.length);
    }

    return value.substring(0, 2) + maskChar.repeat(maskLength) + value.substring(maskLength + 2);
  }

  /**
   * Truncates a value
   */
  private truncateValue(value: any, rule: SanitizationRule): any {
    if (typeof value !== 'string') return value;

    const maxLength = rule.maxLength || 50;

    if (value.length <= maxLength) {
      return value;
    }

    return value.substring(0, maxLength) + '...';
  }

  /**
   * Sanitizes a response
   */
  sanitizeResponse<T>(response: Response, config: SanitizationConfig): Promise<Response> {
    return response.clone().json().then((data) => {
      const sanitized = this.sanitize(data, config);
      return new Response(JSON.stringify(sanitized), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    });
  }
}

// Create singleton instance
const responseSanitizer = new ResponseSanitizer();

/**
 * Sanitizes data
 */
export function sanitizeResponseData<T>(data: T, config: SanitizationConfig): T {
  return responseSanitizer.sanitize(data, config);
}

/**
 * Sanitizes a response
 */
export function sanitizeAPIResponse<T>(
  response: Response,
  config: SanitizationConfig
): Promise<Response> {
  return responseSanitizer.sanitizeResponse(response, config);
}

/**
 * Common sanitization rules
 */
export const SanitizationRules = {
  password: {
    field: 'password',
    action: 'mask' as const,
    maskChar: '*',
    maskLength: 8,
  },
  email: {
    field: 'email',
    action: 'mask' as const,
    maskChar: '*',
    maskLength: 4,
  },
  token: {
    field: 'token',
    action: 'remove' as const,
  },
  apiKey: {
    field: 'apiKey',
    action: 'mask' as const,
    maskChar: '*',
    maskLength: 16,
  },
  creditCard: {
    field: 'creditCard',
    action: 'mask' as const,
    maskChar: '*',
    maskLength: 12,
  },
};

export default responseSanitizer;
