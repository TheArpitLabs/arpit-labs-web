/**
 * Feature Flag System
 * Manages feature flags for gradual rollouts and A/B testing
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  conditions?: FeatureFlagCondition[];
  metadata?: Record<string, any>;
}

export interface FeatureFlagCondition {
  type: 'user_id' | 'email' | 'domain' | 'custom';
  operator: 'equals' | 'contains' | 'regex' | 'in';
  value: string | string[];
}

export interface FeatureFlagContext {
  userId?: string;
  email?: string;
  domain?: string;
  customAttributes?: Record<string, any>;
}

/**
 * Feature flag manager
 */
class FeatureFlagManager {
  private flags = new Map<string, FeatureFlag>();
  private overrideFlags = new Map<string, boolean>();

  /**
   * Sets a feature flag
   */
  setFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
  }

  /**
   * Gets a feature flag
   */
  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  /**
   * Checks if a flag is enabled for a given context
   */
  isEnabled(key: string, context?: FeatureFlagContext): boolean {
    // Check override first
    if (this.overrideFlags.has(key)) {
      return this.overrideFlags.get(key)!;
    }

    const flag = this.flags.get(key);
    if (!flag) {
      return false;
    }

    // If flag is disabled globally
    if (!flag.enabled) {
      return false;
    }

    // If no conditions, it's enabled for everyone
    if (!flag.conditions || flag.conditions.length === 0) {
      return true;
    }

    // Check conditions
    return this.checkConditions(flag.conditions, context);
  }

  /**
   * Checks if conditions match the context
   */
  private checkConditions(
    conditions: FeatureFlagCondition[],
    context?: FeatureFlagContext
  ): boolean {
    if (!context) {
      return false;
    }

    return conditions.every((condition) => {
      const contextValue = this.getContextValue(condition.type, context);
      if (contextValue === undefined) {
        return false;
      }

      return this.evaluateCondition(contextValue, condition);
    });
  }

  /**
   * Gets context value based on condition type
   */
  private getContextValue(
    type: FeatureFlagCondition['type'],
    context: FeatureFlagContext
  ): string | undefined {
    switch (type) {
      case 'user_id':
        return context.userId;
      case 'email':
        return context.email;
      case 'domain':
        return context.domain;
      case 'custom':
        return context.customAttributes
          ? JSON.stringify(context.customAttributes)
          : undefined;
      default:
        return undefined;
    }
  }

  /**
   * Evaluates a single condition
   */
  private evaluateCondition(
    contextValue: string,
    condition: FeatureFlagCondition
  ): boolean {
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return contextValue === conditionValue;
      case 'contains':
        return contextValue.includes(conditionValue as string);
      case 'regex':
        return new RegExp(conditionValue as string).test(contextValue);
      case 'in':
        return Array.isArray(conditionValue)
          ? conditionValue.includes(contextValue)
          : false;
      default:
        return false;
    }
  }

  /**
   * Checks if a flag is enabled based on rollout percentage
   */
  isRolledOut(key: string, context?: FeatureFlagContext): boolean {
    const flag = this.flags.get(key);
    if (!flag || !flag.rolloutPercentage) {
      return this.isEnabled(key, context);
    }

    // Generate consistent hash for user
    const hash = this.generateHash(key, context?.userId || 'anonymous');
    const percentage = (hash % 100) + 1;

    return percentage <= flag.rolloutPercentage;
  }

  /**
   * Generates a consistent hash for rollout
   */
  private generateHash(key: string, identifier: string): number {
    const combined = `${key}-${identifier}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Overrides a flag (useful for testing)
   */
  overrideFlag(key: string, enabled: boolean): void {
    this.overrideFlags.set(key, enabled);
  }

  /**
   * Clears all overrides
   */
  clearOverrides(): void {
    this.overrideFlags.clear();
  }

  /**
   * Gets all flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Removes a flag
   */
  removeFlag(key: string): void {
    this.flags.delete(key);
    this.overrideFlags.delete(key);
  }

  /**
   * Bulk sets flags
   */
  setFlags(flags: FeatureFlag[]): void {
    flags.forEach((flag) => this.setFlag(flag));
  }
}

// Create singleton instance
const featureFlagManager = new FeatureFlagManager();

/**
 * Initialize feature flags from environment or config
 */
export function initializeFeatureFlags(flags: FeatureFlag[]): void {
  featureFlagManager.setFlags(flags);
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(
  key: string,
  context?: FeatureFlagContext
): boolean {
  return featureFlagManager.isEnabled(key, context);
}

/**
 * Check if a feature is rolled out for a user
 */
export function isFeatureRolledOut(
  key: string,
  context?: FeatureFlagContext
): boolean {
  return featureFlagManager.isRolledOut(key, context);
}

/**
 * Override a feature flag (for testing)
 */
export function overrideFeatureFlag(key: string, enabled: boolean): void {
  featureFlagManager.overrideFlag(key, enabled);
}

/**
 * Clear all feature flag overrides
 */
export function clearFeatureFlagOverrides(): void {
  featureFlagManager.clearOverrides();
}

/**
 * Get all feature flags
 */
export function getAllFeatureFlags(): FeatureFlag[] {
  return featureFlagManager.getAllFlags();
}

/**
 * React hook for feature flags
 */
export function useFeatureFlag(
  key: string,
  context?: FeatureFlagContext
): boolean {
  // This would be implemented as a React hook in a real application
  // For now, return the value directly
  return isFeatureEnabled(key, context);
}

/**
 * Default feature flags
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: 'new_ui',
    enabled: false,
    description: 'Enable new user interface',
    rolloutPercentage: 20,
  },
  {
    key: 'advanced_search',
    enabled: true,
    description: 'Enable advanced search functionality',
  },
  {
    key: 'beta_features',
    enabled: false,
    description: 'Enable beta features for specific users',
    conditions: [
      {
        type: 'email',
        operator: 'contains',
        value: '@arpitlabs.com',
      },
    ],
  },
];
