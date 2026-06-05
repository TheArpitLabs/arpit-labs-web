import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { deleteCourseAction } from "@/lib/actions/admin-actions";
import { coursesRepository } from "@/lib/repositories/courses.repository";
import { CourseForm } from "@/components/admin/CourseForm";
import { Search, Filter, Plus, Trash2 } from "lucide-react";

interface AdminCoursesPageProps {
  searchParams?: Promise<{
    edit?: string;
    search?: string;
    category?: string;
    published?: string;
  }>;
}

export default async function AdminCoursesPage({ searchParams }: AdminCoursesPageProps) {
  const params = await searchParams;

  const courses = await coursesRepository.getAll(false);
  
  let filtered = courses;
  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(c => 
      c.title.toLowerCase().includes(search) ||
      c.slug.toLowerCase().includes(search)
    );
  }
  if (params?.category) {
    filtered = filtered.filter(c => c.category === params.category);
  }
  if (params?.published === "true") {
    filtered = filtered.filter(c => c.published);
  } else if (params?.published === "false") {
    filtered = filtered.filter(c => !c.published);
  }

  const editingCourse = params?.edit 
    ? filtered.find(c => c.id === params.edit) || filtered.find(c => c.slug === params.edit)
    : null;

  const categories = Array.from(new Set(courses.map(c => c.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Courses CMS" 
        subtitle="Create, edit, publish, and manage courses." 
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Form Column */}
        <div className="w-full lg:w-2/5">
          <AdminSection 
            title={editingCourse ? "Edit Course" : "Create Course"} 
            description="Manage course content and metadata."
          >
            <CourseForm course={editingCourse as any} />
          </AdminSection>
        </div>

        {/* List Column */}
        <div className="w-full lg:w-3/5 space-y-4">
          <AdminSection title="Courses" description="Filter and manage your courses.">
            <div className="mb-6 flex flex-wrap gap-4">
              <form className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    name="search"
                    defaultValue={params?.search}
                    placeholder="Search courses..."
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
                  <Link href="/admin/courses" className="flex h-10 items-center justify-center rounded-xl border border-border/70 px-4 text-sm font-medium">
                    Clear
                  </Link>
                )}
              </form>
            </div>

            {filtered.length > 0 ? (
              <AdminTable headers={["Course", "Category", "Status", "Actions"]}>
                {filtered.map((course) => (
                  <tr key={course.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-foreground">{course.title}</p>
                        <p className="text-xs text-muted">{course.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-muted">{course.category}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        course.published ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {course.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`?edit=${course.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Edit
                        </Link>
                        <form action={deleteCourseAction} method="POST" className="inline">
                          <input type="hidden" name="id" value={course.id} />
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
              <AdminEmptyState title="No courses" description="Create your first course to get started." />
            )}
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
