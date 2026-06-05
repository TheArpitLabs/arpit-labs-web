"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { formatPrice, featureLabels, membershipPlans } from "@/lib/memberships";
import type { MembershipPlan, UserSubscription } from "@/types/membership";

export default function PricingPage() {
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSubscription() {
      setIsLoading(true);
      const { data } = await supabaseClient.auth.getUser();
      if (!mounted) return;

      if (!data?.user) {
        setCurrentSubscription(null);
        setIsLoading(false);
        return;
      }

      const { data: subscription } = await supabaseClient
        .from("user_subscriptions")
        .select("*, membership_plans(*)")
        .eq("user_id", data.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!mounted) return;
      setCurrentSubscription(subscription ?? null);
      setIsLoading(false);
    }

    loadSubscription();

    return () => {
      mounted = false;
    };
  }, []);

  const activePlanSlug = currentSubscription?.membership_plans?.slug ?? "free";

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <header className="mb-12 text-center">
        <p className="text-sm uppercase tracking-[0.32em] text-muted">Membership</p>
        <h1 className="mt-4 text-4xl font-semibold text-foreground">Choose the plan that grows with you</h1>
        <p className="mx-auto mt-4 max-w-3xl text-base text-muted">
          Compare plans for community access, AI support, learning resources, and premium membership features.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {membershipPlans.map((plan) => {
          const isCurrent = plan.slug === activePlanSlug;
          return (
            <div key={plan.slug} className="rounded-[2rem] border border-border/70 bg-card p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-muted">{plan.name}</p>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">{plan.description}</h2>
                </div>
                {isCurrent && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                    Current Plan
                  </span>
                )}
              </div>

              <div className="mt-8 space-y-3">
                <p className="text-5xl font-bold text-foreground">{formatPrice(plan.monthly_price)}</p>
                <p className="text-sm text-muted">Billed monthly or yearly in the checkout flow.</p>
              </div>

              <ul className="mt-8 space-y-3 text-sm text-muted">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">✓</span>
                    <span>{featureLabels[feature]}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link href={`/billing?plan=${plan.slug}`} className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
                  {isCurrent ? "Manage plan" : plan.monthly_price === 0 ? "Choose Free" : "Upgrade"}
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-16 rounded-[2rem] border border-border/70 bg-surface p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Feature comparison</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">Review which membership features are available on each plan.</p>
          </div>
          <div>
            {isLoading ? (
              <span className="text-sm text-muted">Loading current plan…</span>
            ) : currentSubscription ? (
              <p className="text-sm text-muted">You are currently on the {currentSubscription.membership_plans?.name ?? "Free"} plan.</p>
            ) : (
              <p className="text-sm text-muted">You are currently on the Free plan.</p>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-border/70">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-background/80 text-left text-xs uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="border-b border-border/70 p-4">Feature</th>
                {membershipPlans.map((plan) => (
                  <th key={plan.slug} className="border-b border-border/70 p-4 text-center">{plan.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-card">
              {Object.entries(featureLabels).map(([featureKey, label]) => (
                <tr key={featureKey} className="border-b border-border/70 last:border-0">
                  <td className="p-4 font-medium text-foreground">{label}</td>
                  {membershipPlans.map((plan) => (
                    <td key={`${featureKey}-${plan.slug}`} className="p-4 text-center text-muted">
                      {plan.features.includes(featureKey as MembershipPlan["features"][number]) ? "✓" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
