/**
 * Acquisition Processor
 * 
 * Main processor that orchestrates content acquisition
 */

import { AcquisitionQueueItem, AcquisitionConfig, AcquisitionResult, BatchAcquisitionResult } from './types';
import { ContentValidatorFactory } from './content-validator';
import { ContentNormalizerFactory } from './content-normalizer';
import { ContentExtractorFactory } from './content-extractor';
import { getDiscoveryManager } from '../source-discovery/discovery-manager';
import { supabaseServer } from '@/lib/supabase/server';
import { ContentType, ContentProvider } from '../source-discovery/types';
import { logger } from '@/lib/logger';

export class AcquisitionProcessor {
  private config: Required<AcquisitionConfig>;

  constructor(config: AcquisitionConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? 30000,
      batchSize: config.batchSize ?? 10,
      concurrency: config.concurrency ?? 5,
      enableDeduplication: config.enableDeduplication ?? true,
      enableComplianceCheck: config.enableComplianceCheck ?? true,
      enableAIEnrichment: config.enableAIEnrichment ?? true,
      enableQualityScoring: config.enableQualityScoring ?? true,
      enableModeration: config.enableModeration ?? false,
    };
  }

  /**
   * Process a single acquisition item
   */
  async processItem(itemId: string): Promise<AcquisitionResult> {
    const startTime = Date.now();
    const steps: string[] = [];

    try {
      // Load item from queue
      const item = await this.loadQueueItem(itemId);
      if (!item) {
        throw new Error(`Item not found: ${itemId}`);
      }

      steps.push('loaded_item');

      // Update status to fetching
      await this.updateItemStatus(itemId, 'fetching');
      steps.push('status_fetching');

      // Fetch detailed content from source
      const detailedContent = await this.fetchDetailedContent(item);
      steps.push('fetched_content');

      // Validate content
      const validator = ContentValidatorFactory.getValidator(item.contentType);
      const validationResult = await validator.validate(detailedContent);
      
      if (!validationResult.valid) {
        await this.updateItemStatus(itemId, 'failed', validationResult.errors.join(', '));
        return {
          success: false,
          itemId,
          status: 'failed',
          error: validationResult.errors.join(', '),
          metadata: {
            processingTime: Date.now() - startTime,
            steps,
          },
        };
      }

      steps.push('validated_content');

      // Normalize content
      const normalizer = ContentNormalizerFactory.getNormalizer(item.provider);
      const normalizedContent = await normalizer.normalize(detailedContent);
      steps.push('normalized_content');

      // Extract content
      const extractor = ContentExtractorFactory.getExtractor(item.contentType, item.provider);
      const extracted = await extractor.extract(normalizedContent);
      steps.push('extracted_content');

      // Update item with processed data
      await this.updateItemWithData(itemId, {
        title: normalizedContent.title,
        description: normalizedContent.description,
        rawContent: normalizedContent.rawContent,
        extractedContent: extracted.extractedContent,
        author: normalizedContent.author,
        authorUrl: normalizedContent.authorUrl,
        organization: normalizedContent.organization,
        organizationUrl: normalizedContent.organizationUrl,
        metadata: {
          ...(normalizedContent.metadata as Record<string, unknown>),
          ...(extracted.metadata),
        },
        tags: normalizedContent.tags,
        categories: normalizedContent.categories,
        repositoryUrl: normalizedContent.repositoryUrl,
      });

      // Update status to fetched
      await this.updateItemStatus(itemId, 'fetched');
      steps.push('status_fetched');

      // Run deduplication if enabled
      if (this.config.enableDeduplication) {
        await this.runDeduplication(itemId);
        steps.push('deduplication');
      }

      // Run compliance check if enabled
      if (this.config.enableComplianceCheck) {
        await this.runComplianceCheck(itemId);
        steps.push('compliance_check');
      }

      // Run AI enrichment if enabled
      if (this.config.enableAIEnrichment) {
        await this.runAIEnrichment(itemId);
        steps.push('ai_enrichment');
      }

      // Run quality scoring if enabled
      if (this.config.enableQualityScoring) {
        await this.runQualityScoring(itemId);
        steps.push('quality_scoring');
      }

      // Update status to analyzing
      await this.updateItemStatus(itemId, 'analyzing');
      steps.push('status_analyzing');

      return {
        success: true,
        itemId,
        status: 'analyzing',
        data: normalizedContent,
        metadata: {
          processingTime: Date.now() - startTime,
          steps,
        },
      };

    } catch (error) {
      await this.updateItemStatus(itemId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        itemId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime,
          steps,
        },
      };
    }
  }

  /**
   * Process multiple items in batch
   */
  async processBatch(itemIds: string[]): Promise<BatchAcquisitionResult> {
    const startTime = Date.now();
    const results: AcquisitionResult[] = [];
    const errors: Array<{ itemId: string; error: string }> = [];

    // Process items in batches
    for (let i = 0; i < itemIds.length; i += this.config.batchSize) {
      const batch = itemIds.slice(i, i + this.config.batchSize);
      
      // Process batch concurrently
      const batchResults = await Promise.all(
        batch.map(itemId => this.processItem(itemId))
      );

      results.push(...batchResults);

      // Collect errors
      for (const result of batchResults) {
        if (!result.success && result.error) {
          errors.push({ itemId: result.itemId, error: result.error });
        }
      }
    }

    const successfulItems = results.filter(r => r.success).length;
    const failedItems = results.filter(r => !r.success).length;

    return {
      success: failedItems === 0,
      totalItems: itemIds.length,
      successfulItems,
      failedItems,
      results,
      errors,
      metadata: {
        totalProcessingTime: Date.now() - startTime,
        averageProcessingTime: (Date.now() - startTime) / itemIds.length,
      },
    };
  }

  /**
   * Process all pending items
   */
  async processPendingItems(): Promise<BatchAcquisitionResult> {
    const pendingItems = await this.loadPendingItems();
    const itemIds = pendingItems.map(item => item.id);
    
    return this.processBatch(itemIds);
  }

  /**
   * Load queue item from database
   */
  private async loadQueueItem(itemId: string): Promise<AcquisitionQueueItem | null> {
    const { data, error } = await supabaseServer
      .from('content_acquisition_queue')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) {
      throw new Error(`Failed to load queue item: ${error.message}`);
    }

    return data as AcquisitionQueueItem;
  }

  /**
   * Load pending items from database
   */
  private async loadPendingItems(): Promise<AcquisitionQueueItem[]> {
    const { data, error } = await supabaseServer
      .from('content_acquisition_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .limit(this.config.batchSize * 10);

    if (error) {
      throw new Error(`Failed to load pending items: ${error.message}`);
    }

    return data as AcquisitionQueueItem[];
  }

  /**
   * Fetch detailed content from source
   */
  private async fetchDetailedContent(item: AcquisitionQueueItem): Promise<Record<string, unknown>> {
    const discoveryManager = getDiscoveryManager();
    const connector = discoveryManager.getConnector(item.provider);

    if (!connector) {
      throw new Error(`No connector found for provider: ${item.provider}`);
    }

    return await connector.fetchContent(item.externalId);
  }

  /**
   * Update item status
   */
  private async updateItemStatus(itemId: string, status: string, errorMessage?: string): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
      updateData.last_error_at = new Date().toISOString();
    }

    if (status === 'fetching') {
      updateData.started_at = new Date().toISOString();
    }

    if (status === 'analyzing' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabaseServer
      .from('content_acquisition_queue')
      .update(updateData)
      .eq('id', itemId);

    if (error) {
      throw new Error(`Failed to update item status: ${error.message}`);
    }
  }

  /**
   * Update item with processed data
   */
  private async updateItemWithData(itemId: string, data: Record<string, unknown>): Promise<void> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.rawContent) updateData.raw_content = data.rawContent;
    if (data.extractedContent) updateData.extracted_content = data.extractedContent;
    if (data.author) updateData.author = data.author;
    if (data.authorUrl) updateData.author_url = data.authorUrl;
    if (data.organization) updateData.organization = data.organization;
    if (data.organizationUrl) updateData.organization_url = data.organizationUrl;
    if (data.metadata) updateData.metadata = data.metadata;
    if (data.tags) updateData.tags = data.tags;
    if (data.categories) updateData.categories = data.categories;
    if (data.repositoryUrl) updateData.repository_url = data.repositoryUrl;

    const { error } = await supabaseServer
      .from('content_acquisition_queue')
      .update(updateData)
      .eq('id', itemId);

    if (error) {
      throw new Error(`Failed to update item data: ${error.message}`);
    }
  }

  /**
   * Run deduplication check
   */
  private async runDeduplication(itemId: string): Promise<void> {
    // This will be implemented in the Deduplication Engine
    // For now, just update status
    logger.debug(`Running deduplication for item ${itemId}`);
  }

  /**
   * Run compliance check
   */
  private async runComplianceCheck(itemId: string): Promise<void> {
    // This will be implemented in the Compliance Engine
    // For now, just update status
    logger.debug(`Running compliance check for item ${itemId}`);
  }

  /**
   * Run AI enrichment
   */
  private async runAIEnrichment(itemId: string): Promise<void> {
    // This will be implemented in the AI Enrichment Engine
    // For now, just update status
    logger.debug(`Running AI enrichment for item ${itemId}`);
  }

  /**
   * Run quality scoring
   */
  private async runQualityScoring(itemId: string): Promise<void> {
    // This will be implemented in the Quality Scoring Engine
    // For now, just update status
    logger.debug(`Running quality scoring for item ${itemId}`);
  }
}

// Singleton instance
let acquisitionProcessorInstance: AcquisitionProcessor | null = null;

export function getAcquisitionProcessor(config?: AcquisitionConfig): AcquisitionProcessor {
  if (!acquisitionProcessorInstance || config) {
    acquisitionProcessorInstance = new AcquisitionProcessor(config);
  }
  return acquisitionProcessorInstance;
}
