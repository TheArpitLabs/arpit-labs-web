import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ecosystemRepository } from "@/lib/repositories/ecosystem.repository";
import { ResearchPaperForm } from "@/components/admin/ResearchPaperForm";
import { deleteResearchPaperAction } from "@/lib/actions/ecosystem-actions";
import { Microscope, FileText, Search } from "lucide-react";

interface AdminResearchPageProps {
  searchParams?: Promise<{
    edit?: string;
    division?: string;
  }>;
}

export default async function AdminResearchPage({ searchParams }: AdminResearchPageProps) {
  const params = await searchParams;
  const papers = await ecosystemRepository.getResearchPapers(params?.division);
  
  const editingPaper = params?.edit 
    ? papers.find((p) => p.id === params.edit) 
    : null;

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Research Labs Admin" 
        subtitle="Manage whitepapers, research reports, and division datasets." 
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-2/5">
          <AdminSection 
            title={editingPaper ? "Edit Paper" : "New Publication"} 
            description="Publish new research to the Arpit Labs ecosystem."
          >
            <ResearchPaperForm paper={editingPaper as any} />
          </AdminSection>
        </div>

        <div className="w-full lg:w-3/5">
          <AdminSection title="Publications" description="Your published research library.">
            {papers.length > 0 ? (
              <AdminTable headers={["Title", "Division", "Featured", "Actions"]}>
                {papers.map((paper) => (
                  <tr key={paper.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-foreground">{paper.title}</p>
                        <p className="text-xs text-muted">{paper.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="capitalize text-sm">{paper.division}</span>
                    </td>
                    <td className="px-4 py-4">
                      {paper.is_featured ? "★" : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/admin/research?edit=${paper.id}`}
                          className="rounded-lg border border-border/70 p-2 hover:border-primary"
                        >
                          <FileText size={16} />
                        </Link>
                        <form action={deleteResearchPaperAction}>
                          <input type="hidden" name="id" value={paper.id} />
                          <button className="rounded-lg border border-red-500/30 p-2 text-red-500 hover:bg-red-500 hover:text-white">
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
              <AdminEmptyState title="No papers found" description="Start by publishing your first research paper." />
            )}
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
