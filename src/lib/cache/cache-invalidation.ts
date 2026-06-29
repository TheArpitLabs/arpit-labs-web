/**
 * Cache invalidation utilities
 */

export interface CacheInvalidationRule {
  pattern: string;
  strategy: 'exact' | 'prefix' | 'regex' | 'tag';
  tags?: string[];
}

export interface CacheInvalidationConfig {
  rules: CacheInvalidationRule[];
  defaultTTL: number;
  enableTagBasedInvalidation: boolean;
}

class CacheInvalidationManager {
  private config: CacheInvalidationConfig;
  private cacheTags: Map<string, Set<string>> = new Map();

  constructor(config: Partial<CacheInvalidationConfig> = {}) {
    this.config = {
      rules: [],
      defaultTTL: 60000,
      enableTagBasedInvalidation: true,
      ...config,
    };
  }

  /**
   * Add invalidation rule
   */
  addRule(rule: CacheInvalidationRule): void {
    this.config.rules.push(rule);
  }

  /**
   * Remove invalidation rule
   */
  removeRule(pattern: string): void {
    this.config.rules = this.config.rules.filter(rule => rule.pattern !== pattern);
  }

  /**
   * Tag cache entry
   */
  tagCache(key: string, tags: string[]): void {
    if (!this.config.enableTagBasedInvalidation) return;

    tags.forEach(tag => {
      if (!this.cacheTags.has(tag)) {
        this.cacheTags.set(tag, new Set());
      }
      this.cacheTags.get(tag)!.add(key);
    });
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateByPattern(pattern: string): string[] {
    const invalidated: string[] = [];

    this.config.rules.forEach(rule => {
      if (this.matchesPattern(pattern, rule)) {
        const keys = this.getKeysByRule(rule);
        keys.forEach(key => {
          this.invalidateKey(key);
          invalidated.push(key);
        });
      }
    });

    return invalidated;
  }

  /**
   * Invalidate cache by tag
   */
  invalidateByTag(tag: string): string[] {
    const invalidated: string[] = [];
    const keys = this.cacheTags.get(tag);

    if (keys) {
      keys.forEach(key => {
        this.invalidateKey(key);
        invalidated.push(key);
      });
      this.cacheTags.delete(tag);
    }

    return invalidated;
  }

  /**
   * Invalidate cache by tags
   */
  invalidateByTags(tags: string[]): string[] {
    const invalidated: string[] = [];

    tags.forEach(tag => {
      const keys = this.cacheTags.get(tag);
      if (keys) {
        keys.forEach(key => {
          this.invalidateKey(key);
          invalidated.push(key);
        });
        this.cacheTags.delete(tag);
      }
    });

    return [...new Set(invalidated)];
  }

  /**
   * Invalidate specific key
   */
  invalidateKey(key: string): void {
    localStorage.removeItem(key);
    
    // Remove from all tags
    this.cacheTags.forEach((keys, tag) => {
      keys.delete(key);
      if (keys.size === 0) {
        this.cacheTags.delete(tag);
      }
    });
  }

  /**
   * Invalidate all cache
   */
  invalidateAll(): string[] {
    const keys: string[] = [];

    // Get all cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
        this.invalidateKey(key);
      }
    }

    // Clear tags
    this.cacheTags.clear();

    return keys;
  }

  /**
   * Invalidate cache by time
   */
  invalidateByTime(olderThan: Date): string[] {
    const cutoff = olderThan.getTime();
    const invalidated: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.timestamp && item.timestamp < cutoff) {
            this.invalidateKey(key);
            invalidated.push(key);
          }
        } catch {
          // Skip invalid items
        }
      }
    }

    return invalidated;
  }

  /**
   * Check if pattern matches rule
   */
  private matchesPattern(pattern: string, rule: CacheInvalidationRule): boolean {
    switch (rule.strategy) {
      case 'exact':
        return pattern === rule.pattern;
      case 'prefix':
        return pattern.startsWith(rule.pattern);
      case 'regex':
        return new RegExp(rule.pattern).test(pattern);
      case 'tag':
        return rule.tags?.some(tag => this.cacheTags.has(tag)) || false;
      default:
        return false;
    }
  }

  /**
   * Get keys by rule
   */
  private getKeysByRule(rule: CacheInvalidationRule): string[] {
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && this.matchesPattern(key, rule)) {
        keys.push(key);
      }
    }

    return keys;
  }

  /**
   * Get cache statistics
   */
  getStatistics(): {
    totalKeys: number;
    totalTags: number;
    keysByTag: Record<string, number>;
  } {
    const keysByTag: Record<string, number> = {};

    this.cacheTags.forEach((keys, tag) => {
      keysByTag[tag] = keys.size;
    });

    return {
      totalKeys: localStorage.length,
      totalTags: this.cacheTags.size,
      keysByTag,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CacheInvalidationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): CacheInvalidationConfig {
    return { ...this.config };
  }
}

// Create singleton instance
const cacheInvalidationManager = new CacheInvalidationManager();

export { cacheInvalidationManager };

/**
 * Invalidate cache by pattern
 */
export function invalidateCache(pattern: string): string[] {
  return cacheInvalidationManager.invalidateByPattern(pattern);
}

/**
 * Invalidate cache by tag
 */
export function invalidateCacheByTag(tag: string): string[] {
  return cacheInvalidationManager.invalidateByTag(tag);
}

/**
 * Invalidate cache by tags
 */
export function invalidateCacheByTags(tags: string[]): string[] {
  return cacheInvalidationManager.invalidateByTags(tags);
}

/**
 * Invalidate specific cache key
 */
export function invalidateCacheKey(key: string): void {
  cacheInvalidationManager.invalidateKey(key);
}

/**
 * Invalidate all cache
 */
export function invalidateAllCache(): string[] {
  return cacheInvalidationManager.invalidateAll();
}

/**
 * Tag cache entry
 */
export function tagCacheEntry(key: string, tags: string[]): void {
  cacheInvalidationManager.tagCache(key, tags);
}

/**
 * Add invalidation rule
 */
export function addInvalidationRule(rule: CacheInvalidationRule): void {
  cacheInvalidationManager.addRule(rule);
}

/**
 * Get cache statistics
 */
export function getCacheStatistics() {
  return cacheInvalidationManager.getStatistics();
}

/**
 * Common invalidation rules
 */
export const commonInvalidationRules = {
  userRelated: {
    pattern: '/api/user',
    strategy: 'prefix' as const,
    tags: ['user'],
  },
  projectRelated: {
    pattern: '/api/projects',
    strategy: 'prefix' as const,
    tags: ['projects'],
  },
  authRelated: {
    pattern: '/api/auth',
    strategy: 'prefix' as const,
    tags: ['auth'],
  },
  adminRelated: {
    pattern: '/api/admin',
    strategy: 'prefix' as const,
    tags: ['admin'],
  },
};

/**
 * Setup common invalidation rules
 */
export function setupCommonInvalidationRules(): void {
  Object.values(commonInvalidationRules).forEach(rule => {
    cacheInvalidationManager.addRule(rule);
  });
}

/**
 * Invalidate user-related cache
 */
export function invalidateUserCache(userId: string): string[] {
  return cacheInvalidationManager.invalidateByTags(['user', `user-${userId}`]);
}

/**
 * Invalidate project-related cache
 */
export function invalidateProjectCache(projectId: string): string[] {
  return cacheInvalidationManager.invalidateByTags(['projects', `project-${projectId}`]);
}

/**
 * Invalidate auth-related cache
 */
export function invalidateAuthCache(): string[] {
  return cacheInvalidationManager.invalidateByTags(['auth']);
}

/**
 * Invalidate admin-related cache
 */
export function invalidateAdminCache(): string[] {
  return cacheInvalidationManager.invalidateByTags(['admin']);
}
