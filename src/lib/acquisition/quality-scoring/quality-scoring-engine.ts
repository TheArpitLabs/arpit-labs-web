/**
 * Quality Scoring Engine
 * 
 * Handles multi-factor quality assessment and ranking
 */

import { QualityResult, QualityConfig, QualityThresholds } from './types';
import { supabaseServer } from '@/lib/supabase/server';

export class QualityScoringEngine {
  private config: QualityConfig;

  constructor(config: Partial<QualityConfig> = {}) {
    this.config = {
      enableCompletenessCheck: true,
      enableDocumentationCheck: true,
      enableActivityCheck: true,
      enablePopularityCheck: true,
      enableMaintenanceCheck: true,
      enableOriginalityCheck: true,
      enableRelevanceCheck: true,
      customWeights: config.customWeights,
      ...config,
    };
  }

  /**
   * Calculate quality score for content
   */
  async calculateQualityScore(contentId: string, content: {
    contentType: string;
    title: string;
    description: string;
    rawContent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<QualityResult> {
    // Get quality thresholds for content type
    const thresholds = await this.getQualityThresholds(content.contentType);

    // Calculate individual factor scores
    const factors: Record<string, {
      value: number;
      weight: number;
      weightedScore: number;
      reason: string;
    }> = {};

    let totalWeightedScore = 0;
    let totalWeight = 0;

    // Completeness score
    if (this.config.enableCompletenessCheck) {
      const completeness = this.calculateCompleteness(content);
      const weight = this.config.customWeights?.completeness ?? thresholds.factorWeights.completeness ?? 0.2;
      factors.completeness = {
        value: completeness.value,
        weight,
        weightedScore: completeness.value * weight,
        reason: completeness.reason,
      };
      totalWeightedScore += completeness.value * weight;
      totalWeight += weight;
    }

    // Documentation score
    if (this.config.enableDocumentationCheck) {
      const documentation = this.calculateDocumentation(content);
      const weight = this.config.customWeights?.documentation ?? thresholds.factorWeights.documentation ?? 0.15;
      factors.documentation = {
        value: documentation.value,
        weight,
        weightedScore: documentation.value * weight,
        reason: documentation.reason,
      };
      totalWeightedScore += documentation.value * weight;
      totalWeight += weight;
    }

    // Activity score
    if (this.config.enableActivityCheck) {
      const activity = this.calculateActivity(content);
      const weight = this.config.customWeights?.activity ?? thresholds.factorWeights.activity ?? 0.2;
      factors.activity = {
        value: activity.value,
        weight,
        weightedScore: activity.value * weight,
        reason: activity.reason,
      };
      totalWeightedScore += activity.value * weight;
      totalWeight += weight;
    }

    // Popularity score
    if (this.config.enablePopularityCheck) {
      const popularity = this.calculatePopularity(content);
      const weight = this.config.customWeights?.popularity ?? thresholds.factorWeights.popularity ?? 0.15;
      factors.popularity = {
        value: popularity.value,
        weight,
        weightedScore: popularity.value * weight,
        reason: popularity.reason,
      };
      totalWeightedScore += popularity.value * weight;
      totalWeight += weight;
    }

    // Maintenance score
    if (this.config.enableMaintenanceCheck) {
      const maintenance = this.calculateMaintenance(content);
      const weight = this.config.customWeights?.maintenance ?? thresholds.factorWeights.maintenance ?? 0.15;
      factors.maintenance = {
        value: maintenance.value,
        weight,
        weightedScore: maintenance.value * weight,
        reason: maintenance.reason,
      };
      totalWeightedScore += maintenance.value * weight;
      totalWeight += weight;
    }

    // Originality score
    if (this.config.enableOriginalityCheck) {
      const originality = this.calculateOriginality(content);
      const weight = this.config.customWeights?.originality ?? thresholds.factorWeights.originality ?? 0.1;
      factors.originality = {
        value: originality.value,
        weight,
        weightedScore: originality.value * weight,
        reason: originality.reason,
      };
      totalWeightedScore += originality.value * weight;
      totalWeight += weight;
    }

    // Relevance score
    if (this.config.enableRelevanceCheck) {
      const relevance = this.calculateRelevance(content);
      const weight = this.config.customWeights?.relevance ?? thresholds.factorWeights.relevance ?? 0.05;
      factors.relevance = {
        value: relevance.value,
        weight,
        weightedScore: relevance.value * weight,
        reason: relevance.reason,
      };
      totalWeightedScore += relevance.value * weight;
      totalWeight += weight;
    }

    // Calculate overall score
    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // Determine recommendation
    let recommendation: 'auto_publish' | 'manual_review' | 'reject';
    if (overallScore >= thresholds.autoPublishThreshold) {
      recommendation = 'auto_publish';
    } else if (overallScore >= thresholds.manualReviewThreshold) {
      recommendation = 'manual_review';
    } else {
      recommendation = 'reject';
    }

    const result: QualityResult = {
      overallScore,
      passed: overallScore >= thresholds.minOverallScore,
      recommendation,
      factors,
      comparison: {
        threshold: thresholds.minOverallScore,
        difference: overallScore - thresholds.minOverallScore,
      },
    };

    // Store quality metrics in database
    await this.storeQualityMetrics(contentId, content.contentType, result);

    return result;
  }

  /**
   * Calculate completeness score
   */
  private calculateCompleteness(content: {
    title: string;
    description: string;
    rawContent?: string;
    metadata?: Record<string, unknown>;
  }): { value: number; reason: string } {
    let score = 0;
    const missing: string[] = [];

    if (content.title && content.title.length >= 5) {
      score += 0.3;
    } else {
      missing.push('title');
    }

    if (content.description && content.description.length >= 20) {
      score += 0.3;
    } else {
      missing.push('description');
    }

    if (content.rawContent && content.rawContent.length >= 100) {
      score += 0.4;
    } else {
      missing.push('content');
    }

    const reason = missing.length > 0 
      ? `Missing: ${missing.join(', ')}`
      : 'All required fields present and complete';

    return { value: score, reason };
  }

  /**
   * Calculate documentation score
   */
  private calculateDocumentation(content: {
    rawContent?: string;
    metadata?: Record<string, unknown>;
  }): { value: number; reason: string } {
    let score = 0;
    const docs: string[] = [];

    if (content.rawContent && content.rawContent.length > 500) {
      score += 0.4;
      docs.push('substantial content');
    }

    const metadata = content.metadata || {};
    if (metadata.hasReadme || metadata.readme) {
      score += 0.3;
      docs.push('README');
    }

    if (metadata.hasDocumentation || metadata.documentation) {
      score += 0.3;
      docs.push('documentation');
    }

    const reason = docs.length > 0 
      ? `Has: ${docs.join(', ')}`
      : 'Limited documentation';

    return { value: score, reason };
  }

  /**
   * Calculate activity score
   */
  private calculateActivity(content: {
    metadata?: Record<string, unknown>;
  }): { value: number; reason: string } {
    let score = 0;
    const metadata = content.metadata || {};

    const stars = typeof metadata.stars === 'number' ? metadata.stars : 0;
    const forks = typeof metadata.forks === 'number' ? metadata.forks : 0;
    const watchers = typeof metadata.watchers === 'number' ? metadata.watchers : 0;

    if (stars > 100) {
      score += 0.4;
    } else if (stars > 10) {
      score += 0.2;
    }

    if (forks > 50) {
      score += 0.3;
    } else if (forks > 10) {
      score += 0.15;
    }

    if (watchers > 50) {
      score += 0.3;
    } else if (watchers > 10) {
      score += 0.15;
    }

    const reason = `Stars: ${stars}, Forks: ${forks}, Watchers: ${watchers}`;

    return { value: Math.min(score, 1), reason };
  }

  /**
   * Calculate popularity score
   */
  private calculatePopularity(content: {
    metadata?: Record<string, unknown>;
  }): { value: number; reason: string } {
    let score = 0;
    const metadata = content.metadata || {};

    const stars = typeof metadata.stars === 'number' ? metadata.stars : 0;
    const downloads = typeof metadata.totalDownloads === 'number' ? metadata.totalDownloads : 0;
    const votes = typeof metadata.totalVotes === 'number' ? metadata.totalVotes : 0;

    // Normalize and combine popularity metrics
    const normalizedStars = Math.min(stars / 1000, 1);
    const normalizedDownloads = Math.min(downloads / 10000, 1);
    const normalizedVotes = Math.min(votes / 100, 1);

    score = (normalizedStars * 0.5) + (normalizedDownloads * 0.3) + (normalizedVotes * 0.2);

    const reason = `Stars: ${stars}, Downloads: ${downloads}, Votes: ${votes}`;

    return { value: score, reason };
  }

  /**
   * Calculate maintenance score
   */
  private calculateMaintenance(content: {
    metadata?: Record<string, unknown>;
  }): { value: number; reason: string } {
    let score = 0;
    const metadata = content.metadata || {};

    const updatedAt = metadata.updatedAt || metadata.lastUpdated || metadata.pushedAt;
    const hasIssues = typeof metadata.openIssues === 'number' ? metadata.openIssues : 0;
    const hasLicense = metadata.license || metadata.licenseName;

    if (updatedAt) {
      const updateDate = new Date(updatedAt as string);
      const daysSinceUpdate = (Date.now() - updateDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate < 30) {
        score += 0.5;
      } else if (daysSinceUpdate < 180) {
        score += 0.3;
      } else if (daysSinceUpdate < 365) {
        score += 0.1;
      }
    }

    if (hasIssues < 10) {
      score += 0.3;
    } else if (hasIssues < 50) {
      score += 0.15;
    }

    if (hasLicense) {
      score += 0.2;
    }

    const reason = `Recent updates: ${!!updatedAt}, Open issues: ${hasIssues}, Has license: ${!!hasLicense}`;

    return { value: Math.min(score, 1), reason };
  }

  /**
   * Calculate originality score
   */
  private calculateOriginality(content: {
    title: string;
    description: string;
    metadata?: Record<string, unknown>;
  }): { value: number; reason: string } {
    let score = 0.5; // Base score
    const metadata = content.metadata || {};

    // Check for unique features
    if (metadata.topics && Array.isArray(metadata.topics) && metadata.topics.length > 3) {
      score += 0.2;
    }

    if (metadata.languages && Array.isArray(metadata.languages) && metadata.languages.length > 1) {
      score += 0.15;
    }

    // Check for common patterns that might indicate lack of originality
    const commonPatterns = ['tutorial', 'example', 'demo', 'test', 'sample'];
    const titleLower = content.title.toLowerCase();
    const descLower = content.description.toLowerCase();

    const hasCommonPattern = commonPatterns.some(pattern => 
      titleLower.includes(pattern) || descLower.includes(pattern)
    );

    if (hasCommonPattern) {
      score -= 0.2;
    }

    const reason = score > 0.5 ? 'Shows originality' : 'May lack originality';

    return { value: Math.max(0, Math.min(score, 1)), reason };
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(content: {
    contentType: string;
    tags?: string[];
    categories?: string[];
  }): { value: number; reason: string } {
    let score = 0;

    if (content.tags && content.tags.length > 0) {
      score += 0.4;
    }

    if (content.categories && content.categories.length > 0) {
      score += 0.3;
    }

    if (content.contentType) {
      score += 0.3;
    }

    const reason = `Tags: ${content.tags?.length || 0}, Categories: ${content.categories?.length || 0}`;

    return { value: score, reason };
  }

  /**
   * Get quality thresholds for content type
   */
  private async getQualityThresholds(contentType: string): Promise<QualityThresholds> {
    const { data, error } = await supabaseServer
      .from('quality_thresholds')
      .select('*')
      .eq('content_type', contentType)
      .single();

    if (error || !data) {
      // Return default thresholds
      return {
        id: '',
        contentType,
        minOverallScore: 0.5,
        autoPublishThreshold: 0.8,
        manualReviewThreshold: 0.5,
        rejectThreshold: 0.3,
        factorWeights: {
          completeness: 0.2,
          documentation: 0.15,
          activity: 0.2,
          popularity: 0.15,
          maintenance: 0.15,
          originality: 0.1,
          relevance: 0.05,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return {
      id: data.id,
      contentType: data.content_type,
      minOverallScore: data.min_overall_score,
      autoPublishThreshold: data.auto_publish_threshold,
      manualReviewThreshold: data.manual_review_threshold,
      rejectThreshold: data.reject_threshold,
      factorWeights: data.factor_weights as Record<string, number>,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Store quality metrics in database
   */
  private async storeQualityMetrics(
    contentId: string,
    contentType: string,
    result: QualityResult
  ): Promise<void> {
    const factors: Record<string, {
      value: number;
      weight: number;
      reason: string;
    }> = {};

    for (const [key, factor] of Object.entries(result.factors)) {
      factors[key] = {
        value: factor.value,
        weight: factor.weight,
        reason: factor.reason,
      };
    }

    const { error } = await supabaseServer
      .from('quality_metrics')
      .upsert({
        content_id: contentId,
        content_type: contentType,
        completeness_score: result.factors.completeness?.value || 0,
        documentation_score: result.factors.documentation?.value || 0,
        activity_score: result.factors.activity?.value || 0,
        popularity_score: result.factors.popularity?.value || 0,
        maintenance_score: result.factors.maintenance?.value || 0,
        originality_score: result.factors.originality?.value || 0,
        relevance_score: result.factors.relevance?.value || 0,
        overall_score: result.overallScore,
        factors,
        calculated_at: new Date().toISOString(),
        algorithm_version: '1.0',
      }, {
        onConflict: 'content_id,content_type',
      });

    if (error) {
      console.error(`Failed to store quality metrics: ${error.message}`);
    }

    // Update queue item with quality score
    await supabaseServer
      .from('content_acquisition_queue')
      .update({
        quality_score: result.overallScore,
        quality_factors: factors,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contentId);
  }

  /**
   * Process quality scoring for a queue item
   */
  async processQualityScoring(queueItemId: string): Promise<QualityResult> {
    // Load queue item
    const { data: item, error: itemError } = await supabaseServer
      .from('content_acquisition_queue')
      .select('*')
      .eq('id', queueItemId)
      .single();

    if (itemError || !item) {
      throw new Error(`Failed to load queue item: ${itemError?.message}`);
    }

    // Calculate quality score
    const result = await this.calculateQualityScore(queueItemId, {
      contentType: item.content_type,
      title: item.title,
      description: item.description,
      rawContent: item.raw_content || undefined,
      metadata: item.metadata as Record<string, unknown> | undefined,
    });

    return result;
  }
}

// Singleton instance
let qualityScoringEngineInstance: QualityScoringEngine | null = null;

export function getQualityScoringEngine(config?: Partial<QualityConfig>): QualityScoringEngine {
  if (!qualityScoringEngineInstance || config) {
    qualityScoringEngineInstance = new QualityScoringEngine(config);
  }
  return qualityScoringEngineInstance;
}
