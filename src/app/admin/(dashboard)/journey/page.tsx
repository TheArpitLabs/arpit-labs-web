import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { journeyRepository } from "@/lib/repositories/journey.repository";
import { JourneyForm } from "@/components/admin/JourneyForm";
import { SortableJourneyList } from "@/components/admin/SortableJourneyList";

interface AdminJourneyPageProps {
  searchParams?: Promise<{
    edit?: string;
  }>;
}

export default async function AdminJourneyPage({ searchParams }: AdminJourneyPageProps) {
  const params = await searchParams;
  const items = await journeyRepository.getJourneyTimeline();
  const editingItem = params?.edit ? items.find((item) => item.id === params.edit) : null;

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Journey CMS" 
        subtitle="Maintain timeline entries, achievements, and professional milestones." 
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Form Column */}
        <div className="w-full lg:w-1/3">
          <AdminSection 
            title={editingItem ? "Edit Milestone" : "Add Milestone"} 
            description="Document a new step in your professional timeline."
          >
            <JourneyForm entry={editingItem as any} />
          </AdminSection>
        </div>

        {/* List Column */}
        <div className="w-full lg:w-2/3 space-y-4">
          <AdminSection title="Timeline Sequence" description="Drag and drop entries to reorder how they appear on the site.">
            {items.length > 0 ? (
              <SortableJourneyList initialItems={items} />
            ) : (
              <AdminEmptyState title="Timeline is empty" description="Add your first milestone to start building your story." />
            )}
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
