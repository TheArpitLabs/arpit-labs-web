import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";

export interface UserProgress {
  id: string;
  userId: string;
  projectId?: string;
  skillId?: string;
  careerTrackId?: string;
  progressType: "project_completed" | "skill_learned" | "path_completed" | "track_progress";
  progressValue: number;
  metadata: Record<string, any>;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserLearningStats {
  totalProjectsCompleted: number;
  totalSkillsLearned: number;
  totalLearningPathsCompleted: number;
  totalLearningHours: number;
  currentStreak: number;
  longestStreak: number;
  achievements: string[];
}

/**
 * User Progress System
 * Tracks and manages user learning progress
 */
export class UserProgressSystem {
  /**
   * Record project completion
   */
  async recordProjectCompletion(userId: string, projectId: string, metadata: Record<string, any> = {}): Promise<string> {
    const { data, error } = await supabaseServer
      .from("user_learning_progress")
      .insert({
        user_id: userId,
        project_id: projectId,
        progress_type: "project_completed",
        progress_value: 100,
        metadata,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to record project completion:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Record skill learning
   */
  async recordSkillLearning(userId: string, skillId: string, progressValue: number = 100, metadata: Record<string, any> = {}): Promise<string> {
    const { data, error } = await supabaseServer
      .from("user_learning_progress")
      .insert({
        user_id: userId,
        skill_id: skillId,
        progress_type: "skill_learned",
        progress_value: progressValue,
        metadata,
        completed_at: progressValue === 100 ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to record skill learning:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Record learning path completion
   */
  async recordPathCompletion(userId: string, projectId: string, pathType: string, metadata: Record<string, any> = {}): Promise<string> {
    const { data, error } = await supabaseServer
      .from("user_learning_progress")
      .insert({
        user_id: userId,
        project_id: projectId,
        progress_type: "path_completed",
        progress_value: 100,
        metadata: { ...metadata, pathType },
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to record path completion:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Update career track progress
   */
  async updateCareerTrackProgress(userId: string, careerTrackId: string, progressValue: number, metadata: Record<string, any> = {}): Promise<string> {
    const { data, error } = await supabaseServer
      .from("user_learning_progress")
      .upsert({
        user_id: userId,
        career_track_id: careerTrackId,
        progress_type: "track_progress",
        progress_value: progressValue,
        metadata,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to update career track progress:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Get user progress
   */
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    const { data } = await supabaseServer
      .from("user_learning_progress")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      projectId: d.project_id,
      skillId: d.skill_id,
      careerTrackId: d.career_track_id,
      progressType: d.progress_type,
      progressValue: d.progress_value,
      metadata: d.metadata || {},
      completedAt: d.completed_at,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  /**
   * Get user learning stats
   */
  async getUserLearningStats(userId: string): Promise<UserLearningStats> {
    const progress = await this.getUserProgress(userId);

    const totalProjectsCompleted = progress.filter(p => p.progressType === "project_completed").length;
    const totalSkillsLearned = progress.filter(p => p.progressType === "skill_learned" && p.progressValue === 100).length;
    const totalLearningPathsCompleted = progress.filter(p => p.progressType === "path_completed").length;
    
    // Calculate learning hours (estimate 2 hours per project, 1 hour per skill)
    const totalLearningHours = (totalProjectsCompleted * 2) + (totalSkillsLearned * 1);

    // Calculate streaks
    const { currentStreak, longestStreak } = await this.calculateStreaks(userId);

    // Get achievements
    const achievements = await this.getAchievements(userId);

    return {
      totalProjectsCompleted,
      totalSkillsLearned,
      totalLearningPathsCompleted,
      totalLearningHours,
      currentStreak,
      longestStreak,
      achievements,
    };
  }

  /**
   * Calculate learning streaks
   */
  private async calculateStreaks(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
    const { data } = await supabaseServer
      .from("user_learning_progress")
      .select("completed_at")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    if (!data || data.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const completedDates = data.map((d: any) => new Date(d.completed_at).toDateString());
    const uniqueDates = [...new Set(completedDates)];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;
    const today = new Date();

    for (const dateStr of uniqueDates) {
      const date = new Date(dateStr);
      const diffDays = lastDate ? Math.floor((date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      } else {
        tempStreak = 1;
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      lastDate = date;
    }

    // Calculate current streak
    lastDate = null;
    tempStreak = 0;
    for (const dateStr of uniqueDates) {
      const date = new Date(dateStr);
      const diffDays = lastDate ? Math.floor((date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      } else {
        tempStreak = 1;
      }

      lastDate = date;
    }

    // Check if streak is still active (last completion within 2 days)
    if (lastDate) {
      const daysSinceLast = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLast <= 2) {
        currentStreak = tempStreak;
      }
    }

    return { currentStreak, longestStreak };
  }

  /**
   * Get user achievements
   */
  private async getAchievements(userId: string): Promise<string[]> {
    const progress = await this.getUserProgress(userId);
    const achievements: string[] = [];

    const totalProjectsCompleted = progress.filter(p => p.progressType === "project_completed").length;
    const totalSkillsLearned = progress.filter(p => p.progressType === "skill_learned" && p.progressValue === 100).length;

    if (totalProjectsCompleted >= 1) achievements.push("First Project");
    if (totalProjectsCompleted >= 5) achievements.push("Project Explorer");
    if (totalProjectsCompleted >= 10) achievements.push("Project Master");
    if (totalProjectsCompleted >= 25) achievements.push("Project Legend");

    if (totalSkillsLearned >= 1) achievements.push("First Skill");
    if (totalSkillsLearned >= 5) achievements.push("Skill Builder");
    if (totalSkillsLearned >= 10) achievements.push("Skill Master");
    if (totalSkillsLearned >= 25) achievements.push("Skill Legend");

    return achievements;
  }

  /**
   * Get completed projects for user
   */
  async getCompletedProjects(userId: string): Promise<string[]> {
    const { data } = await supabaseServer
      .from("user_learning_progress")
      .select("project_id")
      .eq("user_id", userId)
      .eq("progress_type", "project_completed")
      .eq("progress_value", 100);

    if (!data) return [];

    return data.map((d: any) => d.project_id).filter(Boolean);
  }

  /**
   * Get learned skills for user
   */
  async getLearnedSkills(userId: string): Promise<string[]> {
    const { data } = await supabaseServer
      .from("user_learning_progress")
      .select("skill_id")
      .eq("user_id", userId)
      .eq("progress_type", "skill_learned")
      .eq("progress_value", 100);

    if (!data) return [];

    return data.map((d: any) => d.skill_id).filter(Boolean);
  }

  /**
   * Get skill progress for user
   */
  async getSkillProgress(userId: string, skillId: string): Promise<number> {
    const { data } = await supabaseServer
      .from("user_learning_progress")
      .select("progress_value")
      .eq("user_id", userId)
      .eq("skill_id", skillId)
      .eq("progress_type", "skill_learned")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.progress_value || 0;
  }

  /**
   * Delete progress entry
   */
  async deleteProgress(progressId: string): Promise<void> {
    const { error } = await supabaseServer
      .from("user_learning_progress")
      .delete()
      .eq("id", progressId);

    if (error) {
      console.error("Failed to delete progress:", error);
      throw error;
    }
  }

  /**
   * Clear all progress for user
   */
  async clearUserProgress(userId: string): Promise<void> {
    const { error } = await supabaseServer
      .from("user_learning_progress")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to clear user progress:", error);
      throw error;
    }
  }
}

// Singleton instance
export const userProgressSystem = new UserProgressSystem();
