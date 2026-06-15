/**
 * ArXiv Source Connector
 * 
 * Discovers and fetches research papers from ArXiv
 */

import { BaseConnector } from './base-connector';
import { DiscoveryConfig, DiscoveryResult, DiscoveredContent, ContentProvider } from './types';

export class ArXivConnector extends BaseConnector {
  private apiBaseUrl = 'http://export.arxiv.org/api/query';

  /**
   * Validate the configuration
   */
  protected async validateConfig(): Promise<void> {
    // ArXiv doesn't require authentication
    // Configuration can include custom search parameters
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
            contentType: 'research_paper',
            title: item.title,
            description: item.summary,
            author: item.authors?.[0] || null,
            organization: null,
            discoveryMetadata: {
              published: item.published,
              categories: item.categories,
              primaryCategory: item.primary_category,
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
          source: 'arxiv',
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
          source: 'arxiv',
        },
      };
    }
  }

  /**
   * Search ArXiv by rule
   */
  private async searchByRule(rule: any, maxResults: number): Promise<any[]> {
    const query = this.buildSearchQuery(rule);
    const url = `${this.apiBaseUrl}?search_query=${encodeURIComponent(query)}&start=0&max_results=${maxResults}`;

    const response = await this.fetchWithRetry(url);
    const text = await response.text();
    return this.parseArXivResponse(text);
  }

  /**
   * Build search query from rule
   */
  private buildSearchQuery(rule: any): string {
    const pattern = rule.pattern;
    
    switch (rule.ruleType) {
      case 'keyword':
        return `all:${pattern}`;
      case 'topic':
        return `cat:${pattern}`;
      case 'organization':
        return `au:${pattern}`;
      case 'language':
        return `all:${pattern}`;
      default:
        return `all:${pattern}`;
    }
  }

  /**
   * Parse ArXiv XML response
   */
  private parseArXivResponse(xmlText: string): any[] {
    const entries: any[] = [];
    
    // Simple XML parsing - in production, use a proper XML parser
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    
    while ((match = entryRegex.exec(xmlText)) !== null) {
      const entryText = match[1];
      
      const id = this.extractXmlTag(entryText, 'id');
      const title = this.extractXmlTag(entryText, 'title');
      const summary = this.extractXmlTag(entryText, 'summary');
      const published = this.extractXmlTag(entryText, 'published');
      const primaryCategory = this.extractXmlAttribute(entryText, 'arxiv:primary_category', 'term');
      
      // Extract authors
      const authors: string[] = [];
      const authorRegex = /<name>(.*?)<\/name>/g;
      let authorMatch;
      while ((authorMatch = authorRegex.exec(entryText)) !== null) {
        authors.push(authorMatch[1].trim());
      }
      
      // Extract categories
      const categories: string[] = [];
      const categoryRegex = /<category term="(.*?)"/g;
      let categoryMatch;
      while ((categoryMatch = categoryRegex.exec(entryText)) !== null) {
        categories.push(categoryMatch[1]);
      }
      
      entries.push({
        id: id?.split('/').pop() || id,
        url: id,
        title: this.cleanText(title),
        summary: this.cleanText(summary),
        authors,
        published,
        primary_category: primaryCategory,
        categories,
      });
    }
    
    return entries;
  }

  /**
   * Extract XML tag content
   */
  private extractXmlTag(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = regex.exec(xml);
    return match ? match[1] : null;
  }

  /**
   * Extract XML attribute
   */
  private extractXmlAttribute(xml: string, tag: string, attr: string): string | null {
    const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
    const match = regex.exec(xml);
    return match ? match[1] : null;
  }

  /**
   * Clean text content
   */
  private cleanText(text: string | null): string {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Fetch detailed content for a specific paper
   */
  async fetchContent(externalId: string): Promise<Record<string, unknown>> {
    const url = `${this.apiBaseUrl}?id_list=${externalId}`;
    const response = await this.fetchWithRetry(url);
    const text = await response.text();
    const papers = this.parseArXivResponse(text);
    
    return papers[0] || {};
  }

  /**
   * Normalize ArXiv content to standard format
   */
  async normalizeContent(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const paper = content as any;

    return {
      provider: 'arxiv' as ContentProvider,
      externalId: paper.id,
      sourceUrl: paper.url,
      contentType: 'research_paper',
      title: paper.title,
      description: paper.summary,
      author: paper.authors?.[0],
      rawContent: paper.summary,
      metadata: {
        authors: paper.authors,
        published: paper.published,
        categories: paper.categories,
        primaryCategory: paper.primary_category,
      },
      tags: paper.categories || [],
      categories: [paper.primary_category].filter(Boolean),
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
      const url = `${this.apiBaseUrl}?search_query=test&max_results=1`;
      const response = await this.fetchWithRetry(url);
      
      if (response.ok) {
        return {
          healthy: true,
          message: 'ArXiv API is healthy',
        };
      }
      
      return {
        healthy: false,
        message: 'ArXiv API returned error',
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
