import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { FloatingDecorations } from "@/components/animations/FloatingDecorations";
import { ecosystemRepository } from "@/lib/repositories/ecosystem.repository";
import { Lightbulb, Rocket, Users, Target, Zap, Globe } from "lucide-react";
import Link from "next/link";

export default async function InnovationHubPage() {
  const startups = await ecosystemRepository.getStartups();

  return (
    <main className="min-h-screen bg-background">
      
      <div className="relative border-b border-border/70 bg-gradient-to-b from-surface/50 to-background py-24">
        <FloatingDecorations />
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-1.5 text-sm font-bold tracking-wide text-secondary">
                <Lightbulb size={18} /> Innovation Hub
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl">
                Where ideas become <span className="text-primary text-glow">impact.</span>
              </h1>
              <p className="text-xl text-muted leading-relaxed max-w-xl">
                Arpit Labs Innovation Hub is a launchpad for disruptive startups and radical engineering projects. We provide the mentorship, validation, and infrastructure to scale your vision.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="rounded-2xl bg-primary px-8 py-4 font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 hover:scale-105">
                  Apply for Incubation
                </button>
                <button className="rounded-2xl border border-border/70 bg-surface px-8 py-4 font-bold text-foreground transition hover:border-primary">
                  Innovation Challenges
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
                  <div className="mb-3 text-primary"><Rocket size={24} /></div>
                  <h4 className="font-bold">MVP Validation</h4>
                  <p className="text-xs text-muted">Rapid prototyping and market testing for your core product.</p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
                  <div className="mb-3 text-secondary"><Users size={24} /></div>
                  <h4 className="font-bold">Mentorship</h4>
                  <p className="text-xs text-muted">Connect with industry experts in AI, IoT, and Cybersecurity.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
                  <div className="mb-3 text-green-500"><Target size={24} /></div>
                  <h4 className="font-bold">Market Access</h4>
                  <p className="text-xs text-muted">Direct pipelines to Arpit Labs&apos; global partner network.</p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
                  <div className="mb-3 text-orange-500"><Zap size={24} /></div>
                  <h4 className="font-bold">Tech Stack</h4>
                  <p className="text-xs text-muted">Pre-configured infrastructure and edge computing resources.</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-20">
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Incubated Startups</h2>
            <p className="text-muted max-w-2xl mx-auto">Discover the next generation of technology companies being built at Arpit Labs.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {startups.map((startup) => (
              <div key={startup.id} className="group relative flex flex-col rounded-[2.5rem] border border-border/70 bg-card p-8 transition hover:border-primary">
                <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
                  {startup.logo_url ? (
                    <Image
                      src={startup.logo_url}
                      alt={startup.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <Rocket className="text-primary" size={32} />
                  )}
                </div>
                <div className="mb-4">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {startup.stage}
                  </span>
                </div>
                <h3 className="text-2xl font-bold">{startup.name}</h3>
                <p className="mt-3 flex-1 text-sm text-muted leading-relaxed">
                  {startup.description}
                </p>
                <div className="mt-8 flex items-center justify-between">
                  {startup.website_url && (
                    <a href={startup.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                      <Globe size={16} /> Website
                    </a>
                  )}
                  {startup.slug ? (
                    <a href={`/innovation/${startup.slug}`} className="text-sm font-medium text-muted hover:text-foreground">
                      Learn more →
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-muted">Not available</span>
                  )}
                </div>
              </div>
            ))}
            
            {/* Call to action card */}
            <div className="flex flex-col justify-center rounded-[2.5rem] border-2 border-dashed border-border/70 p-8 text-center transition hover:border-primary/50">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface">
                <Lightbulb className="text-muted" size={24} />
              </div>
              <h3 className="text-xl font-bold">Your Idea Here</h3>
              <p className="mt-2 text-sm text-muted">Join the ecosystem and build the future with us.</p>
              <button className="mt-6 font-bold text-primary hover:underline">Apply Now</button>
            </div>
          </div>
        </section>
      </Container>
      
      <Footer />
    </main>
  );
}
