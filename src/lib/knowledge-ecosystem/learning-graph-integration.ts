import { knowledgeGraphEngine } from "./knowledge-graph";
import { skillExtractionEngine } from "./skill-extraction";
import { assertKnowledgeFeature } from "./feature-flags";

/**
 * Learning Graph Integration
 * Integrates learning system with knowledge graph from Phase E6
 */
export class LearningGraphIntegration {
  /**
   * Sync skills with knowledge graph entities
   */
  async syncSkillsWithGraph(): Promise<void> {
    assertKnowledgeFeature("learningPaths");
    assertKnowledgeFeature("knowledgeGraph");

    // Get all skills from learning system
    const allSkills = await this.getAllSkills();

    // For each skill, create/update graph entity
    for (const skill of allSkills) {
      await knowledgeGraphEngine.upsertEntity({
        entityId: skill.id,
        type: "technology",
        title: skill.name,
        slug: skill.name.toLowerCase().replace(/\s+/g, "-"),
        metadata: {
          category: skill.category,
          level: skill.level,
          description: skill.description,
          relatedSkills: skill.relatedSkills,
        },
      });
    }
  }

  /**
   * Create skill-project relationships in graph
   */
  async createSkillProjectRelationships(projectId: string): Promise<void> {
    assertKnowledgeFeature("learningPaths");
    assertKnowledgeFeature("knowledgeGraph");

    const skills = await skillExtractionEngine.getProjectSkills(projectId);

    for (const skill of skills) {
      // Create relationship between project and skill in graph
      await knowledgeGraphEngine.createRelationship(
        projectId,
        skill.id,
        "requires_skill",
        1.0,
        { skillLevel: skill.level }
      );

      // Also create reverse relationship
      await knowledgeGraphEngine.createRelationship(
        skill.id,
        projectId,
        "used_in_project",
        1.0,
        { skillLevel: skill.level }
      );
    }
  }

  /**
   * Create skill-skill relationships in graph (prerequisites)
   */
  async createSkillPrerequisiteRelationships(skillId: string, prerequisiteSkillId: string): Promise<void> {
    assertKnowledgeFeature("learningPaths");
    assertKnowledgeFeature("knowledgeGraph");

    await knowledgeGraphEngine.createRelationship(
      skillId,
      prerequisiteSkillId,
      "requires_prerequisite",
      1.0,
      { type: "prerequisite" }
    );

    await knowledgeGraphEngine.createRelationship(
      prerequisiteSkillId,
      skillId,
      "prerequisite_for",
      1.0,
      { type: "prerequisite" }
    );
  }

  /**
   * Get related projects for a skill via graph
   */
  async getRelatedProjectsForSkill(skillId: string, limit: number = 10): Promise<any[]> {
    assertKnowledgeFeature("learningPaths");
    assertKnowledgeFeature("knowledgeGraph");

    const related = await knowledgeGraphEngine.getRelatedEntities(
      skillId,
      "used_in_project",
      limit
    );

    return related;
  }

  /**
   * Get related skills for a project via graph
   */
  async getRelatedSkillsForProject(projectId: string, limit: number = 10): Promise<any[]> {
    assertKnowledgeFeature("learningPaths");
    assertKnowledgeFeature("knowledgeGraph");

    const related = await knowledgeGraphEngine.getRelatedEntities(
      projectId,
      "requires_skill",
      limit
    );

    return related;
  }

  /**
   * Find learning path using graph traversal
   */
  async findLearningPath(fromSkillId: string, toSkillId: string): Promise<string[]> {
    assertKnowledgeFeature("learningPaths");
    assertKnowledgeFeature("knowledgeGraph");

    const path = await knowledgeGraphEngine.findPath(fromSkillId, toSkillId, 5);

    if (!path || !path.entities) {
      return [];
    }

    return path.entities.map((node: any) => node.id);
  }

  /**
   * Get skill recommendations from graph
   */
  async getSkillRecommendations(skillId: string, limit: number = 5): Promise<any[]> {
    assertKnowledgeFeature("learningPaths");
    assertKnowledgeFeature("knowledgeGraph");

    const related = await knowledgeGraphEngine.getRelatedEntities(
      skillId,
      "related_to",
      limit
    );

    return related;
  }

  /**
   * Build project knowledge graph with learning context
   */
  async buildProjectLearningGraph(projectId: string): Promise<void> {
    assertKnowledgeFeature("learningPaths");
    assertKnowledgeFeature("knowledgeGraph");

    // Build standard knowledge graph
    await knowledgeGraphEngine.buildProjectGraph(projectId);

    // Add learning-specific relationships
    await this.createSkillProjectRelationships(projectId);
  }

  /**
   * Get all skills from learning system
   */
  private async getAllSkills(): Promise<any[]> {
    const { skillExtractionEngine } = await import("./skill-extraction");
    const engine = skillExtractionEngine;

    const skills: any[] = [];
    const categories = ["technologies", "frameworks", "domains", "tools"];

    for (const category of categories) {
      const categorySkills = await engine.getSkillsByCategory(category);
      skills.push(...categorySkills);
    }

    return skills;
  }

  /**
   * Search skills via graph
   */
  async searchSkills(query: string, limit: number = 10): Promise<any[]> {
    assertKnowledgeFeature("learningPaths");
    assertKnowledgeFeature("knowledgeGraph");

    const results = await knowledgeGraphEngine.searchEntities("skill", query, limit);

    return results;
  }

  /**
   * Get skill statistics from graph
   */
  async getSkillStatistics(skillId: string): Promise<{
    totalConnections: number;
    projectCount: number;
    prerequisiteCount: number;
    relatedSkillCount: number;
  }> {
    assertKnowledgeFeature("learningPaths");
    assertKnowledgeFeature("knowledgeGraph");

    const projectConnections = await knowledgeGraphEngine.getRelatedEntities(skillId, "used_in_project", 100);
    const prerequisiteConnections = await knowledgeGraphEngine.getRelatedEntities(skillId, "requires_prerequisite", 100);
    const relatedConnections = await knowledgeGraphEngine.getRelatedEntities(skillId, "related_to", 100);

    return {
      totalConnections: projectConnections.length + prerequisiteConnections.length + relatedConnections.length,
      projectCount: projectConnections.length,
      prerequisiteCount: prerequisiteConnections.length,
      relatedSkillCount: relatedConnections.length,
    };
  }

  /**
   * Get most connected skills from graph
   */
  async getMostConnectedSkills(limit: number = 10): Promise<any[]> {
    assertKnowledgeFeature("learningPaths");
    assertKnowledgeFeature("knowledgeGraph");

    const mostConnected = await knowledgeGraphEngine.getMostConnectedEntities("skill", limit);

    return mostConnected;
  }

  /**
   * Sync career tracks with graph
   */
  async syncCareerTracksWithGraph(): Promise<void> {
    assertKnowledgeFeature("learningPaths");
    assertKnowledgeFeature("knowledgeGraph");

    const { careerTrackEngine } = await import("./career-track-engine");
    const engine = careerTrackEngine;

    const tracks = await engine.getAllCareerTracks();

    for (const track of tracks) {
      // Create career track entity in graph
      await knowledgeGraphEngine.upsertEntity({
        entityId: track.id,
        type: "learning_path",
        title: track.name,
        slug: track.name.toLowerCase().replace(/\s+/g, "-"),
        metadata: {
          description: track.description,
          difficulty: track.difficulty,
          domains: track.domains,
        },
      });

      // Create relationships between career track and required skills
      for (const skillId of track.requiredSkills) {
        await knowledgeGraphEngine.createRelationship(
          track.id,
          skillId,
          "requires_skill",
          1.0,
          { type: "required" }
        );
      }

      // Create relationships between career track and recommended skills
      for (const skillId of track.recommendedSkills) {
        await knowledgeGraphEngine.createRelationship(
          track.id,
          skillId,
          "recommends_skill",
          0.5,
          { type: "recommended" }
        );
      }
    }
  }
}

// Singleton instance
export const learningGraphIntegration = new LearningGraphIntegration();
