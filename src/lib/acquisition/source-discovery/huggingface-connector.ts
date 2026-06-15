/**
 * HuggingFace Source Connector
 * 
 * Discovers and fetches models and datasets from HuggingFace
 */

import { BaseConnector } from './base-connector';
import { DiscoveryConfig, DiscoveryResult, DiscoveredContent, ContentProvider } from './types';

export class HuggingFaceConnector extends BaseConnector {
  private apiBaseUrl = 'https://huggingface.co/api';
  private token: string | null = null;

  /**
   * Validate the configuration
   */
  protected async validateConfig(): Promise<void> {
    // HuggingFace API is mostly public, but token can be provided for higher rate limits
    this.token = (this.config.token as string) || null;
  }

  /**
   * Discover content based on rules and patterns
   */
  async discover(config: DiscoveryConfig): Promise<DiscoveryResult> {
    const startTime = Date.now();
    const discovered: DiscoveredContent[] = [];
    const errors: Array<{ externalId: string; error: string }> = [];

    try {
      for (const rule of config.rules) {
        if (!rule.isActive) continue;

        const results = await this.searchByRule(rule, config.maxResults || 100);
        
        for (const item of results) {
          discovered.push({
            id: crypto.randomUUID(),
            sourceId: config.sourceId,
            externalId: item.id,
            sourceUrl: item.url,
            contentType: item.modelId ? 'project' : 'dataset',
            title: item.id,
            description: item.modelId ? item.modelId : item.datasetId,
            author: item.author,
            organization: item.author,
            discoveryMetadata: {
              likes: item.likes,
              downloads: item.downloads,
              lastModified: item.lastModified,
              tags: item.tags,
              pipelineTag: item.pipelineTag,
              ruleId: rule.id,
              ruleWeight: rule.weight,
            },
            discoveredAt: new Date(),
            processedAt: null,
            status: 'pending',
            errorMessage: null,
          });
        }
      }

      return {
        success: true,
        discovered,
        errors,
        metadata: {
          totalDiscovered: discovered.length,
          processingTime: Date.now() - startTime,
          source: 'huggingface',
        },
      };
    } catch (error) {
      return {
        success: false,
        discovered,
        errors: [{
          externalId: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
        metadata: {
          totalDiscovered: discovered.length,
          processingTime: Date.now() - startTime,
          source: 'huggingface',
        },
      };
    }
  }

  /**
   * Search HuggingFace by rule
   */
  private async searchByRule(rule: any, maxResults: number): Promise<any[]> {
    const query = this.buildSearchQuery(rule);
    const limit = Math.min(maxResults, 100); // HuggingFace API limit
    
    // Search both models and datasets
    const [models, datasets] = await Promise.all([
      this.searchModels(query, limit),
      this.searchDatasets(query, limit),
    ]);

    return [...models, ...datasets];
  }

  /**
   * Search models
   */
  private async searchModels(query: string, limit: number): Promise<any[]> {
    const url = `${this.apiBaseUrl}/models?search=${encodeURIComponent(query)}&limit=${limit}`;
    
    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await this.fetchWithRetry(url, { headers });
    const data = await response.json();
    
    return (data || []).map((item: any) => ({
      ...item,
      url: `https://huggingface.co/${item.id}`,
      modelId: item.id,
    }));
  }

  /**
   * Search datasets
   */
  private async searchDatasets(query: string, limit: number): Promise<any[]> {
    const url = `${this.apiBaseUrl}/datasets?search=${encodeURIComponent(query)}&limit=${limit}`;
    
    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await this.fetchWithRetry(url, { headers });
    const data = await response.json();
    
    return (data || []).map((item: any) => ({
      ...item,
      url: `https://huggingface.co/datasets/${item.id}`,
      datasetId: item.id,
    }));
  }

  /**
   * Build search query from rule
   */
  private buildSearchQuery(rule: any): string {
    const pattern = rule.pattern;
    
    switch (rule.ruleType) {
      case 'keyword':
        return pattern;
      case 'topic':
        return pattern;
      case 'organization':
        return `author:${pattern}`;
      case 'language':
        return pattern;
      default:
        return pattern;
    }
  }

  /**
   * Fetch detailed content for a specific model/dataset
   */
  async fetchContent(externalId: string): Promise<Record<string, unknown>> {
    // Try to fetch as model first, then dataset
    try {
      const url = `${this.apiBaseUrl}/models/${externalId}`;
      const headers: Record<string, string> = {};
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await this.fetchWithRetry(url, { headers });
      const data = await response.json();
      return { ...data, type: 'model' };
    } catch {
      try {
        const url = `${this.apiBaseUrl}/datasets/${externalId}`;
        const headers: Record<string, string> = {};
        if (this.token) {
          headers.Authorization = `Bearer ${this.token}`;
        }

        const response = await this.fetchWithRetry(url, { headers });
        const data = await response.json();
        return { ...data, type: 'dataset' };
      } catch (error) {
        throw new Error(`Failed to fetch ${externalId} as model or dataset`);
      }
    }
  }

  /**
   * Normalize HuggingFace content to standard format
   */
  async normalizeContent(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const item = content as any;
    const isModel = item.type === 'model';

    return {
      provider: 'huggingface' as ContentProvider,
      externalId: item.id,
      sourceUrl: item.url || `https://huggingface.co/${item.id}`,
      contentType: isModel ? 'project' : 'dataset',
      title: item.id,
      description: item.cardData?.description || item.description || '',
      author: item.author,
      authorUrl: `https://huggingface.co/${item.author}`,
      organization: item.author,
      rawContent: item.cardData?.description || item.description,
      metadata: {
        likes: item.likes,
        downloads: item.downloads,
        lastModified: item.lastModified,
        tags: item.tags,
        pipelineTag: item.pipelineTag,
        cardData: item.cardData,
        siblings: item.siblings,
        type: item.type,
      },
      tags: item.tags || [],
      categories: [item.pipelineTag].filter(Boolean),
    };
  }

  /**
   * Get connector health status
   */
  async getHealth(): Promise<{
    healthy: boolean;
    message: string;
    metadata?: Record<string, unknown>;
  }> {
    try {
      const url = `${this.apiBaseUrl}/models?limit=1`;
      const headers: Record<string, string> = {};
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await this.fetchWithRetry(url, { headers });

      if (response.ok) {
        return {
          healthy: true,
          message: 'HuggingFace API is healthy',
        };
      }

      return {
        healthy: false,
        message: 'HuggingFace API returned error',
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
