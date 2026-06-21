import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, FileText, BarChart3 } from "lucide-react";
import { headers } from "next/headers";
import { Suspense } from "react";

export default function ValidationDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={32} className="text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Data Validation Layer</h1>
        </div>
        <p className="text-muted">Phase 5: Ensure every discovered repository is complete, useful, and display-ready before insertion</p>
      </div>

      <Suspense fallback={<ValidationDashboardLoading />}>
        <ValidationDashboard />
      </Suspense>
    </div>
  );
}

function ValidationDashboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

async function ValidationDashboard() {
  const [overview, recentValidations, commonErrors] = await Promise.all([
    fetchValidationOverview(),
    fetchRecentValidations(),
    fetchCommonErrors(),
  ]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Validated"
          value={overview.total || 0}
          icon={<Shield size={20} />}
          color="blue"
        />
        <SummaryCard
          title="Passed"
          value={overview.passed || 0}
          icon={<CheckCircle size={20} />}
          color="green"
        />
        <SummaryCard
          title="Failed"
          value={overview.failed || 0}
          icon={<XCircle size={20} />}
          color="red"
        />
        <SummaryCard
          title="Pending"
          value={overview.pending || 0}
          icon={<Clock size={20} />}
          color="yellow"
        />
      </div>

      {/* Average Score Card */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Average Validation Score</h2>
        </div>
        <div className="text-4xl font-bold text-foreground">{overview.average_score || 0}/100</div>
        <div className="text-sm text-muted mt-2">Across all validated repositories</div>
      </div>

      {/* Most Common Rejection Reasons */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Most Common Rejection Reasons</h2>
        </div>
        {commonErrors.common_errors && commonErrors.common_errors.length > 0 ? (
          <div className="space-y-3">
            {commonErrors.common_errors.map((error: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-4">
                  <div className="text-red-500">
                    <XCircle size={16} />
                  </div>
                  <div className="font-medium text-foreground">{error.error}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-foreground">{error.count}</div>
                  <div className="text-xs text-muted">occurrences</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted">No rejection errors recorded</div>
        )}
      </div>

      {/* Recent Validations */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <FileText size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Recent Validations</h2>
        </div>
        {recentValidations.recent_validations && recentValidations.recent_validations.length > 0 ? (
          <div className="space-y-2">
            {recentValidations.recent_validations.map((validation: any) => (
              <ValidationRow key={validation.id} validation={validation} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted">No recent validations</div>
        )}
      </div>

      {/* Validation Rules Reference */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Validation Rules Reference</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-foreground mb-3">Required Fields</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                title
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                description
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                github_url
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                category
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                language
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">Rejection Criteria</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <XCircle size={14} className="text-red-500" />
                description &lt; 50 characters
              </li>
              <li className="flex items-center gap-2">
                <XCircle size={14} className="text-red-500" />
                stars &lt; 50
              </li>
              <li className="flex items-center gap-2">
                <XCircle size={14} className="text-red-500" />
                archived
              </li>
              <li className="flex items-center gap-2">
                <XCircle size={14} className="text-red-500" />
                disabled
              </li>
              <li className="flex items-center gap-2">
                <XCircle size={14} className="text-red-500" />
                empty topics
              </li>
              <li className="flex items-center gap-2">
                <XCircle size={14} className="text-red-500" />
                missing owner
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

async function fetchValidationOverview() {
  try {
    const response = await fetch(`${await getAppOrigin()}/api/admin/discovery/validation`, { cache: "no-store" });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch validation overview:', error);
    return {
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0,
      skipped: 0,
      average_score: 0,
      most_common_errors: [],
    };
  }
}

async function fetchRecentValidations() {
  try {
    const response = await fetch(`${await getAppOrigin()}/api/admin/discovery/validation?action=recent`, { cache: "no-store" });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch recent validations:', error);
    return {
      recent_validations: [],
    };
  }
}

async function fetchCommonErrors() {
  try {
    const response = await fetch(`${await getAppOrigin()}/api/admin/discovery/validation?action=errors`, { cache: "no-store" });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch common errors:', error);
    return {
      common_errors: [],
      total_errors: 0,
    };
  }
}

async function getAppOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function SummaryCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-500",
    green: "text-green-500",
    red: "text-red-500",
    yellow: "text-yellow-500",
  };

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-3 mb-2">
        <div className={colorClasses[color]}>{icon}</div>
        <h3 className="text-sm font-medium text-muted">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function ValidationRow({ validation }: { validation: any }) {
  const statusColors: Record<string, string> = {
    passed: "text-green-500",
    failed: "text-red-500",
    pending: "text-yellow-500",
    skipped: "text-gray-500",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    passed: <CheckCircle size={16} />,
    failed: <XCircle size={16} />,
    pending: <Clock size={16} />,
    skipped: <AlertTriangle size={16} />,
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800">
      <div className="flex-1">
        <div className="font-medium text-foreground">{validation.title}</div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs ${statusColors[validation.validation_status] || 'text-muted'} capitalize`}>
            {validation.validation_status}
          </span>
          <span className="text-xs bg-muted/50 text-muted px-2 py-1 rounded-full">
            Score: {validation.validation_score}/100
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className={statusColors[validation.validation_status] || 'text-muted'}>
          {statusIcons[validation.validation_status] || <AlertTriangle size={16} />}
        </div>
      </div>
    </div>
  );
}
