"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Square, RefreshCw, Database, FileText, AlertCircle, CheckCircle, Clock, XCircle, Settings, ThumbsUp, ThumbsDown, ExternalLink, Star, GitFork } from "lucide-react";

interface PendingProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  github_url: string;
  demo_url: string | null;
  category: string;
  tags: string[];
  stars: number;
  forks: number;
  language: string;
  cover_image: string;
  created_at: string;
}

interface IngestionStatistics {
  totalFetched: number;
  totalInserted: number;
  totalSkipped: number;
  totalDuplicates: number;
  totalFailed: number;
  newProjects: number;
  duplicateProjects: number;
  failedImports: number;
  categoriesProcessed: string[];
  startTime: string;
  endTime?: string;
  errors: Array<{ category: string; error: string; repository?: string }>;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface DiscoveryConfig {
  categories: string[];
  maxResultsPerCategory: number;
  minStars: number;
  minForks: number;
  enabled: boolean;
}

const AVAILABLE_CATEGORIES = [
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'NLP',
  'Computer Vision',
  'Web Development',
  'DevOps',
  'Cloud Computing',
  'Cybersecurity',
  'Robotics',
  'IoT'
];

export function ProjectDiscoveryEngine() {
  const [isActive, setIsActive] = useState(false);
  const [statistics, setStatistics] = useState<IngestionStatistics | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<DiscoveryConfig>({
    categories: AVAILABLE_CATEGORIES,
    maxResultsPerCategory: 20,
    minStars: 50,
    minForks: 0,
    enabled: true
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>(AVAILABLE_CATEGORIES);
  const [pendingProjects, setPendingProjects] = useState<PendingProject[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const fetchPendingProjects = useCallback(async () => {
    setPendingLoading(true);
    try {
      const response = await fetch("/api/admin/pending-projects?status=pending&limit=20");
      const data = await response.json();
      
      if (data.success) {
        setPendingProjects(data.projects || []);
      } else {
        console.error("Failed to fetch pending projects:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch pending projects:", error);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/project-discovery?action=status");
      const data = await response.json();
      
      if (data.success) {
        setErrorMessage(null);
        setIsActive(data.isActive);
        setStatistics(data.statistics);
        setLogs(data.logs || []);
        if (data.categories?.length) {
          setSelectedCategories((current) => current.length ? current : data.categories);
        }
      } else {
        setErrorMessage(data.error || "Unable to load discovery status");
      }
    } catch (error) {
      setErrorMessage("Unable to reach discovery engine status API");
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchPendingProjects();
  }, [fetchStatus, fetchPendingProjects]);

  useEffect(() => {
    // Poll for status updates every 2 seconds when active
    const interval = setInterval(() => {
      if (isActive) {
        fetchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchStatus, isActive]);

  // Refresh pending projects when discovery stops
  useEffect(() => {
    if (!isActive && statistics?.endTime) {
      fetchPendingProjects();
    }
  }, [isActive, statistics?.endTime, fetchPendingProjects]);

  const startDiscovery = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/project-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          categories: selectedCategories,
          maxResultsPerCategory: config.maxResultsPerCategory,
          minStars: config.minStars,
          minForks: config.minForks
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setStatusMessage(data.message || "Discovery started");
        setErrorMessage(null);
        setIsActive(true);
        await fetchStatus();
      } else {
        setErrorMessage(data.error || "Failed to start discovery");
      }
    } catch (error) {
      setErrorMessage("Failed to start discovery");
    } finally {
      setLoading(false);
    }
  };

  const runSingleCategory = async (category: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/project-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "runCategory",
          category,
          maxResultsPerCategory: config.maxResultsPerCategory,
          minStars: config.minStars,
          minForks: config.minForks
        })
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage(data.message || `${category} discovery started`);
        setErrorMessage(null);
        setIsActive(true);
        await fetchStatus();
      } else {
        setErrorMessage(data.error || "Failed to run category discovery");
      }
    } catch (error) {
      setErrorMessage("Failed to run category discovery");
    } finally {
      setLoading(false);
    }
  };

  const stopDiscovery = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/project-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" })
      });

      const data = await response.json();
      
      if (data.success) {
        setStatusMessage(data.message || "Discovery stop signal sent");
        setErrorMessage(null);
        await fetchStatus();
      } else {
        setErrorMessage(data.error || "Failed to stop discovery");
      }
    } catch (error) {
      setErrorMessage("Failed to stop discovery");
    } finally {
      setLoading(false);
    }
  };

  const refreshLogs = async () => {
    try {
      const response = await fetch("/api/admin/project-discovery?action=logs&limit=100");
      const data = await response.json();
      
      if (data.success) {
        setErrorMessage(null);
        setLogs(data.logs || []);
      } else {
        setErrorMessage(data.error || "Failed to refresh logs");
      }
    } catch (error) {
      setErrorMessage("Failed to refresh logs");
    }
  };

  const handleApprove = async (projectId: string) => {
    try {
      const response = await fetch(`/api/admin/pending-projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" })
      });

      const data = await response.json();
      
      if (data.success) {
        setStatusMessage("Project approved and published successfully");
        setErrorMessage(null);
        await fetchPendingProjects();
      } else {
        setErrorMessage(data.error || "Failed to approve project");
      }
    } catch (error) {
      setErrorMessage("Failed to approve project");
    }
  };

  const handleReject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/admin/pending-projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" })
      });

      const data = await response.json();
      
      if (data.success) {
        setStatusMessage("Project rejected successfully");
        setErrorMessage(null);
        await fetchPendingProjects();
      } else {
        setErrorMessage(data.error || "Failed to reject project");
      }
    } catch (error) {
      setErrorMessage("Failed to reject project");
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case "error":
        return <XCircle size={14} className="text-red-500" />;
      case "warning":
        return <AlertCircle size={14} className="text-yellow-500" />;
      case "info":
        return <CheckCircle size={14} className="text-blue-500" />;
      default:
        return <Clock size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0b1527]/80 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/15 p-3 text-blue-300">
            <Database size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Project Discovery Engine</h2>
            <p className="text-sm text-slate-400">Automated GitHub repository ingestion by category</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300"}`}>
            {isActive ? "Running" : "Idle"}
          </span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-lg border border-white/10 bg-white/[0.06] p-2 hover:bg-white/10"
          >
            <Settings size={20} className="text-slate-100" />
          </button>
          <button
            onClick={refreshLogs}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white/[0.06] p-2 hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={20} className="text-slate-100" />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
          <h3 className="text-lg font-semibold text-foreground mb-4">Discovery Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Categories</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategories.includes(category)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted hover:bg-muted/70"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Max Results per Category</label>
                <input
                  type="number"
                  value={config.maxResultsPerCategory}
                  onChange={(e) => setConfig({ ...config, maxResultsPerCategory: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground dark:border-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Min Stars</label>
                <input
                  type="number"
                  value={config.minStars}
                  onChange={(e) => setConfig({ ...config, minStars: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground dark:border-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Min Forks</label>
                <input
                  type="number"
                  value={config.minForks}
                  onChange={(e) => setConfig({ ...config, minForks: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground dark:border-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Fetched"
          value={statistics?.totalFetched || 0}
          icon={<Database size={20} />}
          color="blue"
        />
        <StatCard
          title="New Projects"
          value={statistics?.totalInserted ?? statistics?.newProjects ?? 0}
          icon={<CheckCircle size={20} />}
          color="green"
        />
        <StatCard
          title="Skipped / Duplicates"
          value={(statistics?.totalSkipped || 0) + (statistics?.totalDuplicates ?? statistics?.duplicateProjects ?? 0)}
          icon={<XCircle size={20} />}
          color="yellow"
        />
        <StatCard
          title="Failed"
          value={statistics?.totalFailed ?? statistics?.failedImports ?? 0}
          icon={<AlertCircle size={20} />}
          color="red"
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        {!isActive ? (
          <button
            onClick={startDiscovery}
            disabled={loading || selectedCategories.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play size={16} />
                Start Discovery
              </>
            )}
          </button>
        ) : (
          <button
            onClick={stopDiscovery}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <Square size={16} />
                Stop Discovery
              </>
            )}
          </button>
        )}

        {isActive && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Discovery in progress...</span>
          </div>
        )}
      </div>

      {/* Single Category Controls */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Run Single Category</h3>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => runSingleCategory(category)}
              disabled={loading || isActive}
              className="rounded-full border border-border/70 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/60 hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-800"
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Progress */}
      {statistics?.categoriesProcessed && statistics.categoriesProcessed.length > 0 && (
        <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
          <h3 className="text-lg font-semibold text-foreground mb-4">Categories Processed</h3>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_CATEGORIES.map(category => {
              const isProcessed = statistics.categoriesProcessed.includes(category);
              const isSelected = selectedCategories.includes(category);
              return (
                <div
                  key={category}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    isProcessed
                      ? "bg-green-500/20 text-green-700 dark:text-green-400"
                      : isSelected
                      ? "bg-primary/20 text-primary"
                      : "bg-muted/30 text-muted"
                  }`}
                >
                  {category}
                  {isProcessed && " ✓"}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Discovery Logs</h3>
          </div>
          <span className="text-xs text-muted">{logs.length} entries</span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted">
              No logs available
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg bg-muted/30 p-3 text-sm dark:bg-slate-800"
              >
                {getLogIcon(log.level)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted capitalize">{log.level}</span>
                    <span className="text-xs text-muted">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-foreground mt-1">{log.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Errors */}
      {statistics?.errors && statistics.errors.length > 0 && (
        <div className="rounded-[1.5rem] border border-red-500/30 bg-red-500/10 p-6 shadow-sm dark:border-red-500/20 dark:bg-red-500/5">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Errors</h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {statistics.errors.map((error, index) => (
              <div
                key={index}
                className="rounded-lg bg-red-500/10 p-3 text-sm dark:bg-red-500/5"
              >
                <div className="font-medium text-red-900 dark:text-red-100">
                  {error.category}
                  {error.repository && ` - ${error.repository}`}
                </div>
                <div className="text-red-700 dark:text-red-300 mt-1">{error.error}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Projects */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Pending Projects</h3>
          </div>
          <button
            onClick={fetchPendingProjects}
            disabled={pendingLoading}
            className="rounded-lg border border-border/70 bg-white/[0.06] p-2 hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={16} className={`text-slate-100 ${pendingLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {pendingLoading && pendingProjects.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            Loading pending projects...
          </div>
        ) : pendingProjects.length === 0 ? (
          <div className="text-center py-8 text-muted">
            No pending projects. Start discovery to fetch projects.
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {pendingProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg border border-border/70 bg-muted/30 p-4 dark:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground truncate">{project.title}</h4>
                      <span className="text-xs text-muted bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {project.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted mb-3 line-clamp-2">{project.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <div className="flex items-center gap-1">
                        <Star size={12} />
                        <span>{project.stars.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork size={12} />
                        <span>{project.forks.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>{project.language}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-border/70 bg-white/[0.06] p-2 hover:bg-white/10"
                      title="View on GitHub"
                    >
                      <ExternalLink size={16} className="text-slate-100" />
                    </a>
                    <button
                      onClick={() => handleApprove(project.id)}
                      className="rounded-lg border border-green-500/30 bg-green-500/10 p-2 hover:bg-green-500 hover:text-white transition-colors"
                      title="Approve and Publish"
                    >
                      <ThumbsUp size={16} className="text-green-500" />
                    </button>
                    <button
                      onClick={() => handleReject(project.id)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 hover:bg-red-500 hover:text-white transition-colors"
                      title="Reject"
                    >
                      <ThumbsDown size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    red: "text-red-600 dark:text-red-400"
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
