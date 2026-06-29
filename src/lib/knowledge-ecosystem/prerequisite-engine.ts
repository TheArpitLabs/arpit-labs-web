import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";
import { logger } from '@/lib/logger';

export interface Prerequisite {
  id: string;
  skillId: string;
  prerequisiteSkillId: string;
  dependencyType: "required" | "recommended" | "optional";
  strength: number;
  createdAt: string;
}

export interface SkillDependency {
  skill: string;
  prerequisites: string[];
  dependents: string[];
  level: number;
}

/**
 * Prerequisite Engine
 * Identifies and manages skill dependencies
 */
export class PrerequisiteEngine {
  private skillDependencies: Map<string, SkillDependency> = new Map();

  /**
   * Define skill dependencies
   */
  async definePrerequisite(
    skillId: string,
    prerequisiteSkillId: string,
    dependencyType: "required" | "recommended" | "optional" = "required",
    strength: number = 1.0
  ): Promise<string> {
    const { data, error } = await supabaseServer
      .from("skill_relationships")
      .insert({
        skill_id: skillId,
        related_entity_id: prerequisiteSkillId,
        related_entity_type: "skill",
        relationship_type: "prerequisite",
        metadata: {
          dependency_type: dependencyType,
          strength,
        },
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Failed to define prerequisite:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Get prerequisites for a skill
   */
  async getPrerequisites(skillId: string): Promise<Prerequisite[]> {
    const { data } = await supabaseServer
      .from("skill_relationships")
      .select("*")
      .eq("skill_id", skillId)
      .eq("relationship_type", "prerequisite");

    if (!data) return [];

    return data.map((r: any) => ({
      id: r.id,
      skillId: r.skill_id,
      prerequisiteSkillId: r.related_entity_id,
      dependencyType: r.metadata?.dependency_type || "required",
      strength: r.metadata?.strength || 1.0,
      createdAt: r.created_at,
    }));
  }

  /**
   * Get dependents (skills that depend on this skill)
   */
  async getDependents(skillId: string): Promise<Prerequisite[]> {
    const { data } = await supabaseServer
      .from("skill_relationships")
      .select("*")
      .eq("related_entity_id", skillId)
      .eq("related_entity_type", "skill")
      .eq("relationship_type", "prerequisite");

    if (!data) return [];

    return data.map((r: any) => ({
      id: r.id,
      skillId: r.skill_id,
      prerequisiteSkillId: r.related_entity_id,
      dependencyType: r.metadata?.dependency_type || "required",
      strength: r.metadata?.strength || 1.0,
      createdAt: r.created_at,
    }));
  }

  /**
   * Build prerequisite graph for a skill
   */
  async buildPrerequisiteGraph(skillId: string, maxDepth: number = 5): Promise<SkillDependency> {
    const visited = new Set<string>();
    const prerequisites: string[] = [];
    const dependents: string[] = [];

    await this.collectPrerequisites(skillId, prerequisites, visited, maxDepth);
    visited.clear();
    await this.collectDependents(skillId, dependents, visited, maxDepth);

    return {
      skill: skillId,
      prerequisites,
      dependents,
      level: prerequisites.length,
    };
  }

  /**
   * Collect prerequisites recursively
   */
  private async collectPrerequisites(
    skillId: string,
    prerequisites: string[],
    visited: Set<string>,
    depth: number
  ): Promise<void> {
    if (depth <= 0 || visited.has(skillId)) return;
    visited.add(skillId);

    const prereqs = await this.getPrerequisites(skillId);
    for (const prereq of prereqs) {
      prerequisites.push(prereq.prerequisiteSkillId);
      await this.collectPrerequisites(prereq.prerequisiteSkillId, prerequisites, visited, depth - 1);
    }
  }

  /**
   * Collect dependents recursively
   */
  private async collectDependents(
    skillId: string,
    dependents: string[],
    visited: Set<string>,
    depth: number
  ): Promise<void> {
    if (depth <= 0 || visited.has(skillId)) return;
    visited.add(skillId);

    const deps = await this.getDependents(skillId);
    for (const dep of deps) {
      dependents.push(dep.skillId);
      await this.collectDependents(dep.skillId, dependents, visited, depth - 1);
    }
  }

  /**
   * Get learning path from prerequisites
   */
  async getLearningPath(skillId: string): Promise<string[]> {
    const graph = await this.buildPrerequisiteGraph(skillId);
    
    // Reverse prerequisites to get learning order (from basic to advanced)
    const learningPath = [...graph.prerequisites].reverse();
    learningPath.push(skillId);
    
    return learningPath;
  }

  /**
   * Initialize default skill dependencies
   */
  async initializeDefaultDependencies(): Promise<void> {
    assertKnowledgeFeature("learningPaths");

    // Programming fundamentals
    await this.definePrerequisite("Python", "Programming Fundamentals", "required", 1.0);
    await this.definePrerequisite("JavaScript", "Programming Fundamentals", "required", 1.0);
    await this.definePrerequisite("C++", "Programming Fundamentals", "required", 1.0);

    // Computer Vision path
    await this.definePrerequisite("OpenCV", "Python", "required", 1.0);
    await this.definePrerequisite("YOLO", "OpenCV", "required", 1.0);
    await this.definePrerequisite("YOLO", "Python", "required", 1.0);
    await this.definePrerequisite("Computer Vision", "OpenCV", "required", 0.8);
    await this.definePrerequisite("Computer Vision", "Python", "required", 0.9);

    // IoT path
    await this.definePrerequisite("Arduino", "Programming Fundamentals", "required", 0.8);
    await this.definePrerequisite("Raspberry Pi", "Linux", "recommended", 0.7);
    await this.definePrerequisite("ESP32", "C++", "recommended", 0.6);
    await this.definePrerequisite("Embedded Systems", "Arduino", "required", 0.9);
    await this.definePrerequisite("Embedded Systems", "C++", "recommended", 0.7);

    // Machine Learning path
    await this.definePrerequisite("TensorFlow", "Python", "required", 1.0);
    await this.definePrerequisite("PyTorch", "Python", "required", 1.0);
    await this.definePrerequisite("Machine Learning", "Python", "required", 0.9);
    await this.definePrerequisite("Machine Learning", "NumPy", "required", 0.8);
    await this.definePrerequisite("Machine Learning", "Pandas", "required", 0.8);
    await this.definePrerequisite("Deep Learning", "Machine Learning", "required", 1.0);
    await this.definePrerequisite("Deep Learning", "TensorFlow", "recommended", 0.8);
    await this.definePrerequisite("Deep Learning", "PyTorch", "recommended", 0.8);

    // Web Development path
    await this.definePrerequisite("React", "JavaScript", "required", 1.0);
    await this.definePrerequisite("Next.js", "React", "required", 1.0);
    await this.definePrerequisite("Node.js", "JavaScript", "required", 1.0);
    await this.definePrerequisite("Express", "Node.js", "required", 0.9);

    // Cloud path
    await this.definePrerequisite("Docker", "Linux", "recommended", 0.7);
    await this.definePrerequisite("Kubernetes", "Docker", "required", 1.0);
    await this.definePrerequisite("AWS", "Linux", "recommended", 0.6);
    await this.definePrerequisite("Cloud Computing", "Docker", "required", 0.8);
    await this.definePrerequisite("Cloud Computing", "Kubernetes", "recommended", 0.7);
  }

  /**
   * Check if user has prerequisites for a skill
   */
  async checkPrerequisites(
    skillId: string,
    userCompletedSkills: string[]
  ): Promise<{
    hasPrerequisites: boolean;
    missingPrerequisites: string[];
    recommendedPrerequisites: string[];
  }> {
    const prerequisites = await this.getPrerequisites(skillId);
    
    const missingPrerequisites: string[] = [];
    const recommendedPrerequisites: string[] = [];

    for (const prereq of prerequisites) {
      if (!userCompletedSkills.includes(prereq.prerequisiteSkillId)) {
        if (prereq.dependencyType === "required") {
          missingPrerequisites.push(prereq.prerequisiteSkillId);
        } else if (prereq.dependencyType === "recommended") {
          recommendedPrerequisites.push(prereq.prerequisiteSkillId);
        }
      }
    }

    return {
      hasPrerequisites: missingPrerequisites.length === 0,
      missingPrerequisites,
      recommendedPrerequisites,
    };
  }
}

// Singleton instance
export const prerequisiteEngine = new PrerequisiteEngine();
