import { Globe, Search, CheckCircle, Clock, XCircle, AlertCircle, PlayCircle, Database, TrendingUp, Star, Shield } from "lucide-react";
import { headers } from "next/headers";
import { Suspense } from "react";
import { ProjectDiscoveryEngine } from "@/components/admin/ProjectDiscoveryEngine";
import { logger } from '@/lib/logger';

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

      {/* Project Discovery Engine */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Database size={28} className="text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Project Discovery Engine</h2>
        </div>
        <ProjectDiscoveryEngine />
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
  const [statistics, pipelineStats, sources, discoveredItems, qualityStats] = await Promise.all([
    fetchDiscoveryStatistics(),
    fetchPipelineStatistics(),
    fetchDiscoverySources(),
    fetchDiscoveredItems("discovered"),
    fetchQualityStatistics(),
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

      {/* Quality Cards */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Repository Quality</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <QualityCard
            title="Excellent"
            value={qualityStats.excellent || 0}
            color="green"
            icon={<Star size={20} />}
          />
          <QualityCard
            title="High Quality"
            value={qualityStats.high_quality || 0}
            color="blue"
            icon={<Star size={20} />}
          />
          <QualityCard
            title="Good"
            value={qualityStats.good || 0}
            color="yellow"
            icon={<Star size={20} />}
          />
          <QualityCard
            title="Average"
            value={qualityStats.average || 0}
            color="orange"
            icon={<Star size={20} />}
          />
          <QualityCard
            title="Rejected"
            value={qualityStats.rejected || 0}
            color="red"
            icon={<XCircle size={20} />}
          />
          <QualityCard
            title="Avg Score"
            value={qualityStats.average_score || 0}
            color="purple"
            icon={<TrendingUp size={20} />}
            isScore
          />
        </div>
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
  const response = await fetch(`${await getAppOrigin()}/api/discovery?action=statistics`, { cache: "no-store" });
  const data = await response.json();
  return data.result || [];
}

async function fetchPipelineStatistics() {
  try {
    const response = await fetch(`${await getAppOrigin()}/api/discovery?action=pipeline-stats`, { cache: "no-store" });
    const data = await response.json();
    
    logger.info('Pipeline stats API response:', {
      success: data.success,
      result: data.result,
      isArray: Array.isArray(data.result),
      error: data.error
    });
    
    // Defensive validation: ensure we always return an array
    const result = data.result;
    if (Array.isArray(result)) {
      return result;
    }
    
    // Handle nested pipelines structure
    if (result && typeof result === 'object' && Array.isArray(result.pipelines)) {
      return result.pipelines;
    }
    
    // Handle null, undefined, or invalid responses
    logger.warn('Pipeline stats returned non-array value:', result);
    return [];
  } catch (error) {
    logger.error('Failed to fetch pipeline statistics:', error);
    return [];
  }
}

async function fetchDiscoverySources() {
  try {
    const response = await fetch(`${await getAppOrigin()}/api/discovery?action=sources`, { cache: "no-store" });
    const data = await response.json();
    const result = data.result;
    return Array.isArray(result) ? result : [];
  } catch (error) {
    logger.error('Failed to fetch discovery sources:', error);
    return [];
  }
}

async function fetchDiscoveredItems(status: string) {
  try {
    const response = await fetch(`${await getAppOrigin()}/api/discovery?action=items&status=${status}`, { cache: "no-store" });
    const data = await response.json();
    const result = data.result;
    return Array.isArray(result) ? result : [];
  } catch (error) {
    logger.error('Failed to fetch discovered items:', error);
    return [];
  }
}

async function fetchQualityStatistics() {
  try {
    const response = await fetch(`${await getAppOrigin()}/api/admin/discovery/quality`, { cache: "no-store" });
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Failed to fetch quality statistics:', error);
    return {
      average_score: 0,
      excellent: 0,
      high_quality: 0,
      good: 0,
      average: 0,
      rejected: 0,
    };
  }
}

async function getAppOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
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

function QualityCard({ title, value, color, icon, isScore }: { title: string; value: number; color: string; icon: React.ReactNode; isScore?: boolean }) {
  const colorClasses: Record<string, string> = {
    green: "text-green-500",
    blue: "text-blue-500",
    yellow: "text-yellow-500",
    orange: "text-orange-500",
    red: "text-red-500",
    purple: "text-purple-500",
  };

  return (
    <div className="rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800">
      <div className="flex items-center gap-2 mb-2">
        <div className={colorClasses[color]}>{icon}</div>
        <h3 className="text-xs font-medium text-muted">{title}</h3>
      </div>
      <div className="text-xl font-bold text-foreground">{isScore ? value.toFixed(1) : value}</div>
    </div>
  );
}

function SourcesList({ sources }: { sources: any[] }) {
  const safeSources = Array.isArray(sources) ? sources : [];
  
  if (safeSources.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        No discovery sources available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {safeSources.map((source) => (
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
  // Defensive validation: ensure pipelines is always an array
  const safePipelines = Array.isArray(pipelines) ? pipelines : [];
  
  if (safePipelines.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        No pipeline statistics available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {safePipelines.map((pipeline) => (
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
  const safeItems = Array.isArray(items) ? items : [];
  
  if (safeItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        No discovered items found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {safeItems.map((item) => (
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
