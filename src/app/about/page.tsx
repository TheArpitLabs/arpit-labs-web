import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card, FeatureCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Code2, Microscope, Zap, Github, Linkedin, Twitter, Mail, Target, BookOpen, Award, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "About",
  description: "Learn about the founder story, mission, vision, engineering philosophy, and technology stack behind Axiora.",
  path: "/about",
  keywords: ["About Axiora", "Founder Story", "Mission", "Vision", "Engineering Philosophy"],
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

const skills = [
  { category: "Hardware Engineering", level: 95, items: ["PCB Design", "Embedded Systems", "IoT Architecture", "Sensor Integration", "Firmware Development"] },
  { category: "Software Development", level: 90, items: ["Full-Stack Development", "System Architecture", "API Design", "Database Design", "Cloud Infrastructure"] },
  { category: "AI/ML Engineering", level: 85, items: ["Computer Vision", "Edge AI", "Model Optimization", "TensorFlow/PyTorch", "MLOps"] },
  { category: "Cybersecurity", level: 80, items: ["IoT Security", "Network Security", "Secure Architecture", "Penetration Testing", "Compliance"] }
];

const researchInterests = [
  { title: "Edge AI Optimization", description: "Developing techniques to deploy AI models on resource-constrained edge devices with minimal accuracy loss." },
  { title: "IoT Security Frameworks", description: "Creating comprehensive security frameworks for IoT ecosystems addressing authentication, encryption, and threat detection." },
  { title: "Smart City Architecture", description: "Designing scalable and sustainable smart city systems that integrate sensors, AI, and cloud infrastructure." },
  { title: "Human-Robot Collaboration", description: "Exploring safe and effective collaboration between humans and autonomous systems in industrial environments." }
];

const careerGoals = [
  { title: "Build Industry-Leading Platform", description: "Transform Axiora into a premier AI-powered innovation platform serving 100,000+ engineers worldwide." },
  { title: "Advance Open Source Ecosystem", description: "Contribute significantly to open source projects and build tools that benefit the global engineering community." },
  { title: "Bridge Academic-Industry Gap", description: "Create educational resources that effectively bridge the gap between academic knowledge and industry requirements." },
  { title: "Foster Engineering Community", description: "Build a vibrant community of engineers who collaborate, share knowledge, and push the boundaries of technology." }
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
              About Axiora
            </Badge>
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
              Where systems thinking meets <span className="text-primary">creative engineering.</span>
            </h1>
            <p className="mt-8 text-xl leading-relaxed text-muted">
              Axiora is an AI-powered innovation platform dedicated to exploring the intersection of AI, IoT, and high-performance software.
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
                  With a background in both hardware and software engineering, I founded Axiora to serve as a digital innovation platform for experiments that push the boundaries of what&apos;s possible when these worlds collide. I believe in learning by building, failing fast, and sharing knowledge openly.
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
              <p className="mt-4 text-muted">A look into the tools and technologies used at Axiora.</p>
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

        <AnimatedSection className="mt-32">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Technical Skills</h2>
            <p className="mt-4 text-muted">Expertise across hardware, software, AI, and cybersecurity domains.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {skills.map((skill) => (
              <Card key={skill.category} className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">{skill.category}</h3>
                  <Badge variant="secondary">{skill.level}%</Badge>
                </div>
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-border">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {skill.items.map((item) => (
                    <Badge key={item} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-32">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Research Interests</h2>
            <p className="mt-4 text-muted">Areas of active research and exploration.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {researchInterests.map((interest, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{interest.title}</h3>
                    <p className="mt-2 text-sm text-muted">{interest.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-32">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Career Goals</h2>
            <p className="mt-4 text-muted">Vision for the future of Axiora and AI-powered innovation.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {careerGoals.map((goal, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{goal.title}</h3>
                    <p className="mt-2 text-sm text-muted">{goal.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-32">
          <div className="rounded-[2.5rem] border border-border/70 bg-surface/50 p-12 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground">Connect With Me</h2>
              <p className="mt-4 text-muted">Let&apos;s collaborate on engineering challenges and build something amazing together.</p>
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-6">
              <a
                href="https://github.com/axiora"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-surface px-6 py-4 text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
              >
                <Github className="h-5 w-5" />
                <span className="font-medium">GitHub</span>
              </a>
              <a
                href="https://linkedin.com/in/arpit-kumar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-surface px-6 py-4 text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
              >
                <Linkedin className="h-5 w-5" />
                <span className="font-medium">LinkedIn</span>
              </a>
              <a
                href="https://twitter.com/arpit_labs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-surface px-6 py-4 text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
              >
                <Twitter className="h-5 w-5" />
                <span className="font-medium">Twitter</span>
              </a>
              <a
                href="mailto:hello@axiora.com"
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-surface px-6 py-4 text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900"
              >
                <Mail className="h-5 w-5" />
                <span className="font-medium">Email</span>
              </a>
            </div>
          </div>
        </AnimatedSection>
      </Container>

      <Footer />
    </main>
  );
}
