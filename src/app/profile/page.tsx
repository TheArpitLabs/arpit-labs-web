"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCardSkeleton } from "@/components/ui/card-skeleton";
import { Footer } from "@/components/layout/Footer";
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
      if (mounted) setLoading(false);
    }

    init();
    const { data: listener } = supabaseClient.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabaseClient.from("profiles").select("*").eq("id", session.user.id).single().then(({ data: p }) => setProfile(p ?? null));
        supabaseClient.from("saved_content").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).then(({ data: s }) => setSaved(s ?? []));
        supabaseClient.from("projects").select("*").eq("owner_id", session.user.id).order("created_at", { ascending: false }).then(({ data: proj }) => setProjects(proj ?? []));
      } else {
        setProfile(null);
        setSaved([]);
        setProjects([]);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 rounded-2xl border border-border/70 bg-card p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="h-24 w-24 animate-pulse rounded-full bg-muted/30 md:h-32 md:w-32" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-1/3 animate-pulse rounded-xl bg-muted/30" />
              <div className="h-4 w-1/2 animate-pulse rounded-xl bg-muted/30" />
              <div className="flex gap-4">
                <div className="h-4 w-32 animate-pulse rounded-xl bg-muted/30" />
                <div className="h-4 w-32 animate-pulse rounded-xl bg-muted/30" />
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
      </main>
    );
  }

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
  const totalProjects = projects.length;
  const publishedProjects = projects.filter(p => p.status === 'published').length;
  const draftProjects = projects.filter(p => p.status === 'draft').length;
  const totalViews = projects.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const totalLikes = projects.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const featuredProject = projects.find(p => p.featured && p.status === 'published');
  const recentProjects = projects.slice(0, 3);

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
        <Card className="border-border/70 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">My Projects</p>
              <p className="text-2xl font-semibold">{totalProjects}</p>
            </div>
          </div>
        </Card>
        <Card className="border-border/70 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-semibold">{totalViews}</p>
            </div>
          </div>
        </Card>
        <Card className="border-border/70 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-10 text-red-500">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Likes</p>
              <p className="text-2xl font-semibold">{totalLikes}</p>
            </div>
          </div>
        </Card>
        <Card className="border-border/70 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg">
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
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">My Projects</h2>
          </div>
          <Link href="/profile/projects" as="/profile/projects" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        
        {featuredProject && (
          <Card className="mb-4 border-primary/50 bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Award className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{featuredProject.title}</h3>
                  <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{featuredProject.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{featuredProject.project_type}</span>
                  <span>•</span>
                  <span>{featuredProject.views_count || 0} views</span>
                </div>
              </div>
              <Link href={`/projects/${featuredProject.slug}`} as={`/projects/${featuredProject.slug}`}>
                <Button variant="outline" size="sm">View</Button>
              </Link>
            </div>
          </Card>
        )}

        <Card className="border-border/70 bg-card p-6">
          {recentProjects.length > 0 ? (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.slug}`} as={`/projects/${project.slug}`} className="block">
                  <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-background p-4 transition hover:border-primary">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/20">
                      <FolderOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{project.title}</h4>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{project.status}</Badge>
                        <span>•</span>
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Activity className="h-4 w-4 text-muted-foreground" />
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
            />
          )}
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
              actionLabel="Browse Content"
              actionHref="/"
            />
          ) : (
            <ul className="space-y-3">
              {saved.map((s) => (
                <li key={s.id} className="rounded-xl border border-border/70 bg-background p-4 transition-all hover:border-primary/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
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
            actionLabel="Explore Activities"
            actionHref="/"
          />
        </Card>
      </section>
      <Footer />
    </main>
  );
}
