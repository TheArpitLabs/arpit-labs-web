import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { TimelineExplorer } from "@/components/shared/TimelineExplorer";
import { Badge } from "@/components/ui/badge";
import { getJourneyTimeline } from "@/lib/actions/server-actions";
import { GraduationCap, Briefcase, Award, Trophy } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Journey",
  description: "A timeline of educational milestones, projects, and achievements in my engineering journey.",
  path: "/journey",
  keywords: ["Journey", "Timeline", "Education", "Hackathons", "Certifications", "Milestones"],
});

export default async function JourneyPage() {
  const journeyItems = await getJourneyTimeline();

  return (
    <main className="bg-background text-foreground">

      <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest text-primary">
              Evolution of a Lab
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              The Journey of <span className="text-primary">Arpit Labs</span>
            </h1>
            <p className="mt-6 text-lg text-muted">
              From the first line of code to complex system architectures. This is a record of milestones, achievements, and the evolution of engineering thinking.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <div className="grid gap-16 lg:grid-cols-[1fr_300px]">
          <div>
            <AnimatedSection>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Milestones & History</h2>
                <p className="text-muted">A filterable timeline covering education, competitions, hackathons, certifications, and major milestones.</p>
              </div>
              <div className="mt-10">
                <TimelineExplorer items={journeyItems} />
              </div>
            </AnimatedSection>
          </div>

          <aside className="space-y-12">
            <AnimatedSection>
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-foreground">Summary</h3>
                <div className="grid gap-4">
                  <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-surface/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Education</p>
                      <p className="text-xs text-muted">Engineering Degree & Certs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-surface/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Projects</p>
                      <p className="text-xs text-muted">50+ Hardware & Software</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-surface/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Awards</p>
                      <p className="text-xs text-muted">Hackathons & Honors</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-glow dark:border-slate-800 dark:bg-slate-950">
                <h3 className="text-lg font-bold text-foreground">Current Focus</h3>
                <p className="mt-3 text-sm text-muted">
                  Currently exploring Edge AI optimization and secure IoT communication protocols for industrial applications.
                </p>
                <div className="mt-6">
                  <Badge variant="outline" className="w-full justify-center py-2">
                    Active Research 2025
                  </Badge>
                </div>
              </div>
            </AnimatedSection>
          </aside>
        </div>
      </Container>

      <Footer />
    </main>
  );
}
