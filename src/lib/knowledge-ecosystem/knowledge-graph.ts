import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";
import { tokenize, uniqueKeywords } from "./text";

export interface GraphEntity {
  id: string;
  type: "project" | "research" | "dataset" | "resource" | "technology" | "contributor" | "organization" | "hackathon" | "learning_path";
  entityId: string;
  title: string;
  slug?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GraphRelationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationshipType: string;
  weight: number;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface GraphPath {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
  totalWeight: number;
}

/**
 * Knowledge Graph Engine
 * Manages entities, relationships, and graph traversal
 */
export class KnowledgeGraphEngine {
  /**
   * Extract entities from content
   */
  async extractEntities(content: string, entityType: string): Promise<{
    technologies: string[];
    frameworks: string[];
    languages: string[];
    domains: string[];
    organizations: string[];
    datasets: string[];
  }> {
    const keywords = uniqueKeywords(content);

    // Extract technologies (common tech stack items)
    const technologyKeywords = [
      "react", "vue", "angular", "node", "python", "javascript", "typescript",
      "tensorflow", "pytorch", "keras", "scikit", "pandas", "numpy",
      "docker", "kubernetes", "aws", "azure", "gcp",
      "postgresql", "mongodb", "redis", "mysql",
      "graphql", "rest", "grpc", "websocket",
      "arduino", "raspberry", "esp32", "iot",
      "blockchain", "ethereum", "bitcoin", "solidity",
    ];

    const technologies = keywords.filter(k => 
      technologyKeywords.some(t => k.toLowerCase().includes(t))
    );

    // Extract frameworks
    const frameworkKeywords = [
      "express", "fastapi", "django", "flask", "spring", "rails",
      "nextjs", "nuxt", "gatsby", "remix",
      "electron", "capacitor", "ionic",
    ];

    const frameworks = keywords.filter(k =>
      frameworkKeywords.some(f => k.toLowerCase().includes(f))
    );

    // Extract programming languages
    const languageKeywords = [
      "python", "javascript", "typescript", "java", "c++", "c#",
      "go", "rust", "swift", "kotlin", "php", "ruby",
      "r", "matlab", "julia", "scala", "haskell",
    ];

    const languages = keywords.filter(k =>
      languageKeywords.some(l => k.toLowerCase().includes(l))
    );

    // Extract domains
    const domainKeywords = [
      "ai", "ml", "machine learning", "deep learning", "computer vision",
      "nlp", "natural language", "cybersecurity", "blockchain",
      "iot", "internet of things", "robotics", "cloud", "devops",
      "web", "mobile", "desktop", "embedded", "data science",
      "quantum", "ar", "vr", "augmented reality", "virtual reality",
    ];

    const domains = keywords.filter(k =>
      domainKeywords.some(d => k.toLowerCase().includes(d))
    );

    // Extract organizations (capitalized words)
    const organizations = keywords.filter(k =>
      /^[A-Z][a-z]+$/.test(k) && k.length > 2
    ).slice(0, 10);

    // Extract datasets (common dataset names)
    const datasetKeywords = [
      "imagenet", "coco", "mnist", "cifar", "kaggle",
      "huggingface", "github", "arxiv", "pubmed",
    ];

    const datasets = keywords.filter(k =>
      datasetKeywords.some(d => k.toLowerCase().includes(d))
    );

    return {
      technologies,
      frameworks,
      languages,
      domains,
      organizations,
      datasets,
    };
  }

  /**
   * Create or update entity in graph
   */
  async upsertEntity(entity: Omit<GraphEntity, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const { data, error } = await supabaseServer
      .from("graph_entities")
      .upsert({
        entity_id: entity.entityId,
        entity_type: entity.type,
        title: entity.title,
        slug: entity.slug,
        metadata: entity.metadata,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to upsert entity:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Create relationship between entities
   */
  async createRelationship(
    fromEntityId: string,
    toEntityId: string,
    relationshipType: string,
    weight: number = 1,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const { data, error } = await supabaseServer
      .from("graph_relationships")
      .insert({
        from_entity_id: fromEntityId,
        to_entity_id: toEntityId,
        relationship_type: relationshipType,
        weight,
        metadata,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create relationship:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Get entity by ID
   */
  async getEntity(entityId: string): Promise<GraphEntity | null> {
    const { data, error } = await supabaseServer
      .from("graph_entities")
      .select("*")
      .eq("entity_id", entityId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      type: data.entity_type,
      entityId: data.entity_id,
      title: data.title,
      slug: data.slug,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Get related entities
   */
  async getRelatedEntities(
    entityId: string,
    relationshipType?: string,
    limit: number = 10
  ): Promise<GraphEntity[]> {
    let query = supabaseServer
      .from("graph_relationships")
      .select("to_entity_id, to_entity:graph_entities!graph_relationships_to_entity_id_fkey(*)")
      .eq("from_entity_id", entityId);

    if (relationshipType) {
      query = query.eq("relationship_type", relationshipType);
    }

    const { data, error } = await query.limit(limit);

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.to_entity.id,
      type: r.to_entity.entity_type,
      entityId: r.to_entity.entity_id,
      title: r.to_entity.title,
      slug: r.to_entity.slug,
      metadata: r.to_entity.metadata,
      createdAt: r.to_entity.created_at,
      updatedAt: r.to_entity.updated_at,
    }));
  }

  /**
   * Find path between entities
   */
  async findPath(fromEntityId: string, toEntityId: string, maxDepth: number = 5): Promise<GraphPath | null> {
    const visited = new Set<string>();
    const queue: Array<{ entityId: string; path: GraphPath }> = [
      {
        entityId: fromEntityId,
        path: { entities: [], relationships: [], totalWeight: 0 },
      },
    ];

    while (queue.length > 0) {
      const { entityId, path } = queue.shift()!;

      if (entityId === toEntityId) {
        return path;
      }

      if (visited.has(entityId) || path.entities.length >= maxDepth) {
        continue;
      }

      visited.add(entityId);

      const related = await this.getRelatedEntities(entityId);
      
      for (const entity of related) {
        if (!visited.has(entity.entityId)) {
          const newPath: GraphPath = {
            entities: [...path.entities, entity],
            relationships: [...path.relationships],
            totalWeight: path.totalWeight + 1,
          };
          queue.push({ entityId: entity.entityId, path: newPath });
        }
      }
    }

    return null;
  }

  /**
   * Search entities by type and query
   */
  async searchEntities(
    type: string,
    query: string,
    limit: number = 10
  ): Promise<GraphEntity[]> {
    const { data, error } = await supabaseServer
      .from("graph_entities")
      .select("*")
      .eq("entity_type", type)
      .ilike("title", `%${query}%`)
      .limit(limit);

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      type: d.entity_type,
      entityId: d.entity_id,
      title: d.title,
      slug: d.slug,
      metadata: d.metadata,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  /**
   * Get graph statistics
   */
  async getGraphStats(): Promise<{
    totalEntities: number;
    totalRelationships: number;
    entitiesByType: Record<string, number>;
    relationshipsByType: Record<string, number>;
  }> {
    const [entities, relationships, entitiesByType, relationshipsByType] = await Promise.all([
      supabaseServer.from("graph_entities").select("id", { count: "exact", head: true }),
      supabaseServer.from("graph_relationships").select("id", { count: "exact", head: true }),
      supabaseServer.from("graph_entities").select("entity_type"),
      supabaseServer.from("graph_relationships").select("relationship_type"),
    ]);

    const typeCounts: Record<string, number> = {};
    (entitiesByType.data || []).forEach((e: any) => {
      typeCounts[e.entity_type] = (typeCounts[e.entity_type] || 0) + 1;
    });

    const relCounts: Record<string, number> = {};
    (relationshipsByType.data || []).forEach((r: any) => {
      relCounts[r.relationship_type] = (relCounts[r.relationship_type] || 0) + 1;
    });

    return {
      totalEntities: entities.count || 0,
      totalRelationships: relationships.count || 0,
      entitiesByType: typeCounts,
      relationshipsByType: relCounts,
    };
  }

  /**
   * Build project knowledge graph
   */
  async buildProjectGraph(projectId: string): Promise<void> {
    assertKnowledgeFeature("knowledgeGraph");

    // Fetch project data
    const { data: project } = await supabaseServer
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) return;

    // Create project entity
    const projectEntityId = await this.upsertEntity({
      type: "project",
      entityId: project.id,
      title: project.title,
      slug: project.slug,
      metadata: {
        description: project.description,
        domain: project.domain,
        difficulty: project.difficulty,
        tech_stack: project.tech_stack,
        author: project.author,
      },
    });

    // Extract entities from project content
    const content = [project.title, project.description, project.overview, project.architecture].filter(Boolean).join("\n");
    const entities = await this.extractEntities(content, "project");

    // Create technology entities and relationships
    for (const tech of [...entities.technologies, ...entities.frameworks, ...entities.languages]) {
      const techEntityId = await this.upsertEntity({
        type: "technology",
        entityId: tech.toLowerCase(),
        title: tech,
        metadata: { category: "technology" },
      });

      await this.createRelationship(
        projectEntityId,
        techEntityId,
        "uses_technology",
        1
      );
    }

    // Create domain entities and relationships
    for (const domain of entities.domains) {
      const domainEntityId = await this.upsertEntity({
        type: "technology",
        entityId: domain.toLowerCase(),
        title: domain,
        metadata: { category: "domain" },
      });

      await this.createRelationship(
        projectEntityId,
        domainEntityId,
        "belongs_to_domain",
        1
      );
    }

    // Create contributor entity and relationship
    if (project.author) {
      const contributorEntityId = await this.upsertEntity({
        type: "contributor",
        entityId: project.author.toLowerCase(),
        title: project.author,
        metadata: { type: "contributor" },
      });

      await this.createRelationship(
        projectEntityId,
        contributorEntityId,
        "built_by",
        1
      );
    }

    // Create organization entities and relationships
    for (const org of entities.organizations) {
      const orgEntityId = await this.upsertEntity({
        type: "organization",
        entityId: org.toLowerCase(),
        title: org,
        metadata: { type: "organization" },
      });

      await this.createRelationship(
        projectEntityId,
        orgEntityId,
        "affiliated_with",
        0.5
      );
    }
  }

  /**
   * Get most connected entities
   */
  async getMostConnectedEntities(type: string, limit: number = 10): Promise<Array<{
    entity: GraphEntity;
    connectionCount: number;
  }>> {
    const { data, error } = await supabaseServer
      .from("graph_relationships")
      .select("from_entity_id, from_entity:graph_entities!graph_relationships_from_entity_id_fkey(*)")
      .eq("from_entity.entity_type", type)
      .limit(limit * 10);

    if (error || !data) return [];

    const connectionCounts = new Map<string, number>();
    const entityMap = new Map<string, GraphEntity>();

    (data as any[]).forEach((r) => {
      const entityId = r.from_entity_id;
      connectionCounts.set(entityId, (connectionCounts.get(entityId) || 0) + 1);
      
      if (!entityMap.has(entityId) && r.from_entity) {
        entityMap.set(entityId, {
          id: r.from_entity.id,
          type: r.from_entity.entity_type,
          entityId: r.from_entity.entity_id,
          title: r.from_entity.title,
          slug: r.from_entity.slug,
          metadata: r.from_entity.metadata,
          createdAt: r.from_entity.created_at,
          updatedAt: r.from_entity.updated_at,
        });
      }
    });

    const sorted = Array.from(connectionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([entityId, count]) => ({
      entity: entityMap.get(entityId)!,
      connectionCount: count,
    }));
  }
}

// Singleton instance
export const knowledgeGraphEngine = new KnowledgeGraphEngine();
