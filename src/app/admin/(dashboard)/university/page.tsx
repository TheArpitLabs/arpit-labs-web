import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ecosystemRepository } from "@/lib/repositories/ecosystem.repository";
import { CertificationForm } from "@/components/admin/CertificationForm";
import { GraduationCap, Award, BookOpen } from "lucide-react";

interface AdminUniversityPageProps {
  searchParams?: Promise<{
    edit?: string;
  }>;
}

export default async function AdminUniversityPage({ searchParams }: AdminUniversityPageProps) {
  const params = await searchParams;
  const certs = await ecosystemRepository.getCertifications();
  
  const editingCert = params?.edit 
    ? certs.find((c) => c.id === params.edit) 
    : null;

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="University Admin" 
        subtitle="Manage professional certifications, exams, and academic badges." 
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-2/5">
          <AdminSection 
            title={editingCert ? "Edit Certification" : "New Program"} 
            description="Create professional certifications for the community."
          >
            <CertificationForm cert={editingCert as any} />
          </AdminSection>
        </div>

        <div className="w-full lg:w-3/5">
          <AdminSection title="Current Certifications" description="Academic programs currently offered.">
            {certs.length > 0 ? (
              <AdminTable headers={["Title", "Topic", "Level", "Actions"]}>
                {certs.map((cert) => (
                  <tr key={cert.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Award size={16} />
                        </div>
                        <p className="font-semibold text-foreground">{cert.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{cert.topic}</td>
                    <td className="px-4 py-4 capitalize text-sm">{cert.level}</td>
                    <td className="px-4 py-4">
                      <Link 
                        href={`/admin/university?edit=${cert.id}`}
                        className="rounded-lg border border-border/70 p-2 hover:border-primary inline-block"
                      >
                        <BookOpen size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </AdminTable>
            ) : (
              <AdminEmptyState title="No certifications" description="Launch your first certification program today." />
            )}
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
