import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { ecosystemRepository } from "@/lib/repositories/ecosystem.repository";
import { Microscope, Brain, Shield, Wifi, FileText, Database } from "lucide-react";
import Link from "next/link";

export default async function ResearchPage() {
  const [papers, datasets] = await Promise.all([
    ecosystemRepository.getResearchPapers(),
    ecosystemRepository.getResearchDatasets()
  ]);

  const divisions = [
    { name: "AI Research", icon: <Brain />, slug: "ai", color: "text-blue-500" },
    { name: "IoT Innovation", icon: <Wifi />, slug: "iot", color: "text-green-500" },
    { name: "Cybersecurity", icon: <Shield />, slug: "cybersecurity", color: "text-red-500" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border/70 bg-surface/50 py-16">
        <Container>
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Microscope size={14} /> Research Labs
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Advancing the boundaries of technology.
            </h1>
            <p className="text-lg text-muted">
              Our research divisions focus on high-impact projects in AI, IoT, and Cybersecurity, publishing open-source datasets and whitepapers.
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {divisions.map((div) => (
            <Link 
              key={div.slug}
              href={`/research/${div.slug}`}
              className="group rounded-3xl border border-border/70 bg-card p-8 transition hover:border-primary hover:shadow-lg"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface transition group-hover:scale-110 ${div.color}`}>
                {div.icon}
              </div>
              <h3 className="text-xl font-bold">{div.name}</h3>
              <p className="mt-2 text-sm text-muted">Exploring new frontiers in {div.name.toLowerCase()} with dedicated resources.</p>
            </Link>
          ))}
        </div>

        <section className="mt-20 space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold">Latest Whitepapers</h2>
              <p className="text-muted">Peer-reviewed research and technical reports.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {papers.map((paper) => (
              <div key={paper.id} className="rounded-3xl border border-border/70 bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">
                    {paper.division}
                  </span>
                  <span className="text-xs text-muted">
                    {paper.published_at ? new Date(paper.published_at).toLocaleDateString() : "Draft"}
                  </span>
                </div>
                <h3 className="text-xl font-bold hover:text-primary cursor-pointer">{paper.title}</h3>
                <p className="mt-3 text-sm text-muted line-clamp-3">{paper.abstract}</p>
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-xs text-muted">By {paper.authors.join(", ")}</div>
                  <button className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    <FileText size={16} /> Read Paper
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold">Open Datasets</h2>
              <p className="text-muted">Curated datasets for community research.</p>
            </div>
          </div>

          <div className="grid gap-4">
            {datasets.map((ds) => (
              <div key={ds.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Database size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold">{ds.title}</h4>
                    <p className="text-xs text-muted">{ds.format} · {ds.size} · {ds.license}</p>
                  </div>
                </div>
                <button className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary/90">
                  Download
                </button>
              </div>
            ))}
          </div>
        </section>
      </Container>
      <Footer />
    </main>
  );
}
