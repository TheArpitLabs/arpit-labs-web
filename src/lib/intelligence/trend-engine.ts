import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "../knowledge-ecosystem/feature-flags";

export interface Trend {
  id: string;
  name: string;
  category: "technology" | "domain" | "research" | "contributor" | "project";
  score: number;
  momentum: number;
  velocity: number;
  direction: "up" | "down" | "stable";
  timeframe: "daily" | "weekly" | "monthly" | "quarterly";
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TrendDataPoint {
  timestamp: string;
  value: number;
  count: number;
}

/**
 * Trend Intelligence Engine
 * Detects and tracks technology, domain, research, contributor, and project trends
 */
export class TrendIntelligenceEngine {
  private trackedDomains = [
    "AI",
    "AI Agents",
    "MCP",
    "Cybersecurity",
    "IoT",
    "Robotics",
    "Cloud",
    "DevOps",
    "Quantum",
    "Computer Vision",
  ];

  /**
   * Analyze technology trends
   */
  async analyzeTechnologyTrends(timeframe: "daily" | "weekly" | "monthly" | "quarterly" = "weekly"): Promise<Trend[]> {
    assertKnowledgeFeature("trendIntelligence");

    const trends: Trend[] = [];

    // Get technology usage from projects
    const { data: projects } = await supabaseServer
      .from("projects")
      .select("tech_stack, created_at")
      .gte("created_at", this.getDateRange(timeframe));

    if (!projects) return trends;

    // Count technology occurrences
    const techCounts = new Map<string, number>();
    for (const project of projects) {
      const techStack = project.tech_stack || [];
      for (const tech of techStack) {
        techCounts.set(tech, (techCounts.get(tech) || 0) + 1);
      }
    }

    // Calculate trends for each technology
    for (const [tech, count] of techCounts.entries()) {
      const historicalData = await this.getHistoricalData(tech, "technology", timeframe);
      const trend = this.calculateTrend(tech, "technology", count, historicalData, timeframe);
      trends.push(trend);
    }

    // Sort by score and return top trends
    trends.sort((a, b) => b.score - a.score);
    return trends.slice(0, 50);
  }

  /**
   * Detect emerging domains
   */
  async detectEmergingDomains(): Promise<Trend[]> {
    assertKnowledgeFeature("trendIntelligence");

    const trends: Trend[] = [];

    for (const domain of this.trackedDomains) {
      const currentCount = await this.getDomainCount(domain);
      const historicalData = await this.getHistoricalData(domain, "domain", "monthly");
      const trend = this.calculateTrend(domain, "domain", currentCount, historicalData, "monthly");
      
      // Only include domains with upward momentum
      if (trend.direction === "up" && trend.momentum > 0.5) {
        trends.push(trend);
      }
    }

    // Sort by momentum and return
    trends.sort((a, b) => b.momentum - a.momentum);
    return trends;
  }

  /**
   * Analyze research trends
   */
  async analyzeResearchTrends(timeframe: "daily" | "weekly" | "monthly" | "quarterly" = "monthly"): Promise<Trend[]> {
    assertKnowledgeFeature("trendIntelligence");

    const trends: Trend[] = [];

    // Get research papers
    const { data: research } = await supabaseServer
      .from("research")
      .select("domains, keywords, created_at")
      .gte("created_at", this.getDateRange(timeframe));

    if (!research) return trends;

    // Count domain and keyword occurrences
    const domainCounts = new Map<string, number>();
    const keywordCounts = new Map<string, number>();

    for (const paper of research) {
      const domains = paper.domains || [];
      const keywords = paper.keywords || [];

      for (const domain of domains) {
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      }

      for (const keyword of keywords) {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
      }
    }

    // Calculate trends for domains
    for (const [domain, count] of domainCounts.entries()) {
      const historicalData = await this.getHistoricalData(domain, "research", timeframe);
      const trend = this.calculateTrend(domain, "research", count, historicalData, timeframe);
      trends.push(trend);
    }

    // Calculate trends for keywords
    for (const [keyword, count] of keywordCounts.entries()) {
      const historicalData = await this.getHistoricalData(keyword, "research", timeframe);
      const trend = this.calculateTrend(keyword, "research", count, historicalData, timeframe);
      trends.push(trend);
    }

    // Sort by score and return top trends
    trends.sort((a, b) => b.score - a.score);
    return trends.slice(0, 50);
  }

  /**
   * Analyze contributor trends
   */
  async analyzeContributorTrends(timeframe: "daily" | "weekly" | "monthly" | "quarterly" = "monthly"): Promise<Trend[]> {
    assertKnowledgeFeature("trendIntelligence");

    const trends: Trend[] = [];

    // Get contributors
    const { data: contributors } = await supabaseServer
      .from("contributors")
      .select("id, username, projects_count, created_at")
      .gte("created_at", this.getDateRange(timeframe));

    if (!contributors) return trends;

    // Calculate trends for top contributors
    for (const contributor of contributors) {
      const currentCount = contributor.projects_count || 0;
      const historicalData = await this.getHistoricalData(contributor.id, "contributor", timeframe);
      const trend = this.calculateTrend(
        contributor.username,
        "contributor",
        currentCount,
        historicalData,
        timeframe
      );
      trends.push(trend);
    }

    // Sort by score and return top trends
    trends.sort((a, b) => b.score - a.score);
    return trends.slice(0, 50);
  }

  /**
   * Analyze project trends
   */
  async analyzeProjectTrends(timeframe: "daily" | "weekly" | "monthly" | "quarterly" = "weekly"): Promise<Trend[]> {
    assertKnowledgeFeature("trendIntelligence");

    const trends: Trend[] = [];

    // Get projects
    const { data: projects } = await supabaseServer
      .from("projects")
      .select("id, title, stars_count, forks_count, created_at")
      .gte("created_at", this.getDateRange(timeframe));

    if (!projects) return trends;

    // Calculate trends for projects based on engagement
    for (const project of projects) {
      const currentEngagement = (project.stars_count || 0) + (project.forks_count || 0);
      const historicalData = await this.getHistoricalData(project.id, "project", timeframe);
      const trend = this.calculateTrend(project.title, "project", currentEngagement, historicalData, timeframe);
      trends.push(trend);
    }

    // Sort by score and return top trends
    trends.sort((a, b) => b.score - a.score);
    return trends.slice(0, 50);
  }

  /**
   * Get historical data for trend calculation
   */
  private async getHistoricalData(
    name: string,
    category: string,
    timeframe: string
  ): Promise<TrendDataPoint[]> {
    const { data } = await supabaseServer
      .from("trend_history")
      .select("timestamp, value, count")
      .eq("name", name)
      .eq("category", category)
      .gte("timestamp", this.getDateRange(timeframe))
      .order("timestamp", { ascending: true });

    if (!data) return [];

    return data.map((d: any) => ({
      timestamp: d.timestamp,
      value: d.value,
      count: d.count,
    }));
  }

  /**
   * Calculate trend metrics
   */
  private calculateTrend(
    name: string,
    category: string,
    currentValue: number,
    historicalData: TrendDataPoint[],
    timeframe: string
  ): Trend {
    let momentum = 0;
    let velocity = 0;
    let direction: "up" | "down" | "stable" = "stable";

    if (historicalData.length >= 2) {
      const latest = historicalData[historicalData.length - 1];
      const previous = historicalData[historicalData.length - 2];

      // Calculate velocity (rate of change)
      velocity = currentValue - latest.value;

      // Calculate momentum (acceleration)
      const previousVelocity = latest.value - previous.value;
      momentum = velocity - previousVelocity;

      // Determine direction
      if (velocity > 0.1 * currentValue) {
        direction = "up";
      } else if (velocity < -0.1 * currentValue) {
        direction = "down";
      } else {
        direction = "stable";
      }
    }

    // Calculate score based on value, momentum, and direction
    let score = currentValue;
    if (direction === "up") {
      score *= (1 + momentum);
    } else if (direction === "down") {
      score *= (1 - Math.abs(momentum));
    }

    return {
      id: crypto.randomUUID(),
      name,
      category: category as any,
      score,
      momentum,
      velocity,
      direction,
      timeframe: timeframe as any,
      metadata: {
        currentValue,
        historicalDataPoints: historicalData.length,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get domain count
   */
  private async getDomainCount(domain: string): Promise<number> {
    const { data: projects } = await supabaseServer
      .from("projects")
      .select("id")
      .contains("domains", [domain]);

    const { data: research } = await supabaseServer
      .from("research")
      .select("id")
      .contains("domains", [domain]);

    return (projects?.length || 0) + (research?.length || 0);
  }

  /**
   * Get date range for timeframe
   */
  private getDateRange(timeframe: string): string {
    const now = new Date();
    switch (timeframe) {
      case "daily":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case "weekly":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "monthly":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case "quarterly":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Store trend in database
   */
  async storeTrend(trend: Omit<Trend, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const { data, error } = await supabaseServer
      .from("trends")
      .upsert({
        name: trend.name,
        category: trend.category,
        score: trend.score,
        momentum: trend.momentum,
        velocity: trend.velocity,
        direction: trend.direction,
        timeframe: trend.timeframe,
        metadata: trend.metadata,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to store trend:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Store trend history data point
   */
  async storeTrendHistory(
    name: string,
    category: string,
    value: number,
    count: number
  ): Promise<void> {
    await supabaseServer.from("trend_history").insert({
      name,
      category,
      value,
      count,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get all trends
   */
  async getAllTrends(category?: string, limit: number = 100): Promise<Trend[]> {
    let query = supabaseServer.from("trends").select("*").order("score", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data } = await query.limit(limit);

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      score: d.score,
      momentum: d.momentum,
      velocity: d.velocity,
      direction: d.direction,
      timeframe: d.timeframe,
      metadata: d.metadata || {},
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  /**
   * Get trend by name
   */
  async getTrend(name: string, category: string): Promise<Trend | null> {
    const { data } = await supabaseServer
      .from("trends")
      .select("*")
      .eq("name", name)
      .eq("category", category)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      score: data.score,
      momentum: data.momentum,
      velocity: data.velocity,
      direction: data.direction,
      timeframe: data.timeframe,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Generate trend report
   */
  async generateTrendReport(): Promise<{
    technologyTrends: Trend[];
    emergingDomains: Trend[];
    researchTrends: Trend[];
    contributorTrends: Trend[];
    projectTrends: Trend[];
    summary: {
      totalTrends: number;
      topTechnology: string;
      topDomain: string;
      topResearch: string;
      overallDirection: "up" | "down" | "stable";
    };
  }> {
    const [
      technologyTrends,
      emergingDomains,
      researchTrends,
      contributorTrends,
      projectTrends,
    ] = await Promise.all([
      this.analyzeTechnologyTrends("weekly"),
      this.detectEmergingDomains(),
      this.analyzeResearchTrends("monthly"),
      this.analyzeContributorTrends("monthly"),
      this.analyzeProjectTrends("weekly"),
    ]);

    const totalTrends =
      technologyTrends.length +
      emergingDomains.length +
      researchTrends.length +
      contributorTrends.length +
      projectTrends.length;

    const overallDirection = this.calculateOverallDirection([
      ...technologyTrends,
      ...emergingDomains,
      ...researchTrends,
      ...contributorTrends,
      ...projectTrends,
    ]);

    return {
      technologyTrends: technologyTrends.slice(0, 20),
      emergingDomains: emergingDomains.slice(0, 10),
      researchTrends: researchTrends.slice(0, 20),
      contributorTrends: contributorTrends.slice(0, 20),
      projectTrends: projectTrends.slice(0, 20),
      summary: {
        totalTrends,
        topTechnology: technologyTrends[0]?.name || "N/A",
        topDomain: emergingDomains[0]?.name || "N/A",
        topResearch: researchTrends[0]?.name || "N/A",
        overallDirection,
      },
    };
  }

  /**
   * Calculate overall direction from trends
   */
  private calculateOverallDirection(trends: Trend[]): "up" | "down" | "stable" {
    if (trends.length === 0) return "stable";

    const upCount = trends.filter((t) => t.direction === "up").length;
    const downCount = trends.filter((t) => t.direction === "down").length;

    if (upCount > downCount * 1.5) return "up";
    if (downCount > upCount * 1.5) return "down";
    return "stable";
  }
}

// Singleton instance
export const trendIntelligenceEngine = new TrendIntelligenceEngine();
