import { FileText, Network, Search, TrendingUp, BookOpen, Link2 } from "lucide-react";
import { Suspense } from "react";

export default function ResearchIntelligenceAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText size={32} className="text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Research Intelligence</h1>
        </div>
        <p className="text-muted">Research graph, summaries, recommendations, citation analysis, and paper similarity</p>
      </div>

      <Suspense fallback={<ResearchIntelligenceDashboardLoading />}>
        <ResearchIntelligenceDashboard />
      </Suspense>
    </div>
  );
}

function ResearchIntelligenceDashboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

async function ResearchIntelligenceDashboard() {
  const [statistics, papers, topPaper] = await Promise.all([
    fetchResearchStatistics(),
    fetchResearchPapers(),
    fetchTopPaper(),
  ]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Papers"
          value={statistics[0]?.total_papers || 0}
          icon={<FileText size={20} />}
        />
        <SummaryCard
          title="Total Citations"
          value={statistics[0]?.total_citations || 0}
          icon={<Link2 size={20} />}
        />
        <SummaryCard
          title="Avg Citations"
          value={statistics[0]?.avg_citations?.toFixed(1) || "0"}
          icon={<TrendingUp size={20} />}
        />
        <SummaryCard
          title="Top Domain"
          value={statistics[0]?.top_domain || "N/A"}
          icon={<BookOpen size={20} />}
        />
      </div>

      {/* Research Papers */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <FileText size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Research Papers</h2>
        </div>
        <ResearchPapersList papers={papers} />
      </div>

      {/* Top Paper */}
      {topPaper && (
        <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={20} className="text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Top Cited Paper</h2>
          </div>
          <TopPaperCard paper={topPaper} />
        </div>
      )}
    </div>
  );
}

async function fetchResearchStatistics() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/research?action=statistics`);
  const data = await response.json();
  return data.result || [];
}

async function fetchResearchPapers() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/research?action=all&limit=20`);
  const data = await response.json();
  return data.result || [];
}

async function fetchTopPaper() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/research?action=all&limit=1`);
  const data = await response.json();
  return data.result?.[0] || null;
}

function SummaryCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-primary">{icon}</div>
        <h3 className="text-sm font-medium text-muted">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function ResearchPapersList({ papers }: { papers: any[] }) {
  if (papers.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        No research papers found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {papers.map((paper) => (
        <div
          key={paper.id}
          className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <div className="flex-1">
            <div className="font-medium text-foreground">{paper.title}</div>
            <div className="text-sm text-muted">{paper.authors?.join(", ") || "Unknown"}</div>
            <div className="flex items-center gap-2 mt-2">
              {paper.domains?.slice(0, 2).map((domain: string, i: number) => (
                <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {domain}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold text-foreground">{paper.citations}</div>
              <div className="text-xs text-muted">Citations</div>
            </div>
            <Link2 size={20} className="text-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TopPaperCard({ paper }: { paper: any }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800">
      <div className="font-medium text-foreground text-lg">{paper.title}</div>
      <div className="text-sm text-muted mt-1">{paper.authors?.join(", ") || "Unknown"}</div>
      <div className="text-sm text-muted mt-2">{paper.abstract?.substring(0, 200)}...</div>
      <div className="flex items-center gap-4 mt-4">
        <div className="text-right">
          <div className="font-semibold text-foreground">{paper.citations}</div>
          <div className="text-xs text-muted">Citations</div>
        </div>
        {paper.summary && (
          <div className="text-right">
            <div className="font-semibold text-green-500">Summarized</div>
            <div className="text-xs text-muted">AI Summary</div>
          </div>
        )}
      </div>
    </div>
  );
}
