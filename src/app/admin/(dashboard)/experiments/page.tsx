import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { deleteExperimentAction } from "@/lib/actions/admin-actions";
import { experimentsRepository } from "@/lib/repositories/experiments.repository";
import { ExperimentForm } from "@/components/admin/ExperimentForm";
import { Search, Beaker } from "lucide-react";

interface AdminExperimentsPageProps {
  searchParams?: Promise<{
    edit?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function AdminExperimentsPage({ searchParams }: AdminExperimentsPageProps) {
  const params = await searchParams;
  const filters = {
    search: params?.search,
    status: params?.status,
  };

  const experiments = await experimentsRepository.getExperiments(filters);
  const editingExperiment = params?.edit ? experiments.find((e) => e.id === params.edit) || await experimentsRepository.getExperimentBySlug(params.edit).catch(() => null) : null;

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Experiments CMS" 
        subtitle="Manage research prototypes, technical experiments, and lab status." 
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Form Column */}
        <div className="w-full lg:w-2/5">
          <AdminSection 
            title={editingExperiment ? "Edit Experiment" : "New Experiment"} 
            description="Document your technical research and prototypes."
          >
            <ExperimentForm experiment={editingExperiment as any} />
          </AdminSection>
        </div>

        {/* List Column */}
        <div className="w-full lg:w-3/5 space-y-4">
          <AdminSection title="Lab Log" description="Current status of all active and archived experiments.">
            <div className="mb-6 flex flex-wrap gap-4">
              <form className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    name="search"
                    defaultValue={params?.search}
                    placeholder="Search experiments..."
                    className="h-10 w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
                  />
                </div>
                <select
                  name="status"
                  defaultValue={params?.status}
                  className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button type="submit" className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
                  Filter
                </button>
              </form>
            </div>

            {experiments.length > 0 ? (
              <AdminTable headers={["Experiment", "Status", "Actions"]}>
                {experiments.map((exp) => (
                  <tr key={exp.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                          <Beaker className="h-4 w-4 text-muted" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{exp.title}</p>
                          <p className="text-xs text-muted">{exp.category || "General"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        exp.status === "completed" ? "bg-green-500/10 text-green-500" : 
                        exp.status === "in-progress" ? "bg-blue-500/10 text-blue-500" : 
                        "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/admin/experiments?edit=${exp.id}`}
                          className="rounded-lg border border-border/70 p-2 text-foreground transition hover:border-primary hover:text-primary"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </Link>
                        <form action={deleteExperimentAction} onSubmit={(e) => !confirm("Delete this experiment?") && e.preventDefault()}>
                          <input type="hidden" name="id" value={exp.id} />
                          <button 
                            type="submit"
                            className="rounded-lg border border-red-500/30 p-2 text-red-500 transition hover:bg-red-500 hover:text-white"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </AdminTable>
            ) : (
              <AdminEmptyState title="Empty lab" description="No experiments found. Start by documenting your latest research." />
            )}
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
