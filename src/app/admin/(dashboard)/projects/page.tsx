import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { deleteProjectAction, saveProjectAction } from "@/lib/actions/admin-actions";
import { projectsRepository } from "@/lib/repositories/projects.repository";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { Search, Filter, Plus } from "lucide-react";

interface AdminProjectsPageProps {
  searchParams?: Promise<{
    edit?: string;
    search?: string;
    category?: string;
    status?: string;
  }>;
}

export default async function AdminProjectsPage({ searchParams }: AdminProjectsPageProps) {
  const params = await searchParams;
  const filters = {
    search: params?.search,
    category: params?.category,
    status: params?.status as 'draft' | 'published' | 'archived' | undefined,
  };

  const projectsResult = await projectsRepository.getProjects(filters);
  const projects = projectsResult.data;
  const editingProject = params?.edit ? projects.find((p) => p.id === params.edit) || await projectsRepository.getProjectBySlug(params.edit).catch(() => null) : null;

  const categories = Array.from(new Set(projects.map(p => p.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Projects CMS" 
        subtitle="Create, edit, publish, and retire engineering projects from one place." 
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Form Column */}
        <div className="w-full lg:w-2/5">
          <AdminSection 
            title={editingProject ? "Edit Project" : "Create Project"} 
            description="Manage project content, media, and metadata."
          >
            <ProjectForm project={editingProject as any} />
          </AdminSection>
        </div>

        {/* List Column */}
        <div className="w-full lg:w-3/5 space-y-4">
          <AdminSection title="Inventory" description="Filter and manage your project portfolio.">
            <div className="mb-6 flex flex-wrap gap-4">
              <form className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    name="search"
                    defaultValue={params?.search}
                    placeholder="Search projects..."
                    className="h-10 w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
                  />
                </div>
                <select
                  name="category"
                  defaultValue={params?.category}
                  className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  name="status"
                  defaultValue={params?.status}
                  className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <button type="submit" className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
                  Apply
                </button>
                {Object.keys(params || {}).length > 0 && (
                  <Link href="/admin/projects" className="flex h-10 items-center justify-center rounded-xl border border-border/70 px-4 text-sm font-medium">
                    Clear
                  </Link>
                )}
              </form>
            </div>

            {projects.length > 0 ? (
              <AdminTable headers={["Project", "Status", "Featured", "Actions"]}>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-foreground">{project.title}</p>
                        <p className="text-xs text-muted">{project.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        project.status === 'published' ? "bg-green-500/10 text-green-500" : 
                        project.status === 'archived' ? "bg-gray-500/10 text-gray-500" :
                        "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {project.featured ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                          ★
                        </span>
                      ) : (
                        <span className="text-muted/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/admin/projects?edit=${project.id}`}
                          className="rounded-lg border border-border/70 p-2 text-foreground transition hover:border-primary hover:text-primary"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </Link>
                        {project.status === 'draft' && (
                          <form action={async () => {
                            'use server';
                            const { projectsRepository } = await import('@/lib/repositories/projects.repository');
                            await projectsRepository.updateProject(project.id, { status: 'published' });
                          }}>
                            <input type="hidden" name="id" value={project.id} />
                            <button 
                              type="submit"
                              className="rounded-lg border border-green-500/30 p-2 text-green-500 transition hover:bg-green-500 hover:text-white"
                              title="Approve/Publish"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          </form>
                        )}
                        {project.status === 'published' && (
                          <form action={async () => {
                            'use server';
                            const { projectsRepository } = await import('@/lib/repositories/projects.repository');
                            await projectsRepository.updateProject(project.id, { status: 'draft' });
                          }}>
                            <input type="hidden" name="id" value={project.id} />
                            <button 
                              type="submit"
                              className="rounded-lg border border-yellow-500/30 p-2 text-yellow-500 transition hover:bg-yellow-500 hover:text-white"
                              title="Unpublish/Reject"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          </form>
                        )}
                        <form action={async () => {
                          'use server';
                          const { projectsRepository } = await import('@/lib/repositories/projects.repository');
                          await projectsRepository.updateProject(project.id, { featured: !project.featured });
                        }}>
                          <input type="hidden" name="id" value={project.id} />
                          <button 
                            type="submit"
                            className={`rounded-lg border p-2 transition hover:text-white ${
                              project.featured 
                                ? 'border-yellow-500/30 text-yellow-500 hover:bg-yellow-500' 
                                : 'border-primary/30 text-primary hover:bg-primary'
                            }`}
                            title={project.featured ? 'Unfeature' : 'Feature'}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        </form>
                        <form action={async () => {
                          'use server';
                          const { projectsRepository } = await import('@/lib/repositories/projects.repository');
                          await projectsRepository.updateProject(project.id, { status: 'archived' });
                        }}>
                          <input type="hidden" name="id" value={project.id} />
                          <button 
                            type="submit"
                            className="rounded-lg border border-gray-500/30 p-2 text-gray-500 transition hover:bg-gray-500 hover:text-white"
                            title="Archive"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </button>
                        </form>
                        <form action={deleteProjectAction} onSubmit={(e) => !confirm("Delete this project?") && e.preventDefault()}>
                          <input type="hidden" name="id" value={project.id} />
                          <button 
                            type="submit"
                            className="rounded-lg border border-red-500/30 p-2 text-red-500 transition hover:bg-red-500 hover:text-white"
                            title="Delete"
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
              <AdminEmptyState title="No matches found" description="Try adjusting your filters or create a new project." />
            )}
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
