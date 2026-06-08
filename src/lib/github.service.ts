export interface GitHubRepository {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  topics: string[];
  language: string | null;
  languages: Record<string, number>;
  license: {
    name: string;
    spdx_id: string;
  } | null;
  stargazers_count: number;
  forks_count: number;
  owner: {
    login: string;
    avatar_url: string;
    type: string;
  };
  default_branch: string;
  created_at: string;
  updated_at: string;
  homepage: string | null;
  readme: string | null;
}

export interface GitHubImportData {
  repository: GitHubRepository;
  readme: string | null;
}

export class GitHubService {
  private static readonly API_BASE = 'https://api.github.com';
  private static readonly RAW_BASE = 'https://raw.githubusercontent.com';

  /**
   * Parse GitHub repository URL and extract owner and repo name
   */
  static parseRepositoryUrl(url: string): { owner: string; repo: string } | null {
    try {
      const parsedUrl = new URL(url);
      
      if (parsedUrl.hostname !== 'github.com') {
        return null;
      }

      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      
      if (pathParts.length < 2) {
        return null;
      }

      const owner = pathParts[0];
      const repo = pathParts[1].replace('.git', '');

      return { owner, repo };
    } catch {
      return null;
    }
  }

  /**
   * Fetch repository data from GitHub API
   */
  static async fetchRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const response = await fetch(
      `${this.API_BASE}/repos/${owner}/${repo}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Arpit-Labs-Import',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Repository not found. Please check the URL and ensure the repository is public.');
      }
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Fetch languages separately
    const languagesResponse = await fetch(
      `${this.API_BASE}/repos/${owner}/${repo}/languages`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Arpit-Labs-Import',
        },
      }
    );

    const languages = languagesResponse.ok ? await languagesResponse.json() : {};

    return {
      name: data.name,
      full_name: data.full_name,
      description: data.description,
      html_url: data.html_url,
      topics: data.topics || [],
      language: data.language,
      languages,
      license: data.license,
      stargazers_count: data.stargazers_count,
      forks_count: data.forks_count,
      owner: {
        login: data.owner.login,
        avatar_url: data.owner.avatar_url,
        type: data.owner.type,
      },
      default_branch: data.default_branch,
      created_at: data.created_at,
      updated_at: data.updated_at,
      homepage: data.homepage,
      readme: null, // Will be fetched separately
    };
  }

  /**
   * Fetch README content from repository
   */
  static async fetchReadme(owner: string, repo: string, branch: string = 'main'): Promise<string | null> {
    try {
      // Try to get README from API first
      const response = await fetch(
        `${this.API_BASE}/repos/${owner}/${repo}/readme`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Arpit-Labs-Import',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.encoding === 'base64') {
        const content = atob(data.content);
        return content;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Import complete repository data
   */
  static async importRepository(url: string): Promise<GitHubImportData> {
    const parsed = this.parseRepositoryUrl(url);
    
    if (!parsed) {
      throw new Error('Invalid GitHub repository URL. Please provide a valid URL like https://github.com/owner/repo');
    }

    const { owner, repo } = parsed;

    const repository = await this.fetchRepository(owner, repo);
    const readme = await this.fetchReadme(owner, repo, repository.default_branch);

    return {
      repository: {
        ...repository,
        readme,
      },
      readme,
    };
  }

  /**
   * Map repository topics to project taxonomy
   */
  static mapTopicsToTaxonomy(topics: string[]): string[] {
    const taxonomyMap: Record<string, string[]> = {
      'AI': ['ai', 'artificial-intelligence', 'machine-learning', 'ml', 'deep-learning', 'neural-network', 'nlp', 'natural-language-processing', 'computer-vision', 'llm', 'gpt', 'transformer', 'tensorflow', 'pytorch', 'hugging-face'],
      'Cybersecurity': ['security', 'cybersecurity', 'encryption', 'cryptography', 'penetration-testing', 'bug-bounty', 'hack', 'vulnerability', 'malware', 'firewall', 'authentication', 'authorization'],
      'Web Development': ['web', 'frontend', 'backend', 'fullstack', 'react', 'vue', 'angular', 'nextjs', 'nuxt', 'javascript', 'typescript', 'html', 'css', 'api', 'rest', 'graphql', 'http', 'websocket'],
      'Cloud': ['cloud', 'aws', 'azure', 'gcp', 'google-cloud', 'serverless', 'kubernetes', 'k8s', 'docker', 'container', 'devops', 'infrastructure', 'terraform', 'ansible'],
      'DevOps': ['devops', 'ci-cd', 'cicd', 'jenkins', 'github-actions', 'gitlab-ci', 'deployment', 'monitoring', 'logging', 'prometheus', 'grafana', 'elk', 'elasticsearch'],
      'Mobile': ['mobile', 'ios', 'android', 'react-native', 'flutter', 'swift', 'kotlin', 'mobile-app', 'app-store', 'play-store'],
      'IoT': ['iot', 'internet-of-things', 'embedded', 'arduino', 'raspberry-pi', 'esp32', 'sensor', 'hardware', 'firmware', 'microcontroller', 'smart-home'],
    };

    const detectedTaxonomies = new Set<string>();

    for (const [taxonomy, keywords] of Object.entries(taxonomyMap)) {
      const lowerTopics = topics.map(t => t.toLowerCase());
      const hasMatch = keywords.some(keyword => 
        lowerTopics.some(topic => topic.includes(keyword))
      );
      
      if (hasMatch) {
        detectedTaxonomies.add(taxonomy);
      }
    }

    return Array.from(detectedTaxonomies);
  }

  /**
   * Extract languages from GitHub language data
   */
  static extractLanguages(languages: Record<string, number>): string[] {
    return Object.keys(languages);
  }

  /**
   * Generate a slug from repository name
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Generate a cover image placeholder URL
   */
  static generateCoverPlaceholder(owner: string, repo: string): string {
    // Using GitHub's social preview as a placeholder
    return `https://opengraph.githubassets.com/1/${owner}/${repo}`;
  }
}
