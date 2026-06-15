// Streak System - Streak tracking and management logic

import { supabaseServer } from "@/lib/supabase/server";
import { UserStreak } from "./types";
import { isStreakActive, isLoggedInToday, getStreakBonus, getStreakMilestone } from "./streaks";

/**
 * Get user streak data
 */
export async function getUserStreak(userId: string): Promise<UserStreak | null> {
  const { data, error } = await supabaseServer
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user streak:', error);
    return null;
  }

  return data;
}

/**
 * Initialize user streak
 */
export async function initializeUserStreak(userId: string): Promise<UserStreak | null> {
  // Check if already exists
  const existing = await getUserStreak(userId);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabaseServer
    .from('user_streaks')
    .insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: new Date().toISOString().split('T')[0]
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error initializing user streak:', error);
    return null;
  }

  return data;
}

/**
 * Update user streak (call this on user activity)
 */
export async function updateUserStreak(userId: string): Promise<{
  streak: UserStreak;
  isNewDay: boolean;
  milestone: { message: string; bonusPoints: number } | null;
}> {
  const streak = await getUserStreak(userId);
  
  if (!streak) {
    const newStreak = await initializeUserStreak(userId);
    if (!newStreak) {
      throw new Error('Failed to initialize streak');
    }
    return {
      streak: newStreak,
      isNewDay: true,
      milestone: null
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let isNewDay = false;
  let milestone: { message: string; bonusPoints: number } | null = null;

  // Check if already logged in today
  if (streak.last_activity_date === today) {
    // Already logged in today, no change
    return {
      streak,
      isNewDay: false,
      milestone: null
    };
  }

  // Check if logged in yesterday (consecutive day)
  if (streak.last_activity_date === yesterdayStr) {
    // Increment streak
    const newStreak = streak.current_streak + 1;
    const newLongest = Math.max(streak.longest_streak, newStreak);

    const { data, error } = await supabaseServer
      .from('user_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('id', streak.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating streak:', error);
      throw error;
    }

    isNewDay = true;
    milestone = getStreakMilestone(newStreak);

    return {
      streak: data!,
      isNewDay,
      milestone
    };
  }

  // Streak broken, reset to 1
  const { data, error } = await supabaseServer
    .from('user_streaks')
    .update({
      current_streak: 1,
      last_activity_date: today,
      updated_at: new Date().toISOString()
    })
    .eq('id', streak.id)
    .select('*')
    .single();

  if (error) {
    console.error('Error resetting streak:', error);
    throw error;
  }

  isNewDay = true;

  return {
    streak: data!,
    isNewDay,
    milestone: null
  };
}

/**
 * Get streak bonus for points calculation
 */
export async function getStreakBonusMultiplier(userId: string): Promise<number> {
  const streak = await getUserStreak(userId);
  
  if (!streak) {
    return 1.0;
  }

  return getStreakBonus(streak.current_streak);
}

/**
 * Check if user has active streak
 */
export async function hasActiveStreak(userId: string): Promise<boolean> {
  const streak = await getUserStreak(userId);
  
  if (!streak) {
    return false;
  }

  return isStreakActive(streak);
}

/**
 * Get streak summary for display
 */
export async function getStreakSummary(userId: string): Promise<{
  current: number;
  longest: number;
  isActive: boolean;
  isLoggedInToday: boolean;
  bonusMultiplier: number;
  nextMilestone: number;
}> {
  const streak = await getUserStreak(userId);
  
  if (!streak) {
    return {
      current: 0,
      longest: 0,
      isActive: false,
      isLoggedInToday: false,
      bonusMultiplier: 1.0,
      nextMilestone: 3
    };
  }

  const isActive = isStreakActive(streak);
  const loggedInToday = isLoggedInToday(streak);
  const bonusMultiplier = getStreakBonus(streak.current_streak);
  
  // Calculate next milestone
  const milestones = [3, 7, 14, 30, 60, 100];
  let nextMilestone = milestones[0];
  for (const milestone of milestones) {
    if (streak.current_streak < milestone) {
      nextMilestone = milestone;
      break;
    }
  }
  if (streak.current_streak >= 100) {
    nextMilestone = streak.current_streak + 10;
  }

  return {
    current: streak.current_streak,
    longest: streak.longest_streak,
    isActive,
    isLoggedInToday: loggedInToday,
    bonusMultiplier,
    nextMilestone
  };
}
