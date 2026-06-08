import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabaseServer } from "@/lib/supabase/server";
import { Github, ExternalLink, Star, TrendingUp, Clock, Search, Heart, Flame, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NexusLogo } from "@/components/shared/NexusLogo";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Projects",
  description: "Explore the engineering projects and systems built at Arpit Labs, ranging from IoT devices to AI-powered applications.",
  path: "/projects",
  keywords: ["Projects", "Engineering Showcase", "IoT", "AI", "Software", "Hardware"],
});

interface SearchParams {
  search?: string;
  branch?: string;
  project_type?: string;
  sort?: string;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { search, branch, project_type, sort } = params;

  // Build query with filters
  let query = supabaseServer
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
  const { data: allProjects } = await query;

  // Fetch featured projects (unfiltered)
  const { data: featuredProjects } = await supabaseServer
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(3);

  // Fetch trending projects (by recent engagement)
  const { data: trendingProjects } = await supabaseServer
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .order('likes_count', { ascending: false })
    .order('views_count', { ascending: false })
    .limit(6);

  // Fetch latest projects
  const { data: latestProjects } = await supabaseServer
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6);

  // Fetch popular projects (by views)
  const { data: popularProjects } = await supabaseServer
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .order('views_count', { ascending: false })
    .limit(6);

  // Fetch author profiles for projects
  const authorIds = [...new Set(allProjects?.map(p => p.owner_id).filter(Boolean) || [])];
  const { data: authors } = authorIds.length > 0
    ? await supabaseServer
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', authorIds)
    : { data: [] };

  const authorMap = new Map(authors?.map(a => [a.id, a]) || []);

  return (
    <main className="bg-background text-foreground">

      <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest text-primary">
              Portfolio
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Engineering <span className="text-primary">Showcase</span>
            </h1>
            <p className="mt-6 text-lg text-muted">
              A collection of systems, tools, and platforms built with a focus on performance, scalability, and clean engineering.
            </p>
          </div>
        </Container>
      </section>

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
                  className="pl-12 h-12 text-lg"
                  name="search"
                  defaultValue={search}
                />
              </div>

              <div className="flex flex-wrap gap-4">
                {/* Branch Filter */}
                <select
                  name="branch"
                  defaultValue={branch || ''}
                  className="rounded-lg border border-border/70 bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="rounded-lg border border-border/70 bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="rounded-lg border border-border/70 bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="views">Most Viewed</option>
                  <option value="likes">Most Liked</option>
                </select>

                <Button type="submit" className="ml-auto">
                  Apply Filters
                </Button>
              </div>
            </form>
          </section>
          {/* Featured Projects */}
          {featuredProjects && featuredProjects.length > 0 && (
            <section className="mb-16">
              <div className="mb-8 flex items-center gap-3">
                <Star className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Featured Projects</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.slug}`}>
                    <Card className="group h-full overflow-hidden transition hover:border-primary">
                      <div className="relative aspect-video w-full bg-muted/20">
                        {project.cover_image ? (
                          <Image
                            src={project.cover_image}
                            alt={project.title}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted/20">
                            <NexusLogo className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute left-4 top-4">
                          <Badge className="border-none bg-background/80 text-foreground backdrop-blur-md">
                            {project.project_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-foreground group-hover:text-primary">{project.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-muted">{project.description}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {project.views_count || 0} views
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {project.likes_count || 0} likes
                          </div>
                          {project.branch && (
                            <Badge variant="outline" className="text-xs">
                              {project.branch}
                            </Badge>
                          )}
                          {project.owner_id && (() => {
                            const author = authorMap.get(project.owner_id);
                            return author ? (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{author.full_name || 'Unknown'}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Trending Projects */}
          {trendingProjects && trendingProjects.length > 0 && (
            <section className="mb-16">
              <div className="mb-8 flex items-center gap-3">
                <Flame className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Trending Projects</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {trendingProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.slug}`}>
                    <Card className="group h-full overflow-hidden transition hover:border-primary">
                      <div className="relative aspect-video w-full bg-muted/20">
                        {project.cover_image ? (
                          <Image
                            src={project.cover_image}
                            alt={project.title}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted/20">
                            <NexusLogo className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute left-4 top-4">
                          <Badge variant="outline" className="border-none bg-background/80 text-foreground backdrop-blur-md">
                            {project.project_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-foreground group-hover:text-primary">{project.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-muted">{project.description}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {project.views_count || 0} views
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {project.likes_count || 0} likes
                          </div>
                          {project.branch && (
                            <Badge variant="outline" className="text-xs">
                              {project.branch}
                            </Badge>
                          )}
                          {project.owner_id && (() => {
                            const author = authorMap.get(project.owner_id);
                            return author ? (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{author.full_name || 'Unknown'}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Latest Projects */}
          {latestProjects && latestProjects.length > 0 && (
            <section className="mb-16">
              <div className="mb-8 flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Latest Projects</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.slug}`}>
                    <Card className="group h-full overflow-hidden transition hover:border-primary">
                      <div className="relative aspect-video w-full bg-muted/20">
                        {project.cover_image ? (
                          <Image
                            src={project.cover_image}
                            alt={project.title}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted/20">
                            <NexusLogo className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute left-4 top-4">
                          <Badge variant="outline" className="border-none bg-background/80 text-foreground backdrop-blur-md">
                            {project.project_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-foreground group-hover:text-primary">{project.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-muted">{project.description}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {project.views_count || 0} views
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {project.likes_count || 0} likes
                          </div>
                          {project.branch && (
                            <Badge variant="outline" className="text-xs">
                              {project.branch}
                            </Badge>
                          )}
                          {project.owner_id && (() => {
                            const author = authorMap.get(project.owner_id);
                            return author ? (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{author.full_name || 'Unknown'}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Popular Projects */}
          {popularProjects && popularProjects.length > 0 && (
            <section>
              <div className="mb-8 flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Popular Projects</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {popularProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.slug}`}>
                    <Card className="group h-full overflow-hidden transition hover:border-primary">
                      <div className="relative aspect-video w-full bg-muted/20">
                        {project.cover_image ? (
                          <Image
                            src={project.cover_image}
                            alt={project.title}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted/20">
                            <NexusLogo className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute left-4 top-4">
                          <Badge variant="outline" className="border-none bg-background/80 text-foreground backdrop-blur-md">
                            {project.project_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-foreground group-hover:text-primary">{project.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-muted">{project.description}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {project.views_count || 0} views
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {project.likes_count || 0} likes
                          </div>
                          {project.branch && (
                            <Badge variant="outline" className="text-xs">
                              {project.branch}
                            </Badge>
                          )}
                          {project.owner_id && (() => {
                            const author = authorMap.get(project.owner_id);
                            return author ? (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{author.full_name || 'Unknown'}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </AnimatedSection>
      </Container>

      <Footer />
    </main>
  );
}
