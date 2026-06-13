import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { ecosystemRepository } from "@/lib/repositories/ecosystem.repository";
import { Microscope, Brain, Shield, Wifi, FileText, Database, BookOpen, Search, Filter, TrendingUp, ArrowRight, Lightbulb, Code2, Cpu } from "lucide-react";
import Link from "next/link";

export default async function ResearchPage() {
  const [papers, datasets] = await Promise.all([
    ecosystemRepository.getResearchPapers(),
    ecosystemRepository.getResearchDatasets()
  ]);

  const contentTypes = [
    { name: "Research Papers", icon: FileText, count: papers.length, color: "from-purple-500/10 to-pink-500/10", iconColor: "from-purple-500 to-pink-500" },
    { name: "Articles", icon: BookOpen, count: 12, color: "from-blue-500/10 to-cyan-500/10", iconColor: "from-blue-500 to-cyan-500" },
    { name: "Whitepapers", icon: FileText, count: 8, color: "from-green-500/10 to-emerald-500/10", iconColor: "from-green-500 to-emerald-500" },
    { name: "Case Studies", icon: TrendingUp, count: 6, color: "from-orange-500/10 to-red-500/10", iconColor: "from-orange-500 to-red-500" },
    { name: "Technical Notes", icon: Code2, count: 15, color: "from-indigo-500/10 to-violet-500/10", iconColor: "from-indigo-500 to-violet-500" },
  ];

  const categories = [
    { name: "Artificial Intelligence", icon: Brain, count: 24 },
    { name: "IoT & Embedded", icon: Wifi, count: 18 },
    { name: "Cybersecurity", icon: Shield, count: 12 },
    { name: "Data Science", icon: Database, count: 15 },
    { name: "Software Engineering", icon: Code2, count: 20 },
    { name: "Hardware Design", icon: Cpu, count: 9 },
  ];

  const featuredResearch = papers.slice(0, 3);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative border-b border-border/70 bg-gradient-to-b from-surface/50 to-background py-20">
        <Container>
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold uppercase tracking-wider text-primary">
              <Microscope size={16} /> Engineering Knowledge Hub
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              Research & Innovation
            </h1>
            <p className="text-xl text-muted">
              Explore cutting-edge research papers, technical articles, case studies, and engineering knowledge across AI, IoT, cybersecurity, and emerging technologies.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search research papers, articles, and technical notes..."
                className="w-full rounded-2xl border border-border/70 bg-surface px-12 py-4 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <AnimatedSection>
          {/* Content Types */}
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground">Content Types</h2>
              <p className="mt-2 text-muted">Explore different formats of engineering knowledge</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {contentTypes.map((type) => (
                <Link key={type.name} href={`/research?type=${type.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Card className="group h-full p-6 transition-all hover:shadow-2xl hover:border-primary/50">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${type.iconColor} text-white`}>
                      <type.icon size={24} />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {type.name}
                    </h3>
                    <p className="text-sm text-muted">{type.count} resources</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Research Categories</h2>
                <p className="mt-2 text-muted">Browse by engineering domain</p>
              </div>
              <button className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <Filter size={16} /> Filter All
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link key={category.name} href={`/research?category=${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Card className="group flex items-center gap-4 p-6 transition-all hover:shadow-2xl hover:border-primary/50">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                      <category.icon size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted">{category.count} publications</p>
                    </div>
                    <ArrowRight size={20} className="text-muted group-hover:translate-x-1 group-hover:text-primary transition-all" />
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Featured Research */}
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Featured Research</h2>
                <p className="mt-2 text-muted">Highlighted publications and breakthrough studies</p>
              </div>
              <Link href="/research?featured=true" className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                View All Featured
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {featuredResearch.map((paper) => (
                <Card key={paper.id} className="group h-full overflow-hidden transition-all hover:shadow-2xl">
                  <div className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {paper.division}
                      </Badge>
                      <span className="text-xs text-muted">
                        {paper.published_at ? new Date(paper.published_at).toLocaleDateString() : "Draft"}
                      </span>
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {paper.title}
                    </h3>
                    <p className="mb-4 text-sm text-muted line-clamp-3">
                      {paper.abstract}
                    </p>
                    <div className="mb-4 flex items-center gap-2 text-xs text-muted">
                      <span>By {paper.authors.join(", ")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <FileText size={14} />
                        Read Paper
                      </div>
                      <Lightbulb size={16} className="text-yellow-500" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Latest Papers */}
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Latest Publications</h2>
                <p className="mt-2 text-muted">Recently added research and technical content</p>
              </div>
              <Link href="/research?sort=latest" className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                View All
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {papers.map((paper) => (
                <Card key={paper.id} className="group p-6 transition-all hover:shadow-2xl hover:border-primary/50">
                  <div className="mb-4 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {paper.division}
                    </Badge>
                    <span className="text-xs text-muted">
                      {paper.published_at ? new Date(paper.published_at).toLocaleDateString() : "Draft"}
                    </span>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {paper.title}
                  </h3>
                  <p className="mb-4 text-sm text-muted line-clamp-3">
                    {paper.abstract}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted">By {paper.authors.join(", ")}</div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <FileText size={16} />
                      Read Paper
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Open Datasets */}
          <div>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Open Datasets</h2>
                <p className="mt-2 text-muted">Curated datasets for community research and development</p>
              </div>
              <Link href="/research/datasets" className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Browse All Datasets
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid gap-4">
              {datasets.map((ds) => (
                <Card key={ds.id} className="flex items-center justify-between p-6 transition-all hover:shadow-2xl hover:border-primary/50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                      <Database size={28} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground">{ds.title}</h4>
                      <p className="text-sm text-muted">{ds.format} · {ds.size} · {ds.license}</p>
                    </div>
                  </div>
                  <button className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary/90">
                    Download
                  </button>
                </Card>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </Container>
      <Footer />
    </main>
  );
}
