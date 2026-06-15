"use client";

import React, { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { TechStackChart } from "@/components/dashboard/TechStackChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Card } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      const { data } = await supabaseClient.auth.getUser();
      if (!mounted) return;
      
      if (!data?.user) {
        router.push("/login");
        return;
      }
      
      setUser(data.user);

      const [{ data: p }, { data: proj }] = await Promise.all([
        supabaseClient.from("profiles").select("*").eq("id", data.user.id).single(),
        supabaseClient.from("projects").select("*").eq("owner_id", data.user.id).order("created_at", { ascending: false }),
      ]);

      if (mounted) {
        setProfile(p ?? null);
        setProjects(proj ?? []);
      }
      setLoading(false);
    }

    init();

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) {
        router.push("/login");
      } else {
        setUser(session.user);
        supabaseClient.from("profiles").select("*").eq("id", session.user.id).single().then(({ data: p }) => setProfile(p ?? null));
        supabaseClient.from("projects").select("*").eq("owner_id", session.user.id).order("created_at", { ascending: false }).then(({ data: proj }) => {
          setProjects(proj ?? []);
        });
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalProjects = projects.length;
  const totalViews = projects.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const totalLikes = projects.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const publishedProjects = projects.filter(p => p.status === 'published').length;
  const profileFirstName = profile?.full_name?.trim().split(/\s+/)[0];
  const metadataFirstName = user.user_metadata?.full_name?.trim().split(/\s+/)[0];
  const usableName = (value?: string | null) => {
    const normalized = value?.trim();
    return normalized && !["user", "creator", "member"].includes(normalized.toLowerCase()) ? normalized : null;
  };
  const displayName =
    (user.email || profile?.email)?.split("@")[0] ||
    usableName(profileFirstName) ||
    usableName(metadataFirstName) ||
    "Creator";

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/15 via-surface to-secondary/10 p-6 shadow-sm lg:p-8">
          <div className="absolute right-0 top-0 h-full w-32 bg-primary/5" aria-hidden="true" />
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Welcome back, {displayName}!
          </h1>
          <p className="relative mt-2 text-muted">
            Here&apos;s what&apos;s happening with your projects today.
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalProjects={totalProjects}
          totalViews={totalViews}
          totalLikes={totalLikes}
          publishedProjects={publishedProjects}
        />

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ActivityChart projects={projects} />
          <TechStackChart projects={projects} />
        </div>

        {/* Recent Projects */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Recent Projects</h2>
          </div>
          <RecentProjects projects={projects} />
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </DashboardLayout>
  );
}
