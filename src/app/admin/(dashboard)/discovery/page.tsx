import { Globe, Search, CheckCircle, Clock, XCircle, AlertCircle, PlayCircle } from "lucide-react";
import { Suspense } from "react";

export default function DiscoveryAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe size={32} className="text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Autonomous Discovery</h1>
        </div>
        <p className="text-muted">Automated knowledge discovery from GitHub, GitLab, arXiv, Kaggle, HuggingFace, Devpost, Hack2Skill, Unstop</p>
      </div>

      <Suspense fallback={<DiscoveryDashboardLoading />}>
        <DiscoveryDashboard />
      </Suspense>
    </div>
  );
}

function DiscoveryDashboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

async function DiscoveryDashboard() {
  const [statistics, pipelineStats, sources, discoveredItems] = await Promise.all([
    fetchDiscoveryStatistics(),
    fetchPipelineStatistics(),
    fetchDiscoverySources(),
    fetchDiscoveredItems("discovered"),
  ]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Discovered"
          value={statistics[0]?.total_discovered || 0}
          icon={<Search size={20} />}
        />
        <SummaryCard
          title="Total Published"
          value={statistics[0]?.total_published || 0}
          icon={<CheckCircle size={20} />}
        />
        <SummaryCard
          title="Total Queued"
          value={statistics[0]?.total_queued || 0}
          icon={<Clock size={20} />}
        />
        <SummaryCard
          title="Total Rejected"
          value={statistics[0]?.total_rejected || 0}
          icon={<XCircle size={20} />}
        />
      </div>

      {/* Discovery Sources */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Globe size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Discovery Sources</h2>
        </div>
        <SourcesList sources={sources} />
      </div>

      {/* Pipeline Statistics */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <PlayCircle size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Pipeline Statistics</h2>
        </div>
        <PipelineStatsList pipelines={pipelineStats} />
      </div>

      {/* Discovered Items */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Search size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Recently Discovered Items</h2>
        </div>
        <DiscoveryItemsList items={discoveredItems} />
      </div>
    </div>
  );
}

async function fetchDiscoveryStatistics() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/discovery?action=statistics`);
  const data = await response.json();
  return data.result || [];
}

async function fetchPipelineStatistics() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/discovery?action=pipeline-stats`);
  const data = await response.json();
  return data.result || [];
}

async function fetchDiscoverySources() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/discovery?action=sources`);
  const data = await response.json();
  return data.result || [];
}

async function fetchDiscoveredItems(status: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/discovery?action=items&status=${status}`);
  const data = await response.json();
  return data.result || [];
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
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

function SourcesList({ sources }: { sources: any[] }) {
  return (
    <div className="space-y-2">
      {sources.map((source) => (
        <div
          key={source.id}
          className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <div className="flex items-center gap-4">
            <div className="text-muted text-sm capitalize">{source.source}</div>
            <div>
              <div className="font-medium text-foreground">{source.name}</div>
              <div className="text-sm text-muted">{source.url}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold text-foreground capitalize">{source.enabled ? "Enabled" : "Disabled"}</div>
              <div className="text-xs text-muted">Sync: {source.syncInterval}</div>
            </div>
            <CheckCircle size={20} className={source.enabled ? "text-green-500" : "text-muted"} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PipelineStatsList({ pipelines }: { pipelines: any[] }) {
  return (
    <div className="space-y-2">
      {pipelines.map((pipeline) => (
        <div
          key={`${pipeline.source}-${pipeline.pipeline}`}
          className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <div className="flex items-center gap-4">
            <div className="text-muted text-sm capitalize">{pipeline.source}</div>
            <div>
              <div className="font-medium text-foreground">{pipeline.pipeline}</div>
              <div className="text-sm text-muted capitalize">{pipeline.status}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold text-foreground">{pipeline.items_published}</div>
              <div className="text-xs text-muted">Published</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">{pipeline.error_count}</div>
              <div className="text-xs text-muted">Errors</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">{pipeline.success_rate.toFixed(1)}%</div>
              <div className="text-xs text-muted">Success Rate</div>
            </div>
            <AlertCircle size={20} className={pipeline.status === "error" ? "text-red-500" : "text-muted"} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DiscoveryItemsList({ items }: { items: any[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        No discovered items found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <div className="flex-1">
            <div className="font-medium text-foreground">{item.title}</div>
            <div className="text-sm text-muted">{item.description}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">
                {item.source}
              </span>
              <span className="text-xs bg-muted/50 text-muted px-2 py-1 rounded-full capitalize">
                {item.type}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold text-foreground">{item.score.toFixed(2)}</div>
              <div className="text-xs text-muted">Score</div>
            </div>
            <StatusIcon status={item.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "published":
      return <CheckCircle size={20} className="text-green-500" />;
    case "rejected":
      return <XCircle size={20} className="text-red-500" />;
    case "queued":
      return <Clock size={20} className="text-yellow-500" />;
    case "analyzed":
      return <PlayCircle size={20} className="text-blue-500" />;
    default:
      return <AlertCircle size={20} className="text-muted" />;
  }
}
