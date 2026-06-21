"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Pencil,
  Plus,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabaseClient } from "@/lib/supabase/client";

type ProjectStatus = "published" | "draft" | "pending" | "rejected" | "featured";

const fallbackProjects = [
  {
    id: "smart-traffic",
    title: "Smart Traffic Management",
    category: "AI",
    description: "AI-powered traffic signal control system using computer vision.",
    status: "published",
    views_count: 3400,
    likes_count: 234,
    bookmarks_count: 48,
    github_stars: 234,
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ncc-buddy",
    title: "NCC Buddy",
    category: "Web",
    description: "Platform for NCC cadets to manage activities and events.",
    status: "published",
    views_count: 1800,
    likes_count: 189,
    bookmarks_count: 32,
    github_stars: 189,
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "hospital-management",
    title: "Hospital Management System",
    category: "IoT",
    description: "IoT enabled hospital management and patient monitoring system.",
    status: "draft",
    views_count: 1200,
    likes_count: 156,
    bookmarks_count: 24,
    github_stars: 156,
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const recommended = [
  { title: "AI Code Reviewer", meta: "Automated code review using AI and NLP.", stars: 512 },
  { title: "IoT Weather Station", meta: "Smart weather monitoring using IoT sensors.", stars: 421 },
  { title: "CyberShield", meta: "AI powered cybersecurity threat detection.", stars: 620 },
  { title: "Drone Delivery", meta: "Autonomous drone delivery system.", stars: 310 },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [profileCompletion, setProfileCompletion] = useState<any>(null);
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

      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      if (sessionResponse.ok) {
        const sessionInfo = await sessionResponse.json();
        if (sessionInfo?.isAdmin) {
          router.replace("/admin");
          return;
        }
      }

      setUser(data.user);

      const [{ data: p }, { data: proj }, statsRes, activityRes, completionRes] = await Promise.all([
        supabaseClient.from("profiles").select("*").eq("id", data.user.id).single(),
        supabaseClient.from("projects").select("*").eq("owner_id", data.user.id).order("created_at", { ascending: false }).limit(24),
        fetch("/api/user/stats"),
        fetch("/api/user/activity?limit=10"),
        fetch("/api/user/profile-completion"),
      ]);

      if (mounted) {
        setProfile(p ?? null);
        setProjects(proj?.length ? proj : fallbackProjects);
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setUserStats(statsData.data);
        }
        
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setRecentActivity(activityData.data || []);
        }
        
        if (completionRes.ok) {
          const completionData = await completionRes.json();
          setProfileCompletion(completionData.data);
        }
      }
      setLoading(false);
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
    const allProjects = projects.length ? projects : fallbackProjects;
    const totalViews = allProjects.reduce((sum, project) => sum + (project.views_count || 0), 0);
    const totalLikes = allProjects.reduce((sum, project) => sum + (project.likes_count || 0), 0);
    
    // Use backend stats if available, otherwise fall back to calculated values
    return {
      allProjects,
      engineeringScore: userStats?.engineeringScore || Math.max(1250, totalLikes * 4 + allProjects.length * 120),
      totalViews: userStats?.totalViews || totalViews,
      totalLikes: userStats?.totalLikes || totalLikes,
      followers: userStats?.followersCount || 340,
      profileViews: userStats?.profileViews || Math.max(2450, totalViews),
    };
  }, [projects, userStats]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Engineer";
  const firstName = displayName.split(/\s+/)[0];
  const publishedCount = userStats?.publishedProjects || stats.allProjects.filter((project) => project.status === "published" || project.published).length;
  const draftCount = userStats?.draftProjects || stats.allProjects.filter((project) => project.status === "draft" || !project.published).length;
  const pendingCount = userStats?.pendingProjects || 1;

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
              <Image src={profile?.avatar_url || "/avatar-placeholder.svg"} alt={displayName} fill className="object-cover" />
              <span className="absolute bottom-2 right-1 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-background" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">Welcome back, {firstName}! <span className="text-accent">Wave</span></h2>
                  <p className="mt-1 text-sm text-muted">Keep building. Keep learning. Keep sharing.</p>
                </div>
                <Link href="/profile" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90">
                  Edit Profile
                </Link>
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
                <Link href="/profile/projects" className="text-xs font-semibold text-primary hover:text-accent transition-colors">View All Projects</Link>
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
              <div className="grid gap-4 md:grid-cols-3">
                {stats.allProjects.slice(0, 3).map((project) => (
                  <ProjectCard key={project.id || project.slug} project={project} />
                ))}
              </div>
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
            <RecentActivity activities={recentActivity} />
          </aside>
        </div>
      </div>
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

function ProjectCard({ project }: { project: any }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/50 hover:shadow-glow">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-md bg-primary/20 px-2 py-1 text-[10px] font-heading font-bold text-primary">{project.category || project.domain || "AI"}</span>
          <span className="text-accent"><Star className="h-3.5 w-3.5 fill-accent" /></span>
        </div>
        <h4 className="line-clamp-1 text-sm font-heading font-bold text-foreground group-hover:text-primary transition-colors">{project.title}</h4>
        <p className="mt-2 line-clamp-2 min-h-[32px] text-xs text-muted">{project.description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1 text-accent"><Star className="h-3.5 w-3.5 fill-accent" /> {project.github_stars || project.stars || project.likes_count || 0}</span>
          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {(project.views_count || 0).toLocaleString()}</span>
          <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {project.bookmarks_count || 0}</span>
          <span className="flex items-center gap-1"><GitFork className="h-3.5 w-3.5" /> {project.forks || 0}</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Updated {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : "recently"}</span>
          <button className="rounded-md p-1 text-muted hover:bg-surface-elevated hover:text-foreground transition"><Pencil className="h-3.5 w-3.5" /></button>
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

function RecentActivity({ activities }: { activities?: any[] }) {
  const iconMap: Record<string, any> = {
    Eye,
    Heart,
    Users,
    TrendingUp,
  };
  
  const defaultEvents = [
    { icon: Eye, text: "Your project Smart Traffic Management got 34 new views", time: "2 hours ago" },
    { icon: Heart, text: "You received 12 new likes on NCC Buddy", time: "5 hours ago" },
    { icon: Users, text: "New follower Rahul Singh started following you", time: "1 day ago" },
    { icon: TrendingUp, text: "Hospital Management System got featured", time: "2 days ago" },
  ];
  
  const events = activities && activities.length > 0 
    ? activities.map((activity: any) => ({
        icon: iconMap[activity.icon] || TrendingUp,
        text: activity.text,
        time: activity.time,
      }))
    : defaultEvents;
  
  return (
    <section className="rounded-3xl glass p-6">
      <h3 className="mb-4 font-heading font-bold text-foreground">Recent Activity</h3>
      <div className="space-y-3">
        {events.map((event, index) => (
          <div key={index} className="flex gap-3 rounded-xl bg-surface p-3 transition hover:border-primary/50 hover:shadow-glow">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <event.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-foreground">{event.text}</p>
              <p className="mt-1 text-[10px] text-muted">{event.time}</p>
            </div>
 </div>
        ))}
      </div>
      <Link href="/profile" className="mt-4 block text-center text-xs font-heading font-semibold text-primary hover:text-accent transition-colors">View All Activity</Link>
    </section>
  );
}
