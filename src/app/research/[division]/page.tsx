import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { ecosystemRepository } from "@/lib/repositories/ecosystem.repository";
import { notFound } from "next/navigation";
import { Brain, Shield, Wifi, FileText } from "lucide-react";

interface DivisionPageProps {
  params: Promise<{ division: string }>;
}

export default async function DivisionPage({ params }: DivisionPageProps) {
  const { division } = await params;
  const validDivisions = ["ai", "iot", "cybersecurity"];
  
  if (!validDivisions.includes(division)) {
    notFound();
  }

  const papers = await ecosystemRepository.getResearchPapers(division);
  
  const infoMap: Record<"ai" | "iot" | "cybersecurity", { name: string; icon: ReactNode; description: string }> = {
    ai: { name: "AI Research", icon: <Brain />, description: "Pushing the limits of neural architectures and machine intelligence." },
    iot: { name: "IoT Innovation", icon: <Wifi />, description: "Connecting the physical world through resilient edge computing." },
    cybersecurity: { name: "Cybersecurity", icon: <Shield />, description: "Building secure-by-design systems for the next generation of infrastructure." },
  };
  const info = infoMap[division as keyof typeof infoMap];

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border/70 bg-surface/50 py-16">
        <Container>
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {info.icon}
            </div>
            <div>
              <h1 className="text-4xl font-bold">{info.name}</h1>
              <p className="text-muted">{info.description}</p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-12">
        <h2 className="mb-8 text-2xl font-bold">Research Papers</h2>
        {papers.length > 0 ? (
          <div className="grid gap-6">
            {papers.map((paper) => (
              <div key={paper.id} className="rounded-3xl border border-border/70 bg-card p-8">
                <h3 className="text-2xl font-bold">{paper.title}</h3>
                <p className="mt-4 text-muted">{paper.abstract}</p>
                <div className="mt-6 flex items-center gap-4">
                   <span className="text-sm text-muted">Authors: {paper.authors.join(", ")}</span>
                   <button className="ml-auto flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-bold text-white">
                     <FileText size={18} /> View Full Report
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-muted">
            No research papers published in this division yet.
          </div>
        )}
      </Container>
      <Footer />
    </main>
  );
}
