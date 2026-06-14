import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "../knowledge-ecosystem/feature-flags";

export interface Dataset {
  id: string;
  name: string;
  description: string;
  source: "kaggle" | "huggingface" | "github" | "other";
  sourceId: string;
  url: string;
  downloadUrl?: string;
  license: string;
  size: number;
  format: string;
  domains: string[];
  technologies: string[];
  qualityScore: number;
  completenessScore: number;
  popularityScore: number;
  downloads: number;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetQuality {
  id: string;
  datasetId: string;
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  relevance: number;
  overallScore: number;
  issues: string[];
  recommendations: string[];
  assessedAt: string;
}

/**
 * Dataset Intelligence Engine
* Manages dataset discovery, quality scoring, and recommendations
*/
export class DatasetIntelligenceEngine {
  /**
   * Create dataset
   */
  async createDataset(data: Omit<Dataset, "id" | "createdAt" | "updatedAt">): Promise<Dataset> {
    assertKnowledgeFeature("datasetIntelligence");

    const { data: dataset } = await supabaseServer
      .from("datasets")
      .insert({
        name: data.name,
        description: data.description,
        source: data.source,
        source_id: data.sourceId,
        url: data.url,
        download_url: data.downloadUrl,
        license: data.license,
        size: data.size,
        format: data.format,
        domains: data.domains,
        technologies: data.technologies,
        quality_score: data.qualityScore,
        completeness_score: data.completenessScore,
        popularity_score: data.popularityScore,
        downloads: data.downloads,
        upvotes: data.upvotes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!dataset) {
      throw new Error("Failed to create dataset");
    }

    const createdDataset = await this.getDataset(dataset.id);
    if (!createdDataset) {
      throw new Error("Failed to retrieve created dataset");
    }

    return createdDataset;
  }

  /**
   * Get dataset
   */
  async getDataset(datasetId: string): Promise<Dataset | null> {
    const { data } = await supabaseServer
      .from("datasets")
      .select("*")
      .eq("id", datasetId)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      source: data.source,
      sourceId: data.source_id,
      url: data.url,
      downloadUrl: data.download_url,
      license: data.license,
      size: data.size,
      format: data.format,
      domains: data.domains || [],
      technologies: data.technologies || [],
      qualityScore: data.quality_score || 0,
      completenessScore: data.completeness_score || 0,
      popularityScore: data.popularity_score || 0,
      downloads: data.downloads || 0,
      upvotes: data.upvotes || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Get all datasets
   */
  async getAllDatasets(limit: number = 50): Promise<Dataset[]> {
    const { data } = await supabaseServer
      .from("datasets")
      .select("*")
      .order("quality_score", { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      source: d.source,
      sourceId: d.source_id,
      url: d.url,
      downloadUrl: d.download_url,
      license: d.license,
      size: d.size,
      format: d.format,
      domains: d.domains || [],
      technologies: d.technologies || [],
      qualityScore: d.quality_score || 0,
      completenessScore: d.completeness_score || 0,
      popularityScore: d.popularity_score || 0,
      downloads: d.downloads || 0,
      upvotes: d.upvotes || 0,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  /**
   * Calculate dataset quality score
   */
  async calculateDatasetQuality(datasetId: string): Promise<DatasetQuality> {
    const dataset = await this.getDataset(datasetId);
    if (!dataset) {
      throw new Error("Dataset not found");
    }

    // Calculate quality metrics
    const completeness = this.calculateCompleteness(dataset);
    const accuracy = this.calculateAccuracy(dataset);
    const consistency = this.calculateConsistency(dataset);
    const timeliness = this.calculateTimeliness(dataset);
    const relevance = this.calculateRelevance(dataset);

    const overallScore = (completeness * 0.3) + (accuracy * 0.25) + (consistency * 0.2) + (timeliness * 0.15) + (relevance * 0.1);

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (completeness < 70) {
      issues.push("Dataset lacks complete metadata");
      recommendations.push("Add comprehensive documentation");
    }
    if (accuracy < 70) {
      issues.push("Dataset accuracy concerns");
      recommendations.push("Validate data quality");
    }
    if (timeliness < 70) {
      issues.push("Dataset may be outdated");
      recommendations.push("Update dataset with recent data");
    }

    // Store quality assessment
    const { data: quality } = await supabaseServer
      .from("dataset_quality")
      .insert({
        dataset_id: datasetId,
        completeness,
        accuracy,
        consistency,
        timeliness,
        relevance,
        overall_score: overallScore,
        issues,
        recommendations,
        assessed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!quality) {
      throw new Error("Failed to create quality assessment");
    }

    // Update dataset quality score
    await supabaseServer
      .from("datasets")
      .update({
        quality_score: overallScore,
        completeness_score: completeness,
        updated_at: new Date().toISOString(),
      })
      .eq("id", datasetId);

    return {
      id: quality.id,
      datasetId,
      completeness,
      accuracy,
      consistency,
      timeliness,
      relevance,
      overallScore,
      issues,
      recommendations,
      assessedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate completeness
   */
  private calculateCompleteness(dataset: Dataset): number {
    let score = 0;
    if (dataset.name) score += 20;
    if (dataset.description) score += 20;
    if (dataset.license) score += 15;
    if (dataset.domains.length > 0) score += 15;
    if (dataset.technologies.length > 0) score += 15;
    if (dataset.downloadUrl) score += 15;
    return score;
  }

  /**
   * Calculate accuracy
   */
  private calculateAccuracy(dataset: Dataset): number {
    // Placeholder - would use data validation
    return 75;
  }

  /**
   * Calculate consistency
   */
  private calculateConsistency(dataset: Dataset): number {
    // Placeholder - would use data consistency checks
    return 80;
  }

  /**
   * Calculate timeliness
   */
  private calculateTimeliness(dataset: Dataset): number {
    // Placeholder - would check dataset age
    return 70;
  }

  /**
   * Calculate relevance
   */
  private calculateRelevance(dataset: Dataset): number {
    // Placeholder - would check domain relevance
    return 85;
  }

  /**
   * Get dataset recommendations
   */
  async getDatasetRecommendations(domains: string[], technologies: string[], limit: number = 10): Promise<Dataset[]> {
    const allDatasets = await this.getAllDatasets(100);

    const scored = allDatasets.map((dataset) => {
      const domainMatch = domains.filter((d) => dataset.domains.includes(d)).length;
      const techMatch = technologies.filter((t) => dataset.technologies.includes(t)).length;

      const domainScore = domains.length > 0 ? domainMatch / domains.length : 0;
      const techScore = technologies.length > 0 ? techMatch / technologies.length : 0;
      const qualityScore = dataset.qualityScore / 100;
      const popularityScore = Math.min(dataset.downloads / 1000, 1);

      const overallScore = (domainScore * 0.35) + (techScore * 0.25) + (qualityScore * 0.25) + (popularityScore * 0.15);

      return { ...dataset, matchScore: overallScore };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    return scored.slice(0, limit);
  }

  /**
   * Get datasets by domain
   */
  async getDatasetsByDomain(domain: string, limit: number = 20): Promise<Dataset[]> {
    const { data } = await supabaseServer
      .from("datasets")
      .select("*")
      .contains("domains", [domain])
      .order("quality_score", { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      source: d.source,
      sourceId: d.source_id,
      url: d.url,
      downloadUrl: d.download_url,
      license: d.license,
      size: d.size,
      format: d.format,
      domains: d.domains || [],
      technologies: d.technologies || [],
      qualityScore: d.quality_score || 0,
      completenessScore: d.completeness_score || 0,
      popularityScore: d.popularity_score || 0,
      downloads: d.downloads || 0,
      upvotes: d.upvotes || 0,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  /**
   * Get datasets by technology
   */
  async getDatasetsByTechnology(technology: string, limit: number = 20): Promise<Dataset[]> {
    const { data } = await supabaseServer
      .from("datasets")
      .select("*")
      .contains("technologies", [technology])
      .order("quality_score", { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      source: d.source,
      sourceId: d.source_id,
      url: d.url,
      downloadUrl: d.download_url,
      license: d.license,
      size: d.size,
      format: d.format,
      domains: d.domains || [],
      technologies: d.technologies || [],
      qualityScore: d.quality_score || 0,
      completenessScore: d.completeness_score || 0,
      popularityScore: d.popularity_score || 0,
      downloads: d.downloads || 0,
      upvotes: d.upvotes || 0,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  /**
   * Get dataset quality
   */
  async getDatasetQuality(datasetId: string): Promise<DatasetQuality | null> {
    const { data } = await supabaseServer
      .from("dataset_quality")
      .select("*")
      .eq("dataset_id", datasetId)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      datasetId: data.dataset_id,
      completeness: data.completeness,
      accuracy: data.accuracy,
      consistency: data.consistency,
      timeliness: data.timeliness,
      relevance: data.relevance,
      overallScore: data.overall_score,
      issues: data.issues || [],
      recommendations: data.recommendations || [],
      assessedAt: data.assessed_at,
    };
  }
}

// Singleton instance
export const datasetIntelligenceEngine = new DatasetIntelligenceEngine();
