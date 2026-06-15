// Achievement System - Core logic for achievement tracking and completion

import { Achievement, UserAchievement } from './types';

/**
 * Calculate achievement progress percentage
 */
export function calculateAchievementProgress(
  achievement: Achievement,
  userProgress: Record<string, any>
): number {
  const criteria = achievement.criteria;
  const target = criteria.target || 1;
  const current = userProgress.current || 0;
  
  return Math.min(100, Math.max(0, (current / target) * 100));
}

/**
 * Check if achievement is completed
 */
export function isAchievementCompleted(
  achievement: Achievement,
  userProgress: Record<string, any>
): boolean {
  const criteria = achievement.criteria;
  const target = criteria.target || 1;
  const current = userProgress.current || 0;
  
  return current >= target;
}

/**
 * Update achievement progress
 */
export function updateAchievementProgress(
  userAchievement: UserAchievement,
  increment: number = 1
): Record<string, any> {
  const current = userAchievement.progress.current || 0;
  const newCurrent = current + increment;
  
  return {
    ...userAchievement.progress,
    current: newCurrent,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Get achievement difficulty color
 */
export function getAchievementDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: '#10B981', // green
    medium: '#3B82F6', // blue
    hard: '#F59E0B', // orange
    legendary: '#EF4444', // red
  };
  
  return colors[difficulty] || colors.easy;
}

/**
 * Sort achievements by difficulty and points
 */
export function sortAchievements(achievements: Achievement[]): Achievement[] {
  const difficultyOrder = { legendary: 0, hard: 1, medium: 2, easy: 3 };
  
  return achievements.sort((a, b) => {
    const difficultyA = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] ?? 3;
    const difficultyB = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] ?? 3;
    
    if (difficultyA !== difficultyB) {
      return difficultyA - difficultyB;
    }
    
    return b.points_reward - a.points_reward;
  });
}

/**
 * Filter achievements by category
 */
export function filterAchievementsByCategory(
  achievements: Achievement[],
  category: string
): Achievement[] {
  return achievements.filter(a => a.category === category);
}

/**
 * Get achievement categories
 */
export function getAchievementCategories(achievements: Achievement[]): string[] {
  const categories = new Set(achievements.map(a => a.category));
  return Array.from(categories);
}
