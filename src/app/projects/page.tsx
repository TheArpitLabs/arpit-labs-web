import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Badge } from "@/components/ui/badge";
import { getProjects } from "@/lib/actions/server-actions";
import { ProjectsExplorer } from "@/components/projects/ProjectsExplorer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Projects",
  description: "Explore the engineering projects and systems built at Arpit Labs, ranging from IoT devices to AI-powered applications.",
  path: "/projects",
  keywords: ["Projects", "Engineering Showcase", "IoT", "AI", "Software", "Hardware"],
});

export default async function ProjectsPage() {
  const projects = await getProjects();

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
          <ProjectsExplorer projects={projects} />
        </AnimatedSection>
      </Container>

      <Footer />
    </main>
  );
}
