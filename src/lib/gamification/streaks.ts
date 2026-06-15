// Streak System - Core logic for streak tracking

import { UserStreak } from './types';

/**
 * Check if streak is active (logged in today or yesterday)
 */
export function isStreakActive(streak: UserStreak): boolean {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastActivity = new Date(streak.last_activity_date);
  
  // Normalize dates to midnight for comparison
  lastActivity.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  
  return lastActivity.getTime() === today.getTime() || lastActivity.getTime() === yesterday.getTime();
}

/**
 * Check if user logged in today
 */
export function isLoggedInToday(streak: UserStreak): boolean {
  const today = new Date();
  const lastActivity = new Date(streak.last_activity_date);
  
  // Normalize dates to midnight for comparison
  lastActivity.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  return lastActivity.getTime() === today.getTime();
}

/**
 * Calculate streak bonus multiplier
 */
export function getStreakBonus(streak: number): number {
  if (streak >= 30) return 2.0; // 2x bonus for 30+ day streak
  if (streak >= 14) return 1.5; // 1.5x bonus for 14+ day streak
  if (streak >= 7) return 1.25; // 1.25x bonus for 7+ day streak
  return 1.0; // No bonus
}

/**
 * Get streak milestone rewards
 */
export function getStreakMilestone(streak: number): { message: string; bonusPoints: number } | null {
  const milestones: Record<number, { message: string; bonusPoints: number }> = {
    3: { message: '3-day streak! Keep it up!', bonusPoints: 15 },
    7: { message: '1-week streak! You\'re on fire!', bonusPoints: 50 },
    14: { message: '2-week streak! Amazing dedication!', bonusPoints: 100 },
    30: { message: '30-day streak! Legendary!', bonusPoints: 250 },
    60: { message: '60-day streak! Unbelievable!', bonusPoints: 500 },
    100: { message: '100-day streak! You are a champion!', bonusPoints: 1000 },
  };
  
  return milestones[streak] || null;
}

/**
 * Format streak for display
 */
export function formatStreak(streak: number): string {
  if (streak === 1) return '1 day';
  return `${streak} days`;
}

/**
 * Get next streak milestone
 */
export function getNextStreakMilestone(currentStreak: number): number {
  const milestones = [3, 7, 14, 30, 60, 100];
  
  for (const milestone of milestones) {
    if (currentStreak < milestone) {
      return milestone;
    }
  }
  
  return currentStreak + 10; // Beyond 100, every 10 days
}
