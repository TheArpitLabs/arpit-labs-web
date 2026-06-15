/**
 * Kaggle Source Connector
 * 
 * Discovers and fetches datasets from Kaggle
 */

import { BaseConnector } from './base-connector';
import { DiscoveryConfig, DiscoveryResult, DiscoveredContent, ContentProvider } from './types';

export class KaggleConnector extends BaseConnector {
  private apiBaseUrl = 'https://www.kaggle.com/api/v1';
  private username: string | null = null;
  private key: string | null = null;

  /**
   * Validate the configuration
   */
  protected async validateConfig(): Promise<void> {
    if (!this.config.username || !this.config.key) {
      throw new Error('Kaggle username and key are required');
    }
    this.username = this.config.username as string;
    this.key = this.config.key as string;
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
            externalId: item.ref,
            sourceUrl: item.url,
            contentType: 'dataset',
            title: item.title,
            description: item.subtitle || item.description,
            author: item.ownerAuthor,
            organization: item.ownerAuthor,
            discoveryMetadata: {
              totalDownloads: item.totalDownloads,
              totalVotes: item.totalVotes,
              usability: item.usability,
              lastUpdated: item.lastUpdated,
              tags: item.tags,
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
          source: 'kaggle',
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
          source: 'kaggle',
        },
      };
    }
  }

  /**
   * Search Kaggle by rule
   */
  private async searchByRule(rule: any, maxResults: number): Promise<any[]> {
    const query = this.buildSearchQuery(rule);
    const url = `${this.apiBaseUrl}/datasets/search?search=${encodeURIComponent(query)}&size=${maxResults}`;

    const response = await this.fetchWithRetry(url, {
      headers: {
        Authorization: `Basic ${this.getBasicAuth()}`,
      },
    });

    const data = await response.json();
    return data || [];
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
        return `tags:${pattern}`;
      case 'organization':
        return `owner:${pattern}`;
      default:
        return pattern;
    }
  }

  /**
   * Get basic auth header
   */
  private getBasicAuth(): string {
    const credentials = `${this.username}:${this.key}`;
    return Buffer.from(credentials).toString('base64');
  }

  /**
   * Fetch detailed content for a specific dataset
   */
  async fetchContent(externalId: string): Promise<Record<string, unknown>> {
    const url = `${this.apiBaseUrl}/datasets/view/${externalId}`;

    const response = await this.fetchWithRetry(url, {
      headers: {
        Authorization: `Basic ${this.getBasicAuth()}`,
      },
    });

    return await response.json();
  }

  /**
   * Normalize Kaggle content to standard format
   */
  async normalizeContent(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const dataset = content as any;

    return {
      provider: 'kaggle' as ContentProvider,
      externalId: dataset.ref,
      sourceUrl: dataset.url,
      contentType: 'dataset',
      title: dataset.title,
      description: dataset.subtitle || dataset.description,
      author: dataset.ownerAuthor,
      authorUrl: `https://www.kaggle.com/${dataset.ownerAuthor}`,
      organization: dataset.ownerAuthor,
      rawContent: dataset.description,
      metadata: {
        totalDownloads: dataset.totalDownloads,
        totalVotes: dataset.totalVotes,
        usability: dataset.usability,
        lastUpdated: dataset.lastUpdated,
        tags: dataset.tags,
        size: dataset.size,
        licenseName: dataset.licenseName,
      },
      tags: dataset.tags || [],
      categories: dataset.tags?.slice(0, 3) || [],
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
      const url = `${this.apiBaseUrl}/datasets/list?size=1`;
      const response = await this.fetchWithRetry(url, {
        headers: {
          Authorization: `Basic ${this.getBasicAuth()}`,
        },
      });

      if (response.ok) {
        return {
          healthy: true,
          message: 'Kaggle API is healthy',
        };
      }

      return {
        healthy: false,
        message: 'Kaggle API returned error',
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
