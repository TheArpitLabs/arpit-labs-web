import Link from 'next/link';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { ecosystemRepository } from '@/lib/repositories/ecosystem.repository';
import { StartupForm } from '@/components/admin/StartupForm';
import { Lightbulb, Rocket, Globe } from 'lucide-react';

interface AdminInnovationPageProps {
  searchParams?: Promise<{
    edit?: string;
  }>;
}

export default async function AdminInnovationPage({ searchParams }: AdminInnovationPageProps) {
  const params = await searchParams;
  const startups = await ecosystemRepository.getStartups();

  const editingStartup = params?.edit ? startups.find((s) => s.id === params.edit) : null;

  return (
    <div className="space-y-6">
      <AdminTopbar
        title="Innovation Hub"
        subtitle="Incubate startups, validate MVPs, and manage innovation challenges."
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-2/5">
          <AdminSection
            title={editingStartup ? 'Edit Startup' : 'Incubate Startup'}
            description="Add a new startup to the Axiora ecosystem."
          >
            <StartupForm startup={editingStartup as any} />
          </AdminSection>
        </div>

        <div className="w-full lg:w-3/5">
          <AdminSection
            title="Startup Portfolio"
            description="Startups currently in the incubator."
          >
            {startups.length > 0 ? (
              <AdminTable headers={['Name', 'Stage', 'Website', 'Actions']}>
                {startups.map((startup) => (
                  <tr key={startup.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Rocket size={16} />
                        </div>
                        <p className="font-semibold text-foreground">{startup.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 capitalize text-sm">{startup.stage}</td>
                    <td className="px-4 py-4">
                      {startup.website_url ? (
                        <a
                          href={startup.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Visit
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/innovation?edit=${startup.id}`}
                        className="rounded-lg border border-border/70 p-2 hover:border-primary inline-block"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"
                          />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </AdminTable>
            ) : (
              <AdminEmptyState
                title="No startups"
                description="Start incubating your first startup idea."
              />
            )}
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
