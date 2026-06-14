import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";

export interface EmbeddingGenerationResult {
  success: boolean;
  generated: number;
  failed: number;
  errors: string[];
}

export interface EmbeddingContent {
  entityType: "project" | "research" | "resource";
  entityId: string;
  contentType: "title" | "description" | "overview" | "architecture" | "abstract" | "content";
  content: string;
}

/**
 * Embedding Engine - Generate and manage vector embeddings for content
 */
export class EmbeddingEngine {
  private embeddingModel = "text-embedding-3-small";
  private embeddingDimension = 1536;
  private batchSize = 100;

  /**
   * Generate embeddings for a single piece of content
   */
  async generateEmbedding(content: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required for embedding generation");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: content,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data?.data?.[0]?.embedding || Array(this.embeddingDimension).fill(0);
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple content items in batch
   */
  async generateBatchEmbeddings(contents: string[]): Promise<number[][]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required for embedding generation");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: contents,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data?.data?.map((d: any) => d.embedding) || [];
    } catch (error) {
      console.error("Failed to generate batch embeddings:", error);
      throw error;
    }
  }

  /**
   * Generate and store embeddings for a project
   */
  async generateProjectEmbeddings(projectId: string): Promise<EmbeddingGenerationResult> {
    assertKnowledgeFeature("semanticSearch");

    const { data: project } = await supabaseServer
      .from("projects")
      .select("id,title,description,overview,architecture")
      .eq("id", projectId)
      .single();

    if (!project) {
      throw new Error("Project not found");
    }

    const contents: EmbeddingContent[] = [
      {
        entityType: "project" as const,
        entityId: projectId,
        contentType: "title" as const,
        content: project.title || "",
      },
      {
        entityType: "project" as const,
        entityId: projectId,
        contentType: "description" as const,
        content: project.description || "",
      },
      {
        entityType: "project" as const,
        entityId: projectId,
        contentType: "overview" as const,
        content: project.overview || "",
      },
      {
        entityType: "project" as const,
        entityId: projectId,
        contentType: "architecture" as const,
        content: project.architecture || "",
      },
    ].filter(c => c.content.length > 0);

    return await this.generateAndStoreEmbeddings(contents);
  }

  /**
   * Generate and store embeddings for multiple projects
   */
  async generateBatchProjectEmbeddings(projectIds: string[]): Promise<EmbeddingGenerationResult> {
    assertKnowledgeFeature("semanticSearch");

    const { data: projects } = await supabaseServer
      .from("projects")
      .select("id,title,description,overview,architecture")
      .in("id", projectIds);

    if (!projects || projects.length === 0) {
      return { success: true, generated: 0, failed: 0, errors: [] };
    }

    const allContents: EmbeddingContent[] = [];

    for (const project of projects) {
      const contents: EmbeddingContent[] = [
        {
          entityType: "project" as const,
          entityId: project.id,
          contentType: "title" as const,
          content: project.title || "",
        },
        {
          entityType: "project" as const,
          entityId: project.id,
          contentType: "description" as const,
          content: project.description || "",
        },
        {
          entityType: "project" as const,
          entityId: project.id,
          contentType: "overview" as const,
          content: project.overview || "",
        },
        {
          entityType: "project" as const,
          entityId: project.id,
          contentType: "architecture" as const,
          content: project.architecture || "",
        },
      ].filter(c => c.content.length > 0);

      allContents.push(...contents);
    }

    return await this.generateAndStoreEmbeddings(allContents);
  }

  /**
   * Generate embeddings for all projects
   */
  async generateAllProjectEmbeddings(): Promise<EmbeddingGenerationResult> {
    assertKnowledgeFeature("semanticSearch");

    const { data: projects } = await supabaseServer
      .from("projects")
      .select("id")
      .eq("published", true);

    if (!projects || projects.length === 0) {
      return { success: true, generated: 0, failed: 0, errors: [] };
    }

    const projectIds = projects.map((p: any) => p.id);
    return await this.generateBatchProjectEmbeddings(projectIds);
  }

  /**
   * Generate and store embeddings for content items
   */
  private async generateAndStoreEmbeddings(contents: EmbeddingContent[]): Promise<EmbeddingGenerationResult> {
    const result: EmbeddingGenerationResult = {
      success: true,
      generated: 0,
      failed: 0,
      errors: [],
    };

    // Process in batches
    for (let i = 0; i < contents.length; i += this.batchSize) {
      const batch = contents.slice(i, i + this.batchSize);
      const batchTexts = batch.map(c => c.content);

      try {
        const embeddings = await this.generateBatchEmbeddings(batchTexts);

        // Store embeddings
        for (let j = 0; j < batch.length; j++) {
          const content = batch[j];
          const embedding = embeddings[j];

          await this.storeEmbedding(content, embedding);
          result.generated++;
        }
      } catch (error) {
        console.error("Failed to generate batch embeddings:", error);
        result.failed += batch.length;
        result.errors.push(`Batch ${i / this.batchSize}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return result;
  }

  /**
   * Store embedding in database
   */
  private async storeEmbedding(content: EmbeddingContent, embedding: number[]): Promise<void> {
    const tableName = `${content.entityType}_embeddings`;
    const entityIdColumn = `${content.entityType}_id`;

    // Delete existing embedding for this content type
    await supabaseServer
      .from(tableName)
      .delete()
      .eq(entityIdColumn, content.entityId)
      .eq("content_type", content.contentType);

    // Insert new embedding
    const { error } = await supabaseServer.from(tableName).insert({
      [entityIdColumn]: content.entityId,
      embedding,
      embedding_model: this.embeddingModel,
      content_type: content.contentType,
      content: content.content,
    });

    if (error) {
      throw new Error(`Failed to store embedding: ${error.message}`);
    }
  }

  /**
   * Regenerate embeddings for a specific entity
   */
  async regenerateEmbeddings(entityType: "project" | "research" | "resource", entityId: string): Promise<EmbeddingGenerationResult> {
    assertKnowledgeFeature("semanticSearch");

    switch (entityType) {
      case "project":
        return await this.generateProjectEmbeddings(entityId);
      case "research":
        // TODO: Implement research embeddings
        return { success: true, generated: 0, failed: 0, errors: ["Research embeddings not yet implemented"] };
      case "resource":
        // TODO: Implement resource embeddings
        return { success: true, generated: 0, failed: 0, errors: ["Resource embeddings not yet implemented"] };
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Delete embeddings for an entity
   */
  async deleteEmbeddings(entityType: "project" | "research" | "resource", entityId: string): Promise<void> {
    const tableName = `${entityType}_embeddings`;
    const entityIdColumn = `${entityType}_id`;

    const { error } = await supabaseServer
      .from(tableName)
      .delete()
      .eq(entityIdColumn, entityId);

    if (error) {
      throw new Error(`Failed to delete embeddings: ${error.message}`);
    }
  }

  /**
   * Get embedding statistics
   */
  async getEmbeddingStats(): Promise<{
    projects: number;
    research: number;
    resources: number;
    total: number;
  }> {
    const [projects, research, resources] = await Promise.all([
      supabaseServer.from("project_embeddings").select("id", { count: "exact", head: true }),
      supabaseServer.from("research_embeddings").select("id", { count: "exact", head: true }),
      supabaseServer.from("resource_embeddings").select("id", { count: "exact", head: true }),
    ]);

    const projectCount = projects.count || 0;
    const researchCount = research.count || 0;
    const resourceCount = resources.count || 0;

    return {
      projects: projectCount,
      research: researchCount,
      resources: resourceCount,
      total: projectCount + researchCount + resourceCount,
    };
  }
}

// Singleton instance
export const embeddingEngine = new EmbeddingEngine();
