/**
 * SQL injection prevention utilities
 */

/**
 * Sanitize SQL identifier (table name, column name)
 */
export function sanitizeSqlIdentifier(identifier: string): string {
  // Remove any non-alphanumeric characters except underscores
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Escape SQL string literal
 */
export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Validate SQL identifier
 */
export function validateSqlIdentifier(identifier: string): boolean {
  // Only allow alphanumeric characters and underscores
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}

/**
 * Validate SQL table name
 */
export function validateTableName(tableName: string): boolean {
  return validateSqlIdentifier(tableName);
}

/**
 * Validate SQL column name
 */
export function validateColumnName(columnName: string): boolean {
  return validateSqlIdentifier(columnName);
}

/**
 * Sanitize SQL ORDER BY clause
 */
export function sanitizeOrderBy(orderBy: string, allowedColumns: string[]): string {
  const sanitized = sanitizeSqlIdentifier(orderBy);
  
  if (!allowedColumns.includes(sanitized)) {
    throw new Error(`Invalid ORDER BY column: ${orderBy}`);
  }

  return sanitized;
}

/**
 * Sanitize SQL LIMIT clause
 */
export function sanitizeLimit(limit: number | string): number {
  const numLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;
  
  if (isNaN(numLimit) || numLimit < 0 || numLimit > 10000) {
    throw new Error(`Invalid LIMIT value: ${limit}`);
  }

  return numLimit;
}

/**
 * Sanitize SQL OFFSET clause
 */
export function sanitizeOffset(offset: number | string): number {
  const numOffset = typeof offset === 'string' ? parseInt(offset, 10) : offset;
  
  if (isNaN(numOffset) || numOffset < 0) {
    throw new Error(`Invalid OFFSET value: ${offset}`);
  }

  return numOffset;
}

/**
 * Validate SQL query pattern
 */
export function validateQueryPattern(query: string, allowedPatterns: RegExp[]): boolean {
  return allowedPatterns.some(pattern => pattern.test(query));
}

/**
 * Detect dangerous SQL patterns
 */
export function detectDangerousSqlPatterns(query: string): string[] {
  const dangerousPatterns = [
    /--/i, // SQL comment
    /;/i, // Statement separator
    /\bunion\b.*\bselect\b/i, // UNION SELECT
    /\bdrop\b/i, // DROP
    /\bdelete\b.*\bfrom\b/i, // DELETE
    /\binsert\b.*\binto\b/i, // INSERT
    /\bupdate\b.*\bset\b/i, // UPDATE
    /\bexec\b/i, // EXEC
    /\bexecute\b/i, // EXECUTE
    /\bxp_\w+/i, // Extended stored procedures
    /\bsp_\w+/i, // System stored procedures
    /'(\s*(OR|AND)\s*[^=]*=)/i, // SQL injection pattern
    /1=1/i, // Common injection
    /1\s*=\s*1/i, // Common injection
  ];

  const detected: string[] = [];

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(query)) {
      detected.push(pattern.toString());
    }
  });

  return detected;
}

/**
 * Sanitize user input for SQL
 */
export function sanitizeForSql(input: any): any {
  if (typeof input === 'string') {
    return escapeSqlString(input);
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeForSql(item));
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[sanitizeSqlIdentifier(key)] = sanitizeForSql(input[key]);
      }
    }
    return sanitized;
  }

  return input;
}

/**
 * Validate SQL parameters
 */
export function validateSqlParams(params: Record<string, any>, schema: Record<string, 'string' | 'number' | 'boolean' | 'date'>): boolean {
  for (const [key, type] of Object.entries(schema)) {
    const value = params[key];

    if (value === undefined || value === null) {
      continue; // Allow null/undefined
    }

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return false;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return false;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return false;
        }
        break;
      case 'date':
        if (!(value instanceof Date) && typeof value !== 'string') {
          return false;
        }
        break;
    }
  }

  return true;
}

/**
 * Build safe SQL query with parameterized values
 */
export function buildSafeQuery(template: string, params: Record<string, any>): string {
  let query = template;

  for (const [key, value] of Object.entries(params)) {
    const placeholder = `:${key}`;
    const sanitized = sanitizeForSql(value);
    
    if (typeof sanitized === 'string') {
      query = query.replace(placeholder, `'${sanitized}'`);
    } else {
      query = query.replace(placeholder, String(sanitized));
    }
  }

  return query;
}

/**
 * Validate SQL query against whitelist
 */
export function validateQueryWhitelist(query: string, whitelist: string[]): boolean {
  return whitelist.some(allowed => {
    const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ');
    const normalizedAllowed = allowed.toLowerCase().replace(/\s+/g, ' ');
    return normalizedQuery.startsWith(normalizedAllowed);
  });
}

/**
 * SQL query sanitizer
 */
export class SqlQuerySanitizer {
  private allowedColumns: Set<string> = new Set();
  private allowedTables: Set<string> = new Set();
  private allowedOperations: Set<string> = new Set(['SELECT', 'INSERT', 'UPDATE', 'DELETE']);

  constructor(options: {
    allowedColumns?: string[];
    allowedTables?: string[];
    allowedOperations?: string[];
  } = {}) {
    options.allowedColumns?.forEach(col => this.allowedColumns.add(col));
    options.allowedTables?.forEach(table => this.allowedTables.add(table));
    options.allowedOperations?.forEach(op => this.allowedOperations.add(op));
  }

  /**
   * Sanitize query
   */
  sanitize(query: string): string {
    // Detect dangerous patterns
    const dangerousPatterns = detectDangerousSqlPatterns(query);
    if (dangerousPatterns.length > 0) {
      throw new Error(`Dangerous SQL patterns detected: ${dangerousPatterns.join(', ')}`);
    }

    // Validate operation
    const operation = query.match(/^\s*(\w+)/)?.[1]?.toUpperCase();
    if (operation && !this.allowedOperations.has(operation)) {
      throw new Error(`Operation ${operation} is not allowed`);
    }

    return query;
  }

  /**
   * Add allowed column
   */
  addAllowedColumn(column: string): void {
    this.allowedColumns.add(column);
  }

  /**
   * Add allowed table
   */
  addAllowedTable(table: string): void {
    this.allowedTables.add(table);
  }

  /**
   * Add allowed operation
   */
  addAllowedOperation(operation: string): void {
    this.allowedOperations.add(operation.toUpperCase());
  }

  /**
   * Validate column
   */
  validateColumn(column: string): boolean {
    return this.allowedColumns.has(column);
  }

  /**
   * Validate table
   */
  validateTable(table: string): boolean {
    return this.allowedTables.has(table);
  }
}

/**
 * Create default SQL sanitizer
 */
export function createDefaultSqlSanitizer(): SqlQuerySanitizer {
  return new SqlQuerySanitizer();
}

/**
 * Check for SQL injection in user input
 */
export function checkSqlInjection(input: string): boolean {
  const injectionPatterns = [
    /'(\s*(OR|AND)\s*[^=]*=)/i,
    /1=1/i,
    /1\s*=\s*1/i,
    /--/i,
    /;/i,
    /\bunion\b.*\bselect\b/i,
    /\bexec\b/i,
    /\bxp_\w+/i,
  ];

  return injectionPatterns.some(pattern => pattern.test(input));
}

/**
 * Safe parameter binding helper
 */
export class ParameterBinder {
  private params: Map<string, any> = new Map();

  /**
   * Bind parameter
   */
  bind(key: string, value: any): void {
    this.params.set(key, value);
  }

  /**
   * Get bound parameters
   */
  getParams(): Record<string, any> {
    return Object.fromEntries(this.params);
  }

  /**
   * Clear all parameters
   */
  clear(): void {
    this.params.clear();
  }

  /**
   * Build parameterized query
   */
  buildQuery(template: string): string {
    return buildSafeQuery(template, this.getParams());
  }
}

/**
 * Create parameter binder
 */
export function createParameterBinder(): ParameterBinder {
  return new ParameterBinder();
}
