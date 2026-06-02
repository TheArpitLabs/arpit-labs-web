import { Container } from "@/components/layout/Container";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { TechnologyEcosystem } from "@/components/shared/TechnologyEcosystem";
import { NexusLogo } from "@/components/shared/NexusLogo";
import { Timeline } from "@/components/shared/Timeline";
import { Card, BentoCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Cpu, Code2, Wifi } from "lucide-react";

const experiments = [
  { title: "Edge AI Research", status: "Researching" },
  { title: "ESP32 Smart Home", status: "Building" },
  { title: "Autonomous Navigation", status: "Testing" },
  { title: "Cybersecurity Toolkit", status: "Completed" }
];

const notes = [
  { title: "How I Learned Edge AI", description: "A practical approach to model optimization for constrained hardware." },
  { title: "Building Embedded Systems", description: "Integrating sensors, firmware, and real-time control loops." },
  { title: "Traffic Management Research", description: "Designing resilient systems for city-scale automation." },
  { title: "Lessons From Hackathons", description: "Rapid experimentation with engineering-first workflows." }
];

export default function HomePage() {
  return (
    <main className="bg-background text-foreground">
      <Navbar />

      <section id="home" className="border-b border-border/70 bg-background/75 py-16 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-border/80 bg-surface/80 px-4 py-2 text-sm text-muted dark:border-slate-800 dark:bg-slate-900">
                <span className="text-primary">Nexus ecosystem</span>
                <span className="text-muted">A modern engineering lab for systems thinking</span>
                <span className="text-secondary">✧</span>
              </div>
              <div className="space-y-6">
                <h1 className="max-w-3xl text-section-title leading-tight tracking-[-0.03em] text-foreground">
                  Engineering the future through AI, IoT, Software & Hardware.
                </h1>
                <p className="max-w-2xl text-body text-muted">
                  Arpit Labs is a digital engineering lab where ideas are designed, built, and transformed into impactful systems.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href="#experiments"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Explore the Lab
                </a>
                <a
                  href="#journey"
                  className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-surface px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
                >
                  View My Journey
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {[
                  "AI",
                  "IoT",
                  "Software",
                  "Hardware"
                ].map((item) => (
                  <div key={item} className="rounded-3xl border border-border/70 bg-card/90 px-4 py-3 text-center text-sm font-semibold text-foreground shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <TechnologyEcosystem />
          </div>
        </Container>
      </section>

      <Container>
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
                Mock exploration snapshots that feel like engineering research and product discovery.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {experiments.map((experiment) => (
                <Card key={experiment.title} className="border-border/70 p-6 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{experiment.title}</h3>
                      <p className="mt-2 text-body text-muted">A concise view of the current lab work.</p>
                    </div>
                    <Badge variant="status">{experiment.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <section id="lab-notes" className="py-20">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.28em] text-muted">Lab Notes</p>
              <h2 className="text-section-title">Insights from experiments and systems work.</h2>
              <p className="max-w-3xl text-body text-muted">
                Notion-inspired note previews that feel calm and focused, not cluttered or overly personal.
              </p>
            </div>

            <div className="mt-10 grid gap-6 xl:grid-cols-2">
              {notes.map((note) => (
                <Card key={note.title} className="border-border/70 p-6 dark:border-slate-800">
                  <h3 className="text-xl font-semibold text-foreground">{note.title}</h3>
                  <p className="mt-3 text-body text-muted">{note.description}</p>
                </Card>
              ))}
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
            <Timeline />
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
                href="mailto:hello@arpitlabs.example"
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
