/**
 * AI Enrichment Engine Types
 * 
 * Defines the interfaces and types for AI-powered content enrichment
 */

export type EnrichmentTaskType = 'analyze' | 'summarize' | 'categorize' | 'extract_entities' | 'generate_tags';

export type EnrichmentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface EnrichmentTask {
  id: string;
  contentId: string;
  taskType: EnrichmentTaskType;
  status: EnrichmentStatus;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown>;
  modelUsed: string;
  tokensUsed: number;
  processingTimeMs: number;
  errorMessage: string | null;
  queuedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface ExtractedEntity {
  id: string;
  contentId: string;
  contentType: string;
  entityType: 'person' | 'organization' | 'technology' | 'concept' | 'location';
  entityName: string;
  entityValue: string | null;
  confidence: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface AIGeneratedTag {
  id: string;
  contentId: string;
  contentType: string;
  tag: string;
  confidence: number;
  category: string | null;
  createdAt: Date;
}

export interface EnrichmentResult {
  success: boolean;
  summary: string | null;
  tags: string[];
  categories: string[];
  entities: ExtractedEntity[];
  qualityScore: number | null;
  analysis: Record<string, unknown>;
  processingTime: number;
  tokensUsed: number;
}

export interface EnrichmentConfig {
  enableSummarization: boolean;
  enableTagGeneration: boolean;
  enableEntityExtraction: boolean;
  enableCategorization: boolean;
  enableQualityScoring: boolean;
  model: string;
  maxTokens: number;
  temperature: number;
}
