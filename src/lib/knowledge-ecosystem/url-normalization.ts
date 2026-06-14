/**
 * URL Normalization Service
 * Normalizes URLs from various providers to canonical forms for duplicate detection
 */

export interface NormalizedUrl {
  original: string;
  canonical: string;
  provider: string;
  owner: string;
  repo: string;
  isValid: boolean;
}

/**
 * Normalize a repository URL to its canonical form
 */
export function normalizeRepositoryUrl(url: string): NormalizedUrl {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    // GitHub normalization
    if (hostname === 'github.com' || hostname === 'www.github.com') {
      return normalizeGitHubUrl(parsed, url);
    }
    
    // GitLab normalization
    if (hostname === 'gitlab.com' || hostname === 'www.gitlab.com') {
      return normalizeGitLabUrl(parsed, url);
    }
    
    // Devpost normalization
    if (hostname === 'devpost.com' || hostname === 'www.devpost.com') {
      return normalizeDevpostUrl(parsed, url);
    }
    
    // Kaggle normalization
    if (hostname === 'kaggle.com' || hostname === 'www.kaggle.com') {
      return normalizeKaggleUrl(parsed, url);
    }
    
    // Hugging Face normalization
    if (hostname === 'huggingface.co' || hostname === 'www.huggingface.co') {
      return normalizeHuggingFaceUrl(parsed, url);
    }
    
    // Unknown provider
    return {
      original: url,
      canonical: url,
      provider: 'unknown',
      owner: '',
      repo: '',
      isValid: false
    };
  } catch {
    return {
      original: url,
      canonical: url,
      provider: 'unknown',
      owner: '',
      repo: '',
      isValid: false
    };
  }
}

/**
 * Normalize GitHub URLs
 * Examples:
 * https://github.com/user/project -> github.com/user/project
 * https://github.com/user/project.git -> github.com/user/project
 * https://github.com/user/project/ -> github.com/user/project
 */
function normalizeGitHubUrl(parsed: URL, original: string): NormalizedUrl {
  const pathParts = parsed.pathname.split('/').filter(Boolean);
  
  if (pathParts.length < 2) {
    return {
      original,
      canonical: original,
      provider: 'github',
      owner: '',
      repo: '',
      isValid: false
    };
  }
  
  const owner = pathParts[0];
  const repo = pathParts[1].replace(/\.git$/, '');
  const canonical = `github.com/${owner}/${repo}`;
  
  return {
    original,
    canonical,
    provider: 'github',
    owner,
    repo,
    isValid: true
  };
}

/**
 * Normalize GitLab URLs
 * Similar pattern to GitHub but with GitLab-specific handling
 */
function normalizeGitLabUrl(parsed: URL, original: string): NormalizedUrl {
  const pathParts = parsed.pathname.split('/').filter(Boolean);
  
  if (pathParts.length < 2) {
    return {
      original,
      canonical: original,
      provider: 'gitlab',
      owner: '',
      repo: '',
      isValid: false
    };
  }
  
  const owner = pathParts[0];
  const repo = pathParts[1].replace(/\.git$/, '');
  const canonical = `gitlab.com/${owner}/${repo}`;
  
  return {
    original,
    canonical,
    provider: 'gitlab',
    owner,
    repo,
    isValid: true
  };
}

/**
 * Normalize Devpost URLs
 * Devpost URLs have a different structure: devpost.com/software/project-name
 */
function normalizeDevpostUrl(parsed: URL, original: string): NormalizedUrl {
  const pathParts = parsed.pathname.split('/').filter(Boolean);
  
  if (pathParts.length < 2) {
    return {
      original,
      canonical: original,
      provider: 'devpost',
      owner: '',
      repo: '',
      isValid: false
    };
  }
  
  // Devpost URLs are typically: /software/project-name or /api/project-name
  const type = pathParts[0];
  const repo = pathParts[1];
  const canonical = `devpost.com/${type}/${repo}`;
  
  return {
    original,
    canonical,
    provider: 'devpost',
    owner: '', // Devpost doesn't have owners in the same way
    repo,
    isValid: true
  };
}

/**
 * Normalize Kaggle URLs
 * Kaggle URLs: kaggle.com/datasets/owner/dataset-name or kaggle.com/code/owner/code-name
 */
function normalizeKaggleUrl(parsed: URL, original: string): NormalizedUrl {
  const pathParts = parsed.pathname.split('/').filter(Boolean);
  
  if (pathParts.length < 3) {
    return {
      original,
      canonical: original,
      provider: 'kaggle',
      owner: '',
      repo: '',
      isValid: false
    };
  }
  
  const type = pathParts[0]; // datasets, code, models
  const owner = pathParts[1];
  const repo = pathParts[2];
  const canonical = `kaggle.com/${type}/${owner}/${repo}`;
  
  return {
    original,
    canonical,
    provider: 'kaggle',
    owner,
    repo,
    isValid: true
  };
}

/**
 * Normalize Hugging Face URLs
 * Hugging Face URLs: huggingface.co/owner/repo or huggingface.co/datasets/owner/repo
 */
function normalizeHuggingFaceUrl(parsed: URL, original: string): NormalizedUrl {
  const pathParts = parsed.pathname.split('/').filter(Boolean);
  
  if (pathParts.length < 2) {
    return {
      original,
      canonical: original,
      provider: 'huggingface',
      owner: '',
      repo: '',
      isValid: false
    };
  }
  
  let owner, repo, type = '';
  
  // Handle different Hugging Face URL patterns
  if (pathParts[0] === 'datasets' || pathParts[0] === 'models' || pathParts[0] === 'spaces') {
    type = pathParts[0];
    owner = pathParts[1];
    repo = pathParts[2];
  } else {
    owner = pathParts[0];
    repo = pathParts[1];
  }
  
  const canonical = type ? `huggingface.co/${type}/${owner}/${repo}` : `huggingface.co/${owner}/${repo}`;
  
  return {
    original,
    canonical,
    provider: 'huggingface',
    owner,
    repo,
    isValid: true
  };
}

/**
 * Batch normalize multiple URLs
 */
export function normalizeRepositoryUrls(urls: string[]): NormalizedUrl[] {
  return urls.map(url => normalizeRepositoryUrl(url));
}

/**
 * Extract repository ID from normalized URL
 * Format: provider/owner/repo or provider/type/owner/repo
 */
export function extractRepositoryId(normalizedUrl: string): string {
  return normalizedUrl;
}

/**
 * Check if two URLs are duplicates after normalization
 */
export function areUrlsDuplicate(url1: string, url2: string): boolean {
  const norm1 = normalizeRepositoryUrl(url1);
  const norm2 = normalizeRepositoryUrl(url2);
  
  if (!norm1.isValid || !norm2.isValid) {
    return false;
  }
  
  return norm1.canonical === norm2.canonical;
}
