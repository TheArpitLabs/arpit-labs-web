/**
 * AI Enrichment Engine
 * 
 * Handles AI-powered content analysis, tagging, categorization, and summarization
 */

import { EnrichmentResult, EnrichmentConfig, EnrichmentTaskType, ExtractedEntity } from './types';
import { supabaseServer } from '@/lib/supabase/server';

export class AIEnrichmentEngine {
  private config: EnrichmentConfig;

  constructor(config: Partial<EnrichmentConfig> = {}) {
    this.config = {
      enableSummarization: true,
      enableTagGeneration: true,
      enableEntityExtraction: true,
      enableCategorization: true,
      enableQualityScoring: true,
      model: 'gpt-4',
      maxTokens: 1000,
      temperature: 0.7,
      ...config,
    };
  }

  /**
   * Run AI enrichment on content
   */
  async runEnrichment(contentId: string, content: {
    title: string;
    description: string;
    rawContent?: string;
    contentType: string;
    metadata?: Record<string, unknown>;
  }): Promise<EnrichmentResult> {
    const startTime = Date.now();
    let totalTokensUsed = 0;

    const result: EnrichmentResult = {
      success: true,
      summary: null,
      tags: [],
      categories: [],
      entities: [],
      qualityScore: null,
      analysis: {},
      processingTime: 0,
      tokensUsed: 0,
    };

    try {
      // Generate summary
      if (this.config.enableSummarization) {
        const summaryResult = await this.generateSummary(content);
        result.summary = summaryResult.summary;
        result.analysis.summary = summaryResult.analysis;
        totalTokensUsed += summaryResult.tokensUsed;
      }

      // Generate tags
      if (this.config.enableTagGeneration) {
        const tagsResult = await this.generateTags(content);
        result.tags = tagsResult.tags;
        result.analysis.tags = tagsResult.analysis;
        totalTokensUsed += tagsResult.tokensUsed;
      }

      // Extract entities
      if (this.config.enableEntityExtraction) {
        const entitiesResult = await this.extractEntities(content);
        result.entities = entitiesResult.entities;
        result.analysis.entities = entitiesResult.analysis;
        totalTokensUsed += entitiesResult.tokensUsed;
      }

      // Categorize content
      if (this.config.enableCategorization) {
        const categoriesResult = await this.categorizeContent(content);
        result.categories = categoriesResult.categories;
        result.analysis.categories = categoriesResult.analysis;
        totalTokensUsed += categoriesResult.tokensUsed;
      }

      // Score quality
      if (this.config.enableQualityScoring) {
        const qualityResult = await this.scoreQuality(content);
        result.qualityScore = qualityResult.score;
        result.analysis.quality = qualityResult.analysis;
        totalTokensUsed += qualityResult.tokensUsed;
      }

      result.processingTime = Date.now() - startTime;
      result.tokensUsed = totalTokensUsed;

      // Store enrichment results in database
      await this.storeEnrichmentResults(contentId, content.contentType, result);

      return result;

    } catch (error) {
      result.success = false;
      result.processingTime = Date.now() - startTime;
      
      throw error;
    }
  }

  /**
   * Generate summary using AI
   */
  private async generateSummary(content: {
    title: string;
    description: string;
    rawContent?: string;
  }): Promise<{ summary: string; analysis: Record<string, unknown>; tokensUsed: number }> {
    // In production, this would call an AI API like OpenAI
    // For now, we'll use a simple rule-based approach
    
    const textToSummarize = [
      content.title,
      content.description,
      content.rawContent || '',
    ].join('\n').substring(0, 2000); // Limit to 2000 characters

    // Simple extractive summary (first few sentences)
    const sentences = textToSummarize.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const summary = sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '.' : '');

    return {
      summary,
      analysis: {
        method: 'extractive',
        sentenceCount: sentences.length,
        summaryLength: summary.length,
      },
      tokensUsed: Math.ceil(textToSummarize.length / 4), // Rough estimate
    };
  }

  /**
   * Generate tags using AI
   */
  private async generateTags(content: {
    title: string;
    description: string;
    rawContent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ tags: string[]; analysis: Record<string, unknown>; tokensUsed: number }> {
    const tags: string[] = [];
    const textToAnalyze = [
      content.title,
      content.description,
      content.rawContent || '',
    ].join(' ').toLowerCase();

    // Extract technology-related keywords
    const techKeywords = [
      'javascript', 'typescript', 'python', 'java', 'rust', 'go', 'react', 'vue', 'angular',
      'node', 'django', 'flask', 'spring', 'machine learning', 'ai', 'deep learning',
      'blockchain', 'web3', 'crypto', 'database', 'sql', 'nosql', 'mongodb', 'postgresql',
      'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'devops', 'ci/cd', 'testing',
      'frontend', 'backend', 'fullstack', 'mobile', 'ios', 'android', 'api', 'rest',
      'graphql', 'microservices', 'serverless', 'cloud', 'security', 'performance'
    ];

    for (const keyword of techKeywords) {
      if (textToAnalyze.includes(keyword)) {
        tags.push(keyword);
      }
    }

    // Extract tags from metadata
    const metadata = content.metadata || {};
    if (metadata.languages && Array.isArray(metadata.languages)) {
      tags.push(...metadata.languages.map((l: string) => l.toLowerCase()));
    }
    if (metadata.topics && Array.isArray(metadata.topics)) {
      tags.push(...metadata.topics.map((t: string) => t.toLowerCase()));
    }

    // Remove duplicates and limit to 10 tags
    const uniqueTags = [...new Set(tags)].slice(0, 10);

    return {
      tags: uniqueTags,
      analysis: {
        method: 'keyword_extraction',
        totalKeywordsFound: tags.length,
        uniqueTags: uniqueTags.length,
      },
      tokensUsed: Math.ceil(textToAnalyze.length / 4),
    };
  }

  /**
   * Extract entities using AI
   */
  private async extractEntities(content: {
    title: string;
    description: string;
    rawContent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ entities: ExtractedEntity[]; analysis: Record<string, unknown>; tokensUsed: number }> {
    const entities: ExtractedEntity[] = [];
    const textToAnalyze = [
      content.title,
      content.description,
      content.rawContent || '',
    ].join(' ');

    // Extract organizations (simple pattern matching)
    const orgPatterns = [
      /([A-Z][a-z]+(?: [A-Z][a-z]+)+) (?:Inc|Corp|LLC|Ltd|Company)/g,
      /(?:by|from|at) ([A-Z][a-z]+(?: [A-Z][a-z]+)+)/g,
    ];

    for (const pattern of orgPatterns) {
      let match;
      while ((match = pattern.exec(textToAnalyze)) !== null) {
        entities.push({
          id: crypto.randomUUID(),
          contentId: '', // Will be set when storing
          contentType: '',
          entityType: 'organization',
          entityName: match[1],
          entityValue: match[1],
          confidence: 0.7,
          metadata: { extractionMethod: 'pattern_matching' },
          createdAt: new Date(),
        });
      }
    }

    // Extract technologies from metadata
    const metadata = content.metadata || {};
    if (metadata.languages && Array.isArray(metadata.languages)) {
      for (const lang of metadata.languages) {
        entities.push({
          id: crypto.randomUUID(),
          contentId: '',
          contentType: '',
          entityType: 'technology',
          entityName: lang,
          entityValue: lang,
          confidence: 0.9,
          metadata: { source: 'metadata' },
          createdAt: new Date(),
        });
      }
    }

    return {
      entities,
      analysis: {
        method: 'pattern_matching',
        totalEntities: entities.length,
        byType: this.groupEntitiesByType(entities),
      },
      tokensUsed: Math.ceil(textToAnalyze.length / 4),
    };
  }

  /**
   * Categorize content using AI
   */
  private async categorizeContent(content: {
    title: string;
    description: string;
    contentType: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ categories: string[]; analysis: Record<string, unknown>; tokensUsed: number }> {
    const categories: string[] = [];
    const textToAnalyze = [content.title, content.description].join(' ').toLowerCase();

    // Define category keywords
    const categoryKeywords: Record<string, string[]> = {
      'web development': ['web', 'frontend', 'backend', 'fullstack', 'website', 'html', 'css', 'javascript'],
      'mobile development': ['mobile', 'ios', 'android', 'app', 'react native', 'flutter'],
      'machine learning': ['machine learning', 'ml', 'ai', 'artificial intelligence', 'deep learning', 'neural'],
      'data science': ['data', 'analytics', 'visualization', 'statistics', 'pandas', 'numpy'],
      'devops': ['devops', 'docker', 'kubernetes', 'ci/cd', 'deployment', 'infrastructure'],
      'blockchain': ['blockchain', 'crypto', 'web3', 'smart contract', 'defi'],
      'security': ['security', 'cybersecurity', 'encryption', 'authentication', 'authorization'],
      'database': ['database', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql'],
      'cloud': ['cloud', 'aws', 'azure', 'gcp', 'serverless', 'lambda'],
    };

    // Match categories based on keywords
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matchCount = keywords.filter(keyword => textToAnalyze.includes(keyword)).length;
      if (matchCount >= 2) {
        categories.push(category);
      }
    }

    // Add content type as a category
    categories.push(content.contentType);

    return {
      categories: [...new Set(categories)], // Remove duplicates
      analysis: {
        method: 'keyword_matching',
        categoriesFound: categories.length,
      },
      tokensUsed: Math.ceil(textToAnalyze.length / 4),
    };
  }

  /**
   * Score content quality using AI
   */
  private async scoreQuality(content: {
    title: string;
    description: string;
    rawContent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ score: number; analysis: Record<string, unknown>; tokensUsed: number }> {
    let score = 0;
    const factors: Record<string, number> = {};

    // Title quality (0-20 points)
    if (content.title && content.title.length >= 10 && content.title.length <= 100) {
      score += 20;
      factors.title = 20;
    } else if (content.title) {
      score += 10;
      factors.title = 10;
    } else {
      factors.title = 0;
    }

    // Description quality (0-20 points)
    if (content.description && content.description.length >= 50) {
      score += 20;
      factors.description = 20;
    } else if (content.description) {
      score += 10;
      factors.description = 10;
    } else {
      factors.description = 0;
    }

    // Content quality (0-30 points)
    if (content.rawContent && content.rawContent.length >= 100) {
      score += 30;
      factors.content = 30;
    } else if (content.rawContent) {
      score += 15;
      factors.content = 15;
    } else {
      factors.content = 0;
    }

    // Documentation quality (0-15 points)
    const metadata = content.metadata || {};
    if (metadata.hasReadme || metadata.readme) {
      score += 15;
      factors.documentation = 15;
    } else {
      factors.documentation = 0;
    }

    // Activity/maintenance (0-15 points)
    if (typeof metadata.stars === 'number' && metadata.stars > 10) {
      score += 10;
      factors.activity = 10;
    }
    if (metadata.updatedAt || metadata.lastUpdated) {
      score += 5;
      factors.maintenance = 5;
    }

    const normalizedScore = score / 100; // Normalize to 0-1

    return {
      score: normalizedScore,
      analysis: {
        method: 'rule_based',
        factors,
        totalScore: score,
        normalizedScore,
      },
      tokensUsed: 0,
    };
  }

  /**
   * Group entities by type
   */
  private groupEntitiesByType(entities: ExtractedEntity[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const entity of entities) {
      grouped[entity.entityType] = (grouped[entity.entityType] || 0) + 1;
    }
    return grouped;
  }

  /**
   * Store enrichment results in database
   */
  private async storeEnrichmentResults(
    contentId: string,
    contentType: string,
    result: EnrichmentResult
  ): Promise<void> {
    // Store AI-generated tags
    if (result.tags.length > 0) {
      const tagInserts = result.tags.map(tag => ({
        content_id: contentId,
        content_type: contentType,
        tag,
        confidence: 0.8,
        category: null,
        created_at: new Date().toISOString(),
      }));

      const { error: tagError } = await supabaseServer
        .from('ai_generated_tags')
        .insert(tagInserts);

      if (tagError) {
        console.error(`Failed to store AI tags: ${tagError.message}`);
      }
    }

    // Store extracted entities
    if (result.entities.length > 0) {
      const entityInserts = result.entities.map(entity => ({
        ...entity,
        content_id: contentId,
        content_type: contentType,
      }));

      const { error: entityError } = await supabaseServer
        .from('extracted_entities')
        .insert(entityInserts);

      if (entityError) {
        console.error(`Failed to store extracted entities: ${entityError.message}`);
      }
    }

    // Update queue item with enrichment results
    const { error: updateError } = await supabaseServer
      .from('content_acquisition_queue')
      .update({
        ai_summary: result.summary,
        ai_tags: result.tags,
        ai_categories: result.categories,
        ai_quality_score: result.qualityScore,
        ai_analysis: result.analysis,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contentId);

    if (updateError) {
      console.error(`Failed to update queue item with enrichment results: ${updateError.message}`);
    }
  }

  /**
   * Process AI enrichment for a queue item
   */
  async processAIEnrichment(queueItemId: string): Promise<EnrichmentResult> {
    // Load queue item
    const { data: item, error: itemError } = await supabaseServer
      .from('content_acquisition_queue')
      .select('*')
      .eq('id', queueItemId)
      .single();

    if (itemError || !item) {
      throw new Error(`Failed to load queue item: ${itemError?.message}`);
    }

    // Run AI enrichment
    const result = await this.runEnrichment(queueItemId, {
      title: item.title,
      description: item.description,
      rawContent: item.raw_content || undefined,
      contentType: item.content_type,
      metadata: item.metadata as Record<string, unknown> | undefined,
    });

    return result;
  }
}

// Singleton instance
let aiEnrichmentEngineInstance: AIEnrichmentEngine | null = null;

export function getAIEnrichmentEngine(config?: Partial<EnrichmentConfig>): AIEnrichmentEngine {
  if (!aiEnrichmentEngineInstance || config) {
    aiEnrichmentEngineInstance = new AIEnrichmentEngine(config);
  }
  return aiEnrichmentEngineInstance;
}
