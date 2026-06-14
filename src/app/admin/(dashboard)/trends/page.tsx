import { TrendingUp, BarChart3, Activity, Clock, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Suspense } from "react";

export default function TrendsAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp size={32} className="text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Trend Intelligence</h1>
        </div>
        <p className="text-muted">Monitor technology, domain, research, contributor, and project trends</p>
      </div>

      <Suspense fallback={<TrendsDashboardLoading />}>
        <TrendsDashboard />
      </Suspense>
    </div>
  );
}

function TrendsDashboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

async function TrendsDashboard() {
  const [report, topTrends, emergingDomains] = await Promise.all([
    fetchTrendReport(),
    fetchTopTrends(),
    fetchEmergingDomains(),
  ]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Trends"
          value={report.summary.totalTrends}
          icon={<BarChart3 size={20} />}
        />
        <SummaryCard
          title="Top Technology"
          value={report.summary.topTechnology}
          icon={<TrendingUp size={20} />}
        />
        <SummaryCard
          title="Top Domain"
          value={report.summary.topDomain}
          icon={<Activity size={20} />}
        />
        <SummaryCard
          title="Overall Direction"
          value={report.summary.overallDirection}
          icon={<Clock size={20} />}
        />
      </div>

      {/* Technology Trends */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Technology Trends</h2>
        </div>
        <TrendsList trends={report.technologyTrends} />
      </div>

      {/* Emerging Domains */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Activity size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Emerging Domains</h2>
        </div>
        <TrendsList trends={report.emergingDomains} />
      </div>

      {/* Research Trends */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Research Trends</h2>
        </div>
        <TrendsList trends={report.researchTrends} />
      </div>

      {/* Contributor Trends */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Activity size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Contributor Trends</h2>
        </div>
        <TrendsList trends={report.contributorTrends} />
      </div>

      {/* Project Trends */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Project Trends</h2>
        </div>
        <TrendsList trends={report.projectTrends} />
      </div>
    </div>
  );
}

async function fetchTrendReport() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/trends?action=report`);
  const data = await response.json();
  return data.result;
}

async function fetchTopTrends() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/trends?action=all&limit=20`);
  const data = await response.json();
  return data.result;
}

async function fetchEmergingDomains() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/trends?action=domains`);
  const data = await response.json();
  return data.result;
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

function TrendsList({ trends }: { trends: any[] }) {
  return (
    <div className="space-y-2">
      {trends.map((trend, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <div className="flex items-center gap-4">
            <div className="text-muted text-sm">#{index + 1}</div>
            <div>
              <div className="font-medium text-foreground">{trend.name}</div>
              <div className="text-sm text-muted capitalize">{trend.category}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold text-foreground">{trend.score.toFixed(2)}</div>
              <div className="text-xs text-muted">Score</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">{trend.momentum.toFixed(2)}</div>
              <div className="text-xs text-muted">Momentum</div>
            </div>
            <DirectionIcon direction={trend.direction} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DirectionIcon({ direction }: { direction: string }) {
  switch (direction) {
    case "up":
      return <ArrowUp size={20} className="text-green-500" />;
    case "down":
      return <ArrowDown size={20} className="text-red-500" />;
    default:
      return <Minus size={20} className="text-muted" />;
  }
}
