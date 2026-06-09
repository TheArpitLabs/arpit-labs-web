"use client";

import React, { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Edit, Trash2, Eye, Archive, FolderOpen, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type TabType = 'draft' | 'published' | 'archived';

export default function ProjectsDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('draft');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabaseClient.auth.getUser();
      if (!mounted) return;
      setUser(data?.user ?? null);

      if (data?.user) {
        await fetchProjects(data.user.id);
      }
      setLoading(false);
    }

    init();

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProjects(session.user.id);
      } else {
        setProjects([]);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const fetchProjects = async (userId: string) => {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const { error } = await supabaseClient
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (!error && user) {
      await fetchProjects(user.id);
    }
  };

  const handleArchive = async (projectId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'archived' ? 'published' : 'archived';
    
    const { error } = await supabaseClient
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId);

    if (!error && user) {
      await fetchProjects(user.id);
    }
  };

  const filteredProjects = projects.filter(p => p.status === activeTab);

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <EmptyState
          icon={FolderOpen}
          title="Not signed in"
          description="Please sign in to view your projects."
          actionLabel="Sign In"
          actionHref="/login"
        />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="text-center">Loading...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">My Projects</h1>
          <p className="mt-2 text-muted-foreground">Manage your engineering projects.</p>
        </div>
        <Link href="/creator/projects/new" className="inline-flex">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/70 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Projects</p>
              <p className="text-2xl font-semibold">{projects.length}</p>
            </div>
          </div>
        </Card>
        <Card className="border-border/70 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-semibold">
                {projects.reduce((sum, p) => sum + (p.views_count || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-border/70 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Views (7d)</p>
              <p className="text-2xl font-semibold">
                {projects.reduce((sum, p) => sum + (p.views_count || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-border/70 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Views (30d)</p>
              <p className="text-2xl font-semibold">
                {projects.reduce((sum, p) => sum + (p.views_count || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Most Viewed Project */}
      {projects.length > 0 && (
        <Card className="mb-8 border-border/70 bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Most Viewed Project</h3>
          {(() => {
            const mostViewed = projects.reduce((max, p) => 
              (p.views_count || 0) > (max.views_count || 0) ? p : max, projects[0]);
            return (
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-muted/20">
                  {mostViewed.cover_image ? (
                    <Image
                      src={mostViewed.cover_image}
                      alt={mostViewed.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted/20">
                      <FolderOpen className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{mostViewed.title}</h4>
                  <p className="text-sm text-muted-foreground">{mostViewed.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {mostViewed.views_count || 0} views
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(mostViewed.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Link href={`/projects/${mostViewed.slug}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </Link>
              </div>
            );
          })()}
        </Card>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border/70">
        {(['draft', 'published', 'archived'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium capitalize transition ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab} ({projects.filter(p => p.status === tab).length})
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="border-border/70 bg-card overflow-hidden">
              <div className="relative aspect-video w-full bg-muted/20">
                {project.cover_image ? (
                  <Image
                    src={project.cover_image}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted/20">
                    <FolderOpen className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute left-3 top-3">
                  <Badge variant="outline" className="border-none bg-background/80 text-foreground backdrop-blur-md">
                    {project.project_type}
                  </Badge>
                </div>
                {project.featured && (
                  <div className="absolute right-3 top-3">
                    <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-foreground">{project.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
                
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {project.views_count || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Link href={`/projects/${project.slug}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/creator/projects/${project.slug}/edit`} className="flex-1">
                    <Button size="sm" className="w-full">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(project.id, project.status)}
                    className="flex-1"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    {project.status === 'archived' ? 'Unarchive' : 'Archive'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(project.id)}
                    className="flex-1 text-red-500 hover:text-red-500"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/70 bg-card p-12">
          <EmptyState
            icon={FolderOpen}
            title={`No ${activeTab} projects`}
            description={
              activeTab === 'draft'
                ? "Start by creating your first project."
                : activeTab === 'published'
                ? "Publish your projects to share them with the community."
                : "Archived projects will appear here."
            }
            actionLabel={activeTab === 'draft' ? "Create Project" : undefined}
            actionHref={activeTab === 'draft' ? "/creator/projects/new" : undefined}
          />
        </Card>
      )}
    </main>
  );
}
