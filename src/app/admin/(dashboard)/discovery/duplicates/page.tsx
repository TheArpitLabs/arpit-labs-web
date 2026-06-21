import { supabaseServer } from "@/lib/supabase/server";
import { ShieldCheck, AlertTriangle, Database, GitMerge, Ban, Trash2, CheckCircle, RefreshCw } from "lucide-react";
import { AdminTable } from "@/components/admin/AdminTable";

interface DuplicateRepository {
  id: string;
  title: string;
  github_url: string;
  github_repository_id?: number;
  normalized_github_url?: string;
  github_owner?: string;
  github_repo_name?: string;
  duplicate_count?: number;
}

export default async function DiscoveryDuplicatesPage() {
  // Fetch projects with potential duplicates based on repository identity
  const { data: projects } = await supabaseServer
    .from("projects")
    .select(`
      id,
      title,
      github_url,
      github_repository_id,
      normalized_github_url,
      github_owner,
      github_repo_name
    `)
    .not('github_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  // Find duplicates by repository ID using raw SQL
  const { data: repoIdDuplicates } = await supabaseServer
    .rpc('find_duplicate_repository_ids');

  // Find duplicates by normalized URL using raw SQL
  const { data: normalizedUrlDuplicates } = await supabaseServer
    .rpc('find_duplicate_normalized_urls');

  // Find duplicates by title using raw SQL
  const { data: titleDuplicates } = await supabaseServer
    .rpc('find_duplicate_titles');

  // Calculate duplicate statistics
  const totalProjects = projects?.length || 0;
  const repoIdDuplicateCount = repoIdDuplicates?.length || 0;
  const normalizedUrlDuplicateCount = normalizedUrlDuplicates?.length || 0;
  const titleDuplicateCount = titleDuplicates?.length || 0;
  const totalDuplicateGroups = repoIdDuplicateCount + normalizedUrlDuplicateCount + titleDuplicateCount;

  // Fetch discovery logs for duplicate attempts
  const { data: discoveryLogs } = await supabaseServer
    .from('discovery_logs')
    .select('*')
    .eq('status', 'skipped')
    .order('created_at', { ascending: false })
    .limit(20);

  // Get repository identity health statistics
  const { data: healthStats }: any = await supabaseServer
    .rpc('get_repository_identity_health')
    .single();

  // Get discovery statistics
  const { data: allDiscoveryLogs } = await supabaseServer
    .from('discovery_logs')
    .select('status')
    .order('created_at', { ascending: false })
    .limit(1000);

  const totalDiscoveryOps = allDiscoveryLogs?.length || 0;
  const skippedCount = allDiscoveryLogs?.filter((log: any) => log.status === 'skipped').length || 0;
  const importedCount = allDiscoveryLogs?.filter((log: any) => log.status === 'imported').length || 0;
  const errorCount = allDiscoveryLogs?.filter((log: any) => log.status === 'error').length || 0;
  const duplicateRate = totalDiscoveryOps > 0 ? Math.round((skippedCount / totalDiscoveryOps) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Discovery Engine</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Repository Duplicate Audit</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              Manage duplicate GitHub repositories detected by URL normalization and repository ID matching. Review, merge, or remove duplicate entries.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck size={16} />
            Protected
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={<Database size={18} />} label="Total Repositories" value={totalProjects} color="text-primary" />
        <Metric icon={<AlertTriangle size={18} />} label="Duplicate Groups" value={totalDuplicateGroups} color="text-red-600 dark:text-red-400" />
        <Metric icon={<ShieldCheck size={18} />} label="Duplicates Prevented" value={skippedCount} color="text-amber-600 dark:text-amber-400" />
        <Metric icon={<CheckCircle size={18} />} label="Identity Health" value={`${healthStats?.identity_health_score || 0}%`} color="text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Repository ID Duplicates */}
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <div className="mb-5 flex items-center gap-3">
              <Database size={20} className="text-red-600 dark:text-red-400" />
              <h2 className="text-xl font-semibold text-foreground">Repository ID Duplicates</h2>
              <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
                {repoIdDuplicateCount} groups
              </span>
            </div>
            <AdminTable headers={["Repository", "Owner/Repo", "ID", "Actions"]}>
              {repoIdDuplicateCount === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                    No repository ID duplicates detected
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                    Duplicate detection active - {repoIdDuplicateCount} groups found
                  </td>
                </tr>
              )}
            </AdminTable>
          </div>

          {/* Normalized URL Duplicates */}
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <div className="mb-5 flex items-center gap-3">
              <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
              <h2 className="text-xl font-semibold text-foreground">Normalized URL Duplicates</h2>
              <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                {normalizedUrlDuplicateCount} groups
              </span>
            </div>
            <AdminTable headers={["Repository", "Normalized URL", "Count", "Actions"]}>
              {normalizedUrlDuplicateCount === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                    No normalized URL duplicates detected
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                    Duplicate detection active - {normalizedUrlDuplicateCount} groups found
                  </td>
                </tr>
              )}
            </AdminTable>
          </div>

          {/* Title Duplicates */}
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <div className="mb-5 flex items-center gap-3">
              <AlertTriangle size={20} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-foreground">Title Duplicates</h2>
              <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                {titleDuplicateCount} groups
              </span>
            </div>
            <AdminTable headers={["Title", "Count", "Actions"]}>
              {titleDuplicateCount === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted">
                    No title duplicates detected
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted">
                    Duplicate detection active - {titleDuplicateCount} groups found
                  </td>
                </tr>
              )}
            </AdminTable>
          </div>
        </div>

        <div className="space-y-4">
          {/* Detection Layers */}
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck size={20} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Detection Layers</h2>
            </div>
            <div className="space-y-3 text-sm text-muted">
              <div className="flex items-center justify-between gap-3">
                <span>Repository ID Matching</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>URL Normalization</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Original URL Check</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Title Similarity</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
            </div>
          </div>

          {/* Recent Duplicate Attempts */}
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <div className="mb-4 flex items-center gap-3">
              <RefreshCw size={20} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Recent Duplicate Attempts</h2>
            </div>
            <div className="space-y-3">
              {discoveryLogs && discoveryLogs.length > 0 ? (
                discoveryLogs.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-900">
                    <div className="font-medium text-foreground">{log.repository}</div>
                    <div className="mt-1 text-muted">{log.reason}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted">
                  No duplicate attempts logged
                </div>
              )}
            </div>
          </div>

          {/* Available Actions */}
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <h2 className="text-lg font-semibold text-foreground">Available Actions</h2>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <div className="flex items-center gap-2">
                <GitMerge size={14} className="text-emerald-600" />
                <span>Merge duplicates into single entry</span>
              </div>
              <div className="flex items-center gap-2">
                <Trash2 size={14} className="text-red-600" />
                <span>Delete duplicate entries</span>
              </div>
              <div className="flex items-center gap-2">
                <Ban size={14} className="text-amber-600" />
                <span>Ignore specific duplicates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, color = "text-primary" }: { icon: React.ReactNode; label: string; value: number | string; color?: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-5 shadow-sm dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className={color}>{icon}</div>
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-muted">{label}</p>
    </div>
  );
}
