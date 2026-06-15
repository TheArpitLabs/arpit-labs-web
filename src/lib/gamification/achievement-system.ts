// Achievement System - Achievement tracking and completion logic

import { supabaseServer } from "@/lib/supabase/server";
import { Achievement, UserAchievement } from "./types";
import { calculateAchievementProgress, isAchievementCompleted, updateAchievementProgress } from "./achievements";

/**
 * Get all available achievements
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabaseServer
    .from('achievements')
    .select('*')
    .order('points_reward', { ascending: false });

  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's achievements with progress
 */
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabaseServer
    .from('user_achievements')
    .select(`
      *,
      achievements (*)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }

  return data || [];
}

/**
 * Initialize achievement progress for user
 */
export async function initializeAchievementProgress(
  userId: string,
  achievementId: string
): Promise<UserAchievement | null> {
  // Get achievement details
  const { data: achievement } = await supabaseServer
    .from('achievements')
    .select('*')
    .eq('id', achievementId)
    .single();

  if (!achievement) {
    return null;
  }

  // Check if already initialized
  const { data: existing } = await supabaseServer
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .single();

  if (existing) {
    return existing;
  }

  // Initialize progress
  const { data, error } = await supabaseServer
    .from('user_achievements')
    .insert({
      user_id: userId,
      achievement_id: achievementId,
      progress: {
        current: 0,
        target: achievement.criteria.target || 1,
        started_at: new Date().toISOString()
      }
    })
    .select(`
      *,
      achievements (*)
    `)
    .single();

  if (error) {
    console.error('Error initializing achievement progress:', error);
    return null;
  }

  return data;
}

/**
 * Update achievement progress
 */
export async function trackAchievementProgress(
  userId: string,
  achievementId: string,
  increment: number = 1
): Promise<{ completed: boolean; userAchievement: UserAchievement | null }> {
  // Get or initialize achievement progress
  let userAchievement = await initializeAchievementProgress(userId, achievementId);
  
  if (!userAchievement) {
    return { completed: false, userAchievement: null };
  }

  // If already completed, return
  if (userAchievement.completed_at) {
    return { completed: true, userAchievement };
  }

  // Update progress
  const newProgress = updateAchievementProgress(userAchievement, increment);
  const achievement = userAchievement.achievement!;

  // Check if completed
  const completed = isAchievementCompleted(achievement, newProgress);

  // Update database
  const { data, error } = await supabaseServer
    .from('user_achievements')
    .update({
      progress: newProgress,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userAchievement.id)
    .select(`
      *,
      achievements (*)
    `)
    .single();

  if (error) {
    console.error('Error updating achievement progress:', error);
    return { completed: false, userAchievement };
  }

  // If completed, award points and badge
  if (completed && achievement.points_reward > 0) {
    await supabaseServer.rpc('award_points', {
      p_user_id: userId,
      p_points: achievement.points_reward,
      p_action_type: 'achievement_completed',
      p_description: `Completed achievement: ${achievement.name}`,
      p_metadata: { achievement_id: achievement.id, achievement_name: achievement.name }
    });

    // Award badge if associated
    if (achievement.badge_id) {
      const { data: badgeData } = await supabaseServer
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('badge_id', achievement.badge_id)
        .single();

      if (!badgeData) {
        await supabaseServer
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: achievement.badge_id
          });
      }
    }
  }

  return { completed, userAchievement: data };
}

/**
 * Track achievement by type
 */
export async function trackAchievementByType(
  userId: string,
  type: string,
  increment: number = 1
): Promise<void> {
  // Get all achievements of this type
  const { data: achievements } = await supabaseServer
    .from('achievements')
    .select('*')
    .eq('criteria->>type', type);

  if (!achievements || achievements.length === 0) {
    return;
  }

  // Update progress for each achievement
  for (const achievement of achievements) {
    await trackAchievementProgress(userId, achievement.id, increment);
  }
}

/**
 * Get achievement progress for user
 */
export async function getAchievementProgress(
  userId: string,
  achievementId: string
): Promise<{ progress: number; completed: boolean } | null> {
  const { data, error } = await supabaseServer
    .from('user_achievements')
    .select(`
      *,
      achievements (*)
    `)
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .single();

  if (error || !data) {
    return null;
  }

  const achievement = data.achievement!;
  const progress = calculateAchievementProgress(achievement, data.progress);
  const completed = !!data.completed_at;

  return { progress, completed };
}

/**
 * Check and complete achievements based on user stats
 */
export async function checkAndCompleteAchievements(
  userId: string,
  userStats: Record<string, number>
): Promise<Achievement[]> {
  const allAchievements = await getAllAchievements();
  const userAchievements = await getUserAchievements(userId);
  const completedAchievementIds = new Set(
    userAchievements
      .filter(ua => ua.completed_at)
      .map(ua => ua.achievement_id)
  );
  
  const newlyCompletedAchievements: Achievement[] = [];

  for (const achievement of allAchievements) {
    // Skip if already completed
    if (completedAchievementIds.has(achievement.id)) {
      continue;
    }

    const criteriaType = achievement.criteria.type;
    const target = achievement.criteria.target || 1;
    const current = userStats[criteriaType] || 0;

    if (current >= target) {
      // Complete the achievement
      const result = await trackAchievementProgress(userId, achievement.id, target);
      
      if (result.completed) {
        newlyCompletedAchievements.push(achievement);
      }
    }
  }

  return newlyCompletedAchievements;
}
