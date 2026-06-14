import { Database, GitBranch, SearchCheck, ShieldCheck, Sparkles, UploadCloud, CheckCircle, XCircle, Rocket } from "lucide-react";
import { AdminTable } from "@/components/admin/AdminTable";
import { GitHubImportForm } from "@/components/admin/GitHubImportForm";
import { AcquisitionActions } from "@/components/admin/AcquisitionActions";
import { ProjectAnalysisReview } from "@/components/admin/ProjectAnalysisReview";
import { listAcquisitionQueue, knowledgeFeatureFlags } from "@/lib/knowledge-ecosystem";

const providers = ["GitHub", "GitLab", "Devpost", "Kaggle", "Hugging Face", "arXiv", "Research Paper"];

export default async function AdminAcquisitionPage() {
  const queue = await safeLoadQueue();
  const queuedCount = queue.filter((item: any) => item.status === "queued").length;
  const approvedCount = queue.filter((item: any) => item.status === "approved").length;
  const duplicateCount = queue.filter((item: any) => item.status === "duplicate").length;
  const featureEnabled = knowledgeFeatureFlags.acquisitionEngine;

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Knowledge Ecosystem</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Content Acquisition Engine</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              Import, queue, review, deduplicate, analyze, and approve engineering knowledge from developer,
              research, dataset, and hackathon sources.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck size={16} />
            Feature flagged
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={<UploadCloud size={18} />} label="Queued" value={queuedCount} />
        <Metric icon={<ShieldCheck size={18} />} label="Approved" value={approvedCount} />
        <Metric icon={<SearchCheck size={18} />} label="Duplicates" value={duplicateCount} />
        <Metric icon={<Sparkles size={18} />} label="Providers" value={providers.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <GitHubImportForm featureEnabled={featureEnabled} />
          
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <div className="mb-5 flex items-center gap-3">
              <Database size={20} className="text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Review Queue</h2>
            </div>
            <AdminTable headers={["Source", "Title", "Status", "Analysis", "Actions"]}>
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                    No acquisition candidates yet. Use the GitHub import form above to add repositories.
                  </td>
                </tr>
              ) : (
                queue.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm font-medium capitalize text-foreground">{item.provider}</td>
                    <td className="px-4 py-3 text-sm text-muted">{item.title}</td>
                    <td className="px-4 py-3 text-sm capitalize text-muted">{item.status}</td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {item.ai_analysis_status === "completed" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle size={12} />
                          Analyzed
                        </span>
                      ) : item.ai_analysis_status === "failed" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
                          <XCircle size={12} />
                          Failed
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      <AcquisitionActions item={item} />
                    </td>
                  </tr>
                ))
              )}
            </AdminTable>
          </div>

          {/* Show analysis review for the first queued item */}
          {queue.length > 0 && queue[0].status === "queued" && (
            <ProjectAnalysisReview queueItem={queue[0]} />
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <div className="mb-4 flex items-center gap-3">
              <GitBranch size={20} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Supported Sources</h2>
            </div>
            <div className="grid gap-2">
              {providers.map((provider) => (
                <div key={provider} className="rounded-xl border border-border/70 px-3 py-2 text-sm text-muted dark:border-slate-800">
                  {provider}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
            <h2 className="text-lg font-semibold text-foreground">Engine Flags</h2>
            <div className="mt-4 space-y-2 text-sm text-muted">
              {Object.entries(knowledgeFeatureFlags).map(([flag, enabled]) => (
                <div key={flag} className="flex items-center justify-between gap-3">
                  <span>{flag}</span>
                  <span className={enabled ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>
                    {enabled ? "On" : "Off"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function safeLoadQueue() {
  try {
    return await listAcquisitionQueue();
  } catch (error) {
    console.error("Failed to load acquisition queue:", error);
    return [];
  }
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center justify-between">
        <div className="text-primary">{icon}</div>
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-muted">{label}</p>
    </div>
  );
}
