import { supabaseServer } from "@/lib/supabase/server";
import { handleDatabaseError } from "@/lib/errors";

export const paymentRepository = {
  async getAllPlans() {
    const { data, error } = await supabaseServer
      .from("subscription_plans")
      .select("*")
      .eq("active", true)
      .order("monthly_price", { ascending: true });
    if (error) throw handleDatabaseError(error);
    return data;
  },

  async getPlanBySlug(slug: string) {
    const { data, error } = await supabaseServer
      .from("subscription_plans")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) throw handleDatabaseError(error);
    return data;
  },

  async getUserSubscription(userId: string) {
    const { data, error } = await supabaseServer
      .from("subscriptions")
      .select("*, plan:subscription_plans(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw handleDatabaseError(error);
    return data;
  },

  async getTransactions(userId: string) {
    const { data, error } = await supabaseServer
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw handleDatabaseError(error);
    return data;
  },

  async getInvoices(userId: string) {
    const { data, error } = await supabaseServer
      .from("invoices")
      .select("*, transaction:transactions(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw handleDatabaseError(error);
    return data;
  },

  async getRevenueMetrics() {
    const { data: transactions, error } = await supabaseServer
      .from("transactions")
      .select("amount, created_at, type")
      .eq("status", "succeeded");
    
    if (error) throw handleDatabaseError(error);

    const { data: subs, error: subsError } = await supabaseServer
      .from("subscriptions")
      .select("id")
      .eq("status", "active");
    
    if (subsError) throw handleDatabaseError(subsError);

    const totalRevenue = transactions.reduce((acc, t) => acc + Number(t.amount), 0);
    const subscriptionRevenue = transactions
      .filter(t => t.type === "subscription")
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const marketplaceRevenue = transactions
      .filter(t => t.type === "one_time")
      .reduce((acc, t) => acc + Number(t.amount), 0);

    return {
      totalRevenue,
      subscriptionRevenue,
      marketplaceRevenue,
      activeSubscribers: subs.length,
      transactions: transactions
    };
  }
};
