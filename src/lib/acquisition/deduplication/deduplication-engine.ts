/**
 * Deduplication Engine
 * 
 * Handles content hashing, similarity detection, and canonical URL management
 */

import { createHash } from 'crypto';
import { DeduplicationResult, DeduplicationConfig, ContentComparison } from './types';
import { supabaseServer } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export class DeduplicationEngine {
  private config: DeduplicationConfig;

  constructor(config: Partial<DeduplicationConfig> = {}) {
    this.config = {
      similarityThreshold: 0.85,
      enableClustering: true,
      autoRejectExactDuplicates: true,
      autoRejectHighSimilarity: false,
      highSimilarityThreshold: 0.95,
      ...config,
    };
  }

  /**
   * Check if content is a duplicate
   */
  async checkDuplicate(contentId: string, content: {
    title: string;
    description: string;
    rawContent?: string;
    sourceUrl: string;
    contentType: string;
  }): Promise<DeduplicationResult> {
    // Generate content hash
    const contentHash = this.generateContentHash(content);

    // Check for exact duplicate by hash
    const exactDuplicate = await this.checkExactDuplicate(contentHash, content.contentType);
    if (exactDuplicate) {
      return {
        isDuplicate: true,
        duplicateType: 'exact',
        confidence: 1.0,
        canonicalId: exactDuplicate.firstSeenId,
        recommendation: this.config.autoRejectExactDuplicates ? 'auto_reject' : 'manual_review',
        reason: 'Exact content hash match found',
      };
    }

    // Check for similar content
    const similarContent = await this.checkSimilarContent(content);
    if (similarContent.length > 0) {
      const bestMatch = similarContent[0];
      
      if (bestMatch.similarityScore >= this.config.highSimilarityThreshold && this.config.autoRejectHighSimilarity) {
        return {
          isDuplicate: true,
          duplicateType: 'similar',
          confidence: bestMatch.similarityScore,
          canonicalId: bestMatch.contentId,
          similarityScore: bestMatch.similarityScore,
          recommendation: 'auto_reject',
          reason: `High similarity (${bestMatch.similarityScore.toFixed(2)}) with existing content`,
        };
      }

      return {
        isDuplicate: true,
        duplicateType: 'similar',
        confidence: bestMatch.similarityScore,
        canonicalId: bestMatch.contentId,
        similarityScore: bestMatch.similarityScore,
        recommendation: 'manual_review',
        reason: `Similar content found (${bestMatch.similarityScore.toFixed(2)})`,
      };
    }

    // Check canonical URL
    const canonicalUrlMatch = await this.checkCanonicalUrl(content.sourceUrl);
    if (canonicalUrlMatch) {
      return {
        isDuplicate: true,
        duplicateType: 'exact',
        confidence: 1.0,
        canonicalId: canonicalUrlMatch.id,
        recommendation: 'auto_reject',
        reason: 'Canonical URL already exists',
      };
    }

    return {
      isDuplicate: false,
      duplicateType: 'none',
      confidence: 0,
      recommendation: 'accept',
      reason: 'No duplicates found',
    };
  }

  /**
   * Generate content hash
   */
  private generateContentHash(content: {
    title: string;
    description: string;
    rawContent?: string;
  }): string {
    const hashContent = [
      content.title,
      content.description,
      content.rawContent || '',
    ].join('\n').toLowerCase().trim();

    return createHash('sha256').update(hashContent).digest('hex');
  }

  /**
   * Check for exact duplicate by content hash
   */
  private async checkExactDuplicate(contentHash: string, contentType: string): Promise<{
    firstSeenId: string;
    contentHash: string;
  } | null> {
    const { data, error } = await supabaseServer
      .from('content_hashes')
      .select('*')
      .eq('content_hash', contentHash)
      .eq('content_type', contentType)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      firstSeenId: data.first_seen_id,
      contentHash: data.content_hash,
    };
  }

  /**
   * Check for similar content
   */
  private async checkSimilarContent(content: {
    title: string;
    description: string;
    contentType: string;
  }): Promise<ContentComparison[]> {
    const comparisons: ContentComparison[] = [];

    // Get similar content from database
    const { data: existingContent, error } = await supabaseServer
      .from('content_acquisition_queue')
      .select('id, title, description, content_type')
      .eq('content_type', content.contentType)
      .in('status', ['fetched', 'analyzing', 'approved', 'published'])
      .limit(100);

    if (error || !existingContent) {
      return comparisons;
    }

    // Calculate similarity scores
    for (const existing of existingContent) {
      const similarity = this.calculateSimilarity(content, existing);
      
      if (similarity >= this.config.similarityThreshold) {
        comparisons.push({
          contentId: existing.id,
          similarityScore: similarity,
          matchingFields: this.getMatchingFields(content, existing),
          differences: this.getDifferences(content, existing),
        });
      }
    }

    // Sort by similarity score descending
    comparisons.sort((a, b) => b.similarityScore - a.similarityScore);

    return comparisons;
  }

  /**
   * Calculate similarity between two content items
   */
  private calculateSimilarity(content1: {
    title: string;
    description: string;
  }, content2: {
    title: string;
    description: string;
  }): number {
    const titleSimilarity = this.calculateStringSimilarity(content1.title, content2.title);
    const descriptionSimilarity = this.calculateStringSimilarity(content1.description, content2.description);

    // Weight title more heavily than description
    return (titleSimilarity * 0.6) + (descriptionSimilarity * 0.4);
  }

  /**
   * Calculate string similarity using Jaccard similarity
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const tokens1 = this.tokenize(str1);
    const tokens2 = this.tokenize(str2);

    const intersection = new Set([...tokens1].filter(x => new Set(tokens2).has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    if (union.size === 0) return 0;

    return intersection.size / union.size;
  }

  /**
   * Tokenize string for similarity comparison
   */
  private tokenize(str: string): Set<string> {
    return new Set(
      str
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 2)
    );
  }

  /**
   * Get matching fields between two content items
   */
  private getMatchingFields(content1: any, content2: any): string[] {
    const matching: string[] = [];

    if (this.calculateStringSimilarity(content1.title, content2.title) > 0.8) {
      matching.push('title');
    }

    if (this.calculateStringSimilarity(content1.description, content2.description) > 0.8) {
      matching.push('description');
    }

    return matching;
  }

  /**
   * Get differences between two content items
   */
  private getDifferences(content1: any, content2: any): string[] {
    const differences: string[] = [];

    if (this.calculateStringSimilarity(content1.title, content2.title) <= 0.8) {
      differences.push('title');
    }

    if (this.calculateStringSimilarity(content1.description, content2.description) <= 0.8) {
      differences.push('description');
    }

    return differences;
  }

  /**
   * Check canonical URL
   */
  private async checkCanonicalUrl(sourceUrl: string): Promise<{ id: string } | null> {
    const normalizedUrl = this.normalizeUrl(sourceUrl);

    const { data, error } = await supabaseServer
      .from('content_acquisition_queue')
      .select('id')
      .eq('canonical_url', normalizedUrl)
      .single();

    if (error || !data) {
      return null;
    }

    return { id: data.id };
  }

  /**
   * Normalize URL for comparison
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      
      // Remove trailing slash
      let normalized = parsed.href.replace(/\/$/, '');
      
      // Remove common tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source'];
      const urlObj = new URL(normalized);
      
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });

      return urlObj.href;
    } catch {
      return url;
    }
  }

  /**
   * Store content hash
   */
  async storeContentHash(contentId: string, contentHash: string, contentType: string): Promise<void> {
    const { error } = await supabaseServer
      .from('content_hashes')
      .upsert({
        content_hash: contentHash,
        content_type: contentType,
        first_seen_id: contentId,
        first_seen_at: new Date().toISOString(),
        occurrence_count: 1,
        last_seen_at: new Date().toISOString(),
      }, {
        onConflict: 'content_hash',
      });

    if (error) {
      logger.error(`Failed to store content hash: ${error.message}`);
    }
  }

  /**
   * Update content hash occurrence count
   */
  async updateContentHashOccurrence(contentHash: string): Promise<void> {
    const { error } = await supabaseServer
      .from('content_hashes')
      .update({
        occurrence_count: this.raw('occurrence_count + 1'),
        last_seen_at: new Date().toISOString(),
      })
      .eq('content_hash', contentHash);

    if (error) {
      logger.error(`Failed to update content hash occurrence: ${error.message}`);
    }
  }

  /**
   * Raw SQL helper
   */
  private raw(sql: string): any {
    return sql; // In production, use proper raw SQL escaping
  }

  /**
   * Create content cluster
   */
  async createCluster(contentId: string, contentType: string, similarityThreshold: number): Promise<string> {
    const { data, error } = await supabaseServer
      .from('content_clusters')
      .insert({
        content_type: contentType,
        canonical_id: contentId,
        similarity_threshold: similarityThreshold,
        member_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create cluster: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Add member to cluster
   */
  async addClusterMember(clusterId: string, contentId: string, contentType: string, similarityScore: number): Promise<void> {
    const { error } = await supabaseServer
      .from('content_cluster_members')
      .insert({
        cluster_id: clusterId,
        content_id: contentId,
        content_type: contentType,
        similarity_score: similarityScore,
        is_canonical: false,
        created_at: new Date().toISOString(),
      });

    if (error) {
      logger.error(`Failed to add cluster member: ${error.message}`);
    }

    // Update cluster member count
    await this.updateClusterMemberCount(clusterId);
  }

  /**
   * Update cluster member count
   */
  private async updateClusterMemberCount(clusterId: string): Promise<void> {
    const { error } = await supabaseServer.rpc('increment_cluster_member_count', {
      cluster_id: clusterId,
    });

    if (error) {
      logger.error(`Failed to update cluster member count: ${error.message}`);
    }
  }

  /**
   * Process deduplication for a queue item
   */
  async processDeduplication(queueItemId: string): Promise<DeduplicationResult> {
    // Load queue item
    const { data: item, error: itemError } = await supabaseServer
      .from('content_acquisition_queue')
      .select('*')
      .eq('id', queueItemId)
      .single();

    if (itemError || !item) {
      throw new Error(`Failed to load queue item: ${itemError?.message}`);
    }

    // Check for duplicates
    const result = await this.checkDuplicate(queueItemId, {
      title: item.title,
      description: item.description,
      rawContent: item.raw_content || undefined,
      sourceUrl: item.source_url,
      contentType: item.content_type,
    });

    // Store content hash if not duplicate
    if (!result.isDuplicate) {
      const contentHash = this.generateContentHash({
        title: item.title,
        description: item.description,
        rawContent: item.raw_content || undefined,
      });
      await this.storeContentHash(queueItemId, contentHash, item.content_type);
    }

    // Update queue item with deduplication results
    await supabaseServer
      .from('content_acquisition_queue')
      .update({
        content_hash: result.isDuplicate ? null : this.generateContentHash({
          title: item.title,
          description: item.description,
          rawContent: item.raw_content || undefined,
        }),
        similarity_score: result.similarityScore,
        duplicate_of_id: result.canonicalId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', queueItemId);

    return result;
  }
}

// Singleton instance
let deduplicationEngineInstance: DeduplicationEngine | null = null;

export function getDeduplicationEngine(config?: Partial<DeduplicationConfig>): DeduplicationEngine {
  if (!deduplicationEngineInstance || config) {
    deduplicationEngineInstance = new DeduplicationEngine(config);
  }
  return deduplicationEngineInstance;
}
