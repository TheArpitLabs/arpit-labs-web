import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { deleteLabAction } from "@/lib/actions/admin-actions";
import { labsRepository } from "@/lib/repositories/labs.repository";
import { LabForm } from "@/components/admin/LabForm";
import { Search } from "lucide-react";

interface AdminLabsPageProps {
  searchParams?: Promise<{
    edit?: string;
    search?: string;
    category?: string;
    published?: string;
  }>;
}

export default async function AdminLabsPage({ searchParams }: AdminLabsPageProps) {
  const params = await searchParams;

  const labs = await labsRepository.getAll(false);
  
  let filtered = labs;
  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(l => 
      l.title.toLowerCase().includes(search) ||
      l.slug.toLowerCase().includes(search)
    );
  }
  if (params?.category) {
    filtered = filtered.filter(l => l.category === params.category);
  }
  if (params?.published === "true") {
    filtered = filtered.filter(l => l.published);
  } else if (params?.published === "false") {
    filtered = filtered.filter(l => !l.published);
  }

  const editingLab = params?.edit 
    ? filtered.find(l => l.id === params.edit) || filtered.find(l => l.slug === params.edit)
    : null;

  const categories = Array.from(new Set(labs.map(l => l.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Labs CMS" 
        subtitle="Create, edit, publish, and manage hands-on labs." 
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Form Column */}
        <div className="w-full lg:w-2/5">
          <AdminSection 
            title={editingLab ? "Edit Lab" : "Create Lab"} 
            description="Manage lab content and instructions."
          >
            <LabForm lab={editingLab as any} />
          </AdminSection>
        </div>

        {/* List Column */}
        <div className="w-full lg:w-3/5 space-y-4">
          <AdminSection title="Labs" description="Filter and manage your labs.">
            <div className="mb-6 flex flex-wrap gap-4">
              <form className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    name="search"
                    defaultValue={params?.search}
                    placeholder="Search labs..."
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
                  <Link href="/admin/labs" className="flex h-10 items-center justify-center rounded-xl border border-border/70 px-4 text-sm font-medium">
                    Clear
                  </Link>
                )}
              </form>
            </div>

            {filtered.length > 0 ? (
              <AdminTable headers={["Lab", "Category", "Status", "Actions"]}>
                {filtered.map((lab) => (
                  <tr key={lab.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-foreground">{lab.title}</p>
                        <p className="text-xs text-muted">{lab.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-muted">{lab.category}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        lab.published ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {lab.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`?edit=${lab.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Edit
                        </Link>
                        <form action={deleteLabAction} method="POST" className="inline">
                          <input type="hidden" name="id" value={lab.id} />
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
              <AdminEmptyState title="No labs" description="Create your first lab to get started." />
            )}
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
