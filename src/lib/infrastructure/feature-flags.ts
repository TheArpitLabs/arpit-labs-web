/**
 * Feature Flag System
 * Manages feature flags for gradual rollout and A/B testing
 */

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;
  allowedUsers?: string[];
  allowedRoles?: string[];
  metadata?: Record<string, any>;
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();

  constructor() {
    // Initialize with default flags
    this.initializeDefaultFlags();
  }

  /**
   * Initialize default feature flags
   */
  private initializeDefaultFlags(): void {
    // E8 - Trend Intelligence Engine
    this.setFlag({
      name: 'trend_intelligence_engine',
      enabled: false,
      description: 'E8 - Trend Intelligence Engine',
      rolloutPercentage: 0,
    });

    // E9 - Contributor Intelligence Engine
    this.setFlag({
      name: 'contributor_intelligence_engine',
      enabled: false,
      description: 'E9 - Contributor Intelligence Engine',
      rolloutPercentage: 0,
    });

    // E10 - Collaboration Marketplace
    this.setFlag({
      name: 'collaboration_marketplace',
      enabled: false,
      description: 'E10 - Collaboration Marketplace',
      rolloutPercentage: 0,
    });

    // E11 - Autonomous Discovery Engine
    this.setFlag({
      name: 'autonomous_discovery_engine',
      enabled: false,
      description: 'E11 - Autonomous Discovery Engine',
      rolloutPercentage: 0,
    });

    // E12 - Research Intelligence Engine
    this.setFlag({
      name: 'research_intelligence_engine',
      enabled: false,
      description: 'E12 - Research Intelligence Engine',
      rolloutPercentage: 0,
    });

    // E13 - Dataset Intelligence Engine
    this.setFlag({
      name: 'dataset_intelligence_engine',
      enabled: false,
      description: 'E13 - Dataset Intelligence Engine',
      rolloutPercentage: 0,
    });

    // E14 - Organization Intelligence Engine
    this.setFlag({
      name: 'organization_intelligence_engine',
      enabled: false,
      description: 'E14 - Organization Intelligence Engine',
      rolloutPercentage: 0,
    });

    // E15 - Agentic AI System
    this.setFlag({
      name: 'agentic_ai_system',
      enabled: false,
      description: 'E15 - Agentic AI System',
      rolloutPercentage: 0,
    });
  }

  /**
   * Set a feature flag
   */
  setFlag(flag: FeatureFlag): void {
    this.flags.set(flag.name, flag);
  }

  /**
   * Get a feature flag
   */
  getFlag(name: string): FeatureFlag | null {
    return this.flags.get(name) || null;
  }

  /**
   * Check if a feature is enabled for a user
   */
  isEnabled(name: string, userId?: string, userRoles?: string[]): boolean {
    const flag = this.flags.get(name);
    
    if (!flag) {
      return false;
    }

    // If explicitly disabled
    if (!flag.enabled) {
      return false;
    }

    // Check user whitelist
    if (flag.allowedUsers && userId && flag.allowedUsers.includes(userId)) {
      return true;
    }

    // Check role whitelist
    if (flag.allowedRoles && userRoles) {
      const hasRole = flag.allowedRoles.some(role => userRoles.includes(role));
      if (hasRole) {
        return true;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      if (flag.rolloutPercentage >= 100) {
        return true;
      }
      
      if (flag.rolloutPercentage <= 0) {
        return false;
      }

      // Hash-based consistent rollout
      const hash = this.hashString(userId || name);
      const percentage = (hash % 100);
      return percentage < flag.rolloutPercentage;
    }

    return flag.enabled;
  }

  /**
   * Enable a feature flag
   */
  enable(name: string): void {
    const flag = this.flags.get(name);
    if (flag) {
      flag.enabled = true;
      this.flags.set(name, flag);
    }
  }

  /**
   * Disable a feature flag
   */
  disable(name: string): void {
    const flag = this.flags.get(name);
    if (flag) {
      flag.enabled = false;
      this.flags.set(name, flag);
    }
  }

  /**
   * Set rollout percentage
   */
  setRollout(name: string, percentage: number): void {
    const flag = this.flags.get(name);
    if (flag) {
      flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
      this.flags.set(name, flag);
    }
  }

  /**
   * Add user to whitelist
   */
  addUser(name: string, userId: string): void {
    const flag = this.flags.get(name);
    if (flag) {
      flag.allowedUsers = flag.allowedUsers || [];
      if (!flag.allowedUsers.includes(userId)) {
        flag.allowedUsers.push(userId);
      }
      this.flags.set(name, flag);
    }
  }

  /**
   * Remove user from whitelist
   */
  removeUser(name: string, userId: string): void {
    const flag = this.flags.get(name);
    if (flag && flag.allowedUsers) {
      flag.allowedUsers = flag.allowedUsers.filter(id => id !== userId);
      this.flags.set(name, flag);
    }
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get enabled flags
   */
  getEnabledFlags(): FeatureFlag[] {
    return Array.from(this.flags.values()).filter(f => f.enabled);
  }

  /**
   * Delete a flag
   */
  deleteFlag(name: string): void {
    this.flags.delete(name);
  }

  /**
   * Hash string for consistent rollout
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Export flags as JSON
   */
  export(): Record<string, FeatureFlag> {
    const exportData: Record<string, FeatureFlag> = {};
    for (const [name, flag] of this.flags.entries()) {
      exportData[name] = flag;
    }
    return exportData;
  }

  /**
   * Import flags from JSON
   */
  import(flags: Record<string, FeatureFlag>): void {
    for (const [name, flag] of Object.entries(flags)) {
      this.flags.set(name, flag);
    }
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager();

// Helper function to check flags
export function isFeatureEnabled(featureName: string, userId?: string, userRoles?: string[]): boolean {
  return featureFlags.isEnabled(featureName, userId, userRoles);
}

// React hook for feature flags
export function useFeatureFlag(featureName: string, userId?: string, userRoles?: string[]): boolean {
  return featureFlags.isEnabled(featureName, userId, userRoles);
}
