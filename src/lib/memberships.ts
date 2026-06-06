import type { MembershipFeatureKey, MembershipPlan, UserSubscription } from "@/types/membership";

// PAYMENTS TEMPORARILY DISABLED - All users now have free access
export const membershipPlanSlugs = ["free"] as const;
export type MembershipPlanSlug = (typeof membershipPlanSlugs)[number];

export const membershipPlans: MembershipPlan[] = [
  {
    id: "free",
    name: "Free",
    slug: "free",
    description: "Access the community, public learning resources, and essential AI support.",
    monthly_price: 0,
    yearly_price: 0,
    features: [
      "community_access",
      "public_projects",
      "public_blog",
      "limited_ai",
      "public_courses",
    ],
    active: true,
    created_at: new Date().toISOString(),
  },
];

export const featureLabels: Record<MembershipFeatureKey, string> = {
  community_access: "Community Access",
  public_projects: "Public Projects",
  public_blog: "Public Blog",
  limited_ai: "Limited AI Assistant Usage",
  public_courses: "Public Courses",
  premium_courses: "Premium Courses",
  learning_roadmaps: "Learning Roadmaps",
  hackathon_resources: "Hackathon Resources",
  higher_ai_limits: "Higher AI Limits",
  saved_learning_progress: "Saved Learning Progress",
  unlimited_ai: "Unlimited AI Assistant",
  recruiter_assistant: "Recruiter Assistant",
  ai_project_generator: "AI Project Generator",
  premium_labs: "Premium Labs",
  exclusive_content: "Exclusive Content",
  advanced_analytics: "Advanced Analytics",
};

export function getPlanBySlug(slug: string | undefined): MembershipPlan {
  return membershipPlans[0]; // Always return free plan
}

export function getPlanById(planId: string | undefined): MembershipPlan {
  return membershipPlans[0]; // Always return free plan
}

export function getUserPlan(subscription: UserSubscription | null | undefined): MembershipPlan {
  return membershipPlans[0]; // Always return free plan
}

export function isAtLeastPlan(subscription: UserSubscription | null | undefined, required: MembershipPlanSlug) {
  return true; // All users have at least free access
}

export function canAccessFeature(featureKey: MembershipFeatureKey, subscription: UserSubscription | null | undefined) {
  return true; // All features accessible in free mode
}

export function hasPremiumAccess(subscription: UserSubscription | null | undefined) {
  return true; // All users have premium access temporarily
}

export function hasStudentAccess(subscription: UserSubscription | null | undefined) {
  return true; // All users have student access temporarily
}

export function formatPrice(amount: number) {
  return amount === 0 ? "Free" : `$${amount.toFixed(0)}`;
}

/*
// ORIGINAL IMPLEMENTATION (Commented out - re-enable when payments are restored)
export const membershipPlanSlugs = ["free", "student", "premium"] as const;
export const membershipPlans: MembershipPlan[] = [
  {
    id: "free",
    name: "Free",
    slug: "free",
    description: "Access the community, public learning resources, and essential AI support.",
    monthly_price: 0,
    yearly_price: 0,
    features: [
      "community_access",
      "public_projects",
      "public_blog",
      "limited_ai",
      "public_courses",
    ],
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "student",
    name: "Student",
    slug: "student",
    description: "Unlock premium courses, roadmap guidance, hackathon resources, and more AI credits.",
    monthly_price: 19,
    yearly_price: 190,
    features: [
      "community_access",
      "public_projects",
      "public_blog",
      "limited_ai",
      "public_courses",
      "premium_courses",
      "learning_roadmaps",
      "hackathon_resources",
      "higher_ai_limits",
      "saved_learning_progress",
    ],
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "premium",
    name: "Premium",
    slug: "premium",
    description: "Everything in Student plus unlimited AI, recruiter assistant, premium labs, and analytics.",
    monthly_price: 39,
    yearly_price: 390,
    features: [
      "community_access",
      "public_projects",
      "public_blog",
      "limited_ai",
      "public_courses",
      "premium_courses",
      "learning_roadmaps",
      "hackathon_resources",
      "higher_ai_limits",
      "saved_learning_progress",
      "unlimited_ai",
      "recruiter_assistant",
      "ai_project_generator",
      "premium_labs",
      "exclusive_content",
      "advanced_analytics",
    ],
    active: true,
    created_at: new Date().toISOString(),
  },
];

export function getUserPlan(subscription: UserSubscription | null | undefined): MembershipPlan {
  if (!subscription || !subscription.membership_plans) {
    return membershipPlans[0];
  }
  return getPlanById(subscription.membership_plans.id);
}

export function isAtLeastPlan(subscription: UserSubscription | null | undefined, required: MembershipPlanSlug) {
  const plan = getUserPlan(subscription);
  return membershipPlanSlugs.indexOf(plan.slug) >= membershipPlanSlugs.indexOf(required);
}

export function canAccessFeature(featureKey: MembershipFeatureKey, subscription: UserSubscription | null | undefined) {
  const plan = getUserPlan(subscription);
  return plan.features.includes(featureKey);
}

export function hasPremiumAccess(subscription: UserSubscription | null | undefined) {
  return isAtLeastPlan(subscription, "premium");
}

export function hasStudentAccess(subscription: UserSubscription | null | undefined) {
  return isAtLeastPlan(subscription, "student");
}
*/
