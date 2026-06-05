"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { formatPrice, membershipPlans } from "@/lib/memberships";
import type { MembershipPlan, UserSubscription } from "@/types/membership";

export default function AccountSubscriptionPage() {
  const [subscription, setSubscription] = useState<(UserSubscription & { membership_plans?: MembershipPlan }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSubscription() {
      const { data } = await supabaseClient.auth.getUser();
      if (!mounted) return;

      if (!data?.user) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      const { data: subscriptionData } = await supabaseClient
        .from("user_subscriptions")
        .select("*, membership_plans(*)")
        .eq("user_id", data.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!mounted) return;
      setSubscription(subscriptionData ?? null);
      setIsLoading(false);
    }

    loadSubscription();

    return () => {
      mounted = false;
    };
  }, []);

  const activePlan = subscription?.membership_plans ?? membershipPlans[0];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.32em] text-muted">Account subscription</p>
        <h1 className="mt-4 text-4xl font-semibold text-foreground">Your membership details</h1>
        <p className="mt-4 max-w-3xl text-muted">Manage the membership that powers your premium access and AI tools.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[2rem] border border-border/70 bg-card p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-muted">Current membership</p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground">{activePlan.name}</h2>
              <p className="mt-2 text-sm text-muted">{activePlan.description}</p>
            </div>
            <div className="rounded-3xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">{subscription?.status ?? "Free"}</div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-border/70 bg-surface p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-muted">Billing cycle</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{subscription?.billing_cycle ?? "monthly"}</p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-surface p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-muted">Renewal date</p>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {subscription ? new Date(subscription.end_date).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-[1.75rem] border border-border/70 bg-background p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-muted">Monthly value</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{formatPrice(activePlan.monthly_price)}</p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-background p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-muted">Annual value</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{formatPrice(activePlan.yearly_price)}</p>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/billing" className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
              Manage billing
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border/70 bg-card p-8">
          <p className="text-sm uppercase tracking-[0.32em] text-muted">Plan features</p>
          <div className="mt-6 space-y-4">
            {activePlan.features.map((feature) => (
              <div key={feature} className="rounded-3xl border border-border/70 bg-surface p-5">
                <p className="text-sm font-semibold text-foreground">{feature.replace(/_/g, " ")}</p>
                <p className="mt-2 text-sm text-muted">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] border border-border/70 bg-card p-8">
        <h2 className="text-2xl font-semibold text-foreground">Available plans</h2>
        <p className="mt-2 text-sm text-muted">Upgrade or change your membership any time from the billing page.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {membershipPlans.map((plan) => (
            <div key={plan.slug} className="rounded-[1.75rem] border border-border/70 bg-surface p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-muted">{plan.name}</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{formatPrice(plan.monthly_price)} / month</p>
              <p className="mt-2 text-sm text-muted">{plan.description}</p>
              <Link
                href={`/billing?plan=${plan.slug}`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-transparent bg-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-primary/10 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                {plan.slug === activePlan.slug ? "Current plan" : "Select"}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
