// Badge System - Core logic for badge management

import { Badge } from './types';

// Badge requirement types
export type BadgeRequirementType = 
  | 'content_views'
  | 'content_saves'
  | 'contact_forms'
  | 'newsletter_subscription'
  | 'experiments_completed'
  | 'projects_completed'
  | 'login_streak'
  | 'referrals';

/**
 * Check if user meets badge requirements
 */
export function checkBadgeRequirements(
  badge: Badge,
  userStats: Record<string, number>
): boolean {
  const requirementType = badge.requirement_type as BadgeRequirementType;
  const requirementValue = badge.requirement_value;
  const currentValue = userStats[requirementType] || 0;
  
  return currentValue >= requirementValue;
}

/**
 * Get badge icon (fallback to emoji if not provided)
 */
export function getBadgeIcon(badge: Badge): string {
  if (badge.icon) {
    return badge.icon;
  }
  
  // Default icons based on requirement type
  const defaultIcons: Record<string, string> = {
    content_views: '🔍',
    content_saves: '💾',
    contact_forms: '📝',
    newsletter_subscription: '📧',
    experiments_completed: '🎓',
    projects_completed: '🚀',
    login_streak: '🔥',
    referrals: '👥',
  };
  
  return defaultIcons[badge.requirement_type] || '🏆';
}

/**
 * Get badge rarity based on requirement value
 */
export function getBadgeRarity(badge: Badge): 'common' | 'rare' | 'epic' | 'legendary' {
  if (badge.requirement_value >= 50) return 'legendary';
  if (badge.requirement_value >= 30) return 'epic';
  if (badge.requirement_value >= 10) return 'rare';
  return 'common';
}

/**
 * Get badge color based on rarity
 */
export function getBadgeColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '#9CA3AF', // gray
    rare: '#3B82F6', // blue
    epic: '#8B5CF6', // purple
    legendary: '#F59E0B', // gold
  };
  
  return colors[rarity] || colors.common;
}

/**
 * Sort badges by rarity and points reward
 */
export function sortBadges(badges: Badge[]): Badge[] {
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  
  return badges.sort((a, b) => {
    const rarityA = getBadgeRarity(a);
    const rarityB = getBadgeRarity(b);
    
    if (rarityOrder[rarityA] !== rarityOrder[rarityB]) {
      return rarityOrder[rarityA] - rarityOrder[rarityB];
    }
    
    return b.points_reward - a.points_reward;
  });
}
