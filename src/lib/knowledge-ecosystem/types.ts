export type AcquisitionProvider =
  | "github"
  | "gitlab"
  | "devpost"
  | "kaggle"
  | "huggingface"
  | "arxiv"
  | "research_paper";

export type AcquisitionStatus = "queued" | "analyzing" | "approved" | "rejected" | "imported" | "duplicate" | "failed";

export type KnowledgeEntityType =
  | "project"
  | "research"
  | "dataset"
  | "api"
  | "contributor"
  | "organization";

export type SearchMode = "keyword" | "vector" | "hybrid";

export interface AcquisitionCandidate {
  id?: string;
  provider: AcquisitionProvider;
  externalId?: string | null;
  sourceUrl: string;
  title: string;
  description?: string | null;
  author?: string | null;
  repositoryUrl?: string | null;
  screenshotUrl?: string | null;
  rawContent?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AnalysisResult {
  summary: string;
  technologies: string[];
  skills: string[];
  domain: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  architectureOverview: string;
  learningOutcomes: string[];
}

export interface DuplicateSignal {
  layer: "repository_url" | "repository_id" | "content_hash" | "embedding_similarity" | "screenshot_similarity";
  matched: boolean;
  confidence: number;
  matchedEntityId?: string;
  explanation: string;
}

export interface QualityScore {
  score: number;
  documentation: number;
  architecture: number;
  codeQuality: number;
  activity: number;
  maintainability: number;
}

export interface TrustScore {
  score: number;
  verifiedAuthor: number;
  openSourceActivity: number;
  documentationQuality: number;
  communityEngagement: number;
}

export interface KnowledgeNode {
  entityType: KnowledgeEntityType;
  entityId: string;
  title: string;
  slug?: string | null;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeEdge {
  fromType: KnowledgeEntityType;
  fromId: string;
  toType: KnowledgeEntityType;
  toId: string;
  relationship:
    | "uses_paper"
    | "uses_dataset"
    | "built_by"
    | "uses_api"
    | "belongs_to"
    | "related_to";
  weight?: number;
}

export interface SearchResult {
  entityType: KnowledgeEntityType | "content";
  entityId: string;
  title: string;
  description?: string | null;
  score: number;
  reason: string;
  url?: string | null;
}
