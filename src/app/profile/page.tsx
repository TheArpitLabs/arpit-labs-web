"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { User, Mail, Calendar, FolderOpen, Search, MessageSquare, Bookmark, Award, Code2, TrendingUp, Users, Activity } from "lucide-react";

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
          supabaseClient.from("saved_content").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false }),
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
      <main className="mx-auto max-w-5xl px-4 py-12">
        <EmptyState
          icon={User}
          title="Not signed in"
          description="Please sign in to view your profile and access your dashboard."
          actionLabel="Sign In"
          actionHref="/login"
        />
      </main>
    );
  }

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown';

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      {/* Profile Overview */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-muted/20 md:h-32 md:w-32">
            <Image
              src={profile?.avatar_url ?? "/avatar-placeholder.svg"}
              alt="avatar"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold">{profile?.full_name ?? user.email}</h1>
            <p className="mt-2 text-muted-foreground">{profile?.bio || "Engineering enthusiast and creator"}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Joined {joinDate}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Stats */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/70 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">My Projects</p>
              <p className="text-2xl font-semibold">0</p>
            </div>
          </div>
        </Card>
        <Card className="border-border/70 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Research</p>
              <p className="text-2xl font-semibold">0</p>
            </div>
          </div>
        </Card>
        <Card className="border-border/70 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Community</p>
              <p className="text-2xl font-semibold">0</p>
            </div>
          </div>
        </Card>
        <Card className="border-border/70 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/10 text-muted-foreground">
              <Bookmark className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saved</p>
              <p className="text-2xl font-semibold">{saved.length}</p>
            </div>
          </div>
        </Card>
      </section>

      {/* My Projects */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">My Projects</h2>
        </div>
        <Card className="border-border/70 bg-card p-8">
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            description="Start creating and track your engineering projects here."
            actionLabel="Create Project"
            actionHref="/dashboard"
          />
        </Card>
      </section>

      {/* Research Activity */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Research Activity</h2>
        </div>
        <Card className="border-border/70 bg-card p-8">
          <EmptyState
            icon={TrendingUp}
            title="No research activity"
            description="Your research contributions and experiments will appear here."
            actionLabel="Explore Research"
            actionHref="/research"
          />
        </Card>
      </section>

      {/* Community Activity */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Community Activity</h2>
        </div>
        <Card className="border-border/70 bg-card p-8">
          <EmptyState
            icon={Users}
            title="No community activity"
            description="Join the conversation and connect with other creators."
            actionLabel="Visit Community"
            actionHref="/community/global"
          />
        </Card>
      </section>

      {/* Saved Content */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Saved Content</h2>
        </div>
        <Card className="border-border/70 bg-card p-8">
          {saved.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No saved items"
              description="Save articles, resources, and content to access them later."
            />
          ) : (
            <ul className="space-y-3">
              {saved.map((s) => (
                <li key={s.id} className="rounded-xl border border-border/70 bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {s.content_type}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">ID: {s.content_id}</div>
                    </div>
                    <div>
                      {(() => {
                        const url = `/${String(s.content_type).toLowerCase()}s/${String(s.content_id)}`;
                        return <a href={url} className="text-primary underline text-sm">View</a>;
                      })()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Achievements */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Achievements</h2>
        </div>
        <Card className="border-border/70 bg-card p-8">
          <EmptyState
            icon={Award}
            title="No achievements yet"
            description="Complete activities and contribute to earn achievements."
          />
        </Card>
      </section>
    </main>
  );
}
