import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";
import { learningPathGenerator } from "./learning-path-generator";
import { careerTrackEngine } from "./career-track-engine";

export interface LearningRecommendation {
  id: string;
  userId: string;
  recommendationType: "project" | "skill" | "career_track" | "learning_path";
  recommendedEntityId: string;
  recommendedEntityType: string;
  reason: string;
  score: number;
  metadata: Record<string, any>;
  expiresAt: string;
  createdAt: string;
}

export interface LearningContext {
  userId: string;
  completedProjects: string[];
  completedSkills: string[];
  currentPath: string | null;
  careerTrack: string | null;
  learningGoals: string[];
  skillGaps: string[];
}

/**
 * AI Learning Advisor
 * Generates personalized learning recommendations
 */
export class AILearningAdvisor {
  /**
   * Generate learning recommendations for a user
   */
  async generateRecommendations(userId: string, limit: number = 10): Promise<LearningRecommendation[]> {
    assertKnowledgeFeature("learningPaths");

    const context = await this.buildLearningContext(userId);
    const recommendations: LearningRecommendation[] = [];

    // Generate project recommendations
    const projectRecs = await this.generateProjectRecommendations(context, limit / 2);
    recommendations.push(...projectRecs);

    // Generate skill recommendations
    const skillRecs = await this.generateSkillRecommendations(context, limit / 2);
    recommendations.push(...skillRecs);

    // Generate career track recommendations
    const careerRecs = await this.generateCareerTrackRecommendations(context, 2);
    recommendations.push(...careerRecs);

    // Sort by score and limit
    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, limit);
  }

  /**
   * Build learning context for a user
   */
  private async buildLearningContext(userId: string): Promise<LearningContext> {
    const { data: progress } = await supabaseServer
      .from("user_learning_progress")
      .select("*")
      .eq("user_id", userId);

    const completedProjects: string[] = [];
    const completedSkills: string[] = [];
    let currentPath: string | null = null;
    let careerTrack: string | null = null;

    if (progress) {
      for (const p of progress) {
        if (p.progress_type === "project_completed" && p.project_id) {
          completedProjects.push(p.project_id);
        } else if (p.progress_type === "skill_learned" && p.skill_id) {
          completedSkills.push(p.skill_id);
        } else if (p.progress_type === "path_completed") {
          currentPath = p.project_id;
        } else if (p.progress_type === "track_progress" && p.career_track_id) {
          careerTrack = p.career_track_id;
        }
      }
    }

    // Identify skill gaps
    const skillGaps = await this.identifySkillGaps(completedSkills, careerTrack);

    return {
      userId,
      completedProjects,
      completedSkills,
      currentPath,
      careerTrack,
      learningGoals: [],
      skillGaps,
    };
  }

  /**
   * Identify skill gaps
   */
  private async identifySkillGaps(completedSkills: string[], careerTrackId: string | null): Promise<string[]> {
    if (!careerTrackId) return [];

    const track = await careerTrackEngine.getCareerTrack(careerTrackId);
    if (!track) return [];

    return track.requiredSkills.filter(skill => !completedSkills.includes(skill));
  }

  /**
   * Generate project recommendations
   */
  private async generateProjectRecommendations(context: LearningContext, limit: number): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];

    for (const projectId of context.completedProjects) {
      const nextProject = await learningPathGenerator.getRecommendedNextProject(
        context.completedSkills,
        projectId
      );

      if (nextProject) {
        recommendations.push({
          id: crypto.randomUUID(),
          userId: context.userId,
          recommendationType: "project",
          recommendedEntityId: nextProject.id,
          recommendedEntityType: "project",
          reason: `Builds on your completion of project ${projectId}`,
          score: nextProject.score || 0,
          metadata: { project: nextProject },
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Sort by score and limit
    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, limit);
  }

  /**
   * Generate skill recommendations
   */
  private async generateSkillRecommendations(context: LearningContext, limit: number): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];

    // Recommend based on skill gaps
    for (const skillGap of context.skillGaps) {
      recommendations.push({
        id: crypto.randomUUID(),
        userId: context.userId,
        recommendationType: "skill",
        recommendedEntityId: skillGap,
        recommendedEntityType: "skill",
        reason: `Required for your career track progression`,
        score: 0.9,
        metadata: { skillGap },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    // Recommend based on completed skills (related skills)
    for (const completedSkill of context.completedSkills.slice(0, 5)) {
      const relatedSkills = await this.getRelatedSkills(completedSkill);
      for (const relatedSkill of relatedSkills) {
        if (!context.completedSkills.includes(relatedSkill)) {
          recommendations.push({
            id: crypto.randomUUID(),
            userId: context.userId,
            recommendationType: "skill",
            recommendedEntityId: relatedSkill,
            recommendedEntityType: "skill",
            reason: `Related to ${completedSkill}`,
            score: 0.7,
            metadata: { baseSkill: completedSkill },
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // Sort by score and limit
    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, limit);
  }

  /**
   * Generate career track recommendations
   */
  private async generateCareerTrackRecommendations(context: LearningContext, limit: number): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];

    const recommendedTracks = await careerTrackEngine.recommendCareerTracks(context.completedSkills);

    for (const track of recommendedTracks) {
      recommendations.push({
        id: crypto.randomUUID(),
        userId: context.userId,
        recommendationType: "career_track",
        recommendedEntityId: track.id,
        recommendedEntityType: "career_track",
        reason: `Matches your skill profile`,
        score: (track as any).score || 0.5,
        metadata: { track },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    // Sort by score and limit
    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, limit);
  }

  /**
   * Get related skills
   */
  private async getRelatedSkills(skillId: string): Promise<string[]> {
    const { data } = await supabaseServer
      .from("skill_relationships")
      .select("related_entity_id")
      .eq("skill_id", skillId)
      .eq("relationship_type", "related_to")
      .limit(5);

    if (!data) return [];

    return data.map((r: any) => r.related_entity_id);
  }

  /**
   * Store recommendation in database
   */
  async storeRecommendation(recommendation: Omit<LearningRecommendation, "id" | "createdAt">): Promise<string> {
    const { data, error } = await supabaseServer
      .from("learning_recommendations")
      .insert({
        user_id: recommendation.userId,
        recommendation_type: recommendation.recommendationType,
        recommended_entity_id: recommendation.recommendedEntityId,
        recommended_entity_type: recommendation.recommendedEntityType,
        reason: recommendation.reason,
        score: recommendation.score,
        metadata: recommendation.metadata,
        expires_at: recommendation.expiresAt,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to store recommendation:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Get next learning step for user
   */
  async getNextLearningStep(userId: string): Promise<{
    type: "project" | "skill" | "career";
    entity: string;
    reason: string;
  } | null> {
    const recommendations = await this.generateRecommendations(userId, 1);
    
    if (recommendations.length === 0) return null;

    const topRec = recommendations[0];
    return {
      type: topRec.recommendationType as any,
      entity: topRec.recommendedEntityId,
      reason: topRec.reason,
    };
  }

  /**
   * Generate learning summary
   */
  async generateLearningSummary(userId: string): Promise<{
    totalCompleted: number;
    skillsLearned: number;
    projectsCompleted: number;
    currentFocus: string;
    nextSteps: string[];
    careerProgress: number;
  }> {
    const context = await this.buildLearningContext(userId);
    const nextStep = await this.getNextLearningStep(userId);

    let careerProgress = 0;
    if (context.careerTrack) {
      const trackProgress = await careerTrackEngine.getCareerTrackProgress(context.careerTrack, context.completedSkills);
      careerProgress = trackProgress.progress;
    }

    return {
      totalCompleted: context.completedProjects.length + context.completedSkills.length,
      skillsLearned: context.completedSkills.length,
      projectsCompleted: context.completedProjects.length,
      currentFocus: context.currentPath || "General Learning",
      nextSteps: nextStep ? [nextStep.reason] : ["Explore new projects"],
      careerProgress,
    };
  }
}

// Singleton instance
export const aiLearningAdvisor = new AILearningAdvisor();
