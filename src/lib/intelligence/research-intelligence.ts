import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "../knowledge-ecosystem/feature-flags";

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  arxivId?: string;
  doi?: string;
  publishedDate: string;
  venue?: string;
  citations: number;
  domains: string[];
  technologies: string[];
  summary?: string;
  keyFindings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ResearchCitation {
  id: string;
  citingPaperId: string;
  citedPaperId: string;
  citationType: "direct" | "indirect" | "self";
  context: string;
  createdAt: string;
}

export interface ResearchSimilarity {
  id: string;
  paperId1: string;
  paperId2: string;
  similarityScore: number;
  similarityType: "content" | "citation" | "domain" | "methodology";
  reasons: string[];
  createdAt: string;
}

/**
 * Research Intelligence Engine
* Manages research graph, summaries, recommendations, citation analysis, and paper similarity
*/
export class ResearchIntelligenceEngine {
  /**
   * Create research paper
   */
  async createResearchPaper(data: Omit<ResearchPaper, "id" | "createdAt" | "updatedAt">): Promise<ResearchPaper> {
    assertKnowledgeFeature("researchIntelligence");

    const { data: paper } = await supabaseServer
      .from("research_papers")
      .insert({
        title: data.title,
        authors: data.authors,
        abstract: data.abstract,
        arxiv_id: data.arxivId,
        doi: data.doi,
        published_date: data.publishedDate,
        venue: data.venue,
        citations: data.citations,
        domains: data.domains,
        technologies: data.technologies,
        summary: data.summary,
        key_findings: data.keyFindings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!paper) {
      throw new Error("Failed to create research paper");
    }

    const createdPaper = await this.getResearchPaper(paper.id);
    if (!createdPaper) {
      throw new Error("Failed to retrieve created paper");
    }

    return createdPaper;
  }

  /**
   * Get research paper
   */
  async getResearchPaper(paperId: string): Promise<ResearchPaper | null> {
    const { data } = await supabaseServer
      .from("research_papers")
      .select("*")
      .eq("id", paperId)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      authors: data.authors || [],
      abstract: data.abstract,
      arxivId: data.arxiv_id,
      doi: data.doi,
      publishedDate: data.published_date,
      venue: data.venue,
      citations: data.citations || 0,
      domains: data.domains || [],
      technologies: data.technologies || [],
      summary: data.summary,
      keyFindings: data.key_findings || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Get all research papers
   */
  async getAllResearchPapers(limit: number = 50): Promise<ResearchPaper[]> {
    const { data } = await supabaseServer
      .from("research_papers")
      .select("*")
      .order("citations", { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      title: d.title,
      authors: d.authors || [],
      abstract: d.abstract,
      arxivId: d.arxiv_id,
      doi: d.doi,
      publishedDate: d.published_date,
      venue: d.venue,
      citations: d.citations || 0,
      domains: d.domains || [],
      technologies: d.technologies || [],
      summary: d.summary,
      keyFindings: d.key_findings || [],
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  /**
   * Generate research summary
   */
  async generateResearchSummary(paperId: string): Promise<ResearchPaper> {
    const paper = await this.getResearchPaper(paperId);
    if (!paper) {
      throw new Error("Paper not found");
    }

    // Placeholder - would use AI to generate summary
    const summary = `This paper ${paper.title.toLowerCase()} presents research in the field of ${paper.domains.join(", ")}. The authors ${paper.authors.join(", ")} explore key aspects of ${paper.technologies.join(", ")}. Key findings include: ${paper.keyFindings.join(", ")}.`;

    const keyFindings = [
      `Research in ${paper.domains[0] || "this field"} shows promising results`,
      `Methodology using ${paper.technologies[0] || "advanced techniques"} is effective`,
      `Applications in ${paper.domains[0] || "various domains"} are significant`,
    ];

    await supabaseServer
      .from("research_papers")
      .update({
        summary,
        key_findings: keyFindings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paperId);

    const updatedPaper = await this.getResearchPaper(paperId);
    if (!updatedPaper) {
      throw new Error("Failed to retrieve updated paper");
    }

    return updatedPaper;
  }

  /**
   * Add citation
   */
  async addCitation(citingPaperId: string, citedPaperId: string, citationType: "direct" | "indirect" | "self", context: string): Promise<void> {
    await supabaseServer.from("research_citations").insert({
      citing_paper_id: citingPaperId,
      cited_paper_id: citedPaperId,
      citation_type: citationType,
      context,
      created_at: new Date().toISOString(),
    });

    // Update citation counts
    await supabaseServer.rpc("increment_citation_count", { paper_id_param: citedPaperId });
  }

  /**
   * Get citations for paper
   */
  async getCitations(paperId: string): Promise<ResearchCitation[]> {
    const { data } = await supabaseServer
      .from("research_citations")
      .select("*")
      .eq("cited_paper_id", paperId)
      .order("created_at", { ascending: false });

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      citingPaperId: d.citing_paper_id,
      citedPaperId: d.cited_paper_id,
      citationType: d.citation_type,
      context: d.context,
      createdAt: d.created_at,
    }));
  }

  /**
   * Calculate paper similarity
   */
  async calculateSimilarity(paperId1: string, paperId2: string): Promise<ResearchSimilarity> {
    const paper1 = await this.getResearchPaper(paperId1);
    const paper2 = await this.getResearchPaper(paperId2);

    if (!paper1 || !paper2) {
      throw new Error("One or both papers not found");
    }

    // Calculate domain similarity
    const domainIntersection = paper1.domains.filter((d) => paper2.domains.includes(d));
    const domainSimilarity = domainIntersection.length / Math.max(paper1.domains.length, paper2.domains.length);

    // Calculate technology similarity
    const techIntersection = paper1.technologies.filter((t) => paper2.technologies.includes(t));
    const techSimilarity = techIntersection.length / Math.max(paper1.technologies.length, paper2.technologies.length);

    // Calculate author similarity
    const authorIntersection = paper1.authors.filter((a) => paper2.authors.includes(a));
    const authorSimilarity = authorIntersection.length / Math.max(paper1.authors.length, paper2.authors.length);

    // Overall similarity
    const overallSimilarity = (domainSimilarity * 0.5) + (techSimilarity * 0.3) + (authorSimilarity * 0.2);

    const reasons: string[] = [];
    if (domainIntersection.length > 0) {
      reasons.push(`Shared domains: ${domainIntersection.join(", ")}`);
    }
    if (techIntersection.length > 0) {
      reasons.push(`Shared technologies: ${techIntersection.join(", ")}`);
    }
    if (authorIntersection.length > 0) {
      reasons.push(`Shared authors: ${authorIntersection.join(", ")}`);
    }

    // Check if similarity already exists
    const { data: existing } = await supabaseServer
      .from("research_similarities")
      .select("*")
      .or(`and(paper_id_1.eq.${paperId1},paper_id_2.eq.${paperId2}),and(paper_id_1.eq.${paperId2},paper_id_2.eq.${paperId1})`)
      .maybeSingle();

    if (existing) {
      await supabaseServer
        .from("research_similarities")
        .update({
          similarity_score: overallSimilarity,
          reasons,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      return {
        id: existing.id,
        paperId1: existing.paper_id_1,
        paperId2: existing.paper_id_2,
        similarityScore: overallSimilarity,
        similarityType: existing.similarity_type,
        reasons,
        createdAt: existing.created_at,
      };
    }

    const { data: similarity } = await supabaseServer
      .from("research_similarities")
      .insert({
        paper_id_1: paperId1,
        paper_id_2: paperId2,
        similarity_score: overallSimilarity,
        similarity_type: "content",
        reasons,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!similarity) {
      throw new Error("Failed to create similarity");
    }

    return {
      id: similarity.id,
      paperId1,
      paperId2,
      similarityScore: overallSimilarity,
      similarityType: "content",
      reasons,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get similar papers
   */
  async getSimilarPapers(paperId: string, limit: number = 10): Promise<ResearchSimilarity[]> {
    const { data } = await supabaseServer
      .from("research_similarities")
      .select("*")
      .or(`paper_id_1.eq.${paperId},paper_id_2.eq.${paperId}`)
      .order("similarity_score", { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      paperId1: d.paper_id_1,
      paperId2: d.paper_id_2,
      similarityScore: d.similarity_score,
      similarityType: d.similarity_type,
      reasons: d.reasons || [],
      createdAt: d.created_at,
    }));
  }

  /**
   * Get research recommendations
   */
  async getResearchRecommendations(domains: string[], technologies: string[], limit: number = 10): Promise<ResearchPaper[]> {
    const allPapers = await this.getAllResearchPapers(100);

    const scored = allPapers.map((paper) => {
      const domainMatch = domains.filter((d) => paper.domains.includes(d)).length;
      const techMatch = technologies.filter((t) => paper.technologies.includes(t)).length;

      const domainScore = domains.length > 0 ? domainMatch / domains.length : 0;
      const techScore = technologies.length > 0 ? techMatch / technologies.length : 0;
      const citationScore = Math.min(paper.citations / 100, 1);

      const overallScore = (domainScore * 0.4) + (techScore * 0.3) + (citationScore * 0.3);

      return { ...paper, matchScore: overallScore };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    return scored.slice(0, limit);
  }

  /**
   * Build research graph
   */
  async buildResearchGraph(paperId: string): Promise<{
    paper: ResearchPaper;
    citations: ResearchCitation[];
    similarPapers: ResearchSimilarity[];
  }> {
    const paper = await this.getResearchPaper(paperId);
    if (!paper) {
      throw new Error("Paper not found");
    }

    const citations = await this.getCitations(paperId);
    const similarPapers = await this.getSimilarPapers(paperId, 10);

    return {
      paper,
      citations,
      similarPapers,
    };
  }

  /**
   * Get papers by domain
   */
  async getPapersByDomain(domain: string, limit: number = 20): Promise<ResearchPaper[]> {
    const { data } = await supabaseServer
      .from("research_papers")
      .select("*")
      .contains("domains", [domain])
      .order("citations", { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      title: d.title,
      authors: d.authors || [],
      abstract: d.abstract,
      arxivId: d.arxiv_id,
      doi: d.doi,
      publishedDate: d.published_date,
      venue: d.venue,
      citations: d.citations || 0,
      domains: d.domains || [],
      technologies: d.technologies || [],
      summary: d.summary,
      keyFindings: d.key_findings || [],
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  /**
   * Get papers by technology
   */
  async getPapersByTechnology(technology: string, limit: number = 20): Promise<ResearchPaper[]> {
    const { data } = await supabaseServer
      .from("research_papers")
      .select("*")
      .contains("technologies", [technology])
      .order("citations", { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      title: d.title,
      authors: d.authors || [],
      abstract: d.abstract,
      arxivId: d.arxiv_id,
      doi: d.doi,
      publishedDate: d.published_date,
      venue: d.venue,
      citations: d.citations || 0,
      domains: d.domains || [],
      technologies: d.technologies || [],
      summary: d.summary,
      keyFindings: d.key_findings || [],
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }
}

// Singleton instance
export const researchIntelligenceEngine = new ResearchIntelligenceEngine();
