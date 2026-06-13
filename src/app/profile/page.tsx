"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Card, InfoCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton } from "@/components/ui/card-skeleton";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { User, Mail, Calendar, FolderOpen, Search, MessageSquare, Bookmark, Award, Code2, TrendingUp, Users, Activity, Loader2, Heart } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [saved, setSaved] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      try {
        const { data } = await supabaseClient.auth.getUser();
        if (!mounted) return;
        setUser(data?.user ?? null);

        if (data?.user) {
          const [{ data: p }, { data: s }, { data: proj }] = await Promise.all([
            supabaseClient.from("profiles").select("*").eq("id", data.user.id).single(),
            supabaseClient.from("saved_content").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false }),
            supabaseClient.from("projects").select("*").eq("owner_id", data.user.id).order("created_at", { ascending: false }),
          ]);

          if (mounted) {
            setProfile(p ?? null);
            setSaved(s ?? []);
            setProjects(proj ?? []);
          }
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: listener } = supabaseClient.auth.onAuthStateChange(async (_e, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          const [{ data: p }, { data: s }, { data: proj }] = await Promise.all([
            supabaseClient.from("profiles").select("*").eq("id", session.user.id).single(),
            supabaseClient.from("saved_content").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
            supabaseClient.from("projects").select("*").eq("owner_id", session.user.id).order("created_at", { ascending: false }),
          ]);

          if (mounted) {
            setProfile(p ?? null);
            setSaved(s ?? []);
            setProjects(proj ?? []);
          }
        } catch (error) {
          console.error("Error loading profile data on auth change:", error);
        }
      } else {
        if (mounted) {
          setProfile(null);
          setSaved([]);
          setProjects([]);
        }
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="mb-8 premium-card p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <Skeleton variant="avatar" className="h-24 w-24 md:h-32 md:w-32" />
              <div className="flex-1 space-y-3">
                <Skeleton variant="text" className="w-1/3 h-8" />
                <Skeleton variant="text" className="w-1/2 h-4" />
                <div className="flex gap-4">
                  <Skeleton variant="text" className="w-32" />
                  <Skeleton variant="text" className="w-32" />
                </div>
              </div>
            </div>
          </div>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-12">
          <EmptyState
            icon={User}
            title="Not signed in"
            description="Please sign in to view your profile and access your dashboard."
            actionLabel="Sign In"
            actionHref="/login"
          />
        </div>
      </main>
    );
  }

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown';
  const totalProjects = projects.length;
  const publishedProjects = projects.filter(p => p.status === 'published').length;
  const draftProjects = projects.filter(p => p.status === 'draft').length;
  const totalViews = projects.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const totalLikes = projects.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const featuredProject = projects.find(p => p.featured && p.status === 'published');
  const recentProjects = projects.slice(0, 3);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-12">

      {/* Profile Overview */}
      <section className="mb-8">
        <div className="rounded-[2.5rem] border border-purple-500/30 bg-purple-950/50 p-8 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-purple-700/20 md:h-32 md:w-32 ring-4 ring-purple-500/30">
              <Image
                src={profile?.avatar_url ?? "/avatar-placeholder.svg"}
                alt="avatar"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{profile?.full_name ?? user.email}</h1>
              <p className="mt-2 text-lg text-gray-300">{profile?.bio || "Engineering enthusiast and creator"}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-purple-400" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span>Joined {joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Stats */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          title="My Projects"
          value={totalProjects.toString()}
          label="Total projects"
          trend="+12%"
        />
        <InfoCard
          title="Total Views"
          value={totalViews.toString()}
          label="Project views"
          trend="+24%"
        />
        <InfoCard
          title="Total Likes"
          value={totalLikes.toString()}
          label="Community likes"
          trend="+18%"
        />
        <InfoCard
          title="Saved"
          value={saved.length.toString()}
          label="Bookmarked items"
          trend="+8%"
        />
      </section>

      {/* My Projects */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">My Projects</h2>
          </div>
          <Link href="/profile/projects" as="/profile/projects" className="text-sm text-purple-400 hover:text-purple-300 transition">
            View All
          </Link>
        </div>

        {featuredProject && (
          <div className="mb-4 rounded-[2rem] border border-purple-500/30 bg-purple-950/50 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-700/20 text-purple-400">
                <Award className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{featuredProject.title}</h3>
                  <Badge variant="glow" className="bg-purple-500 text-white">Featured</Badge>
                </div>
                <p className="mt-1 text-sm text-gray-300 line-clamp-2">{featuredProject.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                  <span>{featuredProject.project_type}</span>
                  <span>•</span>
                  <span>{(featuredProject.views_count || 0).toLocaleString()} views</span>
                </div>
              </div>
              <Link href={`/projects/${featuredProject.slug}`} as={`/projects/${featuredProject.slug}`}>
                <Button variant="primary" size="sm">View</Button>
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-[2rem] border border-purple-500/30 bg-purple-950/50 p-6 shadow-sm backdrop-blur-sm">
          {recentProjects.length > 0 ? (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.slug}`} as={`/projects/${project.slug}`} className="block">
                  <div className="flex items-center gap-4 rounded-2xl border border-purple-500/30 bg-purple-900/30 p-4 transition-all hover:border-purple-500 hover:bg-purple-900/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-700/20">
                      <FolderOpen className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{project.title}</h4>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                        <Badge
                          variant={project.status === "published" ? "success" : project.status === "draft" ? "warning" : "secondary"}
                          size="sm"
                        >
                          {project.status}
                        </Badge>
                        <span>•</span>
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Activity className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="No projects yet"
              description="Start creating and track your engineering projects here."
              actionLabel="Create Project"
              actionHref="/creator/projects/new"
              variant="minimal"
            />
          )}
        </div>
      </section>

      {/* Research Activity */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Research Activity</h2>
        </div>
        <div className="rounded-[2rem] border border-purple-500/30 bg-purple-950/50 p-8 shadow-sm backdrop-blur-sm">
          <EmptyState
            icon={TrendingUp}
            title="No research activity"
            description="Your research contributions and experiments will appear here."
            actionLabel="Explore Research"
            actionHref="/research"
            variant="minimal"
          />
        </div>
      </section>

      {/* Community Activity */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Community Activity</h2>
        </div>
        <div className="rounded-[2rem] border border-purple-500/30 bg-purple-950/50 p-8 shadow-sm backdrop-blur-sm">
          <EmptyState
            icon={Users}
            title="No community activity"
            description="Join the conversation and connect with other creators."
            actionLabel="Visit Community"
            actionHref="/community/global"
            variant="minimal"
          />
        </div>
      </section>

      {/* Saved Content */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Saved Content</h2>
        </div>
        <div className="rounded-[2rem] border border-purple-500/30 bg-purple-950/50 p-8 shadow-sm backdrop-blur-sm">
          {saved.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No saved items"
              description="Save articles, resources, and content to access them later."
              actionLabel="Browse Content"
              actionHref="/"
              variant="minimal"
            />
          ) : (
            <ul className="space-y-3">
              {saved.map((s) => (
                <li key={s.id} className="rounded-2xl border border-purple-500/30 bg-purple-900/30 p-4 transition-all hover:border-purple-500 hover:bg-purple-900/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" size="sm" className="capitalize">
                          {s.content_type}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">ID: {s.content_id}</div>
                    </div>
                    <div>
                      {(() => {
                        const url = `/${String(s.content_type).toLowerCase()}s/${String(s.content_id)}`;
                        return <a href={url} className="text-purple-400 underline text-sm font-semibold">View</a>;
                      })()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Achievements */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Achievements</h2>
        </div>
        <div className="rounded-[2rem] border border-purple-500/30 bg-purple-950/50 p-8 shadow-sm backdrop-blur-sm">
          <EmptyState
            icon={Award}
            title="No achievements yet"
            description="Complete activities and contribute to earn achievements."
            actionLabel="Explore Activities"
            actionHref="/"
            variant="minimal"
          />
        </div>
      </section>
      </div>
      <Footer />
    </main>
  );
}
