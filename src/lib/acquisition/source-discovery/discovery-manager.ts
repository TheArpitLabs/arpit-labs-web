/**
 * Source Discovery Manager
 * 
 * Orchestrates multiple source connectors for content discovery
 */

import { GitHubConnector } from './github-connector';
import { ArXivConnector } from './arxiv-connector';
import { KaggleConnector } from './kaggle-connector';
import { HuggingFaceConnector } from './huggingface-connector';
import { ProductHuntConnector } from './producthunt-connector';
import {
  SourceConnector,
  DiscoveryConfig,
  DiscoveryResult,
  ContentSource,
  DiscoveryRule,
  ContentProvider,
} from './types';
import { supabaseServer } from '@/lib/supabase/server';

export class DiscoveryManager {
  private connectors: Map<ContentProvider, SourceConnector> = new Map();

  constructor() {
    this.initializeConnectors();
  }

  /**
   * Initialize all available connectors
   */
  private initializeConnectors(): void {
    this.connectors.set('github', new GitHubConnector());
    this.connectors.set('arxiv', new ArXivConnector());
    this.connectors.set('kaggle', new KaggleConnector());
    this.connectors.set('huggingface', new HuggingFaceConnector());
    this.connectors.set('producthunt', new ProductHuntConnector());
  }

  /**
   * Get connector for a specific provider
   */
  getConnector(provider: ContentProvider): SourceConnector | undefined {
    return this.connectors.get(provider);
  }

  /**
   * Initialize connector with configuration
   */
  async initializeConnector(provider: ContentProvider, config: Record<string, unknown>): Promise<void> {
    const connector = this.getConnector(provider);
    if (!connector) {
      throw new Error(`No connector found for provider: ${provider}`);
    }
    await connector.initialize(config);
  }

  /**
   * Load content sources from database
   */
  async loadContentSources(): Promise<ContentSource[]> {
    const { data, error } = await supabaseServer
      .from('content_sources')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) {
      throw new Error(`Failed to load content sources: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Load discovery rules for a source
   */
  async loadDiscoveryRules(sourceId: string): Promise<DiscoveryRule[]> {
    const { data, error } = await supabaseServer
      .from('discovery_rules')
      .select('*')
      .eq('source_id', sourceId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to load discovery rules: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Run discovery for a specific source
   */
  async runDiscovery(sourceId: string, options: { maxResults?: number } = {}): Promise<DiscoveryResult> {
    // Load source configuration
    const sources = await this.loadContentSources();
    const source = sources.find(s => s.id === sourceId);

    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    // Load rules
    const rules = await this.loadDiscoveryRules(sourceId);

    if (rules.length === 0) {
      return {
        success: true,
        discovered: [],
        errors: [],
        metadata: {
          totalDiscovered: 0,
          processingTime: 0,
          source: source.providerType,
        },
      };
    }

    // Get connector
    const connector = this.getConnector(source.providerType as ContentProvider);
    if (!connector) {
      throw new Error(`No connector available for provider: ${source.providerType}`);
    }

    // Initialize connector
    await connector.initialize({
      ...source.authConfig,
      rateLimit: source.rateLimit,
    });

    // Run discovery
    const config: DiscoveryConfig = {
      sourceId,
      rules,
      maxResults: options.maxResults || 100,
    };

    const result = await connector.discover(config);

    // Store discovered content in database
    if (result.success && result.discovered.length > 0) {
      await this.storeDiscoveredContent(result.discovered);
    }

    // Update source last synced time
    await this.updateSourceSyncTime(sourceId);

    return result;
  }

  /**
   * Run discovery for all active sources
   */
  async runDiscoveryForAllSources(options: { maxResults?: number } = {}): Promise<Record<string, DiscoveryResult>> {
    const sources = await this.loadContentSources();
    const results: Record<string, DiscoveryResult> = {};

    for (const source of sources) {
      try {
        results[source.id] = await this.runDiscovery(source.id, options);
      } catch (error) {
        results[source.id] = {
          success: false,
          discovered: [],
          errors: [{
            externalId: 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          }],
          metadata: {
            totalDiscovered: 0,
            processingTime: 0,
            source: source.providerType,
          },
        };
      }
    }

    return results;
  }

  /**
   * Store discovered content in database
   */
  private async storeDiscoveredContent(discovered: any[]): Promise<void> {
    const { error } = await supabaseServer
      .from('discovered_content')
      .upsert(
        discovered.map(item => ({
          id: item.id,
          source_id: item.sourceId,
          external_id: item.externalId,
          source_url: item.sourceUrl,
          content_type: item.contentType,
          title: item.title,
          description: item.description,
          author: item.author,
          organization: item.organization,
          discovery_metadata: item.discoveryMetadata,
          discovered_at: item.discoveredAt,
          status: item.status,
          error_message: item.errorMessage,
        })),
        { onConflict: 'source_id,external_id' }
      );

    if (error) {
      throw new Error(`Failed to store discovered content: ${error.message}`);
    }
  }

  /**
   * Update source last synced time
   */
  private async updateSourceSyncTime(sourceId: string): Promise<void> {
    const { error } = await supabaseServer
      .from('content_sources')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', sourceId);

    if (error) {
      console.error(`Failed to update source sync time: ${error.message}`);
    }
  }

  /**
   * Get health status for all connectors
   */
  async getHealthStatus(): Promise<Record<ContentProvider, {
    healthy: boolean;
    message: string;
    metadata?: Record<string, unknown>;
  }>> {
    const healthStatus: Record<ContentProvider, {
      healthy: boolean;
      message: string;
      metadata?: Record<string, unknown>;
    }> = {} as any;

    for (const [provider, connector] of this.connectors.entries()) {
      try {
        healthStatus[provider] = await connector.getHealth();
      } catch (error) {
        healthStatus[provider] = {
          healthy: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return healthStatus;
  }

  /**
   * Queue discovered content for acquisition
   */
  async queueForAcquisition(discoveredContentIds: string[]): Promise<void> {
    // Load discovered content
    const { data: discoveredItems, error } = await supabaseServer
      .from('discovered_content')
      .select('*')
      .in('id', discoveredContentIds);

    if (error) {
      throw new Error(`Failed to load discovered content: ${error.message}`);
    }

    // Queue each item for acquisition
    for (const item of discoveredItems || []) {
      await this.queueSingleItem(item);
    }
  }

  /**
   * Queue a single discovered item for acquisition
   */
  private async queueSingleItem(item: any): Promise<void> {
    const connector = this.getConnector(item.provider_type as ContentProvider);
    if (!connector) {
      console.error(`No connector for provider: ${item.provider_type}`);
      return;
    }

    try {
      // Fetch detailed content
      const content = await connector.fetchContent(item.external_id);
      
      // Normalize content
      const normalized = await connector.normalizeContent(content);

      // Queue for acquisition
      const { error: queueError } = await supabaseServer
        .from('content_acquisition_queue')
        .insert({
          source_id: item.source_id,
          discovered_id: item.id,
          provider: normalized.provider,
          external_id: normalized.externalId,
          source_url: normalized.sourceUrl,
          repository_url: normalized.repositoryUrl,
          content_type: normalized.contentType,
          title: normalized.title,
          description: normalized.description,
          raw_content: normalized.rawContent,
          author: normalized.author,
          author_url: normalized.authorUrl,
          organization: normalized.organization,
          organization_url: normalized.organizationUrl,
          metadata: normalized.metadata,
          tags: normalized.tags,
          categories: normalized.categories,
          status: 'pending',
          priority: 0,
        });

      if (queueError) {
        throw queueError;
      }

      // Update discovered content status
      await supabaseServer
        .from('discovered_content')
        .update({ status: 'queued', processed_at: new Date().toISOString() })
        .eq('id', item.id);

    } catch (error) {
      console.error(`Failed to queue item ${item.id}:`, error);
      
      await supabaseServer
        .from('discovered_content')
        .update({ 
          status: 'failed', 
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processed_at: new Date().toISOString()
        })
        .eq('id', item.id);
    }
  }
}

// Singleton instance
let discoveryManagerInstance: DiscoveryManager | null = null;

export function getDiscoveryManager(): DiscoveryManager {
  if (!discoveryManagerInstance) {
    discoveryManagerInstance = new DiscoveryManager();
  }
  return discoveryManagerInstance;
}
