import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjectBySlug } from "@/lib/actions/server-actions";
import { Github, ExternalLink, Calendar, Tag, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NexusLogo } from "@/components/shared/NexusLogo";
import { Project } from "@/types/content";
import { createArticleMetadata } from "@/lib/seo";

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug) as Project | null;
  if (!project) return { title: "Project Not Found" };

  return createArticleMetadata({
    title: `${project.title} | Arpit Labs`,
    description: project.description,
    path: `/projects/${slug}`,
    keywords: [project.category, ...project.tags],
  });
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug) as Project | null;

  if (!project) {
    notFound();
  }

  const detailSections = [
    {
      title: "Overview",
      content: project.overview || project.content || project.description,
    },
    {
      title: "Problem Statement",
      content:
        project.problem_statement ||
        "This project addresses an engineering gap by turning a complex requirement into a more reliable, understandable, and maintainable system.",
    },
    {
      title: "Architecture",
      content:
        project.architecture ||
        "The architecture combines modular frontend presentation, typed data access, and reusable platform primitives so the system can evolve without excessive rewrites.",
    },
  ];

  return (
    <main className="bg-background text-foreground">

      <section className="border-b border-border/70 bg-background/75 py-12 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <Link 
            href="/projects" 
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition mb-8"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </Link>

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="px-4 py-1 text-primary">
                {project.category}
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {project.title}
              </h1>
              <p className="text-xl leading-relaxed text-muted">
                {project.description}
              </p>
              
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Calendar size={18} className="text-primary" />
                  {new Date(project.created_at).toLocaleDateString("en-US", { 
                    month: "long", year: "numeric" 
                  })}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Tag size={18} className="text-secondary" />
                  <div className="flex gap-2">
                    {project.tags.map((tag: string) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                {project.github_url && (
                  <a 
                    href={project.github_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground text-background px-6 py-3 text-sm font-semibold transition hover:opacity-90"
                  >
                    <Github size={18} />
                    View Source
                  </a>
                )}
                {project.demo_url && (
                  <a 
                    href={project.demo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-surface px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <ExternalLink size={18} />
                    Live Demo
                  </a>
                )}
              </div>
            </div>

            <div className="relative aspect-video overflow-hidden rounded-[2.5rem] border border-border/70 bg-surface/50 dark:border-slate-800 dark:bg-slate-900/50 shadow-2xl">
              {project.cover_image ? (
                <Image
                  src={project.cover_image}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted/10">
                  <NexusLogo className="h-[120px] w-[120px]" />
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <AnimatedSection>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-8">
              {detailSections.map((section) => (
                <Card key={section.title} className="p-8">
                  <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                  <div className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-muted">
                    {section.content}
                  </div>
                </Card>
              ))}

              <Card className="p-8">
                <h2 className="text-2xl font-bold text-foreground">Lessons Learned</h2>
                {project.lessons_learned && project.lessons_learned.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {project.lessons_learned.map((lesson) => (
                      <li key={lesson} className="flex gap-3 text-lg text-muted">
                        <span className="mt-2 h-2 w-2 rounded-full bg-primary/60" />
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-lg leading-relaxed text-muted">
                    The core lesson from this build is the value of iterating on architecture early, documenting tradeoffs clearly, and keeping the implementation modular enough to support future experiments.
                  </p>
                )}
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-foreground">Tech Stack</h2>
                <div className="mt-6 flex flex-wrap gap-2">
                  {(project.tech_stack && project.tech_stack.length > 0 ? project.tech_stack : project.tags).map((item) => (
                    <Badge key={item} variant="outline" className="px-3 py-1">
                      {item}
                    </Badge>
                  ))}
                </div>
              </Card>

              <Card className="p-8">
                <h2 className="text-2xl font-bold text-foreground">Screenshots</h2>
                {project.screenshots && project.screenshots.length > 0 ? (
                  <div className="mt-6 grid gap-4">
                    {project.screenshots.map((image, index) => (
                      <div key={image} className="relative overflow-hidden rounded-[1.5rem] border border-border/70 dark:border-slate-800 aspect-[16/9]">
                        <Image
                          src={image}
                          alt={`${project.title} screenshot ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-muted">
                    Visual documentation will appear here as more screenshots are published for this project.
                  </p>
                )}
              </Card>

              <Card className="p-8">
                <h2 className="text-2xl font-bold text-foreground">GitHub Links</h2>
                <div className="mt-6 space-y-4">
                  {project.github_url ? (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface px-4 py-4 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <span>Repository</span>
                      <Github size={18} />
                    </a>
                  ) : (
                    <p className="text-muted">Source repository has not been linked yet.</p>
                  )}

                  {project.demo_url ? (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface px-4 py-4 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <span>Live Demo</span>
                      <ExternalLink size={18} />
                    </a>
                  ) : null}
                </div>
              </Card>
            </div>
          </div>
        </AnimatedSection>
      </Container>

      <Container className="pb-20">
        <AnimatedSection>
          <div className="rounded-[2.5rem] border border-border/70 bg-card/90 p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <h2 className="text-2xl font-bold text-foreground">Want to discuss this build?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              I’m always happy to talk through system design decisions, architecture tradeoffs, and engineering lessons from projects like this one.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                Start a Conversation
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-surface px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
              >
                Browse More Projects
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </Container>

      <Footer />
    </main>
  );
}
