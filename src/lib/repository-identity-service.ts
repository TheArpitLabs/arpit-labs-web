/**
 * Repository Identity Service
 * 
 * Provides ingestion protection by checking for duplicate repositories
 * before insertion. Uses multiple deduplication strategies:
 * 1. GitHub Repository ID (primary)
 * 2. Normalized GitHub URL (secondary)
 * 3. Original GitHub URL (fallback)
 */

import { createClient } from '@supabase/supabase-js';
import { normalizeGithubUrl, extractGitHubUrlParts } from './github-url-normalizer';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: 'repository_id' | 'normalized_url' | 'github_url' | 'title' | 'slug';
  existingProject?: {
    id: string;
    title: string;
    slug: string;
    github_url: string;
    github_repository_id?: number;
    normalized_github_url?: string;
  };
}

export interface RepositoryIdentity {
  github_repository_id?: number;
  github_owner?: string;
  github_repo_name?: string;
  normalized_github_url?: string;
  github_url?: string;
}

export class RepositoryIdentityService {
  private supabase: any;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Check if a repository is a duplicate before insertion
   * @param repositoryData - Repository data to check
   * @returns Duplicate check result
   */
  async checkDuplicate(repositoryData: {
    github_repository_id?: number;
    github_url?: string;
    title?: string;
    slug?: string;
  }): Promise<DuplicateCheckResult> {
    // Check by repository ID (primary deduplication)
    if (repositoryData.github_repository_id) {
      const { data: existingById } = await this.supabase
        .from('projects')
        .select('id, title, slug, github_url, github_repository_id, normalized_github_url')
        .eq('github_repository_id', repositoryData.github_repository_id)
        .single();
      
      if (existingById) {
        return {
          isDuplicate: true,
          reason: 'repository_id',
          existingProject: existingById
        };
      }
    }

    // Check by normalized URL (secondary deduplication)
    if (repositoryData.github_url) {
      const normalizedUrl = normalizeGithubUrl(repositoryData.github_url);
      if (normalizedUrl) {
        const { data: existingByNormalizedUrl } = await this.supabase
          .from('projects')
          .select('id, title, slug, github_url, github_repository_id, normalized_github_url')
          .eq('normalized_github_url', normalizedUrl)
          .single();
        
        if (existingByNormalizedUrl) {
          return {
            isDuplicate: true,
            reason: 'normalized_url',
            existingProject: existingByNormalizedUrl
          };
        }
      }
    }

    // Check by original GitHub URL (fallback)
    if (repositoryData.github_url) {
      const { data: existingByUrl } = await this.supabase
        .from('projects')
        .select('id, title, slug, github_url, github_repository_id, normalized_github_url')
        .eq('github_url', repositoryData.github_url)
        .single();
      
      if (existingByUrl) {
        return {
          isDuplicate: true,
          reason: 'github_url',
          existingProject: existingByUrl
        };
      }
    }

    // Check by title (optional warning)
    if (repositoryData.title) {
      const { data: existingByTitle } = await this.supabase
        .from('projects')
        .select('id, title, slug, github_url, github_repository_id, normalized_github_url')
        .ilike('title', repositoryData.title)
        .single();
      
      if (existingByTitle) {
        return {
          isDuplicate: true,
          reason: 'title',
          existingProject: existingByTitle
        };
      }
    }

    // Check by slug (optional warning)
    if (repositoryData.slug) {
      const { data: existingBySlug } = await this.supabase
        .from('projects')
        .select('id, title, slug, github_url, github_repository_id, normalized_github_url')
        .eq('slug', repositoryData.slug)
        .single();
      
      if (existingBySlug) {
        return {
          isDuplicate: true,
          reason: 'slug',
          existingProject: existingBySlug
        };
      }
    }

    return {
      isDuplicate: false
    };
  }

  /**
   * Extract repository identity from GitHub URL
   * @param githubUrl - GitHub repository URL
   * @returns Repository identity object
   */
  extractRepositoryIdentity(githubUrl: string): RepositoryIdentity {
    const normalizedUrl = normalizeGithubUrl(githubUrl);
    const parts = extractGitHubUrlParts(githubUrl);
    
    return {
      github_url: githubUrl,
      normalized_github_url: normalizedUrl,
      github_owner: parts?.owner,
      github_repo_name: parts?.repo
    };
  }

  /**
   * Extract repository identity from GitHub API response
   * @param apiResponse - GitHub API repository response
   * @returns Repository identity object
   */
  extractRepositoryIdentityFromApi(apiResponse: any): RepositoryIdentity {
    return {
      github_repository_id: apiResponse.id,
      github_owner: apiResponse.owner?.login,
      github_repo_name: apiResponse.name,
      github_url: apiResponse.html_url,
      normalized_github_url: normalizeGithubUrl(apiResponse.html_url)
    };
  }

  /**
   * Log duplicate attempt to discovery_logs
   * @param repositoryData - Repository data that was attempted
   * @param duplicateResult - Result of duplicate check
   */
  async logDuplicateAttempt(
    repositoryData: any,
    duplicateResult: DuplicateCheckResult
  ): Promise<void> {
    try {
      const logEntry = {
        repository: repositoryData.github_url || repositoryData.title || 'unknown',
        reason: duplicateResult.reason || 'unknown',
        status: 'skipped',
        metadata: {
          github_repository_id: repositoryData.github_repository_id,
          normalized_github_url: repositoryData.normalized_github_url,
          existing_project_id: duplicateResult.existingProject?.id,
          existing_project_title: duplicateResult.existingProject?.title
        },
        created_at: new Date().toISOString()
      };

      // Note: This assumes a discovery_logs table exists
      // If it doesn't exist, this will be silently ignored
      await this.supabase
        .from('discovery_logs')
        .insert(logEntry);
    } catch (error) {
      console.error('Failed to log duplicate attempt:', error);
      // Don't throw - logging shouldn't break the main flow
    }
  }

  /**
   * Get repository health statistics
   * @returns Repository identity health metrics
   */
  async getRepositoryHealth(): Promise<{
    totalRepositories: number;
    repositoriesWithId: number;
    repositoriesWithNormalizedUrl: number;
    repositoriesWithOwner: number;
    repositoriesWithRepoName: number;
    identityHealthScore: number;
  }> {
    const { count: totalRepositories } = await this.supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .not('github_url', 'is', null);

    const { count: repositoriesWithId } = await this.supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .not('github_repository_id', 'is', null);

    const { count: repositoriesWithNormalizedUrl } = await this.supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .not('normalized_github_url', 'is', null);

    const { count: repositoriesWithOwner } = await this.supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .not('github_owner', 'is', null);

    const { count: repositoriesWithRepoName } = await this.supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .not('github_repo_name', 'is', null);

    const identityHealthScore = totalRepositories > 0
      ? Math.round(
          ((repositoriesWithId || 0) +
           (repositoriesWithNormalizedUrl || 0) +
           (repositoriesWithOwner || 0) +
           (repositoriesWithRepoName || 0)) / 
          (totalRepositories * 4) * 100
        )
      : 0;

    return {
      totalRepositories: totalRepositories || 0,
      repositoriesWithId: repositoriesWithId || 0,
      repositoriesWithNormalizedUrl: repositoriesWithNormalizedUrl || 0,
      repositoriesWithOwner: repositoriesWithOwner || 0,
      repositoriesWithRepoName: repositoriesWithRepoName || 0,
      identityHealthScore
    };
  }
}

// Singleton instance
let repositoryIdentityService: RepositoryIdentityService | null = null;

export function getRepositoryIdentityService(): RepositoryIdentityService {
  if (!repositoryIdentityService) {
    repositoryIdentityService = new RepositoryIdentityService();
  }
  return repositoryIdentityService;
}
