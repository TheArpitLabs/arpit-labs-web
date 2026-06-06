import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getExperiments } from "@/lib/actions/server-actions";
import { Microscope, Beaker, Terminal, Shield, Brain, Wifi } from "lucide-react";
import { Experiment } from "@/types/content";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Experiments",
  description: "Live research and experimental prototypes in AI, IoT, Cybersecurity, and Hardware Design.",
  path: "/experiments",
  keywords: ["AI Experiments", "IoT Experiments", "Cybersecurity Experiments", "Hardware Experiments"],
});

const categoryIcons: Record<string, React.ReactNode> = {
  "AI": <Brain size={20} />,
  "IoT": <Wifi size={20} />,
  "Cybersecurity": <Shield size={20} />,
  "Hardware": <Terminal size={20} />,
  "Research": <Microscope size={20} />,
};

export default async function ExperimentsPage() {
  const experiments = await getExperiments();
  const categories = ["AI", "IoT", "Cybersecurity", "Hardware"] as const;

  return (
    <main className="bg-background text-foreground">

      <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest text-primary">
              R&D Lab
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Research & <span className="text-primary">Experiments</span>
            </h1>
            <p className="mt-6 text-lg text-muted">
              A space for work-in-progress research, technical proofs of concept, and experimental engineering prototypes.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <AnimatedSection>
          <div className="space-y-12">
            {categories.map((category) => {
              const categoryExperiments = experiments.filter((experiment) => (experiment.category ?? "Research") === category);

              return (
                <section key={category} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      {categoryIcons[category]}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{category} Experiments</h2>
                      <p className="text-sm text-muted">Active prototypes and engineering notes from the {category.toLowerCase()} track.</p>
                    </div>
                  </div>

                  {categoryExperiments.length > 0 ? (
                    <div className="grid gap-8 md:grid-cols-2">
                      {categoryExperiments.map((exp: Experiment) => (
                        <Card key={exp.id} className="relative group overflow-hidden border-border/70 p-8 dark:border-slate-800">
                          <div className="flex h-full flex-col">
                            <div className="mb-6 flex items-start justify-between">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                {exp.category && categoryIcons[exp.category] ? categoryIcons[exp.category] : <Beaker size={20} />}
                              </div>
                              <Badge variant="status" className="border-none bg-secondary/10 text-secondary">
                                {exp.status}
                              </Badge>
                            </div>

                            <h3 className="mb-4 text-2xl font-bold text-foreground">
                              {exp.title}
                            </h3>

                            <p className="mb-8 flex-grow leading-relaxed text-muted">
                              {exp.description}
                            </p>

                            {exp.tech_stack && exp.tech_stack.length > 0 ? (
                              <div className="mb-6 flex flex-wrap gap-2">
                                {exp.tech_stack.map((item) => (
                                  <Badge key={item} variant="outline" className="px-2 py-1 text-[10px]">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}

                            <div className="flex items-center gap-4 text-sm font-medium">
                              <span className="text-primary">View Report</span>
                              <span className="h-px flex-grow bg-border/50 dark:bg-slate-800" />
                              <span className="text-muted">{new Date(exp.created_at).getFullYear()}</span>
                            </div>
                          </div>

                          <div className="pointer-events-none absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05]">
                            <Beaker size={160} />
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[2rem] border border-dashed border-border/50 py-12 text-center text-muted">
                      No {category.toLowerCase()} experiments published yet.
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-24">
          <div className="rounded-[2.5rem] bg-surface/50 border border-border/70 p-12 dark:bg-slate-900/50 dark:border-slate-800 text-center">
            <h2 className="text-2xl font-bold mb-4">Collaboration & Inquiry</h2>
            <p className="text-muted max-w-2xl mx-auto mb-8">
              Are you interested in a specific research area or want to collaborate on an experimental system? 
              I&apos;m always open to discussing new technical frontiers.
            </p>
            <a 
              href="/contact" 
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Start a Conversation
            </a>
          </div>
        </AnimatedSection>
      </Container>

      <Footer />
    </main>
  );
}
