/**
 * GitHub URL Normalizer
 * 
 * Normalizes GitHub repository URLs to a standard format for deduplication.
 * 
 * Converts:
 * - https://github.com/vercel/next.js/
 * - https://github.com/vercel/next.js.git
 * - https://www.github.com/vercel/next.js
 * 
 * Into:
 * - github.com/vercel/next.js
 */

export interface GitHubUrlParts {
  owner: string;
  repo: string;
  normalized: string;
}

export class GitHubUrlNormalizer {
  /**
   * Normalize a GitHub URL to standard format
   * @param url - GitHub repository URL
   * @returns Normalized URL in format: github.com/owner/repo
   */
  static normalizeGithubUrl(url: string): string {
    if (!url) return '';
    
    try {
      // Remove whitespace
      const trimmed = url.trim();
      
      // Parse URL
      let parsed: URL;
      try {
        parsed = new URL(trimmed);
      } catch {
        // If not a valid URL, try to construct one
        if (trimmed.startsWith('github.com/')) {
          return trimmed;
        }
        if (trimmed.includes('github.com/')) {
          const match = trimmed.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          if (match) {
            return `github.com/${match[1]}/${match[2]}`;
          }
        }
        return trimmed;
      }
      
      // Remove www. prefix
      let hostname = parsed.hostname.replace(/^www\./, '');
      
      // Ensure github.com domain
      if (!hostname.endsWith('github.com')) {
        return trimmed;
      }
      
      // Remove .git suffix from path
      let pathname = parsed.pathname;
      if (pathname.endsWith('.git')) {
        pathname = pathname.slice(0, -4);
      }
      
      // Remove trailing slash
      pathname = pathname.replace(/\/$/, '');
      
      // Extract owner and repo from path
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const owner = parts[0];
        const repo = parts[1];
        return `github.com/${owner}/${repo}`;
      }
      
      return trimmed;
    } catch (error) {
      console.error('Error normalizing GitHub URL:', error);
      return url;
    }
  }

  /**
   * Extract owner and repo name from GitHub URL
   * @param url - GitHub repository URL
   * @returns Object with owner, repo, and normalized URL
   */
  static extractGitHubUrlParts(url: string): GitHubUrlParts | null {
    const normalized = this.normalizeGithubUrl(url);
    if (!normalized) return null;
    
    const parts = normalized.split('/');
    if (parts.length >= 3 && parts[0] === 'github.com') {
      return {
        owner: parts[1],
        repo: parts[2],
        normalized: normalized
      };
    }
    
    return null;
  }

  /**
   * Extract repository ID from GitHub API URL
   * @param apiUrl - GitHub API URL (e.g., https://api.github.com/repos/vercel/next.js)
   * @returns Repository ID as number or null
   */
  static extractRepositoryId(apiUrl: string): number | null {
    try {
      const match = apiUrl.match(/\/repos\/([^\/]+)\/([^\/]+)/);
      if (match) {
        // This would need to be called with the actual API response
        // The repository ID comes from the API response, not the URL
        return null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if a URL is a valid GitHub repository URL
   * @param url - URL to check
   * @returns true if valid GitHub repository URL
   */
  static isValidGitHubUrl(url: string): boolean {
    if (!url) return false;
    
    const normalized = this.normalizeGithubUrl(url);
    const parts = normalized.split('/');
    
    return (
      parts.length === 3 &&
      parts[0] === 'github.com' &&
      parts[1].length > 0 &&
      parts[2].length > 0
    );
  }

  /**
   * Compare two GitHub URLs to see if they refer to the same repository
   * @param url1 - First GitHub URL
   * @param url2 - Second GitHub URL
   * @returns true if URLs refer to the same repository
   */
  static areSameRepository(url1: string, url2: string): boolean {
    const norm1 = this.normalizeGithubUrl(url1);
    const norm2 = this.normalizeGithubUrl(url2);
    
    return norm1 === norm2 && norm1 !== '';
  }

  /**
   * Generate GitHub API URL from normalized URL
   * @param normalizedUrl - Normalized GitHub URL
   * @returns GitHub API URL
   */
  static toApiUrl(normalizedUrl: string): string {
    const parts = normalizedUrl.split('/');
    if (parts.length >= 3 && parts[0] === 'github.com') {
      return `https://api.github.com/repos/${parts[1]}/${parts[2]}`;
    }
    return normalizedUrl;
  }

  /**
   * Generate GitHub HTML URL from normalized URL
   * @param normalizedUrl - Normalized GitHub URL
   * @returns GitHub HTML URL
   */
  static toHtmlUrl(normalizedUrl: string): string {
    const parts = normalizedUrl.split('/');
    if (parts.length >= 3 && parts[0] === 'github.com') {
      return `https://github.com/${parts[1]}/${parts[2]}`;
    }
    return normalizedUrl;
  }
}

/**
 * Convenience function for URL normalization
 */
export function normalizeGithubUrl(url: string): string {
  return GitHubUrlNormalizer.normalizeGithubUrl(url);
}

/**
 * Convenience function for extracting URL parts
 */
export function extractGitHubUrlParts(url: string): GitHubUrlParts | null {
  return GitHubUrlNormalizer.extractGitHubUrlParts(url);
}
