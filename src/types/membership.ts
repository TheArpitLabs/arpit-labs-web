export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export type MembershipFeatureKey =
  | 'community_access'
  | 'public_projects'
  | 'public_blog'
  | 'limited_ai'
  | 'public_courses'
  | 'premium_courses'
  | 'learning_roadmaps'
  | 'hackathon_resources'
  | 'higher_ai_limits'
  | 'saved_learning_progress'
  | 'unlimited_ai'
  | 'recruiter_assistant'
  | 'ai_project_generator'
  | 'premium_labs'
  | 'exclusive_content'
  | 'advanced_analytics';

export interface MembershipPlan {
  id: string;
  name: string;
  slug: 'free' | 'student' | 'premium';
  description: string;
  monthly_price: number;
  yearly_price: number;
  features: MembershipFeatureKey[];
  active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  start_date: string;
  end_date: string;
  created_at: string;
  membership_plans?: MembershipPlan;
}

export interface FeatureAccess {
  id: string;
  plan_id: string;
  feature_key: MembershipFeatureKey;
  enabled: boolean;
}
