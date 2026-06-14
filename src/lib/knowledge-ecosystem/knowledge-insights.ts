import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";

export interface KnowledgeInsight {
  type: string;
  title: string;
  description: string;
  data: any[];
  generatedAt: string;
}

/**
 * Knowledge Insights Engine
 * Generates insights from the knowledge graph
 */
export class KnowledgeInsightsEngine {
  /**
   * Get most connected technologies
   */
  async getMostConnectedTechnologies(limit: number = 10): Promise<KnowledgeInsight> {
    assertKnowledgeFeature("knowledgeGraph");

    const { data } = await supabaseServer.rpc("get_most_connected_entities", {
      entity_type_param: "technology",
      limit_count: limit,
    });

    return {
      type: "most_connected_technologies",
      title: "Most Connected Technologies",
      description: "Technologies with the most connections in the knowledge graph",
      data: data || [],
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get most connected contributors
   */
  async getMostConnectedContributors(limit: number = 10): Promise<KnowledgeInsight> {
    assertKnowledgeFeature("knowledgeGraph");

    const { data } = await supabaseServer.rpc("get_most_connected_entities", {
      entity_type_param: "contributor",
      limit_count: limit,
    });

    return {
      type: "most_connected_contributors",
      title: "Most Connected Contributors",
      description: "Contributors with the most connections in the knowledge graph",
      data: data || [],
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get most influential organizations
   */
  async getMostInfluentialOrganizations(limit: number = 10): Promise<KnowledgeInsight> {
    assertKnowledgeFeature("knowledgeGraph");

    const { data } = await supabaseServer.rpc("get_most_connected_entities", {
      entity_type_param: "organization",
      limit_count: limit,
    });

    return {
      type: "most_influential_organizations",
      title: "Most Influential Organizations",
      description: "Organizations with the most connections in the knowledge graph",
      data: data || [],
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get most referenced research
   */
  async getMostReferencedResearch(limit: number = 10): Promise<KnowledgeInsight> {
    assertKnowledgeFeature("knowledgeGraph");

    const { data } = await supabaseServer.rpc("get_most_connected_entities", {
      entity_type_param: "research",
      limit_count: limit,
    });

    return {
      type: "most_referenced_research",
      title: "Most Referenced Research",
      description: "Research papers with the most connections in the knowledge graph",
      data: data || [],
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get most active domains
   */
  async getMostActiveDomains(limit: number = 10): Promise<KnowledgeInsight> {
    assertKnowledgeFeature("knowledgeGraph");

    const { data } = await supabaseServer
      .from("graph_entities")
      .select("entity_id, title, metadata")
      .eq("entity_type", "technology")
      .like("metadata", '%"category":"domain"%')
      .limit(limit * 10);

    if (!data) {
      return {
        type: "most_active_domains",
        title: "Most Active Domains",
        description: "Domains with the most activity in the knowledge graph",
        data: [],
        generatedAt: new Date().toISOString(),
      };
    }

    // Count connections for each domain
    const domainCounts = new Map<string, number>();
    (data as any[]).forEach((entity) => {
      const domainId = entity.entity_id;
      domainCounts.set(domainId, (domainCounts.get(domainId) || 0) + 1);
    });

    const sortedDomains = Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([domainId, count]) => ({
        entity_id: domainId,
        title: domainId,
        connection_count: count,
      }));

    return {
      type: "most_active_domains",
      title: "Most Active Domains",
      description: "Domains with the most activity in the knowledge graph",
      data: sortedDomains,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get all insights
   */
  async getAllInsights(limit: number = 10): Promise<{
    technologies: KnowledgeInsight;
    contributors: KnowledgeInsight;
    organizations: KnowledgeInsight;
    research: KnowledgeInsight;
    domains: KnowledgeInsight;
  }> {
    const [technologies, contributors, organizations, research, domains] = await Promise.all([
      this.getMostConnectedTechnologies(limit),
      this.getMostConnectedContributors(limit),
      this.getMostInfluentialOrganizations(limit),
      this.getMostReferencedResearch(limit),
      this.getMostActiveDomains(limit),
    ]);

    return { technologies, contributors, organizations, research, domains };
  }

  /**
   * Generate insight summary
   */
  async generateInsightSummary(): Promise<{
    totalInsights: number;
    topTechnology: string;
    topContributor: string;
    topOrganization: string;
    topResearch: string;
    topDomain: string;
  }> {
    const insights = await this.getAllInsights(1);

    return {
      totalInsights: 5,
      topTechnology: insights.technologies.data[0]?.title || "N/A",
      topContributor: insights.contributors.data[0]?.title || "N/A",
      topOrganization: insights.organizations.data[0]?.title || "N/A",
      topResearch: insights.research.data[0]?.title || "N/A",
      topDomain: insights.domains.data[0]?.title || "N/A",
    };
  }
}

// Singleton instance
export const knowledgeInsightsEngine = new KnowledgeInsightsEngine();
