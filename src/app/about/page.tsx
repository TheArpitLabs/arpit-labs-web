import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card, FeatureCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Code2, Microscope, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "About",
  description: "Learn about the founder story, mission, vision, engineering philosophy, and technology stack behind Arpit Labs.",
  path: "/about",
  keywords: ["About Arpit Labs", "Founder Story", "Mission", "Vision", "Engineering Philosophy"],
});

const coreValues = [
  {
    title: "Engineering Clarity",
    description: "Simplifying complex systems through thoughtful design and clear documentation.",
    icon: <Microscope size={24} />
  },
  {
    title: "Continuous Experimentation",
    description: "Learning through building, failing, and iterating on hardware and software prototypes.",
    icon: <Zap size={24} />
  },
  {
    title: "Systems Thinking",
    description: "Understanding how interconnected components work together to create impactful solutions.",
    icon: <Brain size={24} />
  },
  {
    title: "Open Knowledge",
    description: "Sharing insights and lab notes to contribute back to the engineering community.",
    icon: <Code2 size={24} />
  }
];

const technologies = [
  { category: "Software", items: ["Next.js", "TypeScript", "Python", "Rust", "Node.js", "Go"] },
  { category: "Hardware", items: ["ESP32", "Arduino", "PCB Design", "ARM Cortex", "Sensors", "CAD"] },
  { category: "AI & Data", items: ["PyTorch", "TensorFlow", "Edge AI", "Computer Vision", "NLP"] },
  { category: "Systems", items: ["Docker", "Kubernetes", "IoT Protocols", "MQTT", "Linux", "Cybersecurity"] }
];

export default function AboutPage() {
  return (
    <main className="bg-background text-foreground">
      
      <section className="relative border-b border-border/70 bg-background/75 py-24 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest">
              About Arpit Labs
            </Badge>
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
              Where systems thinking meets <span className="text-primary">creative engineering.</span>
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-muted">
              Arpit Labs is a personal research and engineering studio dedicated to exploring the intersection of AI, IoT, and high-performance software.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-24">
        <AnimatedSection>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-foreground">The Founder</h2>
                <p className="text-lg text-muted">
                  I&apos;m Arpit Kumar, an engineer driven by the curiosity of how things work—from the silicon in a microcontroller to the distributed systems in the cloud. My journey began with a fascination for embedded systems and has evolved into building comprehensive AI-powered solutions.
                </p>
                <p className="text-lg text-muted">
                  With a background in both hardware and software engineering, I founded Arpit Labs to serve as a digital sandbox for experiments that push the boundaries of what&apos;s possible when these worlds collide. I believe in learning by building, failing fast, and sharing knowledge openly.
                </p>
                <p className="text-lg text-muted">
                  My mission is to democratize access to industry-grade engineering education by providing real-world projects, comprehensive documentation, and AI-powered learning tools that bridge the gap between academic knowledge and professional excellence.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Badge variant="secondary" className="px-4 py-1 text-sm">Hardware Architect</Badge>
                <Badge variant="secondary" className="px-4 py-1 text-sm">Full-stack Developer</Badge>
                <Badge variant="secondary" className="px-4 py-1 text-sm">AI/ML Engineer</Badge>
                <Badge variant="secondary" className="px-4 py-1 text-sm">IoT Specialist</Badge>
                <Badge variant="secondary" className="px-4 py-1 text-sm">Open Source Contributor</Badge>
              </div>
            </div>
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border border-border/70 bg-gradient-to-br from-primary/10 to-secondary/10 dark:border-slate-800 dark:bg-slate-900/50">
               <Image 
                 src="/avatar-placeholder.svg" 
                 alt="Arpit Kumar - Founder & Engineer"
                 fill
                 className="object-cover"
                 priority
               />
               <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                 <p className="text-sm font-medium uppercase tracking-widest text-white">Arpit Kumar</p>
                 <p className="mt-1 text-xs font-medium uppercase tracking-widest text-white/80">Founder & Engineer</p>
               </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-32">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="p-10">
              <h3 className="text-2xl font-bold text-foreground">Our Mission</h3>
              <p className="mt-4 text-lg text-muted">
                To build resilient, intelligent systems that bridge the gap between digital logic and physical reality, making advanced technology accessible and understandable.
              </p>
            </Card>
            <Card className="p-10">
              <h3 className="text-2xl font-bold text-foreground">Our Vision</h3>
              <p className="mt-4 text-lg text-muted">
                To become a leading hub for cross-disciplinary engineering research, where hardware, software, and AI converge to solve real-world problems.
              </p>
            </Card>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-32">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Core Values</h2>
            <p className="mt-4 text-muted">The principles that guide every experiment in the lab.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {coreValues.map((value) => (
              <FeatureCard 
                key={value.title}
                title={value.title}
                description={value.description}
                icon={value.icon}
              />
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-32">
          <div className="rounded-[2.5rem] border border-border/70 bg-surface/50 p-12 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-foreground">Technology Stack</h2>
              <p className="mt-4 text-muted">A look into the tools and technologies used at Arpit Labs.</p>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {technologies.map((tech) => (
                <div key={tech.category} className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-primary">{tech.category}</h4>
                  <ul className="space-y-2">
                    {tech.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-foreground">
                        <div className="h-1 w-1 rounded-full bg-primary/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-32">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-foreground">Engineering Philosophy</h2>
            <p className="mt-6 text-xl leading-relaxed text-muted">
              &quot;Complexity is easy; simplicity is hard. We believe that the most elegant solutions are those where every line of code and every component on a board serves a distinct, vital purpose.&quot;
            </p>
            <div className="mt-12 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
               <Link
                href="/projects"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                Explore Projects
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-surface px-8 py-4 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </Container>

      <Footer />
    </main>
  );
}
