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
import { supabaseClient } from "@/lib/supabase/client";
import { Github, ExternalLink, Star, TrendingUp, Clock, Search, Heart, Flame, User, Sparkles, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NexusLogo } from "@/components/shared/NexusLogo";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface SearchParams {
  search?: string;
  branch?: string;
  project_type?: string;
  sort?: string;
}

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const branch = searchParams.get('branch') || '';
  const project_type = searchParams.get('project_type') || '';
  const sort = searchParams.get('sort') || 'newest';

  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<any[]>([]);
  const [trendingProjects, setTrendingProjects] = useState<any[]>([]);
  const [latestProjects, setLatestProjects] = useState<any[]>([]);
  const [popularProjects, setPopularProjects] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      
      // Build query with filters
      let query = supabaseClient
        .from('projects')
        .select('*')
        .eq('status', 'published');

      // Apply search filter
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}},tech_stack.cs.{${search}}`);
      }

      // Apply branch filter
      if (branch) {
        query = query.eq('branch', branch);
      }

      // Apply project type filter
      if (project_type) {
        query = query.eq('project_type', project_type);
      }

      // Apply sorting
      let orderBy = 'created_at';
      let ascending = false;
      if (sort === 'views') {
        orderBy = 'views_count';
        ascending = false;
      } else if (sort === 'likes') {
        orderBy = 'likes_count';
        ascending = false;
      } else if (sort === 'oldest') {
        orderBy = 'created_at';
        ascending = true;
      }

      query = query.order(orderBy, { ascending });

      // Fetch all projects with filters applied
      const { data: all } = await query;
      setAllProjects(all || []);

      // Fetch featured projects (unfiltered)
      const { data: featured } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(3);
      setFeaturedProjects(featured || []);

      // Fetch trending projects (by recent engagement)
      const { data: trending } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .order('likes_count', { ascending: false })
        .order('views_count', { ascending: false })
        .limit(6);
      setTrendingProjects(trending || []);

      // Fetch latest projects
      const { data: latest } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6);
      setLatestProjects(latest || []);

      // Fetch popular projects (by views)
      const { data: popular } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .order('views_count', { ascending: false })
        .limit(6);
      setPopularProjects(popular || []);

      // Fetch author profiles for projects
      const authorIds = [...new Set(all?.map((p: any) => p.owner_id).filter(Boolean) || [])];
      const { data: authorData } = authorIds.length > 0
        ? await supabaseClient
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', authorIds)
        : { data: [] };
      setAuthors(authorData || []);

      setLoading(false);
    }

    loadProjects();
  }, [search, branch, project_type, sort]);

  const authorMap = new Map(authors?.map((a: any) => [a.id, a]) || []);

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
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mb-16"
            >
              <div className="mb-8 flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Popular Projects</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {popularProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  >
                    <Link href={`/projects/${project.slug}`} className="group block">
                      <Card variant="glass" className="group h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
                        <div className="relative aspect-video w-full bg-surface">
                          {project.cover_image ? (
                            <Image
                              src={project.cover_image}
                              alt={project.title}
                              fill
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

          {/* All Projects */}
          {allProjects && allProjects.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="mb-8 text-2xl font-bold text-foreground">
                {search || branch || project_type ? "Filtered Results" : "All Projects"}
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 + index * 0.05 }}
                  >
                    <Link href={`/projects/${project.slug}`} className="group block">
                      <Card variant="elevated" className="group h-full overflow-hidden transition-all duration-300 hover:shadow-xl">
                        <div className="relative aspect-video w-full bg-surface">
                          {project.cover_image ? (
                            <Image
                              src={project.cover_image}
                              alt={project.title}
                              fill
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
