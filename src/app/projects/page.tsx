import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Database, GitBranch, Sparkles, TrendingUp } from "lucide-react";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { FeaturedProjects, TrendingProjects, LatestProjects, PopularProjects } from "@/components/projects/ProjectSection";
import { getProjectsWithPagination } from "@/lib/actions/server-actions";
import Link from "next/link";

interface SearchParams {
  search?: string;
  branch?: string;
  project_type?: string;
  sort?: string;
  page?: string;
}

interface ProjectsPageProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  project_type: string;
  branch?: string | null;
  category?: string | null;
  cover_image?: string | null;
  tech_stack?: string[];
  tags?: string[];
  views_count?: number;
  likes_count?: number;
  featured?: boolean;
  created_at: string;
  status?: string;
  owner_id?: string | null;
}


function ProjectsHeroBlock({ totalCount, featuredCount, totalViews }: { totalCount: number; featuredCount: number; totalViews: number }) {
  const engineeringAreas = 15; // This should be calculated from categories

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-background py-20 text-foreground">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(var(--primary-rgb),0.22),transparent_28%),radial-gradient(circle_at_78%_0%,rgba(var(--accent-rgb),0.18),transparent_30%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[auto,auto,48px_48px,48px_48px]" />
        <Container>
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-3xl">
              <Badge variant="premium" className="mb-6 border-border bg-surface px-4 py-1.5 text-sm uppercase tracking-widest text-foreground">
                Engineering Knowledge Base
              </Badge>
              <h1 className="text-hero font-heading bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                Discover Real Projects, Research, and Engineering Systems
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
                Search production-grade software, AI, IoT, robotics, and cybersecurity work with clean metadata, visible quality signals, and fast pagination.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {["AI", "Computer Vision", "IoT", "Cybersecurity", "Robotics", "Web"].map((item) => (
                  <span key={item} className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xl backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Platform Index</p>
                  <h2 className="text-xl font-heading font-semibold text-foreground">Live Discovery Snapshot</h2>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">Healthy</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <HeroMetric icon={<Database className="h-5 w-5" />} label="Published" value={totalCount.toLocaleString()} />
                <HeroMetric icon={<Sparkles className="h-5 w-5" />} label="Featured" value={featuredCount.toLocaleString()} />
                <HeroMetric icon={<TrendingUp className="h-5 w-5" />} label="Views" value={totalViews.toLocaleString()} />
                <HeroMetric icon={<GitBranch className="h-5 w-5" />} label="Domains" value={engineeringAreas.toLocaleString()} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-sm font-heading font-medium text-muted">Published Projects</p>
            <p className="mt-2 text-3xl font-heading font-bold text-foreground">{totalCount.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-sm font-heading font-medium text-muted">Featured Builds</p>
            <p className="mt-2 text-3xl font-heading font-bold text-foreground">{featuredCount.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-sm font-heading font-medium text-muted">Total Views</p>
            <p className="mt-2 text-3xl font-heading font-bold text-foreground">{totalViews.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-sm font-heading font-medium text-muted">Engineering Areas</p>
            <p className="mt-2 text-3xl font-heading font-bold text-foreground">{engineeringAreas.toLocaleString()}</p>
          </div>
        </div>
      </Container>
    </>
  );
}

function HeroMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <div className="mb-3 inline-flex rounded-lg bg-primary/15 p-2 text-primary">{icon}</div>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-heading font-bold text-foreground">{value}</p>
    </div>
  );
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const searchQuery = params.search || '';
  const branch = params.branch || '';
  const project_type = params.project_type || '';
  const sort = params.sort || '';
  const page = parseInt(params.page || '1', 10);

  // Load projects from database via server actions with pagination
  const projectsResult = await getProjectsWithPagination({
    page,
    limit: 24,
    search: searchQuery || undefined,
    branch: branch || undefined,
    project_type: project_type || undefined,
    sort: sort || undefined,
  });
  const allProjects: ProjectsPageProject[] = projectsResult.data;
  const { meta } = projectsResult;
  const featuredProjects = allProjects.filter(p => p.featured).slice(0, 12);
  const trendingProjects = [...allProjects].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 12);
  const latestProjects = [...allProjects].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 12);
  const popularProjects = [...allProjects].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 12);
  const totalViews = allProjects.reduce((sum, project) => sum + (project.views_count || 0), 0);
  const featuredCount = featuredProjects.length;
  const authors: any[] = [];
  const loading = false;

  const authorMap = new Map(authors?.map((a: any) => [a.id, a]) || []);

  if (loading) {
    return (
      <main className="bg-background text-foreground">
        <section className="border-b border-border bg-surface py-20">
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
      <ProjectsHeroBlock 
        totalCount={meta.totalCount}
        featuredCount={featuredCount}
        totalViews={totalViews}
      />

      <Container className="py-20">
        <AnimatedSection>
          <ProjectFilters
            searchQuery={searchQuery}
            branch={branch}
            projectType={project_type}
            sort={sort}
          />
          <FeaturedProjects projects={featuredProjects} authorMap={authorMap} />
          <TrendingProjects projects={trendingProjects} authorMap={authorMap} />
          <LatestProjects projects={latestProjects} authorMap={authorMap} />
          <PopularProjects projects={popularProjects} authorMap={authorMap} />

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-8">
              {page > 1 ? (
                <Link href={`/projects?page=${page - 1}${searchQuery ? `&search=${searchQuery}` : ''}${branch ? `&branch=${branch}` : ''}${project_type ? `&project_type=${project_type}` : ''}${sort ? `&sort=${sort}` : ''}`}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              )}

              <span className="text-sm font-heading text-muted">
                Page {page} of {meta.totalPages}
              </span>

              {meta.hasMore ? (
                <Link href={`/projects?page=${page + 1}${searchQuery ? `&search=${searchQuery}` : ''}${branch ? `&branch=${branch}` : ''}${project_type ? `&project_type=${project_type}` : ''}${sort ? `&sort=${sort}` : ''}`}>
                  <Button variant="outline" size="sm">
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {allProjects && allProjects.length === 0 && (
            <EmptyState
              icon={Search}
              title="No projects found"
              description="Try adjusting your filters or search query to find what you're looking for."
              actionLabel="Clear Filters"
              actionHref="/projects"
              variant="minimal"
            />
          )}
        </AnimatedSection>
      </Container>

      <Footer />
    </main>
  );
}
