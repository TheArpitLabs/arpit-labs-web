import { supabaseServer } from "@/lib/supabase/server";
import type { FeatureAccess, MembershipFeatureKey, MembershipPlan, UserSubscription } from "@/types/membership";
import { handleDatabaseError } from "@/lib/errors";
import { canAccessFeature } from "@/lib/memberships";

function getBearerToken(request: Request) {
  return request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
}

export const membershipRepository = {
  async getAllPlans(): Promise<MembershipPlan[]> {
    const { data, error } = await supabaseServer.from("membership_plans").select("*").order("created_at", { ascending: true });
    if (error) {
      console.error("Database error in getAllPlans:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async getPlanBySlug(slug: string): Promise<MembershipPlan | null> {
    const { data, error } = await supabaseServer.from("membership_plans").select("*").eq("slug", slug).single();
    if (error && error.code !== "PGRST116") {
      console.error("Database error in getPlanBySlug:", error);
      throw handleDatabaseError(error);
    }
    return data || null;
  },

  async getPlanById(planId: string): Promise<MembershipPlan | null> {
    const { data, error } = await supabaseServer.from("membership_plans").select("*").eq("id", planId).single();
    if (error && error.code !== "PGRST116") {
      console.error("Database error in getPlanById:", error);
      throw handleDatabaseError(error);
    }
    return data || null;
  },

  async getActiveSubscriptionByUser(userId: string): Promise<(UserSubscription & { membership_plans?: MembershipPlan }) | null> {
    const { data, error } = await supabaseServer
      .from("user_subscriptions")
      .select("*, membership_plans(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Database error in getActiveSubscriptionByUser:", error);
      throw handleDatabaseError(error);
    }
    return data || null;
  },

  async getSubscriptionsByUser(userId: string): Promise<(UserSubscription & { membership_plans?: MembershipPlan })[]> {
    const { data, error } = await supabaseServer
      .from("user_subscriptions")
      .select("*, membership_plans(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error in getSubscriptionsByUser:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async getAllSubscriptions(): Promise<(UserSubscription & { membership_plans?: MembershipPlan })[]> {
    const { data, error } = await supabaseServer
      .from("user_subscriptions")
      .select("*, membership_plans(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error in getAllSubscriptions:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async getFeatureAccess(planId: string): Promise<FeatureAccess[]> {
    const { data, error } = await supabaseServer
      .from("feature_access")
      .select("*")
      .eq("plan_id", planId);

    if (error) {
      console.error("Database error in getFeatureAccess:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async updatePlan(planId: string, updates: Partial<Omit<MembershipPlan, "id" | "created_at" | "slug">>): Promise<MembershipPlan> {
    const { data, error } = await supabaseServer
      .from("membership_plans")
      .update(updates)
      .eq("id", planId)
      .select()
      .single();

    if (error) {
      console.error("Database error in updatePlan:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async getSubscriptionMetrics(): Promise<{ activeCount: number; totalCount: number; revenueEstimate: number; byPlan: Record<string, number> }> {
    const subscriptions = await this.getAllSubscriptions();
    const activeCount = subscriptions.filter((subscription) => subscription.status === "active").length;
    const revenueEstimate = subscriptions.reduce((sum, subscription) => {
      const plan = subscription.membership_plans;
      if (!plan) return sum;
      const price = subscription.billing_cycle === "yearly" ? plan.yearly_price : plan.monthly_price;
      return sum + price;
    }, 0);
    const byPlan = subscriptions.reduce<Record<string, number>>((acc, subscription) => {
      const planName = subscription.membership_plans?.name ?? "Unknown";
      acc[planName] = (acc[planName] ?? 0) + 1;
      return acc;
    }, {});

    return {
      activeCount,
      totalCount: subscriptions.length,
      revenueEstimate,
      byPlan,
    };
  },

  async validateFeatureAccessFromRequest(request: Request, featureKey: MembershipFeatureKey) {
    const token = getBearerToken(request);

    if (!token) {
      return { allowed: false, status: 401, error: "Authentication required." };
    }

    const { data: currentUser, error: userError } = await supabaseServer.auth.getUser(token);

    if (userError || !currentUser?.user) {
      return { allowed: false, status: 401, error: "Authentication required." };
    }

    const subscription = await this.getActiveSubscriptionByUser(currentUser.user.id);

    if (!canAccessFeature(featureKey, subscription)) {
      return { allowed: false, status: 403, error: "Your current membership does not include this feature." };
    }

    return {
      allowed: true,
      status: 200,
      user: currentUser.user,
      subscription,
    };
  },
};
