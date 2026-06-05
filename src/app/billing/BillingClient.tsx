"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { formatPrice, membershipPlans, membershipPlanSlugs } from "@/lib/memberships";
import type { MembershipPlan, UserSubscription } from "@/types/membership";

export function BillingClient() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") ?? "student";
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string>(planParam);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [subscriptions, setSubscriptions] = useState<(UserSubscription & { membership_plans?: MembershipPlan })[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<(UserSubscription & { membership_plans?: MembershipPlan }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const selectedPlan = useMemo(
    () => membershipPlans.find((plan) => plan.slug === selectedPlanSlug) ?? membershipPlans[1],
    [selectedPlanSlug]
  );

  useEffect(() => {
    setSelectedPlanSlug(planParam || "student");
  }, [planParam]);

  useEffect(() => {
    let mounted = true;

    async function loadBillingData() {
      setIsLoading(true);
      const { data } = await supabaseClient.auth.getUser();

      if (!mounted) return;
      if (!data?.user) {
        setSubscriptions([]);
        setActiveSubscription(null);
        setIsLoading(false);
        return;
      }

      const { data: subscriptionData } = await supabaseClient
        .from("user_subscriptions")
        .select("*, membership_plans(*)")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;
      const allSubscriptions = Array.isArray(subscriptionData) ? subscriptionData : [];
      setSubscriptions(allSubscriptions);
      setActiveSubscription(allSubscriptions.find((subscription) => subscription.status === "active") ?? null);
      setIsLoading(false);
    }

    loadBillingData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleCheckout = async () => {
    const { data: session } = await supabaseClient.auth.getSession();
    const accessToken = session?.session?.access_token;

    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

    setCheckoutMessage(null);
    setCheckoutUrl(null);

    const response = await fetch("/api/memberships/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        planId: selectedPlan.slug,
        billingCycle,
        provider: "stripe",
        returnUrl: window.location.origin,
      }),
    });

    const payload = await response.json();

    if (!response.ok || !payload.success) {
      setCheckoutMessage(payload.error || "Unable to create checkout session.");
      return;
    }

    setCheckoutMessage(
      payload.paymentRequired
        ? "Checkout is prepared. Paid access activates only after payment provider confirmation."
        : "Your free membership is active."
    );
    setCheckoutUrl(payload.checkoutUrl ?? null);
    const currentPlanSlug = activeSubscription?.membership_plans?.slug ?? "free";
    const currentPlanRank = membershipPlanSlugs.indexOf(currentPlanSlug);
    const selectedPlanRank = membershipPlanSlugs.indexOf(selectedPlan.slug);

    if (selectedPlanRank > currentPlanRank) {
      analytics.planUpgrade(selectedPlan.slug);
    } else if (selectedPlanRank < currentPlanRank) {
      analytics.planDowngrade(selectedPlan.slug);
    }

    if (payload.subscription) {
      setActiveSubscription(payload.subscription);
      setSubscriptions((prev) => [payload.subscription, ...prev]);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">
        <p>Loading billing details...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-[2rem] border border-border/70 bg-card p-8">
          <p className="text-sm uppercase tracking-[0.32em] text-muted">Billing dashboard</p>
          <h1 className="mt-4 text-4xl font-semibold text-foreground">Manage your subscription</h1>
          <p className="mt-4 text-muted">Review your current plan, billing history, and upgrade options from one place.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-border/70 bg-surface p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-muted">Current plan</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{activeSubscription?.membership_plans?.name ?? "Free"}</p>
              <p className="mt-2 text-sm text-muted">{activeSubscription?.status === "active" ? "Active subscription" : "Free access"}</p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-surface p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-muted">Next cycle</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {activeSubscription ? new Date(activeSubscription.end_date).toLocaleDateString() : "Not subscribed"}
              </p>
              <p className="mt-2 text-sm text-muted">{activeSubscription?.billing_cycle === "yearly" ? "Yearly billing" : "Monthly billing"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card p-8">
          <p className="text-sm uppercase tracking-[0.32em] text-muted">Upgrade options</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-[1.75rem] border border-border/70 bg-surface p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Selected plan</p>
                  <p className="text-muted">{selectedPlan.name}</p>
                </div>
                <p className="text-lg font-semibold text-foreground">{formatPrice(selectedPlan[billingCycle === "yearly" ? "yearly_price" : "monthly_price"])}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {membershipPlans.map((plan) => (
                <button
                  key={plan.slug}
                  className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${plan.slug === selectedPlan.slug ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-background text-foreground hover:bg-surface"}`}
                  onClick={() => setSelectedPlanSlug(plan.slug)}
                >
                  {plan.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${billingCycle === "monthly" ? "bg-primary text-white" : "bg-surface text-foreground hover:bg-surface/90"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${billingCycle === "yearly" ? "bg-primary text-white" : "bg-surface text-foreground hover:bg-surface/90"}`}
              >
                Yearly
              </button>
            </div>
            <Button onClick={handleCheckout} className="w-full">
              Confirm upgrade
            </Button>
            {checkoutMessage && <p className="text-sm text-muted">{checkoutMessage}</p>}
            {checkoutUrl && (
              <a href={checkoutUrl} className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
                Continue to checkout
              </a>
            )}
            {!activeSubscription && selectedPlan.monthly_price === 0 && (
              <p className="text-sm text-muted">Choosing Free creates an active free membership record for your account.</p>
            )}
            {selectedPlan.monthly_price > 0 && (
              <p className="text-sm text-muted">Paid plans activate only after payment provider confirmation.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-border/70 bg-card p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Billing history</h2>
            <p className="mt-2 text-sm text-muted">Review your recent subscription activity.</p>
          </div>
          <Link href="/account/subscription" className="text-sm font-semibold text-primary hover:underline">
            View subscription details
          </Link>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-sm text-muted">You have no subscription records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-background/80 text-xs uppercase tracking-[0.2em] text-muted">
                <tr>
                  <th className="border-b border-border/70 px-4 py-3">Plan</th>
                  <th className="border-b border-border/70 px-4 py-3">Status</th>
                  <th className="border-b border-border/70 px-4 py-3">Cycle</th>
                  <th className="border-b border-border/70 px-4 py-3">Started</th>
                  <th className="border-b border-border/70 px-4 py-3">Ends</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3">{subscription.membership_plans?.name ?? "Free"}</td>
                    <td className="px-4 py-3 capitalize">{subscription.status}</td>
                    <td className="px-4 py-3 capitalize">{subscription.billing_cycle}</td>
                    <td className="px-4 py-3">{new Date(subscription.start_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{new Date(subscription.end_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
