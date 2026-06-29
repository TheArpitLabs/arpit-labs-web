/**
 * API Filtering Helper
 * Handles filtering for API responses
 */

export interface FilterOptions {
  filters?: Record<string, any>;
  operators?: Record<string, 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in'>;
  dateRange?: { field: string; from?: string; to?: string };
  search?: { fields: string[]; query: string };
}

class FilteringHelper {
  /**
   * Filters an array of data
   */
  filter<T>(data: T[], options: FilterOptions): T[] {
    let filtered = [...data];

    // Apply field filters
    if (options.filters) {
      filtered = this.applyFilters(filtered, options.filters, options.operators);
    }

    // Apply date range filter
    if (options.dateRange) {
      filtered = this.applyDateRange(filtered, options.dateRange);
    }

    // Apply search filter
    if (options.search) {
      filtered = this.applySearch(filtered, options.search);
    }

    return filtered;
  }

  /**
   * Applies field filters
   */
  private applyFilters<T>(
    data: T[],
    filters: Record<string, any>,
    operators?: Record<string, 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in'>
  ): T[] {
    return data.filter((item) => {
      for (const [field, value] of Object.entries(filters)) {
        const itemValue = this.getFieldValue(item, field);
        const operator = operators?.[field] || 'eq';

        if (!this.matchesOperator(itemValue, value, operator)) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Checks if value matches operator
   */
  private matchesOperator(itemValue: any, filterValue: any, operator: string): boolean {
    switch (operator) {
      case 'eq':
        return itemValue === filterValue;
      case 'ne':
        return itemValue !== filterValue;
      case 'gt':
        return itemValue > filterValue;
      case 'lt':
        return itemValue < filterValue;
      case 'gte':
        return itemValue >= filterValue;
      case 'lte':
        return itemValue <= filterValue;
      case 'contains':
        return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
      case 'startsWith':
        return String(itemValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
      case 'endsWith':
        return String(itemValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(itemValue);
      default:
        return itemValue === filterValue;
    }
  }

  /**
   * Applies date range filter
   */
  private applyDateRange<T>(data: T[], dateRange: { field: string; from?: string; to?: string }): T[] {
    const { field, from, to } = dateRange;

    return data.filter((item) => {
      const itemValue = this.getFieldValue(item, field);

      if (!itemValue) return false;

      const itemDate = new Date(itemValue);

      if (from && itemDate < new Date(from)) return false;
      if (to && itemDate > new Date(to)) return false;

      return true;
    });
  }

  /**
   * Applies search filter
   */
  private applySearch<T>(data: T[], search: { fields: string[]; query: string }): T[] {
    const { fields, query } = search;
    const lowerQuery = query.toLowerCase();

    return data.filter((item) => {
      for (const field of fields) {
        const itemValue = this.getFieldValue(item, field);
        if (itemValue && String(itemValue).toLowerCase().includes(lowerQuery)) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Gets field value from object
   */
  private getFieldValue<T>(obj: T, field: string): any {
    const keys = field.split('.');
    let value: any = obj;

    for (const key of keys) {
      value = value?.[key];
    }

    return value;
  }

  /**
   * Parses filter options from request
   */
  parseOptions(request: Request): FilterOptions {
    const url = new URL(request.url);
    const filters: Record<string, any> = {};
    const operators: Record<string, any> = {};
    let dateRange: { field: string; from?: string; to?: string } | undefined = undefined;
    let search: { fields: string[]; query: string } | undefined = undefined;

    // Parse filter parameters (e.g., filter[name]=John)
    for (const [key, value] of url.searchParams.entries()) {
      if (key.startsWith('filter[')) {
        const match = key.match(/filter\[(.*?)\](?:\.(.*))?/);
        if (match) {
          const field = match[1];
          const operator = match[2] || 'eq';
          filters[field] = value;
          operators[field] = operator;
        }
      }
    }

    // Parse date range
    const dateField = url.searchParams.get('dateField');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    if (dateField) {
      dateRange = { field: dateField };
      if (fromDate) dateRange.from = fromDate;
      if (toDate) dateRange.to = toDate;
    }

    // Parse search
    const searchQuery = url.searchParams.get('search');
    const searchFields = url.searchParams.get('searchFields');

    if (searchQuery && searchFields) {
      search = { fields: searchFields.split(','), query: searchQuery };
    }

    return {
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      operators: Object.keys(operators).length > 0 ? operators : undefined,
      dateRange,
      search,
    };
  }

  /**
   * Validates filter options
   */
  validateOptions<T>(options: FilterOptions, data: T[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.filters && data.length > 0) {
      for (const field of Object.keys(options.filters)) {
        if (!this.hasField(data[0], field)) {
          errors.push(`Invalid filter field: ${field}`);
        }
      }
    }

    if (options.dateRange && data.length > 0) {
      if (!this.hasField(data[0], options.dateRange.field)) {
        errors.push(`Invalid date range field: ${options.dateRange.field}`);
      }
    }

    if (options.search && data.length > 0) {
      for (const field of options.search.fields) {
        if (!this.hasField(data[0], field)) {
          errors.push(`Invalid search field: ${field}`);
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
   * Generates filter URL parameters
   */
  generateFilterParams(options: FilterOptions): string {
    const params = new URLSearchParams();

    if (options.filters) {
      for (const [field, value] of Object.entries(options.filters)) {
        const operator = options.operators?.[field] || 'eq';
        params.append(`filter[${field}].${operator}`, String(value));
      }
    }

    if (options.dateRange) {
      params.append('dateField', options.dateRange.field);
      if (options.dateRange.from) params.append('fromDate', options.dateRange.from);
      if (options.dateRange.to) params.append('toDate', options.dateRange.to);
    }

    if (options.search) {
      params.append('search', options.search.query);
      params.append('searchFields', options.search.fields.join(','));
    }

    return params.toString();
  }
}

// Create singleton instance
const filteringHelper = new FilteringHelper();

/**
 * Filters data
 */
export function filterData<T>(data: T[], options: FilterOptions): T[] {
  return filteringHelper.filter(data, options);
}

/**
 * Parses filter options from request
 */
export function parseFilterOptions(request: Request): FilterOptions {
  return filteringHelper.parseOptions(request);
}

/**
 * Validates filter options
 */
export function validateFilterOptions<T>(options: FilterOptions, data: T[]): { valid: boolean; errors: string[] } {
  return filteringHelper.validateOptions(options, data);
}

/**
 * Generates filter parameters
 */
export function generateFilterParams(options: FilterOptions): string {
  return filteringHelper.generateFilterParams(options);
}

export default filteringHelper;
