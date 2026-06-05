import { Container } from "@/components/layout/Container";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ecosystemRepository } from "@/lib/repositories/ecosystem.repository";
import { GraduationCap, Award, CheckCircle2, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Certification } from "@/types/content";

export const dynamic = "force-dynamic";

export default async function UniversityPage() {
  let certifications: Certification[] = [];

  try {
    certifications = await ecosystemRepository.getCertifications();
  } catch (error) {
    console.error("Failed to load certifications:", error);
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="relative overflow-hidden border-b border-border/70 bg-surface/30 py-24">
        <div className="absolute left-1/2 top-0 h-[500px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-primary/5 blur-[120px]" />
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold tracking-wide text-primary">
              <GraduationCap size={18} /> Arpit Labs University
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
              Professional Certifications for the Future.
            </h1>
            <p className="text-xl text-muted leading-relaxed">
              Accelerate your career with industry-recognized credentials in AI, IoT, and Cybersecurity. Built for engineers, by engineers.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 size={16} className="text-green-500" /> Self-paced learning
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 size={16} className="text-green-500" /> Digital Badges
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 size={16} className="text-green-500" /> Verified Credentials
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-20">
        <div className="grid gap-12">
          <section className="space-y-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-bold">Certification Programs</h2>
                <p className="text-muted">Master specific technology domains and earn your certificate.</p>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {certifications.map((cert) => (
                <div key={cert.id} className="group relative flex flex-col rounded-[2.5rem] border border-border/70 bg-card p-2 transition hover:border-primary/50 hover:shadow-2xl dark:bg-slate-950/50">
                  <div className="aspect-[16/10] overflow-hidden rounded-[2rem] bg-surface">
                    {cert.image_url ? (
                      <img src={cert.image_url} alt={cert.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary">
                        <Award size={48} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                        {cert.topic}
                      </Badge>
                      <span className="text-xs font-medium uppercase tracking-wider text-muted">{cert.level}</span>
                    </div>
                    <h3 className="mb-3 text-2xl font-bold tracking-tight">{cert.title}</h3>
                    <p className="mb-6 flex-1 text-sm leading-relaxed text-muted line-clamp-3">
                      {cert.description}
                    </p>
                    <a 
                      href={`/university/${cert.slug}`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-bold text-background transition hover:bg-primary hover:text-white"
                    >
                      View Syllabus <ArrowRight size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 grid gap-8 rounded-[3rem] border border-primary/20 bg-primary/5 p-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold">Global Accreditation</h2>
              <p className="text-lg text-muted">
                Our certifications are recognized by leading technology companies and research institutions globally. We ensure every badge holder meets the highest standards of engineering excellence.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/20 p-2 text-primary">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold">Verified Skills</h4>
                    <p className="text-xs text-muted">Hands-on assessment for every certification.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/20 p-2 text-primary">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold">Instant Issuance</h4>
                    <p className="text-xs text-muted">Get your badge immediately upon passing.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Abstract decorative element representing a certificate or badge */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="h-64 w-64 rounded-full border-[16px] border-primary/20 p-4">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-white shadow-2xl">
                       <Award size={80} />
                    </div>
                 </div>
              </div>
            </div>
          </section>
        </div>
      </Container>
      <Footer />
    </main>
  );
}
