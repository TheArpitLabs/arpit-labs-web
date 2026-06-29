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
import { EngineeringDomains } from "@/components/landing/EngineeringDomains";
import { logger } from "@/lib/logger";

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

const ResearchInnovationSection = dynamic(() => import("@/components/landing/ResearchInnovationSection").then(mod => ({ default: mod.ResearchInnovationSection })));

const MarketplaceResourcesSection = dynamic(() => import("@/components/landing/MarketplaceResourcesSection").then(mod => ({ default: mod.MarketplaceResourcesSection })));

const ConsolidatedTestimonials = dynamic(() => import("@/components/landing/ConsolidatedTestimonials").then(mod => ({ default: mod.ConsolidatedTestimonials })));

export default async function HomePage() {
  const [experiments, notes, journey, projectsFromServer] = await Promise.all([
    getExperiments(),
    getLabNotes(),
    getJourneyTimeline(),
    getProjects()
  ]);

  // Use projects from server (database) - limit to 6 for home page
  const projects = projectsFromServer.slice(0, 6);
  logger.debug(`Home page projects count: ${projects.length}`);

  return (
    <main className="bg-background text-foreground">

      <PremiumHero 
        projectCount={projects.length}
        experimentCount={experiments.length}
        totalViews={projects.reduce((sum, p) => sum + (p.views_count || 0), 0)}
      />

      <Container>
        <EngineeringDomains />
      </Container>

      <Container>
        <AnimatedSection>
          <section id="featured-projects" className="py-10">
            <div className="mb-6 text-center">
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-muted">Project Marketplace</p>
              <h2 className="mb-3 bg-gradient-to-r from-foreground via-foreground to-muted bg-clip-text text-2xl font-bold sm:text-3xl">
                Top Projects Right Now
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-muted">
                Not just another marketplace. A complete learning ecosystem with AI-powered tools that help you truly understand every line of code.
              </p>
            </div>

            <div className="mb-5 flex flex-wrap justify-center gap-2">
              {['AI & ML', 'IoT', 'Software', 'Hardware', 'Research', 'All Projects'].map((category) => (
                <button
                  key={category}
                  className="rounded-full border border-border/80 bg-surface/80 px-3 py-1.5 text-[11px] font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80"
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, index) => (
                <PremiumProjectCard key={project.id} project={{
                  ...project,
                  cover_image: project.cover_image || undefined,
                  category: project.category || undefined
                }} index={index} />
              ))}
            </div>

            {projects.length === 0 && (
              <div className="py-8 text-center text-muted">
                No projects published yet. Check back soon!
              </div>
            )}

            {/* Browse All Link */}
            <div className="mt-6 text-center">
              <Link 
                href="/projects"
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Browse All Projects →
              </Link>
            </div>
          </section>
        </AnimatedSection>

        <ResearchInnovationSection />

        <MarketplaceResourcesSection />

        <div className="py-4" />

        {/* <AnimatedSection>
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
              <AnimatedCounter value={projects.length + experiments.length} label="Engineering Resources" icon="Users" />
            </div>
          </section>
        </AnimatedSection> */}


        <PremiumPlatformGrid />

        <div className="py-4" />

        {/* <FounderStory /> */}

        {/* <ConsolidatedTestimonials /> */}

        <div className="py-4" />

        <CommunitySection />

        <LaunchCTA />

      </Container>

      <Footer />
    </main>
  );
}
