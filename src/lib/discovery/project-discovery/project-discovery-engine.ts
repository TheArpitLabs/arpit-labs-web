/**
 * Real GitHub Project Discovery Engine
 *
 * Discovers public repositories from GitHub, validates repository quality,
 * classifies them into Axiora project categories, deduplicates against the
 * existing projects table, and stores real repository metadata.
 */

import { Octokit } from "@octokit/rest";
import { supabaseServer } from "@/lib/supabase/server";
import {
  buildGitHubProjectTags,
  classifyGitHubRepository,
  createGitHubProjectInsertPayload,
  createGitHubRepositorySearchQuery,
  getGitHubProjectDuplicateKeys,
  getGitHubRepositoryRejectionReason,
  normalizeGitHubDiscoveryConfig,
} from "./github-discovery-core";
import { validateRepositoryData, type RepositoryDataInput } from "./repository-data-validator";
import { calculateRepositoryScore } from "./repository-quality-engine";
import { logQualityDecision } from "./quality-logger";
import { logger } from '@/lib/logger';

export type ProjectCategory =
  | "Artificial Intelligence"
  | "Machine Learning"
  | "Deep Learning"
  | "NLP"
  | "Computer Vision"
  | "Web Development"
  | "DevOps"
  | "Cloud Computing"
  | "Cybersecurity"
  | "Robotics"
  | "IoT";

export interface ProjectDiscoveryConfig {
  categories: ProjectCategory[];
  maxResultsPerCategory: number;
  minStars: number;
  minForks: number;
  page?: number;
  limit?: number;
  enabled: boolean;
}

export interface IngestionStatistics {
  totalFetched: number;
  totalInserted: number;
  totalSkipped: number;
  totalDuplicates: number;
  totalFailed: number;
  newProjects: number;
  duplicateProjects: number;
  failedImports: number;
  categoriesProcessed: string[];
  startTime: Date;
  endTime?: Date;
  lastRunTime?: Date;
  errors: Array<{ category: string; error: string; repository?: string }>;
}

export interface DiscoveredProject {
  title: string;
  slug: string;
  description: string;
  category: ProjectCategory;
  tags: string[];
  github_url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  language: string;
  languages: string[];
  topics: string[];
  owner: string;
  owner_avatar_url: string;
  full_name: string;
  repo_created_at: string;
  repo_updated_at: string;
  license?: string | null;
  // Quality metrics
  repository_score?: number;
  quality_grade?: string;
  contributors_count?: number;
  github_repository_id?: number;
  last_commit_at?: string;
  quality_metadata?: Record<string, any>;
  // Validation metrics (Phase 5)
  validation_score?: number;
  validation_status?: 'passed' | 'failed' | 'skipped';
  validation_errors?: string[];
  validation_metadata?: Record<string, any>;
}

type GitHubSearchRepository = Awaited<
  ReturnType<Octokit["search"]["repos"]>
>["data"]["items"][number];

const DEFAULT_CATEGORIES: ProjectCategory[] = [
  "Artificial Intelligence",
  "Machine Learning",
  "Deep Learning",
  "NLP",
  "Computer Vision",
  "Web Development",
  "DevOps",
  "Cloud Computing",
  "Cybersecurity",
  "Robotics",
  "IoT",
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export class GitHubDiscoveryEngine {
  private isRunning = false;
  private shouldStop = false;
  private statistics: IngestionStatistics;
  private logs: Array<{ timestamp: Date; level: string; message: string }> = [];
  private readonly octokit: Octokit;

  private readonly categoryQueries: Record<ProjectCategory, string[]> = {
    "Artificial Intelligence": [
      "artificial intelligence",
      "ai agent",
      "large language model",
      "tensorflow OR pytorch OR huggingface",
    ],
    "Machine Learning": [
      "machine learning",
      "scikit-learn",
      "mlops",
      "predictive model",
    ],
    "Deep Learning": [
      "deep learning",
      "neural network",
      "transformer model",
      "pytorch tensorflow",
    ],
    NLP: [
      "natural language processing",
      "nlp",
      "sentiment analysis",
      "bert gpt transformer",
    ],
    "Computer Vision": [
      "computer vision",
      "object detection",
      "image segmentation",
      "opencv yolo",
    ],
    "Web Development": [
      "nextjs react",
      "vue web application",
      "full stack web",
      "web framework",
    ],
    DevOps: [
      "devops",
      "ci cd",
      "kubernetes docker",
      "terraform infrastructure",
    ],
    "Cloud Computing": [
      "cloud computing",
      "aws serverless",
      "azure cloud",
      "gcp kubernetes",
    ],
    Cybersecurity: [
      "cybersecurity",
      "penetration testing",
      "cryptography",
      "vulnerability scanner",
    ],
    Robotics: [
      "robotics",
      "ros robot",
      "robot arm",
      "autonomous robot",
    ],
    IoT: [
      "iot",
      "internet of things",
      "arduino esp32",
      "raspberry pi sensor",
    ],
  };

  constructor() {
    const tokenLoaded = !!process.env.GITHUB_TOKEN;
    logger.info('GitHub Auth', { status: tokenLoaded ? "Loaded" : "Missing" });
    
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN || undefined,
      userAgent: "Arpit-Labs-Real-GitHub-Discovery/1.0",
    });
    this.statistics = this.createEmptyStatistics();
  }

  async startDiscovery(config: ProjectDiscoveryConfig): Promise<IngestionStatistics> {
    if (this.isRunning) {
      throw new Error("Discovery is already running");
    }

    const normalizedConfig = normalizeGitHubDiscoveryConfig(config);
    if (!normalizedConfig.enabled) {
      throw new Error("Discovery is disabled");
    }

    this.isRunning = true;
    this.shouldStop = false;
    this.statistics = this.createEmptyStatistics();
    this.logs = [];

    this.log("info", "Starting real GitHub discovery engine");
    this.log("info", `Categories: ${normalizedConfig.categories.join(", ")}`);

    try {
      for (const category of normalizedConfig.categories) {
        if (this.shouldStop) {
          this.log("warning", "Discovery stopped by admin request");
          break;
        }

        await this.discoverCategory(category, normalizedConfig);
      }

      this.statistics.endTime = new Date();
      this.statistics.lastRunTime = this.statistics.endTime;
      this.log("info", `Discovery completed. Fetched ${this.statistics.totalFetched}, inserted ${this.statistics.totalInserted}, skipped ${this.statistics.totalSkipped}, duplicates ${this.statistics.totalDuplicates}, failed ${this.statistics.totalFailed}.`);
      return this.getStatistics();
    } catch (error) {
      this.statistics.endTime = new Date();
      this.statistics.lastRunTime = this.statistics.endTime;
      this.log("error", `Discovery failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  stopDiscovery(): void {
    if (this.isRunning) {
      this.shouldStop = true;
      this.log("warning", "Stop signal sent");
    }
  }

  getStatistics(): IngestionStatistics {
    return { ...this.statistics, errors: [...this.statistics.errors] };
  }

  getLogs(): Array<{ timestamp: Date; level: string; message: string }> {
    return [...this.logs];
  }

  getCategories(): ProjectCategory[] {
    return [...DEFAULT_CATEGORIES];
  }

  isActive(): boolean {
    return this.isRunning;
  }

  private async discoverCategory(category: ProjectCategory, config: Required<ProjectDiscoveryConfig>): Promise<void> {
    this.log("info", `Processing category: ${category}`);

    const repositories = new Map<string, DiscoveredProject>();
    const queries = this.categoryQueries[category];

    for (const query of queries) {
      if (this.shouldStop) break;

      try {
        const discovered = await this.searchRepositories(query, category, config);
        for (const project of discovered) {
          repositories.set(project.github_url, project);
        }
      } catch (error) {
        this.recordFailure(category, error instanceof Error ? error.message : "Unknown search error", query);
      }
    }

    await this.ingestProjects([...repositories.values()]);
    this.statistics.categoriesProcessed.push(category);
    this.log("info", `Completed category ${category}. Unique valid repositories: ${repositories.size}`);
  }

  private async searchRepositories(
    query: string,
    category: ProjectCategory,
    config: Required<ProjectDiscoveryConfig>
  ): Promise<DiscoveredProject[]> {
    const page = Math.max(1, config.page || 1);
    const perPage = Math.min(Math.max(config.limit || config.maxResultsPerCategory, 1), 100);
    const searchQuery = createGitHubRepositorySearchQuery(query, config);

    this.log("debug", `GitHub search: ${searchQuery}`);

    const response = await this.octokit.search.repos({
      q: searchQuery,
      sort: "stars",
      order: "desc",
      page,
      per_page: perPage,
    });

    const projects: DiscoveredProject[] = [];
    for (const repo of response.data.items) {
      if (this.shouldStop) break;

      this.statistics.totalFetched++;
      const project = await this.transformRepository(repo, category, config);
      if (project) {
        projects.push(project);
      }
    }

    return projects;
  }

  private async transformRepository(
    searchRepo: GitHubSearchRepository,
    fallbackCategory: ProjectCategory,
    config: ProjectDiscoveryConfig
  ): Promise<DiscoveredProject | null> {
    try {
      const [owner, repoName] = searchRepo.full_name.split("/");
      const [{ data: repo }, { data: languages }, { data: contributors }] = await Promise.all([
        this.octokit.repos.get({ owner, repo: repoName }),
        this.octokit.repos.listLanguages({ owner, repo: repoName }),
        this.octokit.repos.listContributors({ owner, repo: repoName, per_page: 100 }).catch(() => ({ data: [] })),
      ]);

      // First, check basic GitHub rejection rules
      const rejectionReason = getGitHubRepositoryRejectionReason(repo, config.minStars);
      if (rejectionReason) {
        this.statistics.totalSkipped++;
        this.log("debug", `Skipped ${repo.full_name}: ${rejectionReason}`);
        return null;
      }

      const languageNames = Object.keys(languages);
      const classifiedCategory = classifyGitHubRepository(repo, languageNames, fallbackCategory);
      const slug = generateSlug(repo.name);
      const topics = repo.topics || [];

      // Validate against quality rules using new validator
      const validationInput: RepositoryDataInput = {
        title: repo.name,
        description: repo.description || undefined,
        github_url: repo.html_url,
        category: classifiedCategory,
        language: repo.language || languageNames[0] || "Unknown",
        stars: repo.stargazers_count || 0,
        archived: repo.archived,
        disabled: false,
        topics: repo.topics,
        owner: repo.owner?.login || owner,
        homepage_url: repo.homepage || undefined,
        avatar_url: repo.owner?.avatar_url || undefined,
        repository_url: repo.html_url,
      };

      const validation = validateRepositoryData(validationInput);

      if (validation.shouldReject) {
        this.statistics.totalSkipped++;
        this.log("debug", `Rejected ${repo.full_name}: ${validation.errors.join(', ')} (score: ${validation.validationScore})`);

        // Log quality decision
        await logQualityDecision({
          repository: repo.full_name,
          score: validation.validationScore || 0,
          grade: validation.validationStatus === 'passed' ? 'A' : 'Reject',
          status: 'rejected',
          reason: validation.errors.join(', '),
          metadata: {
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            contributors: contributors.length,
            hasLicense: !!repo.license?.name,
            hasHomepage: !!repo.homepage,
            topicCount: repo.topics?.length || 0,
            descriptionLength: repo.description?.length || 0,
          },
        });

        return null;
      }

      // Calculate quality score
      const qualityResult = calculateRepositoryScore({
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        contributors: contributors.length,
        hasLicense: !!repo.license?.name,
        hasHomepage: !!repo.homepage,
        topics: topics,
        description: repo.description || "",
        lastCommitAt: repo.pushed_at,
        createdAt: repo.created_at,
      });

      // Log quality decision for accepted repository
      await logQualityDecision({
        repository: repo.full_name,
        score: qualityResult.score,
        grade: qualityResult.grade,
        status: 'accepted',
        metadata: {
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          contributors: contributors.length,
          hasLicense: !!repo.license?.name,
          hasHomepage: !!repo.homepage,
          topicCount: topics.length,
          descriptionLength: repo.description?.length || 0,
          daysSinceLastCommit: qualityResult.metadata.daysSinceLastCommit,
        },
      });

      return {
        title: repo.name,
        slug,
        description: repo.description || "",
        category: classifiedCategory,
        tags: buildGitHubProjectTags(classifiedCategory, topics, languageNames),
        github_url: repo.html_url,
        homepage: repo.homepage || null,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        language: repo.language || languageNames[0] || "Unknown",
        languages: languageNames,
        topics,
        owner: repo.owner?.login || owner,
        owner_avatar_url: repo.owner?.avatar_url || "",
        full_name: repo.full_name,
        repo_created_at: repo.created_at || new Date().toISOString(),
        repo_updated_at: repo.updated_at || new Date().toISOString(),
        license: repo.license?.name || null,
        // Quality metrics
        repository_score: qualityResult.score,
        quality_grade: qualityResult.grade,
        contributors_count: contributors.length,
        github_repository_id: repo.id,
        last_commit_at: repo.pushed_at,
        quality_metadata: qualityResult.metadata,
        // Validation metrics (Phase 5)
        validation_score: validation.validationScore,
        validation_status: validation.validationStatus,
        validation_errors: validation.errors,
        validation_metadata: validation.metadata,
      };
    } catch (error) {
      this.recordFailure(fallbackCategory, error instanceof Error ? error.message : "Failed to validate repository", searchRepo.full_name);
      return null;
    }
  }

  private async ingestProjects(projects: DiscoveredProject[]): Promise<void> {
    for (const project of projects) {
      if (this.shouldStop) break;

      try {
        const duplicate = await this.findDuplicate(project);
        if (duplicate) {
          this.statistics.totalDuplicates++;
          this.statistics.duplicateProjects++;
          this.log("debug", `Duplicate skipped: ${project.full_name} (${duplicate})`);
          continue;
        }

        const payload = createGitHubProjectInsertPayload(project);
        
        // Debug logging before insert
        logger.info('Inserting project', {
          repo: project.full_name,
          stars: project.stars,
          topics: project.topics?.length || 0,
          owner: project.owner,
          github_stars: payload.github_stars,
          repository_topics: payload.repository_topics?.length || 0,
          github_owner: payload.github_owner,
          forks: payload.forks,
          contributors_count: payload.contributors_count,
          github_repository_id: payload.github_repository_id,
        });
        
        const { error } = await supabaseServer.from("projects").insert(payload);

        if (error) {
          throw error;
        }

        this.statistics.totalInserted++;
        this.statistics.newProjects++;
        this.log("info", `Inserted ${project.full_name} as ${project.category}`);
      } catch (error) {
        this.recordFailure(project.category, error instanceof Error ? error.message : "Insert failed", project.full_name);
      }
    }
  }

  private async findDuplicate(project: DiscoveredProject): Promise<"github_url" | "slug" | null> {
    const duplicateKeys = getGitHubProjectDuplicateKeys(project);
    const { data: githubDuplicate, error: githubError } = await supabaseServer
      .from("projects")
      .select("id")
      .eq("github_url", duplicateKeys.github_url)
      .limit(1)
      .maybeSingle();

    if (githubError) throw githubError;
    if (githubDuplicate) return "github_url";

    const { data: slugDuplicate, error: slugError } = await supabaseServer
      .from("projects")
      .select("id")
      .eq("slug", duplicateKeys.slug)
      .limit(1)
      .maybeSingle();

    if (slugError) throw slugError;
    return slugDuplicate ? "slug" : null;
  }

  private createEmptyStatistics(): IngestionStatistics {
    return {
      totalFetched: 0,
      totalInserted: 0,
      totalSkipped: 0,
      totalDuplicates: 0,
      totalFailed: 0,
      newProjects: 0,
      duplicateProjects: 0,
      failedImports: 0,
      categoriesProcessed: [],
      startTime: new Date(),
      errors: [],
    };
  }

  private recordFailure(category: string, error: string, repository?: string): void {
    this.statistics.totalFailed++;
    this.statistics.failedImports++;
    this.statistics.errors.push({ category, error, repository });
    this.log("error", `${repository ? `${repository}: ` : ""}${error}`);
  }

  private log(level: string, message: string): void {
    this.logs.push({ timestamp: new Date(), level, message });
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }
}

export { GitHubDiscoveryEngine as ProjectDiscoveryEngine };
export {
  buildGitHubProjectTags,
  classifyGitHubRepository,
  createGitHubProjectInsertPayload,
  createGitHubRepositorySearchQuery,
  getGitHubProjectDuplicateKeys,
  getGitHubRepositoryRejectionReason,
  normalizeGitHubDiscoveryConfig,
} from "./github-discovery-core";

let discoveryEngineInstance: GitHubDiscoveryEngine | null = null;

export function getProjectDiscoveryEngine(): GitHubDiscoveryEngine {
  if (!discoveryEngineInstance) {
    discoveryEngineInstance = new GitHubDiscoveryEngine();
  }
  return discoveryEngineInstance;
}
