import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ecosystemRepository } from "@/lib/repositories/ecosystem.repository";
import { CommunityChapterForm } from "@/components/admin/CommunityChapterForm";
import { CommunityEventForm } from "@/components/admin/CommunityEventForm";
import { Users, Globe, Calendar, Plus } from "lucide-react";

interface AdminCommunityPageProps {
  searchParams?: Promise<{
    editChapter?: string;
    editEvent?: string;
    tab?: "chapters" | "events";
  }>;
}

export default async function AdminCommunityPage({ searchParams }: AdminCommunityPageProps) {
  const params = await searchParams;
  const activeTab = params?.tab || "chapters";
  
  const [chapters, events] = await Promise.all([
    ecosystemRepository.getCommunityChapters(),
    ecosystemRepository.getCommunityEvents()
  ]);
  
  const editingChapter = params?.editChapter 
    ? chapters.find((c) => c.id === params.editChapter) 
    : null;

  const editingEvent = params?.editEvent
    ? events.find((e) => e.id === params.editEvent)
    : null;

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Global Community" 
        subtitle="Manage regional chapters, country ambassadors, and global events." 
      />

      <div className="flex gap-4 border-b border-border/70">
        <Link 
          href="/admin/community?tab=chapters" 
          className={`pb-4 text-sm font-bold transition ${activeTab === "chapters" ? "border-b-2 border-primary text-primary" : "text-muted hover:text-foreground"}`}
        >
          Chapters
        </Link>
        <Link 
          href="/admin/community?tab=events" 
          className={`pb-4 text-sm font-bold transition ${activeTab === "events" ? "border-b-2 border-primary text-primary" : "text-muted hover:text-foreground"}`}
        >
          Events
        </Link>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-2/5">
          {activeTab === "chapters" ? (
            <AdminSection 
              title={editingChapter ? "Edit Chapter" : "New Chapter"} 
              description="Establish a new regional chapter for Arpit Labs."
            >
              <CommunityChapterForm chapter={editingChapter as any} />
            </AdminSection>
          ) : (
            <AdminSection 
              title={editingEvent ? "Edit Event" : "Schedule Event"} 
              description="Create community events for your chapters."
            >
              <CommunityEventForm event={editingEvent as any} chapters={chapters} />
            </AdminSection>
          )}
        </div>

        <div className="w-full lg:w-3/5">
          {activeTab === "chapters" ? (
            <AdminSection title="Regional Chapters" description="Active communities worldwide.">
              {chapters.length > 0 ? (
                <AdminTable headers={["Chapter", "Country", "Members", "Actions"]}>
                  {chapters.map((chapter) => (
                    <tr key={chapter.id} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Globe size={16} />
                          </div>
                          <p className="font-semibold text-foreground">{chapter.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">{chapter.country}</td>
                      <td className="px-4 py-4 text-sm">{chapter.member_count}</td>
                      <td className="px-4 py-4">
                        <Link 
                          href={`/admin/community?tab=chapters&editChapter=${chapter.id}`}
                          className="rounded-lg border border-border/70 p-2 hover:border-primary inline-block"
                        >
                          <Users size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </AdminTable>
              ) : (
                <AdminEmptyState title="No chapters" description="Expand the ecosystem by creating your first chapter." />
              )}
            </AdminSection>
          ) : (
            <AdminSection title="Community Events" description="Upcoming events and meetups.">
              {events.length > 0 ? (
                <AdminTable headers={["Event", "Chapter", "Date", "Actions"]}>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-foreground">{event.title}</p>
                          <p className="text-xs text-muted capitalize">{event.event_type}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">{event.community_chapters?.name}</td>
                      <td className="px-4 py-4 text-sm">
                        {new Date(event.start_time).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <Link 
                          href={`/admin/community?tab=events&editEvent=${event.id}`}
                          className="rounded-lg border border-border/70 p-2 hover:border-primary inline-block"
                        >
                          <Calendar size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </AdminTable>
              ) : (
                <AdminEmptyState title="No events" description="Schedule your first community event." />
              )}
            </AdminSection>
          )}
        </div>
      </div>
    </div>
  );
}
