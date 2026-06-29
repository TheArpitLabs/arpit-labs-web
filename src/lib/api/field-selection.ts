/**
 * API Field Selection
 * Handles field selection (partial response) for API responses
 */

export interface FieldSelectionOptions {
  fields?: string[];
  excludeFields?: string[];
  include?: string[];
}

class FieldSelector {
  /**
   * Selects fields from an object
   */
  selectFields<T>(data: T, options: FieldSelectionOptions): any {
    if (!options.fields && !options.excludeFields) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.selectFields(item, options));
    }

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    let result: any = { ...data };

    // Apply include (whitelist)
    if (options.fields && options.fields.length > 0) {
      result = {};
      for (const field of options.fields) {
        const value = this.getFieldValue(data, field);
        if (value !== undefined) {
          this.setFieldValue(result, field, value);
        }
      }
    }

    // Apply exclude (blacklist)
    if (options.excludeFields && options.excludeFields.length > 0) {
      for (const field of options.excludeFields) {
        this.deleteFieldValue(result, field);
      }
    }

    return result;
  }

  /**
   * Gets field value from object
   */
  private getFieldValue<T>(obj: T, field: string): any {
    const keys = field.split('.');
    let value: any = obj;

    for (const key of keys) {
      if (value === undefined || value === null) return undefined;
      value = value[key];
    }

    return value;
  }

  /**
   * Sets field value on object
   */
  private setFieldValue(obj: any, field: string, value: any): void {
    const keys = field.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Deletes field value from object
   */
  private deleteFieldValue(obj: any, field: string): void {
    const keys = field.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) return;
      current = current[keys[i]];
    }

    delete current[keys[keys.length - 1]];
  }

  /**
   * Parses field selection options from request
   */
  parseOptions(request: Request): FieldSelectionOptions {
    const url = new URL(request.url);
    const fieldsParam = url.searchParams.get('fields');
    const excludeParam = url.searchParams.get('exclude');
    const includeParam = url.searchParams.get('include');

    const fields = fieldsParam ? fieldsParam.split(',').map(f => f.trim()) : undefined;
    const excludeFields = excludeParam ? excludeParam.split(',').map(f => f.trim()) : undefined;
    const include = includeParam ? includeParam.split(',').map(f => f.trim()) : undefined;

    return {
      fields,
      excludeFields,
      include,
    };
  }

  /**
   * Validates field selection options
   */
  validateOptions<T>(options: FieldSelectionOptions, data: T): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.fields && data && typeof data === 'object') {
      for (const field of options.fields) {
        if (!this.hasField(data, field)) {
          errors.push(`Invalid field: ${field}`);
        }
      }
    }

    if (options.excludeFields && data && typeof data === 'object') {
      for (const field of options.excludeFields) {
        if (!this.hasField(data, field)) {
          errors.push(`Invalid field to exclude: ${field}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks if object has a field
   */
  private hasField<T>(obj: T, field: string): boolean {
    const keys = field.split('.');
    let value: any = obj;

    for (const key of keys) {
      if (value === undefined || value === null) return false;
      value = value[key];
    }

    return value !== undefined;
  }

  /**
   * Expands nested fields (e.g., user.name -> user: { name })
   */
  expandFields<T>(data: T, fields: string[]): any {
    if (!fields || fields.length === 0) {
      return data;
    }

    const result: any = {};

    for (const field of fields) {
      const value = this.getFieldValue(data, field);
      if (value !== undefined) {
        this.setFieldValue(result, field, value);
      }
    }

    return result;
  }

  /**
   * Gets all available fields from an object
   */
  getAvailableFields<T>(data: T): string[] {
    const fields: string[] = [];

    if (!data || typeof data !== 'object') {
      return fields;
    }

    const extractFields = (obj: any, prefix: string = '') => {
      for (const key in obj) {
        const field = prefix ? `${prefix}.${key}` : key;
        fields.push(field);

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          extractFields(obj[key], field);
        }
      }
    };

    extractFields(data);
    return fields;
  }
}

// Create singleton instance
const fieldSelector = new FieldSelector();

/**
 * Selects fields from data
 */
export function selectFields<T>(data: T, options: FieldSelectionOptions): any {
  return fieldSelector.selectFields(data, options);
}

/**
 * Parses field selection options from request
 */
export function parseFieldSelectionOptions(request: Request): FieldSelectionOptions {
  return fieldSelector.parseOptions(request);
}

/**
 * Validates field selection options
 */
export function validateFieldSelectionOptions<T>(options: FieldSelectionOptions, data: T): { valid: boolean; errors: string[] } {
  return fieldSelector.validateOptions(options, data);
}

/**
 * Expands fields
 */
export function expandFields<T>(data: T, fields: string[]): any {
  return fieldSelector.expandFields(data, fields);
}

/**
 * Gets available fields
 */
export function getAvailableFields<T>(data: T): string[] {
  return fieldSelector.getAvailableFields(data);
}

export default fieldSelector;
