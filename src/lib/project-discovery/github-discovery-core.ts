import type { DiscoveredProject, ProjectCategory, ProjectDiscoveryConfig } from "./project-discovery-engine";

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

const CLASSIFICATION_KEYWORDS: Record<ProjectCategory, string[]> = {
  "Artificial Intelligence": ["artificial-intelligence", "ai", "ai-agent", "llm", "gpt", "openai", "huggingface"],
  "Machine Learning": ["machine-learning", "ml", "scikit-learn", "model-training", "mlops", "prediction"],
  "Deep Learning": ["deep-learning", "neural-network", "tensorflow", "pytorch", "keras", "transformer"],
  NLP: ["nlp", "natural-language-processing", "language-model", "sentiment-analysis", "bert", "text-classification"],
  "Computer Vision": ["computer-vision", "opencv", "yolo", "object-detection", "image-segmentation", "vision"],
  "Web Development": ["web", "react", "nextjs", "vue", "frontend", "backend", "fullstack", "javascript", "typescript"],
  DevOps: ["devops", "ci-cd", "docker", "kubernetes", "terraform", "deployment", "monitoring"],
  "Cloud Computing": ["cloud", "aws", "azure", "gcp", "serverless", "infrastructure", "lambda"],
  Cybersecurity: ["security", "cybersecurity", "penetration-testing", "cryptography", "vulnerability", "infosec"],
  Robotics: ["robotics", "robot", "ros", "drone", "autonomous", "motion-planning"],
  IoT: ["iot", "internet-of-things", "arduino", "raspberry-pi", "esp32", "embedded", "sensor"],
};

export interface GitHubRepositoryValidationInput {
  private?: boolean;
  archived?: boolean;
  disabled?: boolean;
  description?: string | null;
  stargazers_count?: number | null;
  html_url?: string | null;
}

export interface GitHubRepositoryClassificationInput {
  name?: string | null;
  full_name?: string | null;
  description?: string | null;
  language?: string | null;
  topics?: string[] | null;
}

export function getGitHubRepositoryRejectionReason(repo: GitHubRepositoryValidationInput, minStars: number): string | null {
  if (repo.private) return "repository is private";
  if (repo.archived) return "repository is archived";
  if (repo.disabled) return "repository is disabled";
  if (!repo.description || repo.description.trim().length < 8) return "missing useful description";
  if ((repo.stargazers_count || 0) <= minStars) return `stars <= ${minStars}`;
  if (!repo.html_url?.startsWith("https://github.com/")) return "invalid GitHub URL";
  return null;
}

export function classifyGitHubRepository(
  repo: GitHubRepositoryClassificationInput,
  languages: string[],
  fallbackCategory: ProjectCategory
): ProjectCategory {
  const haystack = [
    repo.name || "",
    repo.full_name || "",
    repo.description || "",
    repo.language || "",
    ...languages,
    ...(repo.topics || []),
  ].join(" ").toLowerCase();

  let bestCategory = fallbackCategory;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CLASSIFICATION_KEYWORDS) as Array<[ProjectCategory, string[]]>) {
    const score = keywords.reduce((sum, keyword) => {
      return haystack.includes(keyword.toLowerCase()) ? sum + 1 : sum;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

export function buildGitHubProjectTags(category: ProjectCategory, topics: string[], languages: string[]): string[] {
  const normalized = [category, ...topics, ...languages]
    .map((tag) => tag.trim())
    .filter(Boolean);

  return [...new Set(normalized)].slice(0, 16);
}

export function domainForGitHubCategory(category: ProjectCategory): string {
  if (["Artificial Intelligence", "Machine Learning", "Deep Learning", "NLP", "Computer Vision"].includes(category)) {
    return "AI & Machine Learning";
  }
  if (["Web Development", "DevOps", "Cloud Computing"].includes(category)) {
    return "Software Development";
  }
  if (category === "Cybersecurity") return "Cybersecurity";
  if (category === "Robotics") return "Robotics";
  if (category === "IoT") return "IoT & Embedded Systems";
  return "Engineering";
}

function generateSlugAssetName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function createGitHubProjectInsertPayload(project: DiscoveredProject) {
  const technologies = {
    language: [project.language].filter(Boolean),
    languages: project.languages,
    topics: project.topics,
    source: ["GitHub"],
    owner: [project.owner],
    owner_avatar_url: [project.owner_avatar_url].filter(Boolean),
    repository: [project.full_name],
    license: project.license ? [project.license] : [],
  };

  const content = [
    project.description,
    "",
    `Repository: ${project.github_url}`,
    `Owner: ${project.owner}`,
    `Stars: ${project.stars.toLocaleString()}`,
    `Forks: ${project.forks.toLocaleString()}`,
    project.homepage ? `Homepage: ${project.homepage}` : null,
  ].filter(Boolean).join("\n");

  return {
    title: project.title,
    slug: project.slug,
    description: project.description,
    content,
    overview: project.description,
    project_type: "opensource",
    branch: "Engineering",
    domain: domainForGitHubCategory(project.category),
    category: project.category,
    technologies,
    languages: project.languages,
    frameworks: [],
    tools: { github: [project.owner] },
    github_url: project.github_url,
    demo_url: project.homepage,
    cover_image: `https://opengraph.githubassets.com/1/${project.owner}/${generateSlugAssetName(project.title)}`,
    status: "pending",
    published: false,
    featured: false,
    owner_id: null,
    tags: project.tags,
    tech_stack: project.languages,
    views_count: 0,
    likes_count: 0,
    stars: project.stars,
    forks: project.forks,
    language: project.language,
    github_stars: project.stars,
    created_at: project.repo_created_at,
    updated_at: project.repo_updated_at,
    // Quality metrics
    github_repository_id: project.github_repository_id,
    repository_score: project.repository_score || 0,
    quality_grade: project.quality_grade || 'Unknown',
    contributors_count: project.contributors_count || 0,
    last_commit_at: project.last_commit_at,
    repository_topics: project.topics,
    quality_metadata: project.quality_metadata || {},
    // Repository identity
    github_owner: project.owner,
    github_repo_name: project.title,
    // Validation metrics (Phase 5)
    validation_score: project.validation_score || 0,
    validation_status: project.validation_status || 'pending',
    validation_errors: project.validation_errors || [],
    validated_at: new Date().toISOString(),
    validation_metadata: project.validation_metadata || {},
  };
}

export function getGitHubProjectDuplicateKeys(project: Pick<DiscoveredProject, "github_url" | "slug">) {
  return {
    github_url: project.github_url,
    slug: project.slug,
  };
}

export function normalizeGitHubDiscoveryConfig(config: ProjectDiscoveryConfig): Required<ProjectDiscoveryConfig> {
  const categories = (config.categories?.length ? config.categories : DEFAULT_CATEGORIES)
    .filter((category): category is ProjectCategory => DEFAULT_CATEGORIES.includes(category as ProjectCategory));

  return {
    categories: categories.length ? categories : DEFAULT_CATEGORIES,
    maxResultsPerCategory: Math.min(Math.max(config.maxResultsPerCategory || 24, 1), 100),
    minStars: Math.max(config.minStars ?? 50, 50),
    minForks: Math.max(config.minForks ?? 0, 0),
    page: Math.max(config.page || 1, 1),
    limit: Math.min(Math.max(config.limit || config.maxResultsPerCategory || 24, 1), 100),
    enabled: config.enabled !== false,
  };
}

export function createGitHubRepositorySearchQuery(query: string, config: Required<ProjectDiscoveryConfig>): string {
  return `${query} stars:>${config.minStars} forks:>=${config.minForks} is:public archived:false fork:false`;
}
