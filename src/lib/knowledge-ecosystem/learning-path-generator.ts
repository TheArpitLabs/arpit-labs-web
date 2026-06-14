import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";
import { prerequisiteEngine } from "./prerequisite-engine";
import { skillExtractionEngine } from "./skill-extraction";

export interface LearningPathStep {
  id: string;
  skill: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  description: string;
  resources: string[];
  estimatedTime: number;
  order: number;
}

export interface LearningPath {
  id: string;
  projectId: string;
  projectName: string;
  pathType: "beginner" | "intermediate" | "advanced" | "expert";
  steps: LearningPathStep[];
  totalEstimatedTime: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Learning Path Generator
 * Generates structured learning paths for projects
 */
export class LearningPathGenerator {
  /**
   * Generate learning path for a project
   */
  async generateProjectLearningPath(
    projectId: string,
    pathType: "beginner" | "intermediate" | "advanced" | "expert" = "intermediate"
  ): Promise<LearningPath> {
    assertKnowledgeFeature("learningPaths");

    // Fetch project data
    const { data: project } = await supabaseServer
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) {
      throw new Error("Project not found");
    }

    // Extract skills from project
    const skills = await skillExtractionEngine.getProjectSkills(projectId);
    
    // Generate learning path steps
    const steps = await this.generatePathSteps(skills, pathType);

    // Calculate total estimated time
    const totalEstimatedTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);

    // Store learning path
    const { data: pathData } = await supabaseServer
      .from("learning_paths")
      .upsert({
        project_id: projectId,
        path_type: pathType,
        steps: steps,
        total_estimated_time: totalEstimatedTime,
        updated_at: new Date().toISOString(),
      })
      .select("id, created_at, updated_at")
      .single();

    if (!pathData) {
      throw new Error("Failed to create learning path");
    }

    return {
      id: pathData.id,
      projectId,
      projectName: project.title,
      pathType,
      steps,
      totalEstimatedTime,
      createdAt: pathData.created_at,
      updatedAt: pathData.updated_at,
    };
  }

  /**
   * Generate path steps from skills
   */
  private async generatePathSteps(
    skills: any[],
    pathType: "beginner" | "intermediate" | "advanced" | "expert"
  ): Promise<LearningPathStep[]> {
    const steps: LearningPathStep[] = [];
    let order = 0;

    // Get prerequisites for each skill
    for (const skill of skills) {
      const prerequisites = await prerequisiteEngine.getPrerequisites(skill.id);
      
      // Add prerequisite steps first
      for (const prereq of prerequisites) {
        if (!steps.find(s => s.skill === prereq.prerequisiteSkillId)) {
          steps.push({
            id: prereq.id,
            skill: prereq.prerequisiteSkillId,
            level: this.mapSkillLevel(prereq.dependencyType),
            description: `Prerequisite for ${skill.name}`,
            resources: [],
            estimatedTime: this.estimateTime(prereq.dependencyType),
            order: order++,
          });
        }
      }

      // Add skill step
      steps.push({
        id: skill.id,
        skill: skill.name,
        level: skill.level,
        description: `Learn ${skill.name} for project completion`,
        resources: [],
        estimatedTime: this.estimateTime(skill.level),
        order: order++,
      });
    }

    // Filter steps based on path type
    return this.filterStepsByPathType(steps, pathType);
  }

  /**
   * Map dependency type to skill level
   */
  private mapSkillLevel(dependencyType: string): "beginner" | "intermediate" | "advanced" | "expert" {
    switch (dependencyType) {
      case "required":
        return "beginner";
      case "recommended":
        return "intermediate";
      case "optional":
        return "advanced";
      default:
        return "intermediate";
    }
  }

  /**
   * Estimate time for skill learning
   */
  private estimateTime(level: string): number {
    switch (level) {
      case "beginner":
        return 5; // 5 hours
      case "intermediate":
        return 10; // 10 hours
      case "advanced":
        return 20; // 20 hours
      case "expert":
        return 40; // 40 hours
      default:
        return 10;
    }
  }

  /**
   * Filter steps based on path type
   */
  private filterStepsByPathType(
    steps: LearningPathStep[],
    pathType: "beginner" | "intermediate" | "advanced" | "expert"
  ): LearningPathStep[] {
    switch (pathType) {
      case "beginner":
        return steps.filter(s => s.level === "beginner" || s.level === "intermediate");
      case "intermediate":
        return steps.filter(s => s.level !== "expert");
      case "advanced":
        return steps.filter(s => s.level === "intermediate" || s.level === "advanced" || s.level === "expert");
      case "expert":
        return steps;
      default:
        return steps;
    }
  }

  /**
   * Get learning path for a project
   */
  async getProjectLearningPath(
    projectId: string,
    pathType: "beginner" | "intermediate" | "advanced" | "expert" = "intermediate"
  ): Promise<LearningPath | null> {
    const { data } = await supabaseServer
      .from("learning_paths")
      .select("*")
      .eq("project_id", projectId)
      .eq("path_type", pathType)
      .maybeSingle();

    if (!data) return null;

    const { data: project } = await supabaseServer
      .from("projects")
      .select("title")
      .eq("id", projectId)
      .single();

    return {
      id: data.id,
      projectId,
      projectName: project?.title || "Unknown",
      pathType: data.path_type,
      steps: data.steps,
      totalEstimatedTime: data.total_estimated_time,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Generate all path types for a project
   */
  async generateAllProjectPaths(projectId: string): Promise<{
    beginner: LearningPath;
    intermediate: LearningPath;
    advanced: LearningPath;
    expert: LearningPath;
  }> {
    const [beginner, intermediate, advanced, expert] = await Promise.all([
      this.generateProjectLearningPath(projectId, "beginner"),
      this.generateProjectLearningPath(projectId, "intermediate"),
      this.generateProjectLearningPath(projectId, "advanced"),
      this.generateProjectLearningPath(projectId, "expert"),
    ]);

    return { beginner, intermediate, advanced, expert };
  }

  /**
   * Get recommended next project based on completed skills
   */
  async getRecommendedNextProject(
    completedSkills: string[],
    currentProjectId: string
  ): Promise<any | null> {
    // Find projects that build on completed skills
    const { data } = await supabaseServer
      .from("projects")
      .select("*")
      .neq("id", currentProjectId)
      .limit(10);

    if (!data) return null;

    // Score projects based on skill overlap
    const scoredProjects = (data as any[]).map(project => {
      const projectSkills = project.tech_stack || [];
      const overlap = projectSkills.filter((skill: string) => 
        completedSkills.some(completed => 
          completed.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(completed.toLowerCase())
        )
      ).length;
      
      return {
        ...project,
        score: overlap,
      };
    });

    // Sort by score and return top recommendation
    scoredProjects.sort((a, b) => b.score - a.score);
    
    return scoredProjects[0]?.score > 0 ? scoredProjects[0] : null;
  }

  /**
   * Get learning outcomes for a project
   */
  async getProjectLearningOutcomes(projectId: string): Promise<{
    skillsRequired: string[];
    skillsLearned: string[];
    estimatedTime: number;
    difficulty: string;
  }> {
    const skills = await skillExtractionEngine.getProjectSkills(projectId);
    const path = await this.getProjectLearningPath(projectId, "intermediate");

    return {
      skillsRequired: skills.map(s => s.name),
      skillsLearned: skills.map(s => s.name),
      estimatedTime: path?.totalEstimatedTime || 0,
      difficulty: skills[0]?.level || "intermediate",
    };
  }
}

// Singleton instance
export const learningPathGenerator = new LearningPathGenerator();
