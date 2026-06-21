import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";
import { jaccardSimilarity } from "./text";

interface Project {
  id: string;
  title: string;
  description?: string;
  slug: string;
  domain?: string;
  difficulty?: string;
  tech_stack?: string[];
  author?: string;
  overview?: string;
  architecture?: string;
}

interface ResearchPaper {
  id: string;
  title: string;
  abstract?: string;
  description?: string;
  slug: string;
  domain?: string;
  technologies?: string[];
  author?: string;
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  slug: string;
  domain?: string;
  technologies?: string[];
  author?: string;
}

interface Dataset {
  id: string;
  title: string;
  description?: string;
  slug: string;
  domain?: string;
  technologies?: string[];
  author?: string;
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  slug: string;
  technologies?: string[];
}

interface PartialProject {
  author?: string;
}

export interface RecommendationResult {
  id: string;
  entityType: "project" | "research" | "resource" | "dataset" | "contributor" | "organization";
  entityId: string;
  title: string;
  description: string;
  url: string;
  relevanceScore: number; // 0-100
  factors?: {
    semanticSimilarity: number;
    sharedTechnologies: number;
    sharedDomains: number;
    sharedContributors: number;
    sharedDatasets: number;
  };
  metadata: {
    domain?: string[];
    difficulty?: string;
    technologies?: string[];
    author?: string;
    organization?: string;
  };
}

export interface RecommendationOptions {
  limit?: number;
  minScore?: number;
  includeFactors?: boolean;
}

/**
 * Enhanced Recommendation Engine
 * Generates recommendations based on multiple factors with scoring
 */
export class EnhancedRecommendationEngine {
  /**
   * Get project recommendations for a given project
   */
  async getProjectRecommendations(projectId: string, options: RecommendationOptions = {}): Promise<RecommendationResult[]> {
    assertKnowledgeFeature("recommendations");

    const { limit = 5, minScore = 30, includeFactors = true } = options;

    // Fetch source project
    const { data: sourceProject } = await supabaseServer
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!sourceProject) return [];

    // Fetch candidate projects
    const { data: candidates } = await supabaseServer
      .from("projects")
      .select("*")
      .neq("id", projectId)
      .eq("published", true)
      .limit(100);

    if (!candidates || candidates.length === 0) return [];

    // Calculate recommendations
    const recommendations = await Promise.all(
      candidates.map(async (candidate: Project) => {
        const factors = await calculateRecommendationFactors(sourceProject, candidate);
        const relevanceScore = calculateRelevanceScore(factors);

        return {
          id: candidate.id,
          entityType: "project" as const,
          entityId: candidate.id,
          title: candidate.title,
          description: candidate.description || "",
          url: `/projects/${candidate.slug}`,
          relevanceScore,
          factors: includeFactors ? factors : undefined,
          metadata: {
            domain: candidate.domain ? [candidate.domain] : [],
            difficulty: candidate.difficulty,
            technologies: candidate.tech_stack || [],
            author: candidate.author,
          },
        };
      })
    );

    // Filter by minimum score and sort
    return recommendations
      .filter(r => r.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get research recommendations for a given project
   */
  async getResearchRecommendations(projectId: string, options: RecommendationOptions = {}): Promise<RecommendationResult[]> {
    assertKnowledgeFeature("recommendations");

    const { limit = 5, minScore = 30, includeFactors = true } = options;

    // Fetch source project
    const { data: sourceProject } = await supabaseServer
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!sourceProject) return [];

    // Fetch research papers
    const { data: research } = await supabaseServer
      .from("research")
      .select("*")
      .limit(100);

    if (!research || research.length === 0) return [];

    // Calculate recommendations
    const recommendations = await Promise.all(
      research.map(async (paper: ResearchPaper) => {
        const factors = await calculateResearchFactors(sourceProject, paper);
        const relevanceScore = calculateRelevanceScore(factors);

        return {
          id: paper.id,
          entityType: "research" as const,
          entityId: paper.id,
          title: paper.title,
          description: paper.abstract || paper.description || "",
          url: `/research/${paper.slug}`,
          relevanceScore,
          factors: includeFactors ? factors : undefined,
          metadata: {
            domain: paper.domain ? [paper.domain] : [],
            technologies: paper.technologies || [],
            author: paper.author,
          },
        };
      })
    );

    // Filter by minimum score and sort
    return recommendations
      .filter(r => r.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get resource recommendations for a given project
   */
  async getResourceRecommendations(projectId: string, options: RecommendationOptions = {}): Promise<RecommendationResult[]> {
    assertKnowledgeFeature("recommendations");

    const { limit = 5, minScore = 30, includeFactors = true } = options;

    // Fetch source project
    const { data: sourceProject } = await supabaseServer
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!sourceProject) return [];

    // Fetch resources
    const { data: resources } = await supabaseServer
      .from("resources")
      .select("*")
      .limit(100);

    if (!resources || resources.length === 0) return [];

    // Calculate recommendations
    const recommendations = await Promise.all(
      resources.map(async (resource: Resource) => {
        const factors = await calculateResourceFactors(sourceProject, resource);
        const relevanceScore = calculateRelevanceScore(factors);

        return {
          id: resource.id,
          entityType: "resource" as const,
          entityId: resource.id,
          title: resource.title,
          description: resource.description || "",
          url: `/resources/${resource.slug}`,
          relevanceScore,
          factors: includeFactors ? factors : undefined,
          metadata: {
            domain: resource.domain ? [resource.domain] : [],
            technologies: resource.technologies || [],
            author: resource.author,
          },
        };
      })
    );

    // Filter by minimum score and sort
    return recommendations
      .filter(r => r.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get contributor recommendations for a given project
   */
  async getContributorRecommendations(projectId: string, options: RecommendationOptions = {}): Promise<RecommendationResult[]> {
    assertKnowledgeFeature("recommendations");

    const { limit = 5, minScore = 30, includeFactors = true } = options;

    // Fetch source project
    const { data: sourceProject } = await supabaseServer
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!sourceProject) return [];

    // Fetch contributors from similar projects
    const { data: similarProjects } = await supabaseServer
      .from("projects")
      .select("author")
      .neq("id", projectId)
      .eq("published", true)
      .limit(50);

    if (!similarProjects || similarProjects.length === 0) return [];

    // Get unique contributors
    const contributors = [...new Set(similarProjects.map((p: PartialProject) => p.author).filter((a): a is string => Boolean(a)))];

    // Calculate recommendations
    const recommendations = contributors.map((contributor: string) => {
      const factors = calculateContributorFactors(sourceProject, contributor, similarProjects);
      const relevanceScore = calculateRelevanceScore(factors);

      return {
        id: contributor,
        entityType: "contributor" as const,
        entityId: contributor,
        title: contributor,
        description: `Contributor to ${similarProjects.filter((p: PartialProject) => p.author === contributor).length} similar projects`,
        url: `/contributors/${contributor}`,
        relevanceScore,
        factors: includeFactors ? factors : undefined,
        metadata: {
          author: contributor,
        },
      };
    });

    // Filter by minimum score and sort
    return recommendations
      .filter(r => r.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get dataset recommendations for a given project
   */
  async getDatasetRecommendations(projectId: string, options: RecommendationOptions = {}): Promise<RecommendationResult[]> {
    assertKnowledgeFeature("recommendations");

    const { limit = 5, minScore = 30, includeFactors = true } = options;

    // Fetch source project
    const { data: sourceProject } = await supabaseServer
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!sourceProject) return [];

    // Fetch datasets
    const { data: datasets } = await supabaseServer
      .from("datasets")
      .select("*")
      .limit(100);

    if (!datasets || datasets.length === 0) return [];

    // Calculate recommendations
    const recommendations = await Promise.all(
      datasets.map(async (dataset: Dataset) => {
        const factors = await calculateDatasetFactors(sourceProject, dataset);
        const relevanceScore = calculateRelevanceScore(factors);

        return {
          id: dataset.id,
          entityType: "dataset" as const,
          entityId: dataset.id,
          title: dataset.title,
          description: dataset.description || "",
          url: `/datasets/${dataset.slug}`,
          relevanceScore,
          factors: includeFactors ? factors : undefined,
          metadata: {
            domain: dataset.domain ? [dataset.domain] : [],
            technologies: dataset.technologies || [],
            author: dataset.author,
          },
        };
      })
    );

    // Filter by minimum score and sort
    return recommendations
      .filter(r => r.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get organization recommendations for a given project
   */
  async getOrganizationRecommendations(projectId: string, options: RecommendationOptions = {}): Promise<RecommendationResult[]> {
    assertKnowledgeFeature("recommendations");

    const { limit = 5, minScore = 30, includeFactors = true } = options;

    // Fetch source project
    const { data: sourceProject } = await supabaseServer
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!sourceProject) return [];

    // Fetch organizations
    const { data: organizations } = await supabaseServer
      .from("organizations")
      .select("*")
      .limit(100);

    if (!organizations || organizations.length === 0) return [];

    // Calculate recommendations
    const recommendations = await Promise.all(
      organizations.map(async (org: Organization) => {
        const factors = await calculateOrganizationFactors(sourceProject, org);
        const relevanceScore = calculateRelevanceScore(factors);

        return {
          id: org.id,
          entityType: "organization" as const,
          entityId: org.id,
          title: org.name,
          description: org.description || "",
          url: `/organizations/${org.slug}`,
          relevanceScore,
          factors: includeFactors ? factors : undefined,
          metadata: {
            technologies: org.technologies || [],
          },
        };
      })
    );

    // Filter by minimum score and sort
    return recommendations
      .filter(r => r.relevanceScore >= minScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get all recommendations for a project
   */
  async getAllRecommendations(projectId: string, options: RecommendationOptions = {}): Promise<{
    projects: RecommendationResult[];
    research: RecommendationResult[];
    resources: RecommendationResult[];
    contributors: RecommendationResult[];
    datasets: RecommendationResult[];
    organizations: RecommendationResult[];
  }> {
    const [projects, research, resources, contributors, datasets, organizations] = await Promise.all([
      this.getProjectRecommendations(projectId, options),
      this.getResearchRecommendations(projectId, options),
      this.getResourceRecommendations(projectId, options),
      this.getContributorRecommendations(projectId, options),
      this.getDatasetRecommendations(projectId, options),
      this.getOrganizationRecommendations(projectId, options),
    ]);

    return { projects, research, resources, contributors, datasets, organizations };
  }

  /**
   * Store recommendations in database
   */
  async storeRecommendations(projectId: string, recommendations: RecommendationResult[]): Promise<void> {
    // Delete existing recommendations
    await supabaseServer
      .from("recommendations")
      .delete()
      .eq("source_entity_id", projectId);

    // Insert new recommendations
    const { error } = await supabaseServer.from("recommendations").insert(
      recommendations.map((r) => ({
        source_entity_id: projectId,
        source_entity_type: "project",
        target_entity_id: r.entityId,
        target_entity_type: r.entityType,
        relevance_score: r.relevanceScore,
        factors: r.factors,
        generated_at: new Date().toISOString(),
      }))
    );

    if (error) {
      console.error("Failed to store recommendations:", error);
    }
  }

  /**
   * Get cached recommendations
   */
  async getCachedRecommendations(projectId: string): Promise<RecommendationResult[] | null> {
    const { data } = await supabaseServer
      .from("recommendation_cache")
      .select("recommendations")
      .eq("entity_id", projectId)
      .eq("entity_type", "project")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!data) return null;

    return data.recommendations;
  }

  /**
   * Cache recommendations
   */
  async cacheRecommendations(projectId: string, recommendations: RecommendationResult[], ttl: number = 3600000): Promise<void> {
    const expiresAt = new Date(Date.now() + ttl).toISOString();

    const { error } = await supabaseServer.from("recommendation_cache").upsert({
      entity_id: projectId,
      entity_type: "project",
      recommendations,
      expires_at: expiresAt,
    });

    if (error) {
      console.error("Failed to cache recommendations:", error);
    }
  }
}

/**
 * Calculate recommendation factors between two projects
 */
async function calculateRecommendationFactors(source: Project, candidate: Project): Promise<{
  semanticSimilarity: number;
  sharedTechnologies: number;
  sharedDomains: number;
  sharedContributors: number;
  sharedDatasets: number;
}> {
  // Semantic similarity using Jaccard
  const sourceText = [source.title, source.description, source.overview, source.architecture].filter(Boolean).join(" ");
  const candidateText = [candidate.title, candidate.description, candidate.overview, candidate.architecture].filter(Boolean).join(" ");
  const semanticSimilarity = jaccardSimilarity(sourceText, candidateText);

  // Shared technologies
  const sourceTech = source.tech_stack || [];
  const candidateTech = candidate.tech_stack || [];
  const sharedTech = sourceTech.filter((t: string) => candidateTech.includes(t));
  const sharedTechnologies = sourceTech.length > 0 ? sharedTech.length / sourceTech.length : 0;

  // Shared domains
  const sourceDomain = source.domain;
  const candidateDomain = candidate.domain;
  const sharedDomains = sourceDomain === candidateDomain ? 1 : 0;

  // Shared contributors
  const sharedContributors = source.author === candidate.author ? 1 : 0;

  // Shared datasets (placeholder - would need actual dataset relationships)
  const sharedDatasets = 0;

  return {
    semanticSimilarity,
    sharedTechnologies,
    sharedDomains,
    sharedContributors,
    sharedDatasets,
  };
}

/**
 * Calculate research factors
 */
async function calculateResearchFactors(project: Project, paper: ResearchPaper): Promise<{
  semanticSimilarity: number;
  sharedTechnologies: number;
  sharedDomains: number;
  sharedContributors: number;
  sharedDatasets: number;
}> {
  const projectText = [project.title, project.description, project.overview].filter(Boolean).join(" ");
  const paperText = [paper.title, paper.abstract, paper.description].filter(Boolean).join(" ");
  const semanticSimilarity = jaccardSimilarity(projectText, paperText);

  const projectTech = project.tech_stack || [];
  const paperTech = paper.technologies || [];
  const sharedTech = projectTech.filter((t: string) => paperTech.includes(t));
  const sharedTechnologies = projectTech.length > 0 ? sharedTech.length / projectTech.length : 0;

  const projectDomain = project.domain;
  const paperDomain = paper.domain;
  const sharedDomains = projectDomain === paperDomain ? 1 : 0;

  return {
    semanticSimilarity,
    sharedTechnologies,
    sharedDomains,
    sharedContributors: 0,
    sharedDatasets: 0,
  };
}

/**
 * Calculate resource factors
 */
async function calculateResourceFactors(project: Project, resource: Resource): Promise<{
  semanticSimilarity: number;
  sharedTechnologies: number;
  sharedDomains: number;
  sharedContributors: number;
  sharedDatasets: number;
}> {
  const projectText = [project.title, project.description, project.overview].filter(Boolean).join(" ");
  const resourceText = [resource.title, resource.description].filter(Boolean).join(" ");
  const semanticSimilarity = jaccardSimilarity(projectText, resourceText);

  const projectTech = project.tech_stack || [];
  const resourceTech = resource.technologies || [];
  const sharedTech = projectTech.filter((t: string) => resourceTech.includes(t));
  const sharedTechnologies = projectTech.length > 0 ? sharedTech.length / projectTech.length : 0;

  const projectDomain = project.domain;
  const resourceDomain = resource.domain;
  const sharedDomains = projectDomain === resourceDomain ? 1 : 0;

  return {
    semanticSimilarity,
    sharedTechnologies,
    sharedDomains,
    sharedContributors: 0,
    sharedDatasets: 0,
  };
}

/**
 * Calculate contributor factors
 */
function calculateContributorFactors(project: Project, contributor: string, similarProjects: PartialProject[]): {
  semanticSimilarity: number;
  sharedTechnologies: number;
  sharedDomains: number;
  sharedContributors: number;
  sharedDatasets: number;
} {
  const contributorProjects = similarProjects.filter((p: PartialProject) => p.author === contributor);
  const sharedContributors = contributorProjects.length > 0 ? 1 : 0;

  // Since we only have author info from the query, we can't calculate tech/domain overlap
  const sharedTechnologies = 0;
  const sharedDomains = 0;

  return {
    semanticSimilarity: 0,
    sharedTechnologies,
    sharedDomains,
    sharedContributors,
    sharedDatasets: 0,
  };
}

/**
 * Calculate dataset factors
 */
async function calculateDatasetFactors(project: Project, dataset: Dataset): Promise<{
  semanticSimilarity: number;
  sharedTechnologies: number;
  sharedDomains: number;
  sharedContributors: number;
  sharedDatasets: number;
}> {
  const projectText = [project.title, project.description, project.overview].filter(Boolean).join(" ");
  const datasetText = [dataset.title, dataset.description].filter(Boolean).join(" ");
  const semanticSimilarity = jaccardSimilarity(projectText, datasetText);

  const projectTech = project.tech_stack || [];
  const datasetTech = dataset.technologies || [];
  const sharedTech = projectTech.filter((t: string) => datasetTech.includes(t));
  const sharedTechnologies = projectTech.length > 0 ? sharedTech.length / projectTech.length : 0;

  const projectDomain = project.domain;
  const datasetDomain = dataset.domain;
  const sharedDomains = projectDomain === datasetDomain ? 1 : 0;

  return {
    semanticSimilarity,
    sharedTechnologies,
    sharedDomains,
    sharedContributors: 0,
    sharedDatasets: 0,
  };
}

/**
 * Calculate organization factors
 */
async function calculateOrganizationFactors(project: Project, org: Organization): Promise<{
  semanticSimilarity: number;
  sharedTechnologies: number;
  sharedDomains: number;
  sharedContributors: number;
  sharedDatasets: number;
}> {
  const projectText = [project.title, project.description, project.overview].filter(Boolean).join(" ");
  const orgText = [org.name, org.description].filter(Boolean).join(" ");
  const semanticSimilarity = jaccardSimilarity(projectText, orgText);

  const projectTech = project.tech_stack || [];
  const orgTech = org.technologies || [];
  const sharedTech = projectTech.filter((t: string) => orgTech.includes(t));
  const sharedTechnologies = projectTech.length > 0 ? sharedTech.length / projectTech.length : 0;

  return {
    semanticSimilarity,
    sharedTechnologies,
    sharedDomains: 0,
    sharedContributors: 0,
    sharedDatasets: 0,
  };
}

/**
 * Calculate overall relevance score from factors
 */
function calculateRelevanceScore(factors: {
  semanticSimilarity: number;
  sharedTechnologies: number;
  sharedDomains: number;
  sharedContributors: number;
  sharedDatasets: number;
}): number {
  const weights = {
    semanticSimilarity: 0.4,
    sharedTechnologies: 0.25,
    sharedDomains: 0.2,
    sharedContributors: 0.1,
    sharedDatasets: 0.05,
  };

  const score =
    factors.semanticSimilarity * weights.semanticSimilarity +
    factors.sharedTechnologies * weights.sharedTechnologies +
    factors.sharedDomains * weights.sharedDomains +
    factors.sharedContributors * weights.sharedContributors +
    factors.sharedDatasets * weights.sharedDatasets;

  return Math.round(score * 100);
}

// Singleton instance
export const enhancedRecommendationEngine = new EnhancedRecommendationEngine();
