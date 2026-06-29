/**
 * A/B Testing Framework
 * Manages A/B tests and experiments
 */

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  variants: Variant[];
  trafficAllocation: number; // Percentage of traffic to include
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  targetAudience?: ExperimentTarget;
}

export interface Variant {
  id: string;
  name: string;
  description?: string;
  allocation: number; // Percentage of traffic for this variant
  config: Record<string, any>;
}

export interface ExperimentTarget {
  userIds?: string[];
  userSegments?: string[];
  countries?: string[];
  platforms?: string[];
}

export interface ExperimentResult {
  variantId: string;
  conversions: number;
  visitors: number;
  conversionRate: number;
  revenue?: number;
}

export interface ExperimentStats {
  totalVisitors: number;
  totalConversions: number;
  overallConversionRate: number;
  variantResults: ExperimentResult[];
  winner?: string;
  significance?: number;
}

class ABTestingFramework {
  private experiments = new Map<string, Experiment>();
  private userAssignments = new Map<string, Map<string, string>>(); // userId -> experimentId -> variantId
  private impressions = new Map<string, Map<string, number>>(); // experimentId -> variantId -> count

  /**
   * Creates an experiment
   */
  createExperiment(experiment: Omit<Experiment, 'status'>): Experiment {
    const newExperiment: Experiment = {
      ...experiment,
      status: 'draft',
    };

    // Validate allocation sums to 100
    const totalAllocation = experiment.variants.reduce((sum, v) => sum + v.allocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.1) {
      throw new Error('Variant allocations must sum to 100%');
    }

    this.experiments.set(experiment.id, newExperiment);
    return newExperiment;
  }

  /**
   * Gets an experiment
   */
  getExperiment(id: string): Experiment | undefined {
    return this.experiments.get(id);
  }

  /**
   * Starts an experiment
   */
  startExperiment(id: string): boolean {
    const experiment = this.experiments.get(id);
    if (!experiment) return false;

    experiment.status = 'running';
    experiment.startDate = new Date();
    return true;
  }

  /**
   * Pauses an experiment
   */
  pauseExperiment(id: string): boolean {
    const experiment = this.experiments.get(id);
    if (!experiment) return false;

    experiment.status = 'paused';
    return true;
  }

  /**
   * Completes an experiment
   */
  completeExperiment(id: string): boolean {
    const experiment = this.experiments.get(id);
    if (!experiment) return false;

    experiment.status = 'completed';
    experiment.endDate = new Date();
    return true;
  }

  /**
   * Assigns a user to a variant
   */
  assignVariant(experimentId: string, userId: string): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user is already assigned
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }

    const userAssignments = this.userAssignments.get(userId)!;
    if (userAssignments.has(experimentId)) {
      return userAssignments.get(experimentId)!;
    }

    // Check if user is in target audience
    if (!this.isUserInTargetAudience(userId, experiment)) {
      return null;
    }

    // Allocate variant based on traffic allocation
    if (Math.random() * 100 > experiment.trafficAllocation) {
      return null; // Not included in experiment
    }

    // Select variant based on allocation
    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedVariant: Variant | null = null;

    for (const variant of experiment.variants) {
      cumulative += variant.allocation;
      if (random <= cumulative) {
        selectedVariant = variant;
        break;
      }
    }

    if (!selectedVariant) {
      selectedVariant = experiment.variants[experiment.variants.length - 1];
    }

    userAssignments.set(experimentId, selectedVariant.id);

    // Track impression
    if (!this.impressions.has(experimentId)) {
      this.impressions.set(experimentId, new Map());
    }
    const impressions = this.impressions.get(experimentId)!;
    impressions.set(selectedVariant.id, (impressions.get(selectedVariant.id) || 0) + 1);

    return selectedVariant.id;
  }

  /**
   * Checks if user is in target audience
   */
  private isUserInTargetAudience(userId: string, experiment: Experiment): boolean {
    if (!experiment.targetAudience) return true;

    const target = experiment.targetAudience;

    // Check user IDs
    if (target.userIds && target.userIds.length > 0) {
      return target.userIds.includes(userId);
    }

    // Check segments (would need user segment data)
    if (target.userSegments && target.userSegments.length > 0) {
      // In a real implementation, check user segments
      return true;
    }

    // Check countries (would need user location data)
    if (target.countries && target.countries.length > 0) {
      // In a real implementation, check user country
      return true;
    }

    // Check platforms
    if (target.platforms && target.platforms.length > 0) {
      const platform = this.detectPlatform();
      return target.platforms.includes(platform);
    }

    return true;
  }

  /**
   * Detects user's platform
   */
  private detectPlatform(): string {
    if (typeof window === 'undefined') return 'server';

    const ua = navigator.userAgent;

    if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile';
    if (/Tablet/i.test(ua)) return 'tablet';
    if (/Windows/i.test(ua)) return 'windows';
    if (/Mac/i.test(ua)) return 'mac';
    if (/Linux/i.test(ua)) return 'linux';

    return 'desktop';
  }

  /**
   * Tracks a conversion
   */
  trackConversion(experimentId: string, variantId: string, value?: number): void {
    // In a real implementation, this would store conversion data
    console.log('Conversion tracked:', { experimentId, variantId, value });
  }

  /**
   * Gets experiment statistics
   */
  getStats(experimentId: string): ExperimentStats | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const impressions = this.impressions.get(experimentId) || new Map();
    const variantResults: ExperimentResult[] = [];

    let totalVisitors = 0;
    let totalConversions = 0;

    for (const variant of experiment.variants) {
      const visitors = impressions.get(variant.id) || 0;
      const conversions = 0; // Would be fetched from conversion tracking
      const conversionRate = visitors > 0 ? (conversions / visitors) * 100 : 0;

      totalVisitors += visitors;
      totalConversions += conversions;

      variantResults.push({
        variantId: variant.id,
        conversions,
        visitors,
        conversionRate,
      });
    }

    const overallConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;

    // Determine winner (highest conversion rate)
    const sortedResults = [...variantResults].sort((a, b) => b.conversionRate - a.conversionRate);
    const winner = sortedResults[0]?.variantId;

    return {
      totalVisitors,
      totalConversions,
      overallConversionRate,
      variantResults,
      winner,
    };
  }

  /**
   * Gets all experiments
   */
  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Gets running experiments
   */
  getRunningExperiments(): Experiment[] {
    return this.getAllExperiments().filter(e => e.status === 'running');
  }

  /**
   * Deletes an experiment
   */
  deleteExperiment(id: string): boolean {
    return this.experiments.delete(id);
  }
}

// Create singleton instance
const abTesting = new ABTestingFramework();

/**
 * Creates an experiment
 */
export function createABExperiment(experiment: Omit<Experiment, 'status'>): Experiment {
  return abTesting.createExperiment(experiment);
}

/**
 * Gets an experiment
 */
export function getABExperiment(id: string): Experiment | undefined {
  return abTesting.getExperiment(id);
}

/**
 * Starts an experiment
 */
export function startABExperiment(id: string): boolean {
  return abTesting.startExperiment(id);
}

/**
 * Pauses an experiment
 */
export function pauseABExperiment(id: string): boolean {
  return abTesting.pauseExperiment(id);
}

/**
 * Completes an experiment
 */
export function completeABExperiment(id: string): boolean {
  return abTesting.completeExperiment(id);
}

/**
 * Assigns a user to a variant
 */
export function assignABVariant(experimentId: string, userId: string): string | null {
  return abTesting.assignVariant(experimentId, userId);
}

/**
 * Tracks a conversion
 */
export function trackABConversion(experimentId: string, variantId: string, value?: number): void {
  abTesting.trackConversion(experimentId, variantId, value);
}

/**
 * Gets experiment statistics
 */
export function getABExperimentStats(experimentId: string): ExperimentStats | null {
  return abTesting.getStats(experimentId);
}

/**
 * Gets all experiments
 */
export function getAllABExperiments(): Experiment[] {
  return abTesting.getAllExperiments();
}

/**
 * Gets running experiments
 */
export function getRunningABExperiments(): Experiment[] {
  return abTesting.getRunningExperiments();
}

/**
 * Deletes an experiment
 */
export function deleteABExperiment(id: string): boolean {
  return abTesting.deleteExperiment(id);
}

export default abTesting;
