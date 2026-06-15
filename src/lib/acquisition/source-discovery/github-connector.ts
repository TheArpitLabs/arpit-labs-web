/**
 * GitHub Source Connector
 * 
 * Discovers and fetches content from GitHub repositories
 */

import { BaseConnector } from './base-connector';
import { DiscoveryConfig, DiscoveryResult, DiscoveredContent, ContentProvider } from './types';

export class GitHubConnector extends BaseConnector {
  private apiBaseUrl = 'https://api.github.com';
  private token: string | null = null;

  /**
   * Validate the configuration
   */
  protected async validateConfig(): Promise<void> {
    if (!this.config.token) {
      throw new Error('GitHub token is required');
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
            sourceUrl: item.html_url,
            contentType: 'project',
            title: item.name,
            description: item.description || null,
            author: item.owner?.login || null,
            organization: item.owner?.login || null,
            discoveryMetadata: {
              stars: item.stargazers_count,
              forks: item.forks_count,
              language: item.language,
              topics: item.topics,
              license: item.license?.name,
              updatedAt: item.updated_at,
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
          source: 'github',
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
          source: 'github',
        },
      };
    }
  }

  /**
   * Search GitHub by rule
   */
  private async searchByRule(rule: any, maxResults: number): Promise<any[]> {
    const query = this.buildSearchQuery(rule);
    const url = `${this.apiBaseUrl}/search/repositories?q=${encodeURIComponent(query)}&per_page=${maxResults}&sort=stars&order=desc`;

    const response = await this.fetchWithRetry(url, {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Build search query from rule
   */
  private buildSearchQuery(rule: any): string {
    const baseQuery = rule.pattern;
    
    // Add qualifiers based on rule type
    let qualifiers = '';
    
    switch (rule.ruleType) {
      case 'language':
        qualifiers = `language:${rule.pattern}`;
        break;
      case 'topic':
        qualifiers = `topic:${rule.pattern}`;
        break;
      case 'organization':
        qualifiers = `user:${rule.pattern}`;
        break;
      case 'keyword':
      default:
        qualifiers = baseQuery;
        break;
    }

    // Add common qualifiers for quality
    return `${qualifiers} stars:>10 forks:>5 pushed:>2023-01-01`;
  }

  /**
   * Fetch detailed content for a specific repository
   */
  async fetchContent(externalId: string): Promise<Record<string, unknown>> {
    const url = `${this.apiBaseUrl}/repositories/${externalId}`;

    const response = await this.fetchWithRetry(url, {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const repo = await response.json();

    // Fetch README
    let readme = null;
    try {
      const readmeUrl = `${this.apiBaseUrl}/repos/${externalId}/readme`;
      const readmeResponse = await this.fetchWithRetry(readmeUrl, {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3.raw',
        },
      });
      readme = await readmeResponse.text();
    } catch (error) {
      // README might not exist
    }

    // Fetch languages
    let languages = {};
    try {
      const languagesUrl = `${this.apiBaseUrl}/repos/${externalId}/languages`;
      const languagesResponse = await this.fetchWithRetry(languagesUrl, {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      languages = await languagesResponse.json();
    } catch (error) {
      // Languages might not be available
    }

    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      htmlUrl: repo.html_url,
      apiUrl: repo.url,
      homepage: repo.homepage,
      language: repo.language,
      languages,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      openIssues: repo.open_issues_count,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      size: repo.size,
      license: repo.license,
      topics: repo.topics,
      owner: {
        login: repo.owner?.login,
        id: repo.owner?.id,
        type: repo.owner?.type,
        avatarUrl: repo.owner?.avatar_url,
      },
      readme,
      defaultBranch: repo.default_branch,
    };
  }

  /**
   * Normalize GitHub content to standard format
   */
  async normalizeContent(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    const repo = content as any;

    return {
      provider: 'github' as ContentProvider,
      externalId: repo.fullName || repo.id.toString(),
      sourceUrl: repo.htmlUrl,
      repositoryUrl: repo.htmlUrl,
      contentType: 'project',
      title: repo.name,
      description: repo.description || '',
      author: repo.owner?.login,
      authorUrl: repo.owner?.avatarUrl ? `https://github.com/${repo.owner?.login}` : null,
      organization: repo.owner?.login,
      organizationUrl: `https://github.com/${repo.owner?.login}`,
      rawContent: repo.readme,
      metadata: {
        languages: Object.keys(repo.languages || {}),
        topics: repo.topics || [],
        stars: repo.stars,
        forks: repo.forks,
        watchers: repo.watchers,
        openIssues: repo.openIssues,
        size: repo.size,
        license: repo.license?.name || repo.license?.spdx_id,
        licenseUrl: repo.license?.url,
        homepage: repo.homepage,
        defaultBranch: repo.defaultBranch,
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt,
        pushedAt: repo.pushedAt,
        avatarUrl: repo.owner?.avatarUrl,
      },
      tags: [
        ...(repo.topics || []),
        repo.language ? repo.language.toLowerCase() : undefined,
      ].filter(Boolean),
      categories: [repo.language ? repo.language.toLowerCase() : undefined].filter(Boolean),
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
      const url = `${this.apiBaseUrl}/rate_limit`;
      const response = await this.fetchWithRetry(url, {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const data = await response.json();
      const rateLimits = data.resources?.core;

      return {
        healthy: true,
        message: 'GitHub API is healthy',
        metadata: {
          remaining: rateLimits?.remaining,
          limit: rateLimits?.limit,
          reset: new Date(rateLimits?.reset * 1000).toISOString(),
          used: rateLimits?.limit - rateLimits?.remaining,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
