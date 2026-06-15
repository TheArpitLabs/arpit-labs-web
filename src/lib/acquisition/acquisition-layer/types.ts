/**
 * Acquisition Layer Types
 * 
 * Defines the interfaces and types for content acquisition
 */

import { ContentProvider, ContentType } from '../source-discovery/types';

export type AcquisitionStatus = 
  | 'pending' 
  | 'fetching' 
  | 'fetched' 
  | 'analyzing' 
  | 'enriching' 
  | 'quality_check' 
  | 'moderating' 
  | 'approved' 
  | 'rejected' 
  | 'published' 
  | 'failed';

export interface AcquisitionQueueItem {
  id: string;
  sourceId: string | null;
  discoveredId: string | null;
  provider: ContentProvider;
  externalId: string;
  sourceUrl: string;
  canonicalUrl: string | null;
  repositoryId: string | null;
  contentType: ContentType;
  title: string;
  description: string;
  rawContent: string | null;
  extractedContent: string | null;
  author: string | null;
  authorUrl: string | null;
  organization: string | null;
  organizationUrl: string | null;
  screenshotUrl: string | null;
  coverImage: string | null;
  screenshots: string[];
  metadata: Record<string, unknown>;
  tags: string[];
  categories: string[];
  contentHash: string | null;
  similarityScore: number | null;
  duplicateOfId: string | null;
  status: AcquisitionStatus;
  priority: number;
  retryCount: number;
  maxRetries: number;
  aiAnalysis: Record<string, unknown> | null;
  aiSummary: string | null;
  aiTags: string[];
  aiCategories: string[];
  aiQualityScore: number | null;
  qualityScore: number | null;
  qualityFactors: Record<string, unknown> | null;
  complianceStatus: string;
  licenseType: string | null;
  licenseUrl: string | null;
  complianceNotes: string | null;
  moderationStatus: string;
  moderatorId: string | null;
  moderationNotes: string | null;
  moderatedAt: Date | null;
  publishedContentId: string | null;
  publishedContentType: string | null;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  errorStack: string | null;
  lastErrorAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

export interface AcquisitionConfig {
  maxRetries?: number;
  timeout?: number;
  batchSize?: number;
  concurrency?: number;
  enableDeduplication?: boolean;
  enableComplianceCheck?: boolean;
  enableAIEnrichment?: boolean;
  enableQualityScoring?: boolean;
  enableModeration?: boolean;
}

export interface AcquisitionResult {
  success: boolean;
  itemId: string;
  status: AcquisitionStatus;
  data?: Record<string, unknown>;
  error?: string;
  metadata: {
    processingTime: number;
    steps: string[];
  };
}

export interface BatchAcquisitionResult {
  success: boolean;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  results: AcquisitionResult[];
  errors: Array<{
    itemId: string;
    error: string;
  }>;
  metadata: {
    totalProcessingTime: number;
    averageProcessingTime: number;
  };
}

export interface ContentValidator {
  validate(content: Record<string, unknown>): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

export interface ContentNormalizer {
  normalize(content: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface ContentExtractor {
  extract(content: Record<string, unknown>): Promise<{
    extractedContent: string;
    metadata: Record<string, unknown>;
  }>;
}
