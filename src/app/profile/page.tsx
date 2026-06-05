"use client";

import React, { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [saved, setSaved] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabaseClient.auth.getUser();
      if (!mounted) return;
      setUser(data?.user ?? null);

      if (data?.user) {
        const [{ data: p }, { data: s }] = await Promise.all([
          supabaseClient.from("profiles").select("*").eq("id", data.user.id).single(),
          supabaseClient.from("saved_content").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false })
        ]);
        setProfile(p ?? null);
        setSaved(s ?? []);
      }
    }

    init();
    const { data: listener } = supabaseClient.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabaseClient.from("profiles").select("*").eq("id", session.user.id).single().then(({ data: p }) => setProfile(p ?? null));
        supabaseClient.from("saved_content").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).then(({ data: s }) => setSaved(s ?? []));
      } else {
        setProfile(null);
        setSaved([]);
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-center gap-4">
        <img src={profile?.avatar_url ?? "/avatar-placeholder.png"} alt="avatar" className="h-16 w-16 rounded-full" />
        <div>
          <h1 className="text-2xl font-semibold">{profile?.full_name ?? user.email}</h1>
          <p className="text-sm text-muted">{profile?.bio}</p>
        </div>
      </div>

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
