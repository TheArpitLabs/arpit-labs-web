import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import dynamic from "next/dynamic";
import { NexusLogo } from "@/components/shared/NexusLogo";
import { Timeline } from "@/components/shared/Timeline";
import { Card, BentoCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Cpu, Code2, Wifi, Eye, Heart, FolderOpen, Users, FlaskConical, Microscope, Lightbulb, Globe, ShoppingBag, ArrowRight } from "lucide-react";
import { getExperiments, getLabNotes, getJourneyTimeline, getProjects } from "@/lib/actions/server-actions";
import { HeroCards } from "@/components/shared/HeroCards";
import Image from "next/image";
import Link from "next/link";

const TechnologyEcosystem = dynamic(() => import("@/components/shared/TechnologyEcosystem").then(mod => ({ default: mod.TechnologyEcosystem })), {
  loading: () => <div className="h-[520px] w-full max-w-xl animate-pulse rounded-[2rem] bg-surface/80" />,
  ssr: true
});

const FloatingDecorations = dynamic(() => import("@/components/animations/FloatingDecorations").then(mod => ({ default: mod.FloatingDecorations })), {
  ssr: true
});

export default async function HomePage() {
  const [experiments, notes, journey, projects] = await Promise.all([
    getExperiments(),
    getLabNotes(),
    getJourneyTimeline(),
    getProjects()
  ]);

  return (
    <main className="bg-background text-foreground">

      <section id="home" className="relative border-b border-border/70 bg-gradient-to-b from-background to-background/95 py-24 dark:border-slate-800">
        <FloatingDecorations />
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-border/80 bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-2 text-sm dark:border-slate-700">
                <span className="text-primary font-semibold">Engineering Lab</span>
                <span className="text-muted">Build, Learn & Grow with Real-World Projects</span>
                <span className="text-secondary">✧</span>
              </div>
              <div className="space-y-6">
                <h1 className="max-w-3xl text-hero leading-tight tracking-[-0.02em] text-foreground">
                  Build Your Engineering Career with Real-World Projects
                </h1>
                <p className="max-w-2xl text-body text-muted">
                  Master AI, IoT, software, and hardware through industry-grade projects with complete documentation, AI explanations, and a thriving engineering ecosystem.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href="#featured-projects"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-8 py-4 text-sm font-bold text-white transition hover:opacity-90 shadow-lg shadow-primary/30"
                >
                  Browse Projects
                </a>
                <a
                  href="#about"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-border/70 bg-surface px-8 py-4 text-sm font-bold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
                >
                  Learn More
                </a>
              </div>

              <HeroCards />
            </div>

            <TechnologyEcosystem />
          </div>
        </Container>
      </section>

      <Container>
        <AnimatedSection>
          <section id="featured-projects" className="py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-muted">Project Marketplace</p>
                <h2 className="text-section-title">Top Projects Right Now</h2>
              </div>
              <p className="max-w-xl text-body text-muted">
                Not just another marketplace. A complete learning ecosystem with AI-powered tools that help you truly understand every line of code.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {['AI & ML', 'IoT', 'Software', 'Hardware', 'Research', 'All Projects'].map((category) => (
                <button
                  key={category}
                  className="rounded-full border border-border/70 bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden border-border/70 transition hover:border-primary dark:border-slate-800">
                    <div className="relative aspect-video overflow-hidden bg-surface">
                      {project.cover_image ? (
                        <Image
                          src={project.cover_image}
                          alt={project.title}
                          fill
                          className="object-cover transition group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                          <NexusLogo className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {project.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition">
                        {project.title}
                      </h3>
                      <p className="mb-4 line-clamp-2 text-body text-muted">
                        {project.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted">
                        <div className="flex items-center gap-1.5">
                          <Eye size={14} />
                          <span>{project.views_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Heart size={14} />
                          <span>{project.likes_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {projects.length === 0 && (
              <div className="py-12 text-center text-muted">
                No projects published yet. Check back soon!
              </div>
            )}
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section id="social-proof" className="py-20">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.28em] text-muted">Impact</p>
              <h2 className="text-section-title">Building systems that matter.</h2>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/70 bg-surface/90 p-6 text-center dark:border-slate-800 dark:bg-slate-950/90">
                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                  <FolderOpen size={24} />
                </div>
                <div className="text-3xl font-bold text-foreground">{projects.length}</div>
                <div className="mt-2 text-sm text-muted">Projects Published</div>
              </Card>

              <Card className="border-border/70 bg-surface/90 p-6 text-center dark:border-slate-800 dark:bg-slate-950/90">
                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                  <FlaskConical size={24} />
                </div>
                <div className="text-3xl font-bold text-foreground">{experiments.length}</div>
                <div className="mt-2 text-sm text-muted">Research Initiatives</div>
              </Card>

              <Card className="border-border/70 bg-surface/90 p-6 text-center dark:border-slate-800 dark:bg-slate-950/90">
                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                  <Eye size={24} />
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {projects.reduce((sum, p) => sum + (p.views_count || 0), 0).toLocaleString()}
                </div>
                <div className="mt-2 text-sm text-muted">Total Views</div>
              </Card>

              <Card className="border-border/70 bg-surface/90 p-6 text-center dark:border-slate-800 dark:bg-slate-950/90">
                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                  <Users size={24} />
                </div>
                <div className="text-3xl font-bold text-foreground">1,200+</div>
                <div className="mt-2 text-sm text-muted">Community Members</div>
              </Card>
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section id="pricing" className="py-20">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.28em] text-muted">Transparent Pricing</p>
              <h2 className="text-section-title">Simple, fair pricing for everyone.</h2>
              <p className="max-w-3xl text-body text-muted">
                No hidden fees. No surprises. Access premium engineering resources with clear, upfront pricing.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <Card className="border-border/70 bg-surface/90 p-8 dark:border-slate-800 dark:bg-slate-950/90">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">For Learners</h3>
                  <p className="text-body text-muted">Everything you need to learn & build</p>
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm text-foreground">Complete source code + documentation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm text-foreground">AI-powered code explanations</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm text-foreground">Lifetime project updates</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm text-foreground">Community support included</span>
                    </div>
                  </div>
                  <a
                    href="/projects"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl border-2 border-border/70 bg-surface px-6 py-3 text-sm font-bold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
                  >
                    Start Learning
                  </a>
                </div>
              </Card>

              <Card className="relative border-2 border-primary/50 bg-gradient-to-b from-primary/5 to-transparent p-8 shadow-lg shadow-primary/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-1 text-xs font-bold text-white">
                  Most Popular
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">For Contributors</h3>
                  <p className="text-body text-muted">Earn while you learn & build</p>
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm text-foreground">Highest contributor commission</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm text-foreground">AI auto-documentation tools</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm text-foreground">Premium verified badge</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm text-foreground">Weekly payout guarantees</span>
                    </div>
                  </div>
                  <a
                    href="/register"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 shadow-lg"
                  >
                    Start Contributing
                  </a>
                </div>
              </Card>

              <Card className="border-border/70 bg-surface/90 p-8 dark:border-slate-800 dark:bg-slate-950/90">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">For Organizations</h3>
                  <p className="text-body text-muted">Enterprise solutions for teams</p>
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm text-foreground">Custom project development</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm text-foreground">Team collaboration tools</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm text-foreground">Priority support & SLA</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm text-foreground">White-label solutions</span>
                    </div>
                  </div>
                  <a
                    href="/contact"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl border-2 border-border/70 bg-surface px-6 py-3 text-sm font-bold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
                  >
                    Contact Sales
                  </a>
                </div>
              </Card>
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section id="platform" className="py-20">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.28em] text-muted">Platform</p>
              <h2 className="text-section-title">Explore the ecosystem.</h2>
              <p className="max-w-3xl text-body text-muted">
                From research to marketplace, discover the full suite of tools and communities driving innovation at Arpit Labs.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/research" className="group">
                <Card className="border-border/70 bg-surface/90 p-6 transition hover:border-primary dark:border-slate-800 dark:bg-slate-950/90">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Microscope size={24} />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition">Research</h3>
                  <p className="mb-4 text-body text-muted">
                    Explore cutting-edge research papers, datasets, and publications across AI, IoT, and cybersecurity.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Explore Research <ArrowRight size={16} />
                  </div>
                </Card>
              </Link>

              <Link href="/innovation" className="group">
                <Card className="border-border/70 bg-surface/90 p-6 transition hover:border-primary dark:border-slate-800 dark:bg-slate-950/90">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Lightbulb size={24} />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition">Innovation</h3>
                  <p className="mb-4 text-body text-muted">
                    Discover startups, venture initiatives, and innovation projects transforming ideas into reality.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    View Innovation <ArrowRight size={16} />
                  </div>
                </Card>
              </Link>

              <Link href="/community/global" className="group">
                <Card className="border-border/70 bg-surface/90 p-6 transition hover:border-primary dark:border-slate-800 dark:bg-slate-950/90">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Globe size={24} />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition">Community</h3>
                  <p className="mb-4 text-body text-muted">
                    Join a global network of engineers, researchers, and innovators collaborating on the future.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Join Community <ArrowRight size={16} />
                  </div>
                </Card>
              </Link>

              <Link href="/ai" className="group">
                <Card className="border-border/70 bg-surface/90 p-6 transition hover:border-primary dark:border-slate-800 dark:bg-slate-950/90">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Brain size={24} />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition">AI & Automation</h3>
                  <p className="mb-4 text-body text-muted">
                    Leverage AI-powered tools, automation workflows, and intelligent systems for your projects.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Explore AI <ArrowRight size={16} />
                  </div>
                </Card>
              </Link>

              <Link href="/marketplace" className="group">
                <Card className="border-border/70 bg-surface/90 p-6 transition hover:border-primary dark:border-slate-800 dark:bg-slate-950/90">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShoppingBag size={24} />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition">Marketplace</h3>
                  <p className="mb-4 text-body text-muted">
                    Browse and discover products, tools, and resources built by the community.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Visit Marketplace <ArrowRight size={16} />
                  </div>
                </Card>
              </Link>

              <Link href="/projects" className="group">
                <Card className="border-border/70 bg-surface/90 p-6 transition hover:border-primary dark:border-slate-800 dark:bg-slate-950/90">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FolderOpen size={24} />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition">Projects</h3>
                  <p className="mb-4 text-body text-muted">
                    Explore a comprehensive collection of open-source projects across all technology domains.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    Browse Projects <ArrowRight size={16} />
                  </div>
                </Card>
              </Link>
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section id="testimonials" className="py-20">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.28em] text-muted">Community Love</p>
              <h2 className="text-section-title">Engineers building their future here.</h2>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <Card className="border-border/70 bg-surface/90 p-6 dark:border-slate-800 dark:bg-slate-950/90">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-primary">★</span>
                  ))}
                </div>
                <p className="mb-4 text-body text-muted">
                  "Arpit Labs' AI explanations helped me understand machine learning completely. The learning path was incredible and practical."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20"></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Sarah Chen</p>
                    <p className="text-xs text-muted">ML Engineer at Google</p>
                  </div>
                </div>
              </Card>

              <Card className="border-border/70 bg-surface/90 p-6 dark:border-slate-800 dark:bg-slate-950/90">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-primary">★</span>
                  ))}
                </div>
                <p className="mb-4 text-body text-muted">
                  "Started contributing during college, now building real systems! The project documentation and community support are unmatched."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20"></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Rahul Sharma</p>
                    <p className="text-xs text-muted">Systems Engineer</p>
                  </div>
                </div>
              </Card>

              <Card className="border-border/70 bg-surface/90 p-6 dark:border-slate-800 dark:bg-slate-950/90">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-primary">★</span>
                  ))}
                </div>
                <p className="mb-4 text-body text-muted">
                  "Found my dream job through Arpit Labs projects! The hands-on experience with IoT systems made all the difference in interviews."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20"></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Alex Rivera</p>
                    <p className="text-xs text-muted">IoT Specialist at Tesla</p>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section id="about" className="py-20">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.28em] text-muted">What is Arpit Labs?</p>
              <h2 className="text-section-title">A lab for systems, experiments, and engineering stories.</h2>
              <p className="max-w-3xl text-body text-muted">
                Arpit Labs brings friendly workflows and premium engineering clarity together. It is a digital workspace for building, learning, and sharing systems across AI, IoT, software, hardware, and cybersecurity.
              </p>
            </div>

            <div className="mt-12 grid gap-6 xl:grid-cols-3">
              <Card className="border-border/70 bg-surface/90 p-8 dark:border-slate-800 dark:bg-slate-950/90">
                <p className="text-sm uppercase tracking-[0.24em] text-muted">Mission</p>
                <h3 className="mt-4 text-xl font-semibold text-foreground">Build meaningful systems.</h3>
                <p className="mt-3 text-body text-muted">
                  Create resilient engineering experiences that connect hardware, software, and intelligence through thoughtful design.
                </p>
              </Card>
              <Card className="border-border/70 bg-surface/90 p-8 dark:border-slate-800 dark:bg-slate-950/90">
                <p className="text-sm uppercase tracking-[0.24em] text-muted">Approach</p>
                <h3 className="mt-4 text-xl font-semibold text-foreground">Experiment with confidence.</h3>
                <p className="mt-3 text-body text-muted">
                  Use playful micro interactions, clean systems, and engineering-first stories to frame every project and prototype.
                </p>
              </Card>
              <Card className="border-border/70 bg-surface/90 p-8 dark:border-slate-800 dark:bg-slate-950/90">
                <p className="text-sm uppercase tracking-[0.24em] text-muted">Vision</p>
                <h3 className="mt-4 text-xl font-semibold text-foreground">Share what matters.</h3>
                <p className="mt-3 text-body text-muted">
                  Document learning, iterate on hardware and code, and build lab systems that feel modern and inviting.
                </p>
              </Card>
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section id="build" className="py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-muted">What I Build</p>
                <h2 className="text-section-title">Technology showcase without project clutter.</h2>
              </div>
              <p className="max-w-xl text-body text-muted">
                Four pillars of engineering work that define the Arpit Labs ecosystem.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <BentoCard
                icon={<Brain size={22} />}
                title="AI & Automation"
                content="Systems that sense, learn, and act intelligently across data and hardware boundaries."
              />
              <BentoCard
                icon={<Wifi size={22} />}
                title="IoT & Embedded Systems"
                content="Connected devices, sensor networks, and edge architectures for real-world interaction."
              />
              <BentoCard
                icon={<Code2 size={22} />}
                title="Software Engineering"
                content="Reliable code, APIs, and workflows that power modern products and lab systems."
              />
              <BentoCard
                icon={<Cpu size={22} />}
                title="Hardware Design"
                content="Circuit design, prototyping, and electronics crafted for performance and usability."
              />
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section id="experiments" className="py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-muted">Current Experiments</p>
                <h2 className="text-section-title">Live work in progress across the lab.</h2>
              </div>
              <p className="max-w-xl text-body text-muted">
                Recent exploration snapshots from the lab research and product discovery.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {experiments.length > 0 ? (
                experiments.map((experiment) => (
                  <Card key={experiment.id} className="border-border/70 p-6 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold text-foreground">{experiment.title}</h3>
                        <p className="text-body text-muted line-clamp-2">{experiment.description}</p>
                      </div>
                      <Badge variant="status">{experiment.status}</Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-muted">
                  No active experiments to display right now.
                </div>
              )}
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section id="lab-notes" className="py-20">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.28em] text-muted">Lab Notes</p>
              <h2 className="text-section-title">Insights from experiments and systems work.</h2>
              <p className="max-w-3xl text-body text-muted">
                Focused engineering documentation and system design patterns.
              </p>
            </div>

            <div className="mt-10 grid gap-6 xl:grid-cols-2">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <Card key={note.id} className="border-border/70 p-6 dark:border-slate-800">
                    <h3 className="text-xl font-semibold text-foreground">{note.title}</h3>
                    <p className="mt-3 text-body text-muted line-clamp-3">{note.excerpt || note.content}</p>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-muted">
                  New lab notes are currently being drafted.
                </div>
              )}
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section id="journey" className="py-20">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.28em] text-muted">Journey</p>
              <h2 className="text-section-title">The evolution of Arpit Labs.</h2>
              <p className="max-w-3xl text-body text-muted">
                A modern timeline that highlights engineering milestones and the lab&apos;s growing systems focus.
              </p>
            </div>
            <Timeline items={journey} />
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section id="contact" className="rounded-[2rem] border border-border/70 bg-card/90 p-12 text-center shadow-glow dark:border-slate-800 dark:bg-slate-950/95">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <NexusLogo className="h-8 w-8" />
              </div>
              <h2 className="text-section-title">Let&apos;s Build Something Interesting.</h2>
              <p className="text-body text-muted">
                Whether it&apos;s AI, IoT, software, hardware, or experimentation, I&apos;m always exploring new ideas.
              </p>
              <a
                href="mailto:contact@arpitlabs.com"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                Let&apos;s Connect
              </a>
            </div>
          </section>
        </AnimatedSection>
      </Container>

      <Footer />
    </main>
  );
}
