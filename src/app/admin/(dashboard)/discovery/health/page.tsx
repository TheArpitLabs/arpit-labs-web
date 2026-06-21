import { Activity, AlertTriangle, CheckCircle, Clock, Database, GitBranch, Shield, TrendingUp, Zap } from "lucide-react";
import { headers } from "next/headers";
import { Suspense } from "react";

export default function DiscoveryHealthPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity size={32} className="text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Discovery Health Monitor</h1>
        </div>
        <p className="text-muted">Real-time health monitoring for GitHub Discovery Engine</p>
      </div>

      <Suspense fallback={<HealthDashboardLoading />}>
        <HealthDashboard />
      </Suspense>
    </div>
  );
}

function HealthDashboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

async function HealthDashboard() {
  const healthData = await fetchDiscoveryHealth();

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`p-6 rounded-lg border-2 ${
        healthData.status === 'healthy' 
          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
          : healthData.status === 'warning'
          ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
          : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          {healthData.status === 'healthy' && <CheckCircle size={24} className="text-green-600 dark:text-green-400" />}
          {healthData.status === 'warning' && <AlertTriangle size={24} className="text-yellow-600 dark:text-yellow-400" />}
          {healthData.status === 'critical' && <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />}
          <h2 className="text-2xl font-bold text-foreground">
            Overall Status: {healthData.status.toUpperCase()}
          </h2>
        </div>
        {healthData.issues && healthData.issues.length > 0 && (
          <div className="mt-4 space-y-2">
            {healthData.issues.map((issue: string, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <AlertTriangle size={16} className="text-orange-600 dark:text-orange-400" />
                <span className="text-foreground">{issue}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* GitHub Status */}
        <MetricCard
          icon={<GitBranch size={24} className="text-blue-600 dark:text-blue-400" />}
          title="GitHub Status"
          value={healthData.github_auth ? "Connected" : "Disconnected"}
          status={healthData.github_auth ? "healthy" : "critical"}
        />

        {/* Rate Limit Remaining */}
        <MetricCard
          icon={<Zap size={24} className="text-yellow-600 dark:text-yellow-400" />}
          title="Rate Limit Remaining"
          value={`${healthData.rate_limit_remaining} / ${healthData.rate_limit_limit}`}
          status={healthData.rate_limit_remaining < 100 ? "critical" : healthData.rate_limit_remaining < 500 ? "warning" : "healthy"}
          subtitle={`Resets at ${healthData.rate_limit_reset_date ? new Date(healthData.rate_limit_reset_date).toLocaleTimeString() : 'Unknown'}`}
        />

        {/* Database Status */}
        <MetricCard
          icon={<Database size={24} className="text-green-600 dark:text-green-400" />}
          title="Database Status"
          value={healthData.database ? "Healthy" : "Unhealthy"}
          status={healthData.database ? "healthy" : "critical"}
        />

        {/* Circuit Breaker State */}
        <MetricCard
          icon={<Shield size={24} className="text-purple-600 dark:text-purple-400" />}
          title="Circuit Breaker"
          value={healthData.circuit_breaker_state.toUpperCase()}
          status={healthData.circuit_breaker_state === 'closed' ? "healthy" : healthData.circuit_breaker_state === 'half_open' ? "warning" : "critical"}
          subtitle={healthData.circuit_breaker_open_since ? `Open since ${new Date(healthData.circuit_breaker_open_since).toLocaleString()}` : `Failures: ${healthData.circuit_breaker_failure_count}`}
        />

        {/* API Failures */}
        <MetricCard
          icon={<AlertTriangle size={24} className="text-red-600 dark:text-red-400" />}
          title="API Failures"
          value={`${healthData.api_recovery_recent_failures} recent`}
          status={healthData.api_recovery_recent_failures > 10 ? "critical" : healthData.api_recovery_recent_failures > 5 ? "warning" : "healthy"}
          subtitle={`Total: ${healthData.api_recovery_failures}`}
        />

        {/* Failure Rate */}
        <MetricCard
          icon={<TrendingUp size={24} className="text-orange-600 dark:text-orange-400" />}
          title="Failure Rate"
          value={`${healthData.failure_rate.toFixed(1)}%`}
          status={healthData.failure_rate > 50 ? "critical" : healthData.failure_rate > 20 ? "warning" : "healthy"}
        />
      </div>

      {/* Run Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center gap-3 mb-4">
            <Clock size={24} className="text-primary" />
            <h3 className="text-xl font-bold text-foreground">Last Run</h3>
          </div>
          {healthData.last_run ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Started:</span>
                <span className="text-foreground">{new Date(healthData.last_run).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status:</span>
                <span className={`font-semibold ${
                  healthData.last_run_status === 'completed' ? 'text-green-600 dark:text-green-400' :
                  healthData.last_run_status === 'failed' ? 'text-red-600 dark:text-red-400' :
                  'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {healthData.last_run_status?.toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-muted">No runs recorded</p>
          )}
        </div>

        <div className="p-6 rounded-lg border bg-card">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-bold text-foreground">Last Successful Run</h3>
          </div>
          {healthData.last_successful_run ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Completed:</span>
                <span className="text-foreground">{new Date(healthData.last_successful_run).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-muted">No successful runs recorded</p>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="p-6 rounded-lg border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <Activity size={24} className="text-primary" />
          <h3 className="text-xl font-bold text-foreground">Performance Metrics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between p-3 rounded bg-muted">
            <span className="text-muted">Average Runtime:</span>
            <span className="text-foreground font-semibold">{(healthData.average_runtime_ms / 1000).toFixed(2)}s</span>
          </div>
          <div className="flex justify-between p-3 rounded bg-muted">
            <span className="text-muted">Last Updated:</span>
            <span className="text-foreground font-semibold">{new Date(healthData.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, status, subtitle }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  status: "healthy" | "warning" | "critical";
  subtitle?: string;
}) {
  const statusColors = {
    healthy: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    critical: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="p-6 rounded-lg border bg-card">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <div className={`text-2xl font-bold ${statusColors[status]}`}>
        {value}
      </div>
      {subtitle && (
        <div className="mt-2 text-sm text-muted">
          {subtitle}
        </div>
      )}
    </div>
  );
}

async function fetchDiscoveryHealth() {
  const headersList = await headers();
  const cookie = headersList.get("cookie");

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/discovery/health`, {
    headers: {
      cookie: cookie || "",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch discovery health");
  }

  const result = await response.json();
  return result.data;
}
