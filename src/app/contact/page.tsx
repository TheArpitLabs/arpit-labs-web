import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Badge } from "@/components/ui/badge";
import { ContactForm } from "@/components/shared/ContactForm";
import { Mail, MessageSquare, Github, Linkedin, Twitter, Globe } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Contact",
  description: "Get in touch with Arpit Labs for collaborations, inquiries, or just to talk about engineering.",
  path: "/contact",
  keywords: ["Contact", "Engineering Collaboration", "Arpit Labs"],
});

export default function ContactPage() {
  return (
    <main className="bg-background text-foreground">

      <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest text-primary">
              Connect
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Let&apos;s build the <span className="text-primary">future together.</span>
            </h1>
            <p className="mt-6 text-lg text-muted">
              Have a question about a project, a research inquiry, or a collaboration proposal? I&apos;d love to hear from you.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <AnimatedSection>
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Contact Information</h2>
                <p className="mt-4 text-muted">
                  Feel free to reach out through the form or via my social channels. I usually respond within 24-48 hours.
                </p>
              </div>

              <div className="grid gap-4">
                <a href="mailto:hello@arpitlabs.example" className="group flex items-center gap-4 rounded-[1.75rem] border border-border/70 bg-surface/50 p-5 transition hover:border-primary/50 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">Email</p>
                    <p className="text-foreground">hello@arpitlabs.example</p>
                  </div>
                </a>

                <div className="flex items-center gap-4 rounded-[1.75rem] border border-border/70 bg-surface/50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">Office Hours</p>
                    <p className="text-foreground">Mon — Fri, 9am - 5pm EST</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Follow the Lab</h3>
                <div className="flex gap-4">
                  {[
                    { icon: <Github size={20} />, href: "#", label: "GitHub" },
                    { icon: <Linkedin size={20} />, href: "#", label: "LinkedIn" },
                    { icon: <Twitter size={20} />, href: "#", label: "Twitter" },
                    { icon: <Globe size={20} />, href: "#", label: "Website" },
                  ].map((social, i) => (
                    <a
                      key={i}
                      href={social.href}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-background text-muted transition hover:border-primary hover:text-primary dark:border-slate-800"
                      aria-label={social.label}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <ContactForm />
          </AnimatedSection>
        </div>
      </Container>

      <Footer />
    </main>
  );
}
