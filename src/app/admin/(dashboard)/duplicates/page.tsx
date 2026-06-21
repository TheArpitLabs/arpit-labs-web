import { supabaseServer } from "@/lib/supabase/server";
import { Database, ShieldCheck, AlertTriangle, CheckCircle, XCircle, GitMerge, Ban, Plus } from "lucide-react";
import { AdminTable } from "@/components/admin/AdminTable";

interface DuplicateCheck {
  id: string;
  is_duplicate: boolean;
  duplicate_type: string;
  confidence: number;
  queue_item?: {
    title?: string;
    provider?: string;
  };
}

interface QueueItem {
  id: string;
  title?: string;
  provider?: string;
  source_url?: string;
  repository_url?: string;
  status?: string;
}

export default async function AdminDuplicatesPage() {
  // Fetch duplicate checks
  const { data: duplicateChecks } = await supabaseServer
    .from("duplicate_checks")
    .select(`
      *,
      queue_item:content_acquisition_queue(
        id,
        title,
        provider,
        source_url,
        repository_url,
        status
      )
    `)
    .order("checked_at", { ascending: false })
    .limit(50);

  // Fetch queue items with potential duplicates
  const { data: queueItems } = await supabaseServer
    .from("content_acquisition_queue")
    .select("*")
    .in("status", ["queued", "analyzing"])
    .order("created_at", { ascending: false })
    .limit(20);

  const duplicates = duplicateChecks?.filter((check: DuplicateCheck) => check.is_duplicate) || [];
  const potentialDuplicates = duplicateChecks?.filter((check: DuplicateCheck) => check.duplicate_type === "potential") || [];
  const exactDuplicates = duplicateChecks?.filter((check: DuplicateCheck) => check.duplicate_type === "exact") || [];

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Duplicate Detection Engine</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Duplicate Management</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              Manage duplicate projects, resources, and research papers. Review similarity scores and resolve conflicts before publishing.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck size={16} />
            Protected
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={<AlertTriangle size={18} />} label="Exact Duplicates" value={exactDuplicates.length} color="text-red-600 dark:text-red-400" />
        <Metric icon={<Database size={18} />} label="Potential Duplicates" value={potentialDuplicates.length} color="text-amber-600 dark:text-amber-400" />
        <Metric icon={<CheckCircle size={18} />} label="Checks Performed" value={duplicateChecks?.length || 0} color="text-emerald-600 dark:text-emerald-400" />
        <Metric icon={<ShieldCheck size={18} />} label="Queue Items" value={queueItems?.length || 0} color="text-primary" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <div className="mb-5 flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              <h2 className="text-xl font-semibold text-foreground">Exact Duplicates</h2>
            </div>
            <AdminTable headers={["Title", "Provider", "Confidence", "Type", "Action"]}>
              {exactDuplicates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                    No exact duplicates detected
                  </td>
                </tr>
              ) : (
                exactDuplicates.map((check: DuplicateCheck) => (
                  <tr key={check.id}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{check.queue_item?.title}</td>
                    <td className="px-4 py-3 text-sm capitalize text-muted">{check.queue_item?.provider}</td>
                    <td className="px-4 py-3 text-sm text-muted">{(check.confidence * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-sm text-muted">{check.duplicate_type}</td>
                    <td className="px-4 py-3 text-sm text-muted">
                      <DuplicateActions check={check} />
                    </td>
                  </tr>
                ))
              )}
            </AdminTable>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <div className="mb-5 flex items-center gap-3">
              <Database size={20} className="text-amber-600 dark:text-amber-400" />
              <h2 className="text-xl font-semibold text-foreground">Potential Duplicates</h2>
            </div>
            <AdminTable headers={["Title", "Provider", "Confidence", "Type", "Action"]}>
              {potentialDuplicates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                    No potential duplicates detected
                  </td>
                </tr>
              ) : (
                potentialDuplicates.map((check: any) => (
                  <tr key={check.id}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{check.queue_item?.title}</td>
                    <td className="px-4 py-3 text-sm capitalize text-muted">{check.queue_item?.provider}</td>
                    <td className="px-4 py-3 text-sm text-muted">{(check.confidence * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-sm text-muted">{check.duplicate_type}</td>
                    <td className="px-4 py-3 text-sm text-muted">
                      <DuplicateActions check={check} />
                    </td>
                  </tr>
                ))
              )}
            </AdminTable>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck size={20} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Detection Layers</h2>
            </div>
            <div className="space-y-3 text-sm text-muted">
              <div className="flex items-center justify-between gap-3">
                <span>URL Normalization</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Repository ID Matching</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Content Hashing</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>AI Similarity Engine</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Cross-Source Resolution</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <h2 className="text-lg font-semibold text-foreground">Similarity Rules</h2>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <div className="flex items-center justify-between gap-3">
                <span>&gt;95% similarity</span>
                <span className="font-semibold text-red-600">Auto Reject</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>80-95% similarity</span>
                <span className="font-semibold text-amber-600">Manual Review</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>&lt;80% similarity</span>
                <span className="font-semibold text-emerald-600">Proceed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, color = "text-primary" }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
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

function DuplicateActions({ check }: { check: any }) {
  return (
    <div className="flex items-center gap-2">
      {check.recommendation === "auto_reject" ? (
        <button className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-500/20 dark:text-red-300">
          <Ban size={12} />
          Reject
        </button>
      ) : check.recommendation === "manual_review" ? (
        <>
          <button className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">
            <GitMerge size={12} />
            Merge
          </button>
          <button className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-500/20 dark:text-red-300">
            <Ban size={12} />
            Reject
          </button>
          <button className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">
            <Plus size={12} />
            Import New
          </button>
        </>
      ) : (
        <span className="text-xs text-muted">No action</span>
      )}
    </div>
  );
}
