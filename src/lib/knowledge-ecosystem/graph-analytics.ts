import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";

export interface GraphMetrics {
  nodeCount: number;
  relationshipCount: number;
  graphDensity: number;
  averageDegree: number;
  growthRate: number;
  entityDistribution: Record<string, number>;
  relationshipDistribution: Record<string, number>;
}

/**
 * Graph Analytics Engine
 * Tracks and analyzes graph metrics
 */
export class GraphAnalyticsEngine {
  /**
   * Calculate graph metrics
   */
  async calculateMetrics(): Promise<GraphMetrics> {
    assertKnowledgeFeature("knowledgeGraph");

    const { data: stats, error } = await supabaseServer.rpc("get_graph_statistics");
    
    if (error || !stats || !Array.isArray(stats) || stats.length === 0) {
      return {
        nodeCount: 0,
        relationshipCount: 0,
        graphDensity: 0,
        averageDegree: 0,
        growthRate: 0,
        entityDistribution: {},
        relationshipDistribution: {},
      };
    }

    const totalEntities = stats[0]?.total_entities || 0;
    const totalRelationships = stats[0]?.total_relationships || 0;

    // Calculate graph density
    // Density = (2 * edges) / (nodes * (nodes - 1)) for undirected graph
    const graphDensity = totalEntities > 1 
      ? (2 * totalRelationships) / (totalEntities * (totalEntities - 1))
      : 0;

    // Calculate average degree
    // Average degree = (2 * edges) / nodes
    const averageDegree = totalEntities > 0 
      ? (2 * totalRelationships) / totalEntities
      : 0;

    // Calculate growth rate (compare with previous day)
    const growthRate = await this.calculateGrowthRate();

    // Get entity distribution
    const entityDistribution: Record<string, number> = {};
    stats.forEach((row: any) => {
      if (row.entity_type) {
        entityDistribution[row.entity_type] = row.entity_count;
      }
    });

    // Get relationship distribution
    const relationshipDistribution: Record<string, number> = {};
    stats.forEach((row: any) => {
      if (row.relationship_type) {
        relationshipDistribution[row.relationship_type] = row.relationship_count;
      }
    });

    return {
      nodeCount: totalEntities,
      relationshipCount: totalRelationships,
      graphDensity,
      averageDegree,
      growthRate,
      entityDistribution,
      relationshipDistribution,
    };
  }

  /**
   * Calculate growth rate
   */
  async calculateGrowthRate(): Promise<number> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [currentStats, previousStats] = await Promise.all([
      supabaseServer
        .from("graph_metrics")
        .select("metric_value")
        .eq("metric_name", "total_entities")
        .eq("metric_type", "count")
        .gte("recorded_at", yesterday.toISOString())
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseServer
        .from("graph_metrics")
        .select("metric_value")
        .eq("metric_name", "total_entities")
        .eq("metric_type", "count")
        .lt("recorded_at", yesterday.toISOString())
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const current = currentStats?.data?.metric_value || 0;
    const previous = previousStats?.data?.metric_value || 0;

    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Record metric
   */
  async recordMetric(
    metricName: string,
    metricValue: number,
    metricType: "count" | "average" | "sum" | "min" | "max",
    entityType?: string
  ): Promise<void> {
    const { error } = await supabaseServer.from("graph_metrics").insert({
      metric_name: metricName,
      metric_value: metricValue,
      metric_type: metricType,
      entity_type: entityType,
      recorded_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to record metric:", error);
    }
  }

  /**
   * Get metrics history
   */
  async getMetricsHistory(
    metricName: string,
    days: number = 7
  ): Promise<Array<{ recordedAt: string; value: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabaseServer
      .from("graph_metrics")
      .select("recorded_at, metric_value")
      .eq("metric_name", metricName)
      .gte("recorded_at", startDate.toISOString())
      .order("recorded_at", { ascending: true });

    if (!data) return [];

    return data.map((row: any) => ({
      recordedAt: row.recorded_at,
      value: row.metric_value,
    }));
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    metrics: GraphMetrics;
  }> {
    const issues: string[] = [];
    const metrics = await this.calculateMetrics();

    // Check if graph is empty
    if (metrics.nodeCount === 0) {
      issues.push("Graph has no nodes");
    }

    // Check if graph density is too low
    if (metrics.graphDensity < 0.01 && metrics.nodeCount > 10) {
      issues.push("Graph density is very low");
    }

    // Check if average degree is too low
    if (metrics.averageDegree < 1 && metrics.nodeCount > 10) {
      issues.push("Average degree is very low");
    }

    return {
      healthy: issues.length === 0,
      issues,
      metrics,
    };
  }

  /**
   * Get analytics dashboard data
   */
  async getDashboardData(): Promise<{
    metrics: GraphMetrics;
    health: any;
    insights: any;
  }> {
    const [metrics, health] = await Promise.all([
      this.calculateMetrics(),
      this.healthCheck(),
    ]);

    // Get basic insights
    const insights = {
      mostConnectedEntity: await this.getMostConnectedEntity(),
      mostConnectedType: await this.getMostConnectedType(),
      growthTrend: await this.getGrowthTrend(),
    };

    return { metrics, health, insights };
  }

  /**
   * Get most connected entity
   */
  async getMostConnectedEntity(): Promise<any> {
    const { data } = await supabaseServer
      .from("graph_relationships")
      .select("from_entity_id, from_entity:graph_entities!graph_relationships_from_entity_id_fkey(*)")
      .limit(1000);

    if (!data) return null;

    const connectionCounts = new Map<string, number>();
    const entityMap = new Map<string, any>();

    (data as any[]).forEach((r) => {
      const entityId = r.from_entity_id;
      connectionCounts.set(entityId, (connectionCounts.get(entityId) || 0) + 1);
      
      if (!entityMap.has(entityId) && r.from_entity) {
        entityMap.set(entityId, r.from_entity);
      }
    });

    const sorted = Array.from(connectionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1);

    if (sorted.length === 0) return null;

    const [entityId, count] = sorted[0];
    const entity = entityMap.get(entityId);

    return {
      ...entity,
      connectionCount: count,
    };
  }

  /**
   * Get most connected entity type
   */
  async getMostConnectedType(): Promise<string | null> {
    const stats = await this.calculateMetrics();
    
    let maxCount = 0;
    let maxType = null;

    Object.entries(stats.entityDistribution).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxType = type;
      }
    });

    return maxType;
  }

  /**
   * Get growth trend
   */
  async getGrowthTrend(): Promise<"increasing" | "decreasing" | "stable"> {
    const history = await this.getMetricsHistory("total_entities", 7);
    
    if (history.length < 2) return "stable";

    const recent = history.slice(-3);
    const older = history.slice(0, -3);

    const recentAvg = recent.reduce((sum, h) => sum + h.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, h) => sum + h.value, 0) / older.length;

    if (recentAvg > olderAvg * 1.05) return "increasing";
    if (recentAvg < olderAvg * 0.95) return "decreasing";
    return "stable";
  }
}

// Singleton instance
export const graphAnalyticsEngine = new GraphAnalyticsEngine();
