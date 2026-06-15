// Points System - Core logic for points calculation and management

import { ActionType, LevelThreshold } from './types';

// Point values for different actions
export const POINT_VALUES: Record<ActionType, number> = {
  content_view: 5,
  content_save: 10,
  newsletter_subscription: 25,
  contact_form: 15,
  project_completion: 100,
  experiment_completion: 75,
  daily_login: 10,
  referral: 50,
};

// Level thresholds
export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, minPoints: 0, maxPoints: 99, name: 'Novice' },
  { level: 2, minPoints: 100, maxPoints: 499, name: 'Explorer' },
  { level: 3, minPoints: 500, maxPoints: 999, name: 'Contributor' },
  { level: 4, minPoints: 1000, maxPoints: 2499, name: 'Expert' },
  { level: 5, minPoints: 2500, maxPoints: 4999, name: 'Master' },
  { level: 6, minPoints: 5000, maxPoints: Infinity, name: 'Legend' },
];

/**
 * Calculate level based on total points
 */
export function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].minPoints) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
}

/**
 * Get level name based on level number
 */
export function getLevelName(level: number): string {
  const threshold = LEVEL_THRESHOLDS.find(t => t.level === level);
  return threshold?.name || 'Novice';
}

/**
 * Get points required to reach next level
 */
export function getPointsToNextLevel(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints);
  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
  
  if (!nextThreshold) {
    return 0; // Already at max level
  }
  
  return nextThreshold.minPoints - currentPoints;
}

/**
 * Get progress percentage to next level
 */
export function getLevelProgress(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints);
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
  
  if (!currentThreshold || !nextThreshold) {
    return 100; // Already at max level or invalid state
  }
  
  const range = nextThreshold.minPoints - currentThreshold.minPoints;
  const progress = currentPoints - currentThreshold.minPoints;
  
  return Math.min(100, Math.max(0, (progress / range) * 100));
}

/**
 * Get point value for an action type
 */
export function getPointValue(actionType: ActionType): number {
  return POINT_VALUES[actionType] || 0;
}

/**
 * Validate point value (prevent negative or excessive points)
 */
export function validatePointValue(points: number): boolean {
  return points > 0 && points <= 1000; // Max 1000 points per action
}

/**
 * Format points for display
 */
export function formatPoints(points: number): string {
  return points.toLocaleString();
}
