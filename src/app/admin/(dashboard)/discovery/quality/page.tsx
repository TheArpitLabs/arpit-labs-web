import { Shield, TrendingUp, Star, XCircle, CheckCircle, AlertCircle } from "lucide-react";
import { headers } from "next/headers";
import { Suspense } from "react";
import { logger } from '@/lib/logger';

export default function DiscoveryQualityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={32} className="text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Repository Quality Analytics</h1>
        </div>
        <p className="text-muted">Analytics and insights for repository quality scoring and grading</p>
      </div>

      <Suspense fallback={<QualityAnalyticsLoading />}>
        <QualityAnalytics />
      </Suspense>
    </div>
  );
}

function QualityAnalyticsLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

async function QualityAnalytics() {
  const [qualityStats, topRepositories, bottomRepositories] = await Promise.all([
    fetchQualityStatistics(),
    fetchTopRepositories(),
    fetchBottomRepositories(),
  ]);

  return (
    <div className="space-y-8">
      {/* Quality Overview Cards */}
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

      {/* Quality Distribution */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Quality Grade Distribution</h2>
        </div>
        <QualityDistribution stats={qualityStats} />
      </div>

      {/* Top Scoring Repositories */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Top Scoring Repositories</h2>
        </div>
        <RepositoryList repositories={topRepositories} />
      </div>

      {/* Lowest Scoring Repositories */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Lowest Scoring Repositories</h2>
        </div>
        <RepositoryList repositories={bottomRepositories} />
      </div>
    </div>
  );
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

async function fetchTopRepositories() {
  try {
    const response = await fetch(`${await getAppOrigin()}/api/admin/discovery/quality?top=10`, { cache: "no-store" });
    const data = await response.json();
    return data.repositories || [];
  } catch (error) {
    logger.error('Failed to fetch top repositories:', error);
    return [];
  }
}

async function fetchBottomRepositories() {
  try {
    const response = await fetch(`${await getAppOrigin()}/api/admin/discovery/quality?bottom=10`, { cache: "no-store" });
    const data = await response.json();
    return data.repositories || [];
  } catch (error) {
    logger.error('Failed to fetch bottom repositories:', error);
    return [];
  }
}

async function getAppOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
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

function QualityDistribution({ stats }: { stats: any }) {
  const total = (stats.excellent || 0) + (stats.high_quality || 0) + (stats.good || 0) + (stats.average || 0) + (stats.rejected || 0);
  
  if (total === 0) {
    return <div className="text-center py-8 text-muted">No quality data available</div>;
  }

  const data = [
    { label: 'Excellent', value: stats.excellent || 0, color: 'bg-green-500' },
    { label: 'High Quality', value: stats.high_quality || 0, color: 'bg-blue-500' },
    { label: 'Good', value: stats.good || 0, color: 'bg-yellow-500' },
    { label: 'Average', value: stats.average || 0, color: 'bg-orange-500' },
    { label: 'Rejected', value: stats.rejected || 0, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const percentage = (item.value / total) * 100;
        return (
          <div key={item.label}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <span className="text-sm text-muted">{item.value} ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`${item.color} h-2 rounded-full transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RepositoryList({ repositories }: { repositories: any[] }) {
  if (!repositories || repositories.length === 0) {
    return <div className="text-center py-8 text-muted">No repositories found</div>;
  }

  return (
    <div className="space-y-2">
      {repositories.map((repo) => (
        <div
          key={repo.id}
          className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <div className="flex-1">
            <div className="font-medium text-foreground">{repo.title}</div>
            <div className="text-sm text-muted">{repo.github_url}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">
                {repo.quality_grade}
              </span>
              <span className="text-xs bg-muted/50 text-muted px-2 py-1 rounded-full">
                {repo.stars} stars
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold text-foreground">{repo.repository_score}</div>
              <div className="text-xs text-muted">Score</div>
            </div>
            <GradeIcon grade={repo.quality_grade} />
          </div>
        </div>
      ))}
    </div>
  );
}

function GradeIcon({ grade }: { grade: string }) {
  switch (grade) {
    case 'Excellent':
      return <Star size={20} className="text-green-500" />;
    case 'High Quality':
      return <Star size={20} className="text-blue-500" />;
    case 'Good':
      return <Star size={20} className="text-yellow-500" />;
    case 'Average':
      return <Star size={20} className="text-orange-500" />;
    case 'Reject':
      return <XCircle size={20} className="text-red-500" />;
    default:
      return <AlertCircle size={20} className="text-muted" />;
  }
}
