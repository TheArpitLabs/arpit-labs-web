import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import dynamic from "next/dynamic";
import { NexusLogo } from "@/components/shared/NexusLogo";
import { Timeline } from "@/components/shared/Timeline";
import { Card, BentoCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Cpu, Code2, Wifi, FolderOpen, FlaskConical, ArrowRight, Eye, Users } from "lucide-react";
import { getExperiments, getLabNotes, getJourneyTimeline, getProjects } from "@/lib/actions/server-actions";
import Image from "next/image";
import Link from "next/link";

const PremiumHero = dynamic(() => import("@/components/landing/PremiumHero").then(mod => ({ default: mod.PremiumHero })), {
  loading: () => <div className="h-screen animate-pulse bg-surface" />
});

const AnimatedCounter = dynamic(() => import("@/components/landing/AnimatedCounter").then(mod => ({ default: mod.AnimatedCounter })));

const PremiumPlatformGrid = dynamic(() => import("@/components/landing/PremiumPlatformGrid").then(mod => ({ default: mod.PremiumPlatformGrid })));

const PremiumProjectCard = dynamic(() => import("@/components/landing/PremiumProjectCard").then(mod => ({ default: mod.PremiumProjectCard })));

const SocialProofSection = dynamic(() => import("@/components/landing/SocialProofSection").then(mod => ({ default: mod.SocialProofSection })));

const FounderStory = dynamic(() => import("@/components/landing/FounderStory").then(mod => ({ default: mod.FounderStory })));

const CommunitySection = dynamic(() => import("@/components/landing/CommunitySection").then(mod => ({ default: mod.CommunitySection })));

const LaunchCTA = dynamic(() => import("@/components/landing/LaunchCTA").then(mod => ({ default: mod.LaunchCTA })));

export default async function HomePage() {
  const [experiments, notes, journey, projects] = await Promise.all([
    getExperiments(),
    getLabNotes(),
    getJourneyTimeline(),
    getProjects()
  ]);

  return (
    <main className="bg-background text-foreground">

      <PremiumHero />

      <Container>
        <AnimatedSection>
          <section id="featured-projects" className="py-24">
            <div className="mb-12 text-center">
              <p className="mb-4 text-sm uppercase tracking-[0.28em] text-muted">Project Marketplace</p>
              <h2 className="mb-6 bg-gradient-to-r from-foreground via-foreground to-muted bg-clip-text text-4xl font-bold sm:text-5xl">
                Top Projects Right Now
              </h2>
              <p className="mx-auto max-w-3xl text-lg text-muted">
                Not just another marketplace. A complete learning ecosystem with AI-powered tools that help you truly understand every line of code.
              </p>
            </div>

            <div className="mb-8 flex flex-wrap justify-center gap-3">
              {['AI & ML', 'IoT', 'Software', 'Hardware', 'Research', 'All Projects'].map((category) => (
                <button
                  key={category}
                  className="rounded-full border border-border/80 bg-surface/80 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80"
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((project, index) => (
                <PremiumProjectCard key={project.id} project={{ 
                  ...project, 
                  cover_image: project.cover_image || undefined,
                  category: project.category || undefined
                }} index={index} />
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
          <section id="social-proof" className="py-24">
            <div className="mb-12 text-center">
              <p className="mb-4 text-sm uppercase tracking-[0.28em] text-muted">Impact</p>
              <h2 className="mb-6 bg-gradient-to-r from-foreground via-foreground to-muted bg-clip-text text-4xl font-bold sm:text-5xl">
                Building Systems That Matter
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <AnimatedCounter value={projects.length} label="Projects Published" icon="FolderOpen" />
              <AnimatedCounter value={experiments.length} label="Research Initiatives" icon="FlaskConical" />
              <AnimatedCounter value={projects.reduce((sum, p) => sum + (p.views_count || 0), 0)} label="Total Views" icon="Eye" />
              <AnimatedCounter value={1200} label="Community Members" icon="Users" suffix="+" />
            </div>
          </section>
        </AnimatedSection>


        <PremiumPlatformGrid />

        <SocialProofSection />

        <FounderStory />

        <CommunitySection />

        <LaunchCTA />

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
