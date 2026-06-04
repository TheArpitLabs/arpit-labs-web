import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { deleteLabNoteAction } from "@/lib/actions/admin-actions";
import { labNotesRepository } from "@/lib/repositories/labnotes.repository";
import { BlogForm } from "@/components/admin/BlogForm";
import { Search, Plus, Filter } from "lucide-react";

interface AdminBlogPageProps {
  searchParams?: Promise<{
    edit?: string;
    search?: string;
    category?: string;
  }>;
}

export default async function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  const params = await searchParams;
  const filters = {
    search: params?.search,
    category: params?.category,
  };

  const notes = await labNotesRepository.getLabNotes(filters);
  const editingNote = params?.edit ? notes.find((n) => n.id === params.edit) || await labNotesRepository.getLabNoteBySlug(params.edit).catch(() => null) : null;

  const categories = Array.from(new Set(notes.map(n => n.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Blog CMS" 
        subtitle="Draft, publish, and maintain technical articles from the lab." 
      />

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Form Column */}
        <div className="w-full xl:w-1/2">
          <AdminSection 
            title={editingNote ? "Edit Article" : "Compose New Article"} 
            description="Use the rich text editor to craft technical content."
          >
            <BlogForm note={editingNote as any} />
          </AdminSection>
        </div>

        {/* List Column */}
        <div className="w-full xl:w-1/2 space-y-4">
          <AdminSection title="Publication Archive" description="Manage existing lab notes and their visibility.">
            <div className="mb-6 flex flex-wrap gap-4">
              <form className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    name="search"
                    defaultValue={params?.search}
                    placeholder="Search articles..."
                    className="h-10 w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
                  />
                </div>
                <button type="submit" className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
                  Search
                </button>
              </form>
            </div>

            {notes.length > 0 ? (
              <AdminTable headers={["Article", "Status", "Actions"]}>
                {notes.map((note) => (
                  <tr key={note.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-4">
                      <div className="max-w-[200px] sm:max-w-xs">
                        <p className="truncate font-semibold text-foreground">{note.title}</p>
                        <p className="text-xs text-muted">{note.category || "Uncategorized"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        note.published ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {note.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/admin/blog?edit=${note.id}`}
                          className="rounded-lg border border-border/70 p-2 text-foreground transition hover:border-primary hover:text-primary"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </Link>
                        <form action={deleteLabNoteAction} onSubmit={(e) => !confirm("Delete this article?") && e.preventDefault()}>
                          <input type="hidden" name="id" value={note.id} />
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
              <AdminEmptyState title="No articles found" description="Try a different search term or start writing a new one." />
            )}
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
