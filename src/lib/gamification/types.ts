// Gamification System Types

export interface UserPoints {
  id: string;
  user_id: string;
  points: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  action_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  points_reward: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  points_reward: number;
  badge_id: string;
  criteria: Record<string, any>;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: Record<string, any>;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  achievement?: Achievement;
}

export interface UserGamificationSummary {
  user_id: string;
  email: string;
  full_name: string;
  points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  badges_earned: number;
  achievements_completed: number;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string;
  points: number;
  level: number;
  current_streak: number;
  badges_earned: number;
  achievements_completed: number;
  rank: number;
}

export type ActionType = 
  | 'content_view'
  | 'content_save'
  | 'newsletter_subscription'
  | 'contact_form'
  | 'project_completion'
  | 'experiment_completion'
  | 'daily_login'
  | 'referral';

export interface AwardPointsParams {
  userId: string;
  points: number;
  actionType: ActionType;
  description?: string;
  metadata?: Record<string, any>;
}

export interface LevelThreshold {
  level: number;
  minPoints: number;
  maxPoints: number;
  name: string;
}
