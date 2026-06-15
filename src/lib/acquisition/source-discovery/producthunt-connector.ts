/**
 * ProductHunt Source Connector
 * 
 * Discovers and fetches products from ProductHunt
 */

import { BaseConnector } from './base-connector';
import { DiscoveryConfig, DiscoveryResult, DiscoveredContent, ContentProvider } from './types';

export class ProductHuntConnector extends BaseConnector {
  private apiBaseUrl = 'https://api.producthunt.com/v2';
  private token: string | null = null;

  /**
   * Validate the configuration
   */
  protected async validateConfig(): Promise<void> {
    if (!this.config.token) {
      throw new Error('ProductHunt API token is required');
    }
    this.token = this.config.token as string;
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
            externalId: item.id.toString(),
            sourceUrl: item.url,
            contentType: 'project',
            title: item.name,
            description: item.tagline || item.description,
            author: item.user?.username,
            organization: item.user?.username,
            discoveryMetadata: {
              votesCount: item.votes_count,
              commentsCount: item.comments_count,
              featuredAt: item.featured_at,
              topics: item.topics,
              thumbnail: item.thumbnail?.url,
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
          source: 'producthunt',
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
          source: 'producthunt',
        },
      };
    }
  }

  /**
   * Search ProductHunt by rule
   */
  private async searchByRule(rule: any, maxResults: number): Promise<any[]> {
    const query = this.buildSearchQuery(rule);
    
    // ProductHunt API requires GraphQL
    const graphqlQuery = `
      query {
        posts(search: "${query}", first: ${maxResults}) {
          edges {
            node {
              id
              name
              tagline
              description
              url
              votes_count
              comments_count
              featured_at
              thumbnail {
                url
              }
              user {
                username
                name
              }
              topics {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.fetchWithRetry('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: graphqlQuery }),
    });

    const data = await response.json();
    const edges = data?.data?.posts?.edges || [];
    
    return edges.map((edge: any) => ({
      ...edge.node,
      topics: edge.node.topics?.edges?.map((t: any) => t.node.name) || [],
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
        return `@${pattern}`;
      default:
        return pattern;
    }
  }

  /**
   * Fetch detailed content for a specific product
   */
  async fetchContent(externalId: string): Promise<Record<string, unknown>> {
    const graphqlQuery = `
      query {
        post(id: "${externalId}") {
          id
          name
          tagline
          description
          url
          website
          votes_count
          comments_count
          featured_at
          created_at
          thumbnail {
            url
          }
          user {
            username
            name
            url
          }
          topics {
            edges {
              node {
                name
              }
            }
          }
        }
      }
    `;

    const response = await this.fetchWithRetry('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: graphqlQuery }),
    });

    const data = await response.json();
    return data?.data?.post || {};
  }

  /**
   * Normalize ProductHunt content to standard format
   */
  async normalizeContent(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const product = content as any;

    return {
      provider: 'producthunt' as ContentProvider,
      externalId: product.id.toString(),
      sourceUrl: product.url,
      contentType: 'project',
      title: product.name,
      description: product.tagline || product.description,
      author: product.user?.username,
      authorUrl: product.user?.url,
      organization: product.user?.username,
      rawContent: product.description,
      metadata: {
        votesCount: product.votes_count,
        commentsCount: product.comments_count,
        featuredAt: product.featured_at,
        createdAt: product.created_at,
        topics: product.topics?.edges?.map((t: any) => t.node.name) || [],
        thumbnail: product.thumbnail?.url,
        website: product.website,
      },
      tags: product.topics?.edges?.map((t: any) => t.node.name) || [],
      categories: product.topics?.edges?.slice(0, 3).map((t: any) => t.node.name) || [],
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
      const graphqlQuery = `
        query {
          posts(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      `;

      const response = await this.fetchWithRetry('https://api.producthunt.com/v2/api/graphql', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: graphqlQuery }),
      });

      if (response.ok) {
        return {
          healthy: true,
          message: 'ProductHunt API is healthy',
        };
      }

      return {
        healthy: false,
        message: 'ProductHunt API returned error',
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
