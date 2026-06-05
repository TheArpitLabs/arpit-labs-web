import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { deleteRoadmapAction } from "@/lib/actions/admin-actions";
import { roadmapsRepository } from "@/lib/repositories/roadmaps.repository";
import { RoadmapForm } from "@/components/admin/RoadmapForm";
import { Search } from "lucide-react";

interface AdminRoadmapsPageProps {
  searchParams?: Promise<{
    edit?: string;
    search?: string;
    category?: string;
    published?: string;
  }>;
}

export default async function AdminRoadmapsPage({ searchParams }: AdminRoadmapsPageProps) {
  const params = await searchParams;

  const roadmaps = await roadmapsRepository.getAll(false);
  
  let filtered = roadmaps;
  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(r => 
      r.title.toLowerCase().includes(search) ||
      r.slug.toLowerCase().includes(search)
    );
  }
  if (params?.category) {
    filtered = filtered.filter(r => r.category === params.category);
  }
  if (params?.published === "true") {
    filtered = filtered.filter(r => r.published);
  } else if (params?.published === "false") {
    filtered = filtered.filter(r => !r.published);
  }

  const editingRoadmap = params?.edit 
    ? filtered.find(r => r.id === params.edit) || filtered.find(r => r.slug === params.edit)
    : null;

  const categories = Array.from(new Set(roadmaps.map(r => r.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Roadmaps CMS" 
        subtitle="Create, edit, publish, and manage learning roadmaps." 
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Form Column */}
        <div className="w-full lg:w-2/5">
          <AdminSection 
            title={editingRoadmap ? "Edit Roadmap" : "Create Roadmap"} 
            description="Manage roadmap content and structure."
          >
            <RoadmapForm roadmap={editingRoadmap as any} />
          </AdminSection>
        </div>

        {/* List Column */}
        <div className="w-full lg:w-3/5 space-y-4">
          <AdminSection title="Roadmaps" description="Filter and manage your roadmaps.">
            <div className="mb-6 flex flex-wrap gap-4">
              <form className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    name="search"
                    defaultValue={params?.search}
                    placeholder="Search roadmaps..."
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
                <button type="submit" className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
                  Apply
                </button>
                {Object.keys(params || {}).length > 0 && (
                  <Link href="/admin/roadmaps" className="flex h-10 items-center justify-center rounded-xl border border-border/70 px-4 text-sm font-medium">
                    Clear
                  </Link>
                )}
              </form>
            </div>

            {filtered.length > 0 ? (
              <AdminTable headers={["Roadmap", "Category", "Status", "Actions"]}>
                {filtered.map((roadmap) => (
                  <tr key={roadmap.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-foreground">{roadmap.title}</p>
                        <p className="text-xs text-muted">{roadmap.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-muted">{roadmap.category}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        roadmap.published ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {roadmap.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`?edit=${roadmap.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Edit
                        </Link>
                        <form action={deleteRoadmapAction} method="POST" className="inline">
                          <input type="hidden" name="id" value={roadmap.id} />
                          <button 
                            type="submit"
                            className="text-xs font-medium text-red-500 hover:text-red-600"
                            onClick={(e) => !confirm("Are you sure?") && e.preventDefault()}
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </AdminTable>
            ) : (
              <AdminEmptyState title="No roadmaps" description="Create your first roadmap to get started." />
            )}
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
