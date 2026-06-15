/**
 * Quality Scoring Engine Types
 * 
 * Defines the interfaces and types for quality assessment and ranking
 */

export interface QualityMetrics {
  id: string;
  contentId: string;
  contentType: string;
  completenessScore: number;
  documentationScore: number;
  activityScore: number;
  popularityScore: number;
  maintenanceScore: number;
  originalityScore: number;
  relevanceScore: number;
  overallScore: number;
  factors: Record<string, {
    value: number;
    weight: number;
    reason: string;
  }>;
  calculatedAt: Date;
  algorithmVersion: string;
}

export interface QualityThresholds {
  id: string;
  contentType: string;
  minOverallScore: number;
  autoPublishThreshold: number;
  manualReviewThreshold: number;
  rejectThreshold: number;
  factorWeights: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface QualityResult {
  overallScore: number;
  passed: boolean;
  recommendation: 'auto_publish' | 'manual_review' | 'reject';
  factors: Record<string, {
    value: number;
    weight: number;
    weightedScore: number;
    reason: string;
  }>;
  comparison: {
    threshold: number;
    difference: number;
  };
}

export interface QualityConfig {
  enableCompletenessCheck: boolean;
  enableDocumentationCheck: boolean;
  enableActivityCheck: boolean;
  enablePopularityCheck: boolean;
  enableMaintenanceCheck: boolean;
  enableOriginalityCheck: boolean;
  enableRelevanceCheck: boolean;
  customWeights?: Record<string, number>;
}
