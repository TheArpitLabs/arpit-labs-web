"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Check,
  Eye,
  FlaskConical,
  FolderKanban,
  GitFork,
  Heart,
  Map,
  LogOut,
  Pencil,
  Plus,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

type ProjectStatus = "published" | "draft" | "pending" | "rejected" | "featured";

interface Project {
  id: string;
  title: string;
  category?: string;
  domain?: string;
  description: string;
  status: ProjectStatus;
  published?: boolean;
  views_count?: number;
  likes_count?: number;
  bookmarks_count?: number;
  github_stars?: number;
  stars?: number;
  forks?: number;
  updated_at?: string;
  slug?: string;
}

interface User {
  id: string;
  email?: string;
}

interface Profile {
  full_name?: string;
  avatar_url?: string;
  engineering_score?: number;
  role?: string;
  verified?: boolean;
}

interface UserStats {
  engineeringScore?: number;
  totalViews?: number;
  totalLikes?: number;
  followersCount?: number;
  profileViews?: number;
  publishedProjects?: number;
  draftProjects?: number;
  pendingProjects?: number;
}

const recommended = [
  { title: "AI Code Reviewer", meta: "Automated code review using AI and NLP.", stars: 512 },
  { title: "IoT Weather Station", meta: "Smart weather monitoring using IoT sensors.", stars: 421 },
  { title: "CyberShield", meta: "AI powered cybersecurity threat detection.", stars: 620 },
  { title: "Drone Delivery", meta: "Autonomous drone delivery system.", stars: 310 },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [profileCompletion, setProfileCompletion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const handleLogout = useCallback(async () => {
    setShowLogoutConfirm(false);
    try {
      await supabaseClient.auth.signOut();
      await fetch('/api/auth/session', { method: 'DELETE' });
      router.push('/login');
    } catch (err) {
      logger.error('Logout error:', err);
      setError('Failed to logout. Please try again.');
    }
  }, [router]);

  const handleLogoutClick = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const cancelLogout = useCallback(() => {
    setShowLogoutConfirm(false);
  }, []);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('project-search')?.focus();
      }
      // Ctrl/Cmd + L for logout
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleLogout();
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLogout, searchQuery]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      setError(null);
      
      try {
        const { data } = await supabaseClient.auth.getUser();
        if (!mounted) return;

        if (!data?.user) {
          router.push("/login");
          return;
        }

        const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
        if (sessionResponse.ok) {
          const sessionInfo = await sessionResponse.json();
          if (sessionInfo?.isAdmin) {
            router.replace("/admin");
            return;
          }
        }

        setUser(data.user);

        const [{ data: p, error: profileError }, { data: proj, error: projectsError }, statsRes, activityRes, completionRes] = await Promise.all([
          supabaseClient.from("profiles").select("*").eq("id", data.user.id).single(),
          supabaseClient.from("projects").select("*").eq("owner_id", data.user.id).order("created_at", { ascending: false }).limit(24),
          fetch("/api/user/stats"),
          fetch("/api/user/activity?limit=10"),
          fetch("/api/user/profile-completion"),
        ]);

        if (mounted) {
          if (profileError) {
            logger.error('Profile fetch error:', profileError);
          }
          setProfile(p ?? null);
          
          if (projectsError) {
            logger.error('Projects fetch error:', projectsError);
            setError('Failed to load projects. Please refresh the page.');
          }
          setProjects(proj?.length ? proj : []);
          
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setUserStats(statsData.data);
          } else {
            logger.error('Stats API error:', statsRes.status);
          }
          
          if (activityRes.ok) {
            const activityData = await activityRes.json();
            setRecentActivity(activityData.data || []);
          } else {
            logger.error('Activity API error:', activityRes.status);
          }
          
          if (completionRes.ok) {
            const completionData = await completionRes.json();
            setProfileCompletion(completionData.data);
          } else {
            logger.error('Profile completion API error:', completionRes.status);
          }
        }
      } catch (err) {
        logger.error('Dashboard initialization error:', err);
        setError('Failed to load dashboard. Please try again.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/login");
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  const stats = useMemo(() => {
    const allProjects = projects.length ? projects : [];
    const totalViews = allProjects.reduce((sum, project) => sum + (project.views_count || 0), 0);
    const totalLikes = allProjects.reduce((sum, project) => sum + (project.likes_count || 0), 0);
    
    // Use backend stats if available, otherwise fall back to calculated values
    return {
      allProjects,
      engineeringScore: userStats?.engineeringScore || Math.max(0, totalLikes * 4 + allProjects.length * 120),
      totalViews: userStats?.totalViews || totalViews,
      totalLikes: userStats?.totalLikes || totalLikes,
      followers: userStats?.followersCount || 0,
      profileViews: userStats?.profileViews || totalViews,
    };
  }, [projects, userStats]);

  // Filter projects based on search query (with debouncing)
  const filteredProjects = useMemo(() => {
    if (!debouncedSearchQuery) return stats.allProjects;
    const query = debouncedSearchQuery.toLowerCase();
    return stats.allProjects.filter(project => 
      project.title.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      (project.category && project.category.toLowerCase().includes(query))
    );
  }, [stats.allProjects, debouncedSearchQuery]);

  // Filter activity based on selected filter
  const filteredActivity = useMemo(() => {
    if (activityFilter === 'all') return recentActivity;
    return recentActivity.filter((activity: any) => activity.type === activityFilter);
  }, [recentActivity, activityFilter]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted" role="status">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center max-w-md">
          <div className="rounded-2xl bg-red-500/20 px-4 py-3 text-sm text-red-400 mb-4" role="alert">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Engineer";
  const firstName = displayName.split(/\s+/)[0];
  const publishedCount = userStats?.publishedProjects ?? stats.allProjects.filter((project) => project.status === "published" || project.published).length;
  const draftCount = userStats?.draftProjects ?? stats.allProjects.filter((project) => project.status === "draft" || !project.published).length;
  const pendingCount = userStats?.pendingProjects ?? stats.allProjects.filter((project) => project.status === "pending").length;

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold uppercase tracking-wide text-foreground md:text-4xl">User Dashboard</h1>
          <p className="text-sm text-muted">Empowering Engineers. Building the Future.</p>
        </div>

        <section className="relative overflow-hidden rounded-3xl glass p-6 shadow-glow">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-surface ring-2 ring-primary/20">
              <Image 
                src={profile?.avatar_url || "/avatar-placeholder.svg"} 
                alt={displayName} 
                fill 
                className="object-cover" 
                sizes="96px"
                priority
              />
              <span className="absolute bottom-2 right-1 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-background" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">Welcome back, {firstName}!</h2>
                  <p className="mt-1 text-sm text-muted">Keep building. Keep learning. Keep sharing.</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/profile" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90">
                    Edit Profile
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-foreground shadow-glow transition hover:bg-surface"
                    aria-label="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <HeroMetric label="Engineering Score" value={stats.engineeringScore.toLocaleString()} delta="+120 this month" />
                <HeroMetric label="Projects" value={stats.allProjects.length.toString()} delta="+2 this month" />
                <HeroMetric label="Followers" value={stats.followers.toString()} delta="+25 this month" />
                <HeroMetric label="Profile Views" value={stats.profileViews.toLocaleString()} delta="+320 this month" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl glass p-6">
          <h3 className="mb-4 text-lg font-heading font-bold text-foreground">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ActionButton href="/creator/projects/new" label="Add Project" icon={Plus} className="from-primary to-accent" />
            <ActionButton href="/research" label="Create Research" icon={BookOpen} className="from-accent to-success" />
            <ActionButton href="/labs" label="Create Lab" icon={FlaskConical} className="from-success to-primary" />
            <ActionButton href="/roadmaps" label="Create Roadmap" icon={Map} className="from-primary to-secondary" />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
          <div className="space-y-6">
            <section className="rounded-3xl glass p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-heading font-bold text-foreground">My Projects</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      id="project-search"
                      type="text"
                      placeholder="Search projects... (Ctrl+K)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-48 md:w-64 rounded-xl border border-border bg-surface-elevated px-3 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-primary text-foreground placeholder:text-muted"
                      aria-label="Search projects"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition"
                        aria-label="Clear search"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <Link href="/profile/projects" className="text-xs font-semibold text-primary hover:text-accent transition-colors">View All</Link>
                </div>
              </div>
              <div className="mb-4 flex gap-2 overflow-x-auto">
                {[
                  ["Published", publishedCount],
                  ["Draft", draftCount],
                  ["Pending Review", pendingCount],
                  ["Rejected", 0],
                ].map(([label, count]) => (
                  <button key={label} className="shrink-0 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-heading font-semibold text-foreground first:bg-primary/20 first:text-primary transition hover:border-primary/50">
                    {label} ({count})
                  </button>
                ))}
              </div>
              {filteredProjects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {filteredProjects.slice(0, 3).map((project, index) => (
                    <ProjectCard key={project.id || project.slug} project={project} priority={index === 0} />
                  ))}
                </div>
              ) : debouncedSearchQuery ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted">No projects found matching "{debouncedSearchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-primary hover:text-accent mt-2"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted">No projects yet. Create your first project to get started!</p>
                  <Link
                    href="/creator/projects/new"
                    className="inline-flex items-center justify-center gap-2 mt-4 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" />
                    Create Project
                  </Link>
                </div>
              )}
            </section>

            <section className="rounded-3xl glass p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-heading font-bold text-foreground">Analytics Overview</h3>
                <span className="text-xs text-muted">This Month</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AnalyticsCard label="Project Views" value={stats.totalViews || 12450} color="primary" />
                <AnalyticsCard label="Project Likes" value={stats.totalLikes || 2340} color="accent" />
                <AnalyticsCard label="Profile Visits" value={stats.profileViews} color="success" />
                <AnalyticsCard label="New Followers" value={stats.followers} color="secondary" />
              </div>
            </section>

            <section className="rounded-3xl glass p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-heading font-bold text-foreground">Recommended For You</h3>
                <Link href="/projects" className="text-xs font-semibold text-primary hover:text-accent transition-colors">View All</Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {recommended.map((item) => (
                  <div key={item.title} className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/50 hover:shadow-glow">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative">
                      <h4 className="text-sm font-heading font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</h4>
                      <p className="mt-2 line-clamp-2 text-xs text-muted">{item.meta}</p>
                      <p className="mt-4 flex items-center gap-1 text-xs font-heading font-semibold text-accent"><Star className="h-3.5 w-3.5 fill-accent" /> {item.stars}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <ProfileCompletion completionData={profileCompletion} />
            <RecentActivity 
              activities={filteredActivity} 
              filter={activityFilter}
              onFilterChange={setActivityFilter}
            />
          </aside>
        </div>
      </div>
      
      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-glow">
            <h2 id="logout-dialog-title" className="text-lg font-heading font-bold text-foreground mb-2">
              Confirm Logout
            </h2>
            <p className="text-sm text-muted mb-6">
              Are you sure you want to logout? You will need to sign in again to access your dashboard.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 rounded-xl border border-border bg-surface-elevated text-sm font-semibold text-foreground hover:bg-surface transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function HeroMetric({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="border-l border-border pl-4 first:border-l-0 first:pl-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-heading font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-success">{delta}</p>
    </div>
  );
}

function ActionButton({ href, label, icon: Icon, className }: { href: Route; label: string; icon: any; className: string }) {
  return (
    <Link href={href} className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 py-3 text-sm font-heading font-bold text-white shadow-glow transition hover:opacity-90 ${className}`}>
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function ProjectCard({ project, priority = false }: { project: Project; priority?: boolean }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/50 hover:shadow-glow" role="article">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-md bg-primary/20 px-2 py-1 text-[10px] font-heading font-bold text-primary">{project.category || project.domain || "AI"}</span>
          <span className="text-accent" aria-hidden="true"><Star className="h-3.5 w-3.5 fill-accent" /></span>
        </div>
        <h4 className="line-clamp-1 text-sm font-heading font-bold text-foreground group-hover:text-primary transition-colors">{project.title}</h4>
        <p className="mt-2 line-clamp-2 min-h-[32px] text-xs text-muted">{project.description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1 text-accent" title="Stars"><Star className="h-3.5 w-3.5 fill-accent" aria-hidden="true" /> {project.github_stars || project.stars || project.likes_count || 0}</span>
          <span className="flex items-center gap-1" title="Views"><Eye className="h-3.5 w-3.5" aria-hidden="true" /> {(project.views_count || 0).toLocaleString()}</span>
          <span className="flex items-center gap-1" title="Bookmarks"><Heart className="h-3.5 w-3.5" aria-hidden="true" /> {project.bookmarks_count || 0}</span>
          <span className="flex items-center gap-1" title="Forks"><GitFork className="h-3.5 w-3.5" aria-hidden="true" /> {project.forks || 0}</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
          <time dateTime={project.updated_at}>Updated {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : "recently"}</time>
          <Link 
            href={`/profile/projects`}
            className="rounded-md p-1 text-muted hover:bg-surface-elevated hover:text-foreground transition"
            aria-label={`Edit ${project.title}`}
            title="Edit project"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function AnalyticsCard({ label, value, color }: { label: string; value: number; color: "primary" | "accent" | "success" | "secondary" }) {
  const colors = {
    primary: "text-primary",
    accent: "text-accent",
    success: "text-success",
    secondary: "text-secondary",
  };
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-2xl font-heading font-bold text-foreground">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-success">+ 18.5%</p>
      <div className={`mt-4 h-10 rounded bg-gradient-to-r from-transparent ${colors[color].replace("text", "to")}/30`} />
    </div>
  );
}

function ProfileCompletion({ completionData }: { completionData?: any }) {
  const completionPercentage = completionData?.completionPercentage || 85;
  const items = completionData?.items || {
    basicInfo: { completed: true, label: 'Basic Information' },
    profilePicture: { completed: true, label: 'Profile Picture' },
    bio: { completed: true, label: 'Bio' },
    skills: { completed: true, label: 'Skills' },
    socialLinks: { completed: false, label: 'Social Links' },
  };
  
  const itemsArray = Object.values(items);
  
  return (
    <section className="rounded-3xl glass p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading font-bold text-foreground">Profile Completion</h3>
        <span className="text-xs text-muted">{completionPercentage}%</span>
      </div>
      <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full border-[8px] border-primary/80 text-2xl font-heading font-black text-foreground">{completionPercentage}%</div>
      <p className="text-center text-xs text-muted">Almost there. Complete your profile to unlock more features.</p>
      <div className="mt-4 space-y-2">
        {itemsArray.map((item: any, index: number) => (
          <div key={item.label} className="flex items-center justify-between text-xs text-foreground">
            <span>{item.label}</span>
            {item.completed ? <Check className="h-3.5 w-3.5 text-success" /> : <span className="h-3.5 w-3.5 rounded-full border border-border" />}
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentActivity({ activities, filter, onFilterChange }: { activities?: any[]; filter?: string; onFilterChange?: (filter: string) => void }) {
  const iconMap: Record<string, any> = {
    Eye,
    Heart,
    Users,
    TrendingUp,
  };
  
  const defaultEvents = [
    { icon: Eye, text: "Your project Smart Traffic Management got 34 new views", time: "2 hours ago", type: 'project_view' },
    { icon: Heart, text: "You received 12 new likes on NCC Buddy", time: "5 hours ago", type: 'project_like' },
    { icon: Users, text: "New follower Rahul Singh started following you", time: "1 day ago", type: 'new_follower' },
    { icon: TrendingUp, text: "Hospital Management System got featured", time: "2 days ago", type: 'project_featured' },
  ];
  
  const events = activities && activities.length > 0 
    ? activities.map((activity: any) => ({
        icon: iconMap[activity.icon] || TrendingUp,
        text: activity.text,
        time: activity.time,
        type: activity.type,
      }))
    : defaultEvents;
  
  const activityTypes = ['all', 'project_view', 'project_like', 'new_follower', 'project_featured'];
  
  return (
    <section className="rounded-3xl glass p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading font-bold text-foreground">Recent Activity</h3>
        {onFilterChange && (
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="text-xs rounded-lg border border-border bg-surface px-2 py-1 text-foreground outline-none focus:border-primary"
          >
            <option value="all">All</option>
            <option value="project_view">Views</option>
            <option value="project_like">Likes</option>
            <option value="new_follower">Followers</option>
            <option value="project_featured">Featured</option>
          </select>
        )}
      </div>
      <div className="space-y-3">
        {events.length > 0 ? (
          events.map((event, index) => (
            <div key={index} className="flex gap-3 rounded-xl bg-surface p-3 transition hover:border-primary/50 hover:shadow-glow">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <event.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground line-clamp-2">{event.text}</p>
                <p className="mt-1 text-[10px] text-muted">{event.time}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-muted">No recent activity</p>
          </div>
        )}
      </div>
      <Link href="/profile" className="mt-4 block text-center text-xs font-heading font-semibold text-primary hover:text-accent transition-colors">View All Activity</Link>
    </section>
  );
}
