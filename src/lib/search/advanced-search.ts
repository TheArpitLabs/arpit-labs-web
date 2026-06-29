/**
 * Advanced Search Functionality
 * Provides advanced search with filters, fuzzy matching, and ranking
 */

export interface SearchOptions {
  fuzzy?: boolean;
  fuzzyThreshold?: number;
  caseSensitive?: boolean;
  includeFields?: string[];
  excludeFields?: string[];
  maxResults?: number;
  highlightMatches?: boolean;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: string[];
  highlighted?: Record<string, string>;
}

export interface FilterConfig {
  field: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
  options?: string[];
}

export interface SearchFilter {
  field: string;
  operator: string;
  value: any;
}

class AdvancedSearch<T> {
  private index: Map<string, T[]> = new Map();
  private items: T[] = [];

  /**
   * Indexes items for search
   */
  indexItems(items: T[], fields: (keyof T)[]): void {
    this.items = items;
    this.index.clear();

    for (const item of items) {
      for (const field of fields) {
        const value = String(item[field] || '').toLowerCase();
        const words = value.split(/\s+/);

        for (const word of words) {
          if (word.length > 2) {
            if (!this.index.has(word)) {
              this.index.set(word, []);
            }
            this.index.get(word)!.push(item);
          }
        }
      }
    }
  }

  /**
   * Searches indexed items
   */
  search(
    query: string,
    options: SearchOptions = {}
  ): SearchResult<T>[] {
    const {
      fuzzy = true,
      fuzzyThreshold = 0.6,
      caseSensitive = false,
      maxResults = 50,
      highlightMatches = false,
    } = options;

    const searchQuery = caseSensitive ? query : query.toLowerCase();
    const results = new Map<T, SearchResult<T>>();

    // Exact matches
    const exactMatches = this.index.get(searchQuery) || [];
    for (const item of exactMatches) {
      results.set(item, {
        item,
        score: 1.0,
        matches: [searchQuery],
      });
    }

    // Partial matches
    for (const [word, items] of this.index.entries()) {
      if (word.includes(searchQuery) || searchQuery.includes(word)) {
        for (const item of items) {
          const existing = results.get(item);
          const score = existing ? existing.score + 0.5 : 0.5;
          results.set(item, {
            item,
            score,
            matches: existing ? [...existing.matches, word] : [word],
          });
        }
      }
    }

    // Fuzzy matches
    if (fuzzy) {
      for (const [word, items] of this.index.entries()) {
        const similarity = this.calculateSimilarity(searchQuery, word);
        if (similarity >= fuzzyThreshold) {
          for (const item of items) {
            const existing = results.get(item);
            const score = existing ? existing.score + similarity * 0.3 : similarity * 0.3;
            results.set(item, {
              item,
              score,
              matches: existing ? [...existing.matches, word] : [word],
            });
          }
        }
      }
    }

    // Sort by score and limit results
    const sorted = Array.from(results.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    // Highlight matches if requested
    if (highlightMatches) {
      return sorted.map((result) => ({
        ...result,
        highlighted: this.highlightMatches(result.item, result.matches, caseSensitive),
      }));
    }

    return sorted;
  }

  /**
   * Calculates similarity between two strings (Levenshtein distance)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculates Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Highlights matches in text
   */
  private highlightMatches(
    item: T,
    matches: string[],
    caseSensitive: boolean
  ): Record<string, string> {
    const highlighted: Record<string, string> = {};

    for (const key in item) {
      const value = String(item[key]);
      let highlightedValue = value;

      for (const match of matches) {
        const regex = new RegExp(
          `(${this.escapeRegex(match)})`,
          caseSensitive ? 'g' : 'gi'
        );
        highlightedValue = highlightedValue.replace(regex, '<mark>$1</mark>');
      }

      highlighted[key] = highlightedValue;
    }

    return highlighted;
  }

  /**
   * Escapes regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Applies filters to results
   */
  filter(items: T[], filters: SearchFilter[]): T[] {
    return items.filter((item) => {
      return filters.every((filter) => {
        const value = item[filter.field as keyof T];
        return this.applyFilter(value, filter.operator, filter.value);
      });
    });
  }

  /**
   * Applies a single filter
   */
  private applyFilter(value: any, operator: string, filterValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === filterValue;
      case 'contains':
        return String(value).includes(String(filterValue));
      case 'startsWith':
        return String(value).startsWith(String(filterValue));
      case 'endsWith':
        return String(value).endsWith(String(filterValue));
      case 'gt':
        return value > filterValue;
      case 'lt':
        return value < filterValue;
      case 'gte':
        return value >= filterValue;
      case 'lte':
        return value <= filterValue;
      case 'between':
        return value >= filterValue[0] && value <= filterValue[1];
      default:
        return true;
    }
  }

  /**
   * Sorts results
   */
  sort(results: T[], sortBy: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...results].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Paginates results
   */
  paginate(results: T[], page: number, pageSize: number): {
    items: T[];
    totalPages: number;
    currentPage: number;
  } {
    const totalPages = Math.ceil(results.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = results.slice(startIndex, endIndex);

    return {
      items,
      totalPages,
      currentPage: page,
    };
  }
}

// Create singleton instance
const searchEngine = new AdvancedSearch<any>();

/**
 * Indexes items for search
 */
export function indexSearchItems<T>(items: T[], fields: (keyof T)[]): void {
  searchEngine.indexItems(items, fields);
}

/**
 * Performs search
 */
export function performSearch<T>(
  query: string,
  options?: SearchOptions
): SearchResult<T>[] {
  return searchEngine.search(query, options);
}

/**
 * Applies filters
 */
export function applySearchFilters<T>(items: T[], filters: SearchFilter[]): T[] {
  return searchEngine.filter(items, filters);
}

/**
 * Sorts results
 */
export function sortSearchResults<T>(
  results: T[],
  sortBy: keyof T,
  order?: 'asc' | 'desc'
): T[] {
  return searchEngine.sort(results, sortBy, order);
}

/**
 * Paginates results
 */
export function paginateSearchResults<T>(
  results: T[],
  page: number,
  pageSize: number
) {
  return searchEngine.paginate(results, page, pageSize);
}

export default searchEngine;
