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
import { User, Mail, Calendar, FolderOpen, Search, MessageSquare, Bookmark, Award, Code2, TrendingUp, Users, Activity, Heart, Star, Flame, Trophy, Download, Share2, Github, Linkedin, Globe, MapPin, Briefcase, GraduationCap, Zap, Twitter, Youtube, Instagram, CheckCircle } from "lucide-react";
import { ResumeGenerator } from "@/components/profile/ResumeGenerator";
import { SocialFeatures } from "@/components/profile/SocialFeatures";
import { ProfileAnalytics } from "@/components/profile/ProfileAnalytics";
import { notFound } from "next/navigation";

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  created_at?: string;
  engineering_score?: number;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  instagram_url?: string;
  website_url?: string;
  job_title?: string;
  company?: string;
  availability?: 'open' | 'busy' | 'not_looking';
  endorsements?: Endorsement[];
}

interface ProfileProject {
  id: string;
  title: string;
  description?: string;
  slug: string;
  views_count?: number;
  likes_count?: number;
  featured?: boolean;
  project_type?: string;
  created_at?: string;
}

interface UserBadge {
  id: string;
  badge_name: string;
  badge_icon?: string;
  earned_at: string;
}

interface UserAchievement {
  id: string;
  achievement_name: string;
  achievement_description?: string;
  progress?: number;
  target?: number;
  completed_at?: string;
}

interface Endorsement {
  id: string;
  skill: string;
  rating?: number;
  endorsement_text?: string;
}

interface GamificationData {
  points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
}

interface EngineeringScore {
  total: number;
  breakdown: {
    projects: number;
    points: number;
    badges: number;
    achievements: number;
    streak: number;
  };
  rank: string;
}

interface PublicProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<ProfileProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [engineeringScore, setEngineeringScore] = useState<EngineeringScore | null>(null);
  const [username, setUsername] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPublicProfile(username: string) {
      setLoading(true);
      try {
        // Get current user
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }

        // Get profile by username
        const { data: p, error: profileError } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("username", username)
          .eq("profile_visibility", "public")
          .single();

        if (profileError || !p) {
          if (mounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        if (!mounted) return;

        setProfile(p);

        // Load public data for this user using Phase 3 tables
        const [{ data: proj }, { data: pb }, { data: pa }, { data: pe }] = await Promise.all([
          supabaseClient
            .from("projects")
            .select("*")
            .eq("owner_id", p.id)
            .eq("status", "published")
            .order("created_at", { ascending: false }),
          supabaseClient.from("profile_badges").select("*").eq("profile_id", p.id).eq("is_active", true).order("earned_at", { ascending: false }),
          supabaseClient.from("profile_achievements").select("*").eq("profile_id", p.id).order("completed_at", { ascending: false, nullsFirst: false }),
          supabaseClient.from("profile_endorsements").select("*, endorser:profiles(full_name, avatar_url)").eq("profile_id", p.id).order("created_at", { ascending: false }),
        ]);

        if (mounted) {
          setProjects(proj ?? []);
          setUserBadges(pb ?? []);
          setUserAchievements(pa ?? []);
          
          // Use engineering score from profile (calculated by trigger)
          const score = {
            total: p.engineering_score || 0,
            breakdown: {
              projects: (proj?.length || 0) * 10,
              points: 0,
              badges: (pb?.length || 0) * 15,
              achievements: (pa?.filter((a: UserAchievement) => a.completed_at).length || 0) * 20,
              streak: 0,
            },
            rank: getEngineeringRank(p.engineering_score || 0),
          };
          setEngineeringScore(score);
          
          // Set gamification data for compatibility
          setGamificationData({
            points: p.engineering_score || 0,
            level: Math.floor((p.engineering_score || 0) / 100) + 1,
            current_streak: 0,
            longest_streak: 0,
          });
        }
      } catch (error) {
        console.error("Error loading public profile:", error);
        if (mounted) {
          setNotFound(true);
          setLoading(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // Resolve params Promise
    params.then((resolvedParams) => {
      setUsername(resolvedParams.username);
      loadPublicProfile(resolvedParams.username);
    }).catch((error) => {
      console.error("Error resolving params:", error);
      if (mounted) {
        setNotFound(true);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [params]);

  function calculateEngineeringScore(projects: ProfileProject[], gamification: GamificationData, badges: UserBadge[], achievements: UserAchievement[]) {
    const projectScore = (projects?.length || 0) * 25;
    const pointsScore = Math.floor((gamification?.points || 0) / 10);
    const badgeScore = (badges?.length || 0) * 15;
    const achievementScore = (achievements?.filter((a: UserAchievement) => a.completed_at).length || 0) * 20;
    const streakBonus = Math.floor((gamification?.current_streak || 0) * 2);
    
    const totalScore = projectScore + pointsScore + badgeScore + achievementScore + streakBonus;
    
    return {
      total: totalScore,
      breakdown: {
        projects: projectScore,
        points: pointsScore,
        badges: badgeScore,
        achievements: achievementScore,
        streak: streakBonus,
      },
      rank: getEngineeringRank(totalScore),
    };
  }

  function getEngineeringRank(score: number): string {
    if (score >= 1000) return "Legendary Engineer";
    if (score >= 500) return "Master Engineer";
    if (score >= 250) return "Senior Engineer";
    if (score >= 100) return "Engineer";
    if (score >= 50) return "Junior Engineer";
    return "Aspiring Engineer";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
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

  if (notFound || !profile) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-12">
          <EmptyState
            icon={User}
            title="Profile not found"
            description="This profile may be private or does not exist."
            actionLabel="Go Home"
            actionHref="/"
          />
        </div>
      </main>
    );
  }

  const joinDate = profile?.created_at ? new Date(profile.created_at as string).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown';
  const totalProjects = projects.length;
  const totalViews = projects.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const totalLikes = projects.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const featuredProject = projects.find(p => p.featured);
  const recentProjects = projects.slice(0, 6);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-12">

      {/* Profile Overview */}
      <section className="mb-8">
        <div className="rounded-[2.5rem] border border-border bg-surface p-8 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-accent/20 md:h-32 md:w-32 ring-4 ring-primary/30">
              <Image
                src={profile?.avatar_url ?? "/avatar-placeholder.svg"}
                alt="avatar"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-heading font-bold text-foreground">{profile?.full_name || profile?.username}</h1>
                  <p className="mt-2 text-lg text-muted">{profile?.bio || "Engineering enthusiast and creator"}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
                    {profile?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Joined {joinDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="primary" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                </div>
              </div>
              
              {/* Social Links */}
              <div className="mt-4 flex flex-wrap gap-3">
                {profile?.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted hover:text-primary transition">
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}
                {profile?.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted hover:text-primary transition">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
                {profile?.twitter_url && (
                  <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted hover:text-primary transition">
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </a>
                )}
                {profile?.youtube_url && (
                  <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted hover:text-primary transition">
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </a>
                )}
                {profile?.instagram_url && (
                  <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted hover:text-primary transition">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </a>
                )}
                {profile?.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted hover:text-primary transition">
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>

              {/* Professional Info */}
              {(profile?.job_title || profile?.company) && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
                  {profile?.job_title && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span>{profile.job_title}</span>
                    </div>
                  )}
                  {profile?.company && (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span>{profile.company}</span>
                    </div>
                  )}
                  {profile?.availability && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${profile.availability === 'open' ? 'text-green-400' : profile.availability === 'busy' ? 'text-yellow-400' : 'text-red-400'}`} />
                      <span className="capitalize">{profile.availability === 'open' ? 'Open to opportunities' : profile.availability === 'busy' ? 'Busy' : 'Not looking'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Score */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-heading font-semibold text-foreground">Engineering Score</h2>
        </div>
        <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-heading font-bold text-foreground">{engineeringScore?.total || 0}</div>
              <div className="text-sm text-muted">Total Score</div>
            </div>
            <Badge variant="glow" className="bg-primary text-foreground text-lg px-4 py-2">
              {engineeringScore?.rank || "Aspiring Engineer"}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-surface-elevated p-4">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted">Projects</span>
              </div>
              <div className="text-xl font-heading font-bold text-foreground">{engineeringScore?.breakdown?.projects || 0}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-muted">Points</span>
              </div>
              <div className="text-xl font-heading font-bold text-foreground">{engineeringScore?.breakdown?.points || 0}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-muted">Badges</span>
              </div>
              <div className="text-xl font-heading font-bold text-foreground">{engineeringScore?.breakdown?.badges || 0}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted">Achievements</span>
              </div>
              <div className="text-xl font-heading font-bold text-foreground">{engineeringScore?.breakdown?.achievements || 0}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-muted">Streak Bonus</span>
              </div>
              <div className="text-xl font-heading font-bold text-foreground">{engineeringScore?.breakdown?.streak || 0}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Analytics */}
      <section className="mb-8">
        <ProfileAnalytics
          profileId={profile.id}
          isOwner={currentUserId === profile.id}
        />
      </section>

      {/* Social Features */}
      <section className="mb-8">
        <SocialFeatures
          profileId={profile.id}
          currentUserId={currentUserId || undefined}
        />
      </section>

      {/* Resume Generator */}
      <section className="mb-8">
        <ResumeGenerator
          profile={profile}
          projects={projects}
          gamificationData={gamificationData || undefined}
          userBadges={userBadges}
          userAchievements={userAchievements}
          engineeringScore={engineeringScore || undefined}
        />
      </section>

      {/* Dashboard Stats */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          title="Projects"
          value={totalProjects.toString()}
          label="Published projects"
        />
        <InfoCard
          title="Total Views"
          value={totalViews.toString()}
          label="Project views"
        />
        <InfoCard
          title="Total Likes"
          value={totalLikes.toString()}
          label="Community likes"
        />
        <InfoCard
          title="Level"
          value={(gamificationData?.level || 1).toString()}
          label="Current level"
        />
      </section>

      {/* Gamification Stats */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-heading font-semibold text-foreground">Gamification Progress</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-muted">Points</span>
            </div>
            <div className="text-2xl font-heading font-bold text-foreground">{gamificationData?.points?.toLocaleString() || 0}</div>
            <div className="text-xs text-muted">Level {gamificationData?.level || 1}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="text-sm text-muted">Current Streak</span>
            </div>
            <div className="text-2xl font-heading font-bold text-foreground">{gamificationData?.current_streak || 0} days</div>
            <div className="text-xs text-muted">Best: {gamificationData?.longest_streak || 0} days</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <Award className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-muted">Badges</span>
            </div>
            <div className="text-2xl font-heading font-bold text-foreground">{userBadges.length}</div>
            <div className="text-xs text-muted">Earned badges</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted">Achievements</span>
            </div>
            <div className="text-2xl font-heading font-bold text-foreground">{userAchievements.filter(ua => ua.completed_at).length}</div>
            <div className="text-xs text-muted">Completed</div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-heading font-semibold text-foreground">Projects</h2>
        </div>

        {featuredProject && (
          <div className="mb-4 rounded-[2rem] border border-border bg-surface p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                <Award className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-foreground">{featuredProject.title}</h3>
                  <Badge variant="glow" className="bg-primary text-foreground">Featured</Badge>
                </div>
                <p className="mt-1 text-sm text-muted line-clamp-2">{featuredProject.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted">
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

        <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-sm backdrop-blur-sm">
          {recentProjects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {recentProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.slug}`} as={`/projects/${project.slug}`} className="block">
                  <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-4 transition-all hover:border-primary hover:bg-surface-elevated">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                      <FolderOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{project.title}</h4>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <span>{project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown'}</span>
                        <span>•</span>
                        <span>{(project.views_count || 0).toLocaleString()} views</span>
                      </div>
                    </div>
                    <Activity className="h-4 w-4 text-muted" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="No projects yet"
              description="This user hasn't published any projects yet."
              variant="minimal"
            />
          )}
        </div>
      </section>

      {/* Achievements */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-heading font-semibold text-foreground">Achievements</h2>
        </div>
        <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-sm backdrop-blur-sm">
          {userAchievements.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {userAchievements.slice(0, 4).map((ua) => (
                <div key={ua.id} className="rounded-xl border border-border bg-surface-elevated p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{ua.achievement_name}</h4>
                      <p className="text-xs text-muted line-clamp-1">{ua.achievement_description}</p>
                    </div>
                    {ua.completed_at && (
                      <Badge variant="success" size="sm" className="bg-green-500 text-foreground">
                        ✓
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${ua.completed_at ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: `${Math.min(100, ((ua.progress || 0) / (ua.target || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Award}
              title="No achievements yet"
              description="This user hasn't completed any achievements yet."
              variant="minimal"
            />
          )}
        </div>
      </section>

      {/* Badges */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-heading font-semibold text-foreground">Badges</h2>
        </div>
        <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-sm backdrop-blur-sm">
          {userBadges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {userBadges.slice(0, 8).map((ub) => (
                <div key={ub.id} className="rounded-xl border border-border bg-surface-elevated p-4 text-center">
                  <div className="text-3xl mb-2">{ub.badge_icon || '🏆'}</div>
                  <div className="text-sm font-medium text-foreground">{ub.badge_name}</div>
                  <div className="text-xs text-muted mt-1">
                    {new Date(ub.earned_at as string).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Award}
              title="No badges yet"
              description="This user hasn't earned any badges yet."
              variant="minimal"
            />
          )}
        </div>
      </section>

      {/* Endorsements */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-heading font-semibold text-foreground">Skills & Endorsements</h2>
        </div>
        <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-sm backdrop-blur-sm">
          {profile.endorsements && profile.endorsements.length > 0 ? (
            <div className="space-y-4">
              {profile.endorsements.slice(0, 4).map((endorsement: any) => (
                <div key={endorsement.id} className="p-4 rounded-xl border border-border bg-surface-elevated">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{endorsement.skill}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(endorsement.rating || 5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                      </div>
                      {endorsement.endorsement_text && (
                        <p className="text-xs text-muted">{endorsement.endorsement_text}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No endorsements yet"
              description="This user hasn't received any endorsements yet."
              variant="minimal"
            />
          )}
        </div>
      </section>
      </div>
      <Footer />
    </main>
  );
}
