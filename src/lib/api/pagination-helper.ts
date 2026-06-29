/**
 * API Pagination Helper
 * Handles pagination for API responses
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    nextCursor?: string;
    previousCursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

class PaginationHelper {
  private defaultLimit = 20;
  private maxLimit = 100;

  /**
   * Paginates an array of data
   */
  paginate<T>(
    data: T[],
    options: PaginationOptions
  ): PaginatedResult<T> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || this.defaultLimit, this.maxLimit);
    const offset = options.offset || ((page - 1) * limit);

    const total = data.length;
    const totalPages = Math.ceil(total / limit);

    const paginatedData = data.slice(offset, offset + limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
        nextCursor: page < totalPages ? this.encodeCursor(page + 1, limit) : undefined,
        previousCursor: page > 1 ? this.encodeCursor(page - 1, limit) : undefined,
      },
    };
  }

  /**
   * Paginates using cursor-based pagination
   */
  paginateByCursor<T>(
    data: T[],
    options: PaginationOptions & { cursor?: string }
  ): CursorPaginationResult<T> {
    const limit = Math.min(options.limit || this.defaultLimit, this.maxLimit);
    let startIndex = 0;

    if (options.cursor) {
      startIndex = this.decodeCursor(options.cursor).offset;
    }

    const paginatedData = data.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < data.length;

    return {
      data: paginatedData,
      pagination: {
        nextCursor: hasMore ? this.encodeCursor(startIndex + limit, limit) : undefined,
        previousCursor: startIndex > 0 ? this.encodeCursor(Math.max(0, startIndex - limit), limit) : undefined,
        hasMore,
        limit,
      },
    };
  }

  /**
   * Encodes cursor
   */
  private encodeCursor(page: number, limit: number): string {
    const offset = (page - 1) * limit;
    return Buffer.from(JSON.stringify({ offset, limit })).toString('base64');
  }

  /**
   * Decodes cursor
   */
  private decodeCursor(cursor: string): { offset: number; limit: number } {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      return { offset: 0, limit: this.defaultLimit };
    }
  }

  /**
   * Parses pagination options from request
   */
  parseOptions(request: Request): PaginationOptions {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || String(this.defaultLimit));
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const cursor = url.searchParams.get('cursor') || undefined;

    return {
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? this.defaultLimit : Math.min(limit, this.maxLimit),
      offset: isNaN(offset) ? 0 : offset,
      cursor,
    };
  }

  /**
   * Generates pagination links
   */
  generateLinks(baseUrl: string, pagination: PaginatedResult<any>['pagination']): Record<string, string> {
    const links: Record<string, string> = {};

    links.self = `${baseUrl}?page=${pagination.page}&limit=${pagination.limit}`;

    if (pagination.hasPrevious) {
      links.previous = `${baseUrl}?page=${pagination.page - 1}&limit=${pagination.limit}`;
    }

    if (pagination.hasNext) {
      links.next = `${baseUrl}?page=${pagination.page + 1}&limit=${pagination.limit}`;
    }

    links.first = `${baseUrl}?page=1&limit=${pagination.limit}`;
    links.last = `${baseUrl}?page=${pagination.totalPages}&limit=${pagination.limit}`;

    return links;
  }

  /**
   * Calculates total pages
   */
  calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }

  /**
   * Validates pagination options
   */
  validateOptions(options: PaginationOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.page !== undefined && options.page < 1) {
      errors.push('Page must be greater than 0');
    }

    if (options.limit !== undefined && options.limit < 1) {
      errors.push('Limit must be greater than 0');
    }

    if (options.limit !== undefined && options.limit > this.maxLimit) {
      errors.push(`Limit cannot exceed ${this.maxLimit}`);
    }

    if (options.offset !== undefined && options.offset < 0) {
      errors.push('Offset cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sets default limit
   */
  setDefaultLimit(limit: number): void {
    this.defaultLimit = limit;
  }

  /**
   * Sets max limit
   */
  setMaxLimit(limit: number): void {
    this.maxLimit = limit;
  }
}

// Create singleton instance
const paginationHelper = new PaginationHelper();

/**
 * Paginates data
 */
export function paginate<T>(data: T[], options: PaginationOptions): PaginatedResult<T> {
  return paginationHelper.paginate(data, options);
}

/**
 * Paginates by cursor
 */
export function paginateByCursor<T>(
  data: T[],
  options: PaginationOptions & { cursor?: string }
): CursorPaginationResult<T> {
  return paginationHelper.paginateByCursor(data, options);
}

/**
 * Parses pagination options from request
 */
export function parsePaginationOptions(request: Request): PaginationOptions {
  return paginationHelper.parseOptions(request);
}

/**
 * Generates pagination links
 */
export function generatePaginationLinks(
  baseUrl: string,
  pagination: PaginatedResult<any>['pagination']
): Record<string, string> {
  return paginationHelper.generateLinks(baseUrl, pagination);
}

/**
 * Calculates total pages
 */
export function calculateTotalPages(total: number, limit: number): number {
  return paginationHelper.calculateTotalPages(total, limit);
}

/**
 * Validates pagination options
 */
export function validatePaginationOptions(options: PaginationOptions): { valid: boolean; errors: string[] } {
  return paginationHelper.validateOptions(options);
}

export default paginationHelper;
