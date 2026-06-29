/**
 * API Sorting Helper
 * Handles sorting for API responses
 */

export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  multipleSort?: Array<{ field: string; order: 'asc' | 'desc' }>;
}

class SortingHelper {
  /**
   * Sorts an array of data
   */
  sort<T>(data: T[], options: SortOptions): T[] {
    if (!options.sortBy && !options.multipleSort) {
      return [...data];
    }

    let sorted = [...data];

    if (options.multipleSort && options.multipleSort.length > 0) {
      // Apply multiple sorts in order
      for (const sort of options.multipleSort) {
        sorted = this.sortByField(sorted, sort.field, sort.order);
      }
    } else if (options.sortBy) {
      sorted = this.sortByField(sorted, options.sortBy, options.sortOrder || 'asc');
    }

    return sorted;
  }

  /**
   * Sorts by a single field
   */
  private sortByField<T>(data: T[], field: string, order: 'asc' | 'desc'): T[] {
    return [...data].sort((a, b) => {
      const aValue = this.getFieldValue(a, field);
      const bValue = this.getFieldValue(b, field);

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return order === 'desc' ? -comparison : comparison;
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
   * Parses sort options from request
   */
  parseOptions(request: Request): SortOptions {
    const url = new URL(request.url);
    const sortBy = url.searchParams.get('sort') || url.searchParams.get('sortBy') || undefined;
    const sortOrder = (url.searchParams.get('order') || url.searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
    const sortParam = url.searchParams.get('sort');

    // Parse multiple sort (e.g., sort=name:asc,created_at:desc)
    let multipleSort: Array<{ field: string; order: 'asc' | 'desc' }> | undefined;

    if (sortParam && sortParam.includes(',')) {
      multipleSort = sortParam.split(',').map((s) => {
        const [field, order] = s.split(':');
        return {
          field,
          order: (order || 'asc') as 'asc' | 'desc',
        };
      });
    }

    return {
      sortBy,
      sortOrder,
      multipleSort,
    };
  }

  /**
   * Validates sort options
   */
  validateOptions<T>(options: SortOptions, data: T[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.sortBy && data.length > 0) {
      if (!this.hasField(data[0], options.sortBy)) {
        errors.push(`Invalid sort field: ${options.sortBy}`);
      }
    }

    if (options.multipleSort) {
      for (const sort of options.multipleSort) {
        if (data.length > 0 && !this.hasField(data[0], sort.field)) {
          errors.push(`Invalid sort field: ${sort.field}`);
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
   * Generates sort URL parameter
   */
  generateSortParam(options: SortOptions): string {
    if (options.multipleSort && options.multipleSort.length > 0) {
      return options.multipleSort
        .map((s) => `${s.field}:${s.order}`)
        .join(',');
    }

    if (options.sortBy) {
      return `${options.sortBy}:${options.sortOrder || 'asc'}`;
    }

    return '';
  }
}

// Create singleton instance
const sortingHelper = new SortingHelper();

/**
 * Sorts data
 */
export function sortData<T>(data: T[], options: SortOptions): T[] {
  return sortingHelper.sort(data, options);
}

/**
 * Parses sort options from request
 */
export function parseSortOptions(request: Request): SortOptions {
  return sortingHelper.parseOptions(request);
}

/**
 * Validates sort options
 */
export function validateSortOptions<T>(options: SortOptions, data: T[]): { valid: boolean; errors: string[] } {
  return sortingHelper.validateOptions(options, data);
}

/**
 * Generates sort parameter
 */
export function generateSortParam(options: SortOptions): string {
  return sortingHelper.generateSortParam(options);
}

export default sortingHelper;
