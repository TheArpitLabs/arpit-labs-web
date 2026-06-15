"use client";

import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Github, ExternalLink, Star, TrendingUp, Clock, Search, Heart, Flame, User, Sparkles, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NexusLogo } from "@/components/shared/NexusLogo";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getProjects as getProjectsData } from "@/lib/data/projects";

interface SearchParams {
  search?: string;
  branch?: string;
  project_type?: string;
  sort?: string;
}

const fallbackProjects = [
  {
    id: "fallback-smart-traffic",
    title: "Smart Traffic Management System",
    slug: "smart-traffic-management-system",
    description: "Computer vision and IoT-based traffic signal optimization with live monitoring, adaptive timing, and congestion analytics.",
    project_type: "hybrid",
    branch: "IoT",
    category: "Smart City",
    cover_image: "/images/projects/traffic-management-cover.jpg",
    tech_stack: ["Python", "OpenCV", "TensorFlow", "Arduino", "React"],
    tags: ["IoT", "Computer Vision", "Machine Learning"],
    views_count: 1240,
    likes_count: 86,
    featured: true,
    created_at: "2026-06-01T00:00:00.000Z",
    status: "published"
  },
  {
    id: "fallback-hospital-attendance",
    title: "Hospital Attendance System",
    slug: "hospital-attendance-system",
    description: "Biometric staff attendance platform for healthcare teams using RFID, fingerprint authentication, reports, and admin dashboards.",
    project_type: "software",
    branch: "Computer Science",
    category: "Healthcare",
    cover_image: "/images/projects/hospital-attendance-cover.jpg",
    tech_stack: ["Java", "Spring Boot", "React", "MySQL"],
    tags: ["Healthcare", "Biometrics", "Enterprise Software"],
    views_count: 980,
    likes_count: 74,
    featured: true,
    created_at: "2026-05-20T00:00:00.000Z",
    status: "published"
  },
  {
    id: "fallback-ncc-buddy",
    title: "NCC Buddy",
    slug: "ncc-buddy",
    description: "Mobile learning and community companion for NCC cadets with schedules, attendance, study material, and offline-first access.",
    project_type: "software",
    branch: "Mobile",
    category: "Education",
    cover_image: "/images/projects/ncc-buddy-cover.jpg",
    tech_stack: ["React Native", "Node.js", "Firebase"],
    tags: ["Mobile App", "Education", "Community"],
    views_count: 760,
    likes_count: 58,
    featured: true,
    created_at: "2026-05-10T00:00:00.000Z",
    status: "published"
  },
  {
    id: "fallback-ship-collision",
    title: "Ship Bridge Collision Prevention",
    slug: "ship-bridge-collision-prevention",
    description: "Marine safety system using radar signals, AI object detection, and automated alerts for ship collision prevention.",
    project_type: "research",
    branch: "Robotics",
    category: "Maritime",
    cover_image: "/images/projects/ship-collision-cover.jpg",
    tech_stack: ["Python", "OpenCV", "ROS", "PostgreSQL"],
    tags: ["Maritime", "AI", "Safety Systems"],
    views_count: 690,
    likes_count: 49,
    featured: false,
    created_at: "2026-04-26T00:00:00.000Z",
    status: "published"
  },
  {
    id: "fallback-accident-detection",
    title: "Accident Detection System",
    slug: "accident-detection-system",
    description: "Vehicle accident detection and emergency response workflow using accelerometers, GPS, GSM modules, and severity scoring.",
    project_type: "hardware",
    branch: "IoT",
    category: "Safety",
    cover_image: "/images/projects/accident-detection-cover.jpg",
    tech_stack: ["Arduino", "ESP32", "Firebase", "React Native"],
    tags: ["IoT", "Emergency Response", "Sensors"],
    views_count: 840,
    likes_count: 63,
    featured: false,
    created_at: "2026-04-12T00:00:00.000Z",
    status: "published"
  },
  {
    id: "fallback-snake-robot",
    title: "Snake Robot",
    slug: "snake-robot",
    description: "Bio-inspired rescue robot using servo articulation, Arduino control, wireless telemetry, and camera-assisted navigation.",
    project_type: "hardware",
    branch: "Robotics",
    category: "Robotics",
    cover_image: "/images/projects/snake-robot-cover.jpg",
    tech_stack: ["Arduino", "Servo Motors", "Wireless Control"],
    tags: ["Robotics", "Search and Rescue", "Embedded"],
    views_count: 610,
    likes_count: 41,
    featured: false,
    created_at: "2026-03-30T00:00:00.000Z",
    status: "published"
  },
];

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const branch = searchParams.get('branch') || '';
  const project_type = searchParams.get('project_type') || '';
  const sort = searchParams.get('sort') || 'newest';

  // Initialize with fallback data immediately
  const [allProjects, setAllProjects] = useState<any[]>(fallbackProjects);
  const [featuredProjects, setFeaturedProjects] = useState<any[]>(fallbackProjects.filter((project) => project.featured).slice(0, 3));
  const [trendingProjects, setTrendingProjects] = useState<any[]>([...fallbackProjects].sort((a, b) => b.likes_count - a.likes_count).slice(0, 6));
  const [latestProjects, setLatestProjects] = useState<any[]>([...fallbackProjects].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 6));
  const [popularProjects, setPopularProjects] = useState<any[]>([...fallbackProjects].sort((a, b) => b.views_count - a.views_count).slice(0, 6));
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Apply filters and sorting when search params change
    let filtered = fallbackProjects;
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        p.tech_stack?.some(tech => tech.toLowerCase().includes(searchLower))
      );
    }

    // Apply branch filter
    if (branch) {
      filtered = filtered.filter(p => p.branch === branch);
    }

    // Apply project type filter
    if (project_type) {
      filtered = filtered.filter(p => p.project_type === project_type);
    }

    // Apply sorting
    let sorted = [...filtered];
    if (sort === 'views') {
      sorted.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    } else if (sort === 'likes') {
      sorted.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (sort === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setAllProjects(sorted);
  }, [search, branch, project_type, sort]);

  const authorMap = new Map(authors?.map((a: any) => [a.id, a]) || []);

  // Debug: Check state before rendering
  console.log("RENDER DEBUG - Loading:", loading);
  console.log("RENDER DEBUG - Featured projects:", featuredProjects.length);
  console.log("RENDER DEBUG - Trending projects:", trendingProjects.length);
  console.log("RENDER DEBUG - Latest projects:", latestProjects.length);
  console.log("RENDER DEBUG - Popular projects:", popularProjects.length);
  console.log("RENDER DEBUG - All projects:", allProjects.length);

  if (loading) {
    return (
      <main className="bg-background text-foreground">
        <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
          <Container>
            <div className="max-w-3xl">
              <Skeleton variant="text" className="mb-6 h-8 w-32" />
              <Skeleton variant="text" className="h-16 w-96" />
              <Skeleton variant="text" className="mt-6 h-6 w-full" />
            </div>
          </Container>
        </section>
        <Container className="py-20">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-80" />
            ))}
          </div>
        </Container>
        <Footer />
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground">

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="border-b border-border/70 bg-gradient-to-b from-primary/5 to-background/75 py-20 dark:border-slate-800 dark:from-primary/10 dark:to-slate-950/70"
      >
        <Container>
          <div className="max-w-3xl">
            <Badge variant="premium" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest">
              Portfolio
            </Badge>
            <h1 className="text-hero text-gradient">
              Engineering Showcase
            </h1>
            <p className="mt-6 text-lg text-muted">
              A collection of systems, tools, and platforms built with a focus on performance, scalability, and clean engineering.
            </p>
          </div>
        </Container>
      </motion.section>

      <Container className="py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">
            <p className="text-sm font-medium text-muted">Published Projects</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{allProjects.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <p className="text-sm font-medium text-muted">Featured Builds</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{featuredProjects.length}</p>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
            <p className="text-sm font-medium text-muted">Total Views</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {allProjects.reduce((sum, project) => sum + (project.views_count || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <p className="text-sm font-medium text-muted">Engineering Areas</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {new Set(allProjects.map((project) => project.branch || project.category).filter(Boolean)).size}
            </p>
          </div>
        </div>
      </Container>

      <Container className="py-20">
        <AnimatedSection>
          {/* Search and Filters */}
          <section className="mb-12 space-y-6">
            <form>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                <Input
                  type="search"
                  placeholder="Search projects by title, description, tags, or technologies..."
                  className="pl-12 h-12 text-lg rounded-2xl glass"
                  name="search"
                  defaultValue={search}
                />
              </div>

              <div className="flex flex-wrap gap-4">
                {/* Branch Filter */}
                <select
                  name="branch"
                  defaultValue={branch || ''}
                  className="rounded-2xl border border-border/80 bg-surface/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">All Branches</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="IoT">IoT</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                  <option value="Robotics">Robotics</option>
                  <option value="Aerospace">Aerospace</option>
                  <option value="Biomedical">Biomedical</option>
                </select>

                {/* Project Type Filter */}
                <select
                  name="project_type"
                  defaultValue={project_type || ''}
                  className="rounded-2xl border border-border/80 bg-surface/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">All Types</option>
                  <option value="software">Software</option>
                  <option value="hardware">Hardware</option>
                  <option value="research">Research</option>
                  <option value="opensource">Open Source</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="hybrid">Hybrid</option>
                </select>

                {/* Sort */}
                <select
                  name="sort"
                  defaultValue={sort || 'newest'}
                  className="rounded-2xl border border-border/80 bg-surface/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="views">Most Viewed</option>
                  <option value="likes">Most Liked</option>
                </select>

                <Button type="submit" variant="primary" className="ml-auto">
                  Apply Filters
                </Button>
              </div>
            </form>
          </section>
          {/* Featured Projects */}
          {featuredProjects && featuredProjects.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-16"
            >
              <div className="mb-8 flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Featured Projects</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  >
                    <Link href={`/projects/${project.slug}`} className="group block">
                      <Card variant="elevated" className="group h-full overflow-hidden transition-all duration-300 hover:shadow-xl">
                        <div className="relative aspect-video w-full bg-surface">
                          {project.cover_image ? (
                            <Image
                              src={project.cover_image}
                              alt={project.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                              <NexusLogo className="h-12 w-12 text-primary/40" />
                            </div>
                          )}
                          <div className="absolute left-4 top-4">
                            <Badge variant="outline" className="border-none glass text-foreground">
                              {project.project_type}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted">{project.description}</p>
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(project.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5" />
                              {(project.views_count || 0).toLocaleString()} views
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5" />
                              {(project.likes_count || 0).toLocaleString()} likes
                            </div>
                            {project.branch && (
                              <Badge variant="secondary" size="sm">
                                {project.branch}
                              </Badge>
                            )}
                            {project.owner_id && (() => {
                              const author = authorMap.get(project.owner_id);
                              return author ? (
                                <div className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{author.full_name || 'Unknown'}</span>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Trending Projects */}
          {trendingProjects && trendingProjects.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-16"
            >
              <div className="mb-8 flex items-center gap-3">
                <Flame className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Trending Projects</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {trendingProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  >
                    <Link href={`/projects/${project.slug}`} className="group block">
                      <Card variant="glass" className="group h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
                        <div className="relative aspect-video w-full bg-surface">
                          {project.cover_image ? (
                            <Image
                              src={project.cover_image}
                              alt={project.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                              <NexusLogo className="h-12 w-12 text-primary/40" />
                            </div>
                          )}
                          <div className="absolute left-4 top-4">
                            <Badge variant="outline" className="border-none glass text-foreground">
                              {project.project_type}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted">{project.description}</p>
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(project.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5" />
                              {(project.views_count || 0).toLocaleString()} views
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5" />
                              {(project.likes_count || 0).toLocaleString()} likes
                            </div>
                            {project.branch && (
                              <Badge variant="secondary" size="sm">
                                {project.branch}
                              </Badge>
                            )}
                            {project.owner_id && (() => {
                              const author = authorMap.get(project.owner_id);
                              return author ? (
                                <div className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{author.full_name || 'Unknown'}</span>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Latest Projects */}
          {latestProjects && latestProjects.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-16"
            >
              <div className="mb-8 flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Latest Projects</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  >
                    <Link href={`/projects/${project.slug}`} className="group block">
                      <Card variant="glass" className="group h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
                        <div className="relative aspect-video w-full bg-surface">
                          {project.cover_image ? (
                            <Image
                              src={project.cover_image}
                              alt={project.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                              <NexusLogo className="h-12 w-12 text-primary/40" />
                            </div>
                          )}
                          <div className="absolute left-4 top-4">
                            <Badge variant="outline" className="border-none glass text-foreground">
                              {project.project_type}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted">{project.description}</p>
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(project.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5" />
                              {(project.views_count || 0).toLocaleString()} views
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5" />
                              {(project.likes_count || 0).toLocaleString()} likes
                            </div>
                            {project.branch && (
                              <Badge variant="secondary" size="sm">
                                {project.branch}
                              </Badge>
                            )}
                            {project.owner_id && (() => {
                              const author = authorMap.get(project.owner_id);
                              return author ? (
                                <div className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{author.full_name || 'Unknown'}</span>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Popular Projects */}
          {popularProjects && popularProjects.length > 0 && (
            <section
              className="mb-16"
            >
              <div className="mb-8 flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Popular Projects</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {popularProjects.map((project, index) => (
                  <div
                    key={project.id}
                  >
                    <Link href={`/projects/${project.slug}`} className="group block">
                      <Card variant="glass" className="group h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
                        <div className="relative aspect-video w-full bg-surface">
                          {project.cover_image ? (
                            <Image
                              src={project.cover_image}
                              alt={project.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                              <NexusLogo className="h-12 w-12 text-primary/40" />
                            </div>
                          )}
                          <div className="absolute left-4 top-4">
                            <Badge variant="outline" className="border-none glass text-foreground">
                              {project.project_type}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted">{project.description}</p>
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(project.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5" />
                              {(project.views_count || 0).toLocaleString()} views
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5" />
                              {(project.likes_count || 0).toLocaleString()} likes
                            </div>
                            {project.branch && (
                              <Badge variant="secondary" size="sm">
                                {project.branch}
                              </Badge>
                            )}
                            {project.owner_id && (() => {
                              const author = authorMap.get(project.owner_id);
                              return author ? (
                                <div className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{author.full_name || 'Unknown'}</span>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {allProjects && allProjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <EmptyState
                icon={Search}
                title="No projects found"
                description="Try adjusting your filters or search query to find what you're looking for."
                actionLabel="Clear Filters"
                actionHref="/projects"
                variant="minimal"
              />
            </motion.div>
          )}
        </AnimatedSection>
      </Container>

      <Footer />
    </main>
  );
}
