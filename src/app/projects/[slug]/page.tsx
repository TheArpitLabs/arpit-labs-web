import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabaseServer } from "@/lib/supabase/server";
import { Github, ExternalLink, Calendar, Tag, ArrowLeft, Eye, Heart, Users, Clock, CheckCircle2, Star, Shield, BookOpen, GitBranch, Award, Code2, Lightbulb, Zap, Globe, Lock, FolderOpen, Image as ImageIcon } from "lucide-react";
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
  const { data: project } = await supabaseServer
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  
  if (!project) return { title: "Project Not Found" };

  return createArticleMetadata({
    title: `${project.title} | Arpit Labs`,
    description: project.description,
    path: `/projects/${slug}`,
    keywords: [project.category || '', ...(project.tags || [])],
  });
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const { data: project } = await supabaseServer
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!project) {
    notFound();
  }

  // Fetch related projects based on category or tags
  const { data: relatedProjects } = await supabaseServer
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .neq('id', project.id)
    .or(`category.eq.${project.category},tags.cs.{${project.tags?.join(',')}}`)
    .limit(4);

  const isOpensourceShowcase = project.project_type === 'opensource_showcase';
  
  const detailSections = [
    {
      title: "Overview",
      content: project.overview || project.content || project.description,
      icon: BookOpen,
    },
    {
      title: "Problem Statement",
      content:
        project.problem_statement ||
        "This project addresses an engineering gap by turning a complex requirement into a more reliable, understandable, and maintainable system.",
      icon: Lightbulb,
    },
    {
      title: "Architecture",
      content:
        project.architecture ||
        "The architecture combines modular frontend presentation, typed data access, and reusable platform primitives so the system can evolve without excessive rewrites.",
      icon: Code2,
    },
    ...(project.features ? [{
      title: "Features",
      content: project.features,
      icon: Zap,
    }] : []),
    ...(project.industry_applications ? [{
      title: "Industry Applications",
      content: project.industry_applications,
      icon: Globe,
    }] : []),
    ...(project.challenges_solved ? [{
      title: "Challenges Solved",
      content: project.challenges_solved,
      icon: Award,
    }] : []),
    ...(project.future_possibilities ? [{
      title: "Future Possibilities",
      content: project.future_possibilities,
      icon: GitBranch,
    }] : []),
    {
      title: "Results",
      content:
        project.results ||
        "The project successfully achieved its core objectives with measurable improvements in performance, user experience, and system reliability. Key metrics include optimized response times, enhanced error handling, and scalable architecture that supports future growth.",
      icon: CheckCircle2,
    },
  ];

  return (
    <main className="bg-background text-foreground">

      <section className="border-b border-border/70 glass py-12">
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
              <h1 className="text-hero text-gradient">
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
                {isOpensourceShowcase && project.github_stars && (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Star size={18} className="text-yellow-500" />
                    {project.github_stars.toLocaleString()} stars
                  </div>
                )}
                {isOpensourceShowcase && project.verified_repository && (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Shield size={18} className="text-green-500" />
                    Verified Repository
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Eye size={18} className="text-secondary" />
                  {project.views_count || 0} views
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Heart size={18} className="text-red-500" />
                  {project.likes_count || 0} likes
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Tag size={18} className="text-secondary" />
                  <div className="flex gap-2">
                    {project.tags?.map((tag: string) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                {project.repository_url && (
                  <a 
                    href={project.repository_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="premium-button inline-flex items-center justify-center gap-2"
                  >
                    <Github size={18} />
                    {isOpensourceShowcase ? 'View Repository' : 'View Source'}
                  </a>
                )}
                {project.github_url && !project.repository_url && (
                  <a 
                    href={project.github_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="premium-button inline-flex items-center justify-center gap-2"
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
                    className="premium-button-secondary inline-flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={18} />
                    Live Demo
                  </a>
                )}
              </div>
            </div>

            <div className="relative aspect-video overflow-hidden rounded-[2.5rem] border border-border/70 glass shadow-2xl">
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
                  <div className="flex items-center gap-3">
                    {section.icon && <section.icon size={24} className="text-primary" />}
                    <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                  </div>
                  <div className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-muted">
                    {section.content}
                  </div>
                </Card>
              ))}

              {project.learning_outcomes && (
                <Card className="p-8">
                  <div className="flex items-center gap-3">
                    <BookOpen size={24} className="text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Learning Outcomes</h2>
                  </div>
                  <div className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-muted">
                    {project.learning_outcomes}
                  </div>
                </Card>
              )}

              <Card className="p-8">
                <div className="flex items-center gap-3">
                  <Lightbulb size={24} className="text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Lessons Learned</h2>
                </div>
                {project.lessons_learned && project.lessons_learned.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {project.lessons_learned?.map((lesson: string) => (
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
              {isOpensourceShowcase && project.license && (
                <Card className="p-8">
                  <div className="flex items-center gap-3">
                    <Shield size={24} className="text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">License</h2>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-border/70 p-4">
                      <span className="font-semibold text-foreground">License Type</span>
                      <Badge variant="outline" className="px-3 py-1">{project.license}</Badge>
                    </div>
                    {project.verification_date && (
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <span>Verified on {new Date(project.verification_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {isOpensourceShowcase && project.original_author && (
                <Card className="p-8">
                  <div className="flex items-center gap-3">
                    <Users size={24} className="text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Original Author</h2>
                  </div>
                  <div className="mt-6 flex items-center gap-3 rounded-xl border border-border/70 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold text-lg">
                      {project.original_author.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{project.original_author}</p>
                      <p className="text-sm text-muted">Original Maintainer</p>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="p-8">
                <div className="flex items-center gap-3">
                  <Code2 size={24} className="text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Tech Stack</h2>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {(project.tech_stack && project.tech_stack.length > 0 ? project.tech_stack : project.tags)?.map((item: string) => (
                    <Badge key={item} variant="outline" className="px-3 py-1">
                      {item}
                    </Badge>
                  ))}
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-center gap-3">
                  <ImageIcon size={24} className="text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Screenshots</h2>
                </div>
                {project.screenshots && project.screenshots.length > 0 ? (
                  <div className="mt-6 grid gap-4">
                    {project.screenshots?.map((image: string, index: number) => (
                      <div key={image} className="relative overflow-hidden rounded-[1.5rem] border border-border/70 glass aspect-[16/9]">
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
                <div className="flex items-center gap-3">
                  <Clock size={24} className="text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Project Timeline</h2>
                </div>
                {project.timeline && project.timeline.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    {project.timeline?.map((milestone: any, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-3 w-3 rounded-full bg-primary" />
                          {index < (project.timeline?.length || 0) - 1 && (
                            <div className="w-0.5 flex-1 bg-border/50" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <Calendar size={14} />
                            <span>{milestone.date || new Date(project.created_at).toLocaleDateString()}</span>
                          </div>
                          <h4 className="mt-2 font-semibold text-foreground">{milestone.title}</h4>
                          <p className="mt-1 text-sm text-muted">{milestone.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                        <div className="w-0.5 flex-1 bg-border/50" />
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <Calendar size={14} />
                          <span>{new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className="mt-2 font-semibold text-foreground">Project Inception</h4>
                        <p className="mt-1 text-sm text-muted">Initial concept and requirements gathering</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                        <div className="w-0.5 flex-1 bg-border/50" />
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <CheckCircle2 size={14} className="text-success" />
                          <span>Development Phase</span>
                        </div>
                        <h4 className="mt-2 font-semibold text-foreground">Core Implementation</h4>
                        <p className="mt-1 text-sm text-muted">Building the main features and functionality</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-secondary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <CheckCircle2 size={14} className="text-success" />
                          <span>Launch</span>
                        </div>
                        <h4 className="mt-2 font-semibold text-foreground">Project Completion</h4>
                        <p className="mt-1 text-sm text-muted">Final testing, documentation, and release</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-8">
                <div className="flex items-center gap-3">
                  <Users size={24} className="text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Contributors</h2>
                </div>
                {project.contributors && project.contributors.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {project.contributors?.map((contributor: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 rounded-xl border border-border/70 p-3 transition hover:border-primary hover:bg-primary/5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold">
                          {contributor.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{contributor.name}</p>
                          <p className="text-xs text-muted">{contributor.role || 'Contributor'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 flex items-center gap-3 rounded-xl border border-border/70 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold">
                      {isOpensourceShowcase && project.original_author ? project.original_author.charAt(0) : 'A'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{isOpensourceShowcase && project.original_author ? project.original_author : 'Arpit Labs'}</p>
                      <p className="text-xs text-muted">{isOpensourceShowcase ? 'Original Maintainer' : 'Lead Developer'}</p>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-8">
                <div className="flex items-center gap-3">
                  <Github size={24} className="text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Repository Links</h2>
                </div>
                <div className="mt-6 space-y-4">
                  {project.repository_url ? (
                    <a
                      href={project.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-border/70 glass px-4 py-4 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5"
                    >
                      <span>Repository</span>
                      <Github size={18} />
                    </a>
                  ) : project.github_url ? (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-border/70 glass px-4 py-4 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5"
                    >
                      <span>Repository</span>
                      <Github size={18} />
                    </a>
                  ) : (
                    <p className="text-muted">Source repository has not been linked yet.</p>
                  )}

                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-border/70 glass px-4 py-4 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5"
                    >
                      <span>Live Demo</span>
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              </Card>

              {isOpensourceShowcase && (
                <Card className="p-8">
                  <div className="flex items-center gap-3">
                    <GitBranch size={24} className="text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Project Type</h2>
                  </div>
                  <div className="mt-6">
                    <Badge variant="outline" className="px-4 py-2 text-base">
                      Open Source Showcase
                    </Badge>
                    <p className="mt-3 text-sm text-muted">
                      This is a verified open-source project showcased for educational purposes. All credit goes to the original maintainers.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </AnimatedSection>
      </Container>

      <Container className="pb-20">
        <AnimatedSection>
          {relatedProjects && relatedProjects.length > 0 && (
            <div className="mb-20">
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-foreground">Related Projects</h2>
                <p className="mt-2 text-muted">Explore similar projects in the same domain</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProjects.map((relatedProject) => (
                  <Link key={relatedProject.id} href={`/projects/${relatedProject.slug}`}>
                    <Card className="group h-full overflow-hidden transition-all hover:shadow-2xl">
                      <div className="relative aspect-video overflow-hidden">
                        {relatedProject.cover_image ? (
                          <Image
                            src={relatedProject.cover_image}
                            alt={relatedProject.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted/10">
                            <NexusLogo className="h-[60px] w-[60px]" />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {relatedProject.title}
                        </h3>
                        <p className="mb-4 text-sm text-muted line-clamp-2">
                          {relatedProject.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {relatedProject.category}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <Eye size={12} />
                            {relatedProject.views_count || 0}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </AnimatedSection>
      </Container>

      <Container className="pb-20">
        <AnimatedSection>
          <div className="rounded-[2.5rem] glass p-10 text-center">
            <h2 className="text-2xl font-bold text-foreground">Want to discuss this build?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              I&apos;m always happy to talk through system design decisions, architecture tradeoffs, and engineering lessons from projects like this one.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="premium-button inline-flex items-center justify-center"
              >
                Start a Conversation
              </Link>
              <Link
                href="/projects"
                className="premium-button-secondary inline-flex items-center justify-center"
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
