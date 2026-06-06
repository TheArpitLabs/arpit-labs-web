"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { formatPrice, membershipPlans } from "@/lib/memberships";

export default function ProfilePage() {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [saved, setSaved] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabaseClient.auth.getUser();
      if (!mounted) return;
      setUser(data?.user ?? null);

      if (data?.user) {
        const [{ data: p }, { data: s }, { data: sub }] = await Promise.all([
          supabaseClient.from("profiles").select("*").eq("id", data.user.id).single(),
          supabaseClient.from("saved_content").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false }),
          supabaseClient
            .from("user_subscriptions")
            .select("*, membership_plans(*)")
            .eq("user_id", data.user.id)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .single()
        ]);
        setProfile(p ?? null);
        setSaved(s ?? []);
        setSubscription(sub ?? null);
      }
    }

    init();
    const { data: listener } = supabaseClient.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabaseClient.from("profiles").select("*").eq("id", session.user.id).single().then(({ data: p }) => setProfile(p ?? null));
        supabaseClient.from("saved_content").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).then(({ data: s }) => setSaved(s ?? []));
        supabaseClient
          .from("user_subscriptions")
          .select("*, membership_plans(*)")
          .eq("user_id", session.user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
          .then(({ data: sub }) => setSubscription(sub ?? null));
      } else {
        setProfile(null);
        setSaved([]);
        setSubscription(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-xl font-semibold">Not signed in</h2>
        <p className="mt-4">Please <Link href="/login" className="text-primary">sign in</Link> to view your profile.</p>
      </main>
    );
  }

  const activePlan = subscription?.membership_plans ?? membershipPlans[0];
  const aiLimitLabel = activePlan.slug === "premium" ? "Unlimited" : activePlan.slug === "student" ? "Higher limit" : "Limited";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted/20">
          <Image
            src={profile?.avatar_url ?? "/avatar-placeholder.svg"}
            alt="avatar"
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{profile?.full_name ?? user.email}</h1>
          <p className="text-sm text-muted">{profile?.bio}</p>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-border/70 bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted">Current membership</p>
            <h2 className="mt-2 text-2xl font-semibold">{activePlan.name}</h2>
            <p className="mt-2 text-sm text-muted">{activePlan.description}</p>
          </div>
          {/* PAYMENTS TEMPORARILY DISABLED - Replace with Coming Soon */}
          <button
            disabled
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Status</p>
            <p className="mt-2 font-semibold capitalize">{subscription?.status ?? "Free"}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">AI usage</p>
            <p className="mt-2 font-semibold">{aiLimitLabel}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Plan value</p>
            <p className="mt-2 font-semibold">{formatPrice(activePlan.monthly_price)} / month</p>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Saved content</h2>
        {saved.length === 0 ? (
          <p className="text-sm text-muted">You haven&apos;t saved any items yet.</p>
        ) : (
          <ul className="space-y-2">
                {saved.map((s) => (
              <li key={s.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{s.content_type}</div>
                    <div className="text-xs text-muted">ID: {s.content_id}</div>
                  </div>
                  <div>
                    {(() => {
                      const url = `/${String(s.content_type).toLowerCase()}s/${String(s.content_id)}`;
                      return <a href={url} className="text-primary underline">View</a>;
                    })()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Activity</h2>
        <p className="text-sm text-muted">Recent activity and statistics will appear here.</p>
      </section>
    </main>
  );
}
