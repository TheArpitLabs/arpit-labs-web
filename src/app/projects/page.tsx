import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabaseServer } from "@/lib/supabase/server";
import { Github, ExternalLink, Star, TrendingUp, Clock } from "lucide-react";
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

export default async function ProjectsPage() {
  // Fetch featured projects
  const { data: featuredProjects } = await supabaseServer
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(3);

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
                        <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {project.views_count || 0} views
                          </div>
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
                        <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {project.views_count || 0} views
                          </div>
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
                        <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {project.views_count || 0} views
                          </div>
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
