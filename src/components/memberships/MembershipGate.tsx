"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/client";
import { hasPremiumAccess, hasStudentAccess } from "@/lib/memberships";
import type { UserSubscription } from "@/types/membership";
import type { User } from "@supabase/supabase-js";

interface MembershipGateProps {
  requiredPlan: "student" | "premium";
  title: string;
  description: string;
  children: React.ReactNode;
}

export function MembershipGate({ requiredPlan, title, description, children }: MembershipGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSubscription() {
      setIsLoading(true);
      const { data } = await supabaseClient.auth.getUser();
      if (!mounted) return;
      setUser(data?.user ?? null);

      if (!data?.user) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      const { data: subs } = await supabaseClient
        .from("user_subscriptions")
        .select("*, membership_plans(*)")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;
      setSubscription(Array.isArray(subs) ? subs[0] ?? null : null);
      setIsLoading(false);
    }

    loadSubscription();

    return () => {
      mounted = false;
    };
  }, []);

  const isAuthorized = user && subscription && (requiredPlan === "premium" ? hasPremiumAccess(subscription) : hasStudentAccess(subscription));

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border/70 bg-background/70 p-10 text-center text-muted">
        Loading membership information...
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="rounded-3xl border border-border/70 bg-background/70 p-10 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">Access required</p>
        <h2 className="mt-4 text-3xl font-semibold text-foreground">{title}</h2>
        <p className="mt-3 text-sm text-muted max-w-2xl mx-auto">{description}</p>
        {/* PAYMENTS TEMPORARILY DISABLED - Replace with Coming Soon */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button disabled className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white opacity-50 cursor-not-allowed">
            Coming Soon
          </button>
          {!user && (
            <Link href="/login" className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-surface">
              Sign in to continue
            </Link>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
