import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { getCurrentOrganization } from "@/lib/saas";
import { updateOrganizationAction } from "@/lib/actions/saas-actions";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import { ArrowLeft, Shield, Trash2, Building2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface OrgSettingsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function OrgSettingsPage({ params }: OrgSettingsPageProps) {
  const { slug } = await params;
  const organization = await getCurrentOrganization(slug);

  if (!organization) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <Container className="py-12">
        <div className="mx-auto max-w-3xl space-y-10">
          <Link
            href={`/organizations/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition"
          >
            <ArrowLeft size={16} />
            Back to Organization
          </Link>

          <header>
            <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
            <p className="text-muted">Manage identity, billing, and global configuration for {organization.name}.</p>
          </header>

          <div className="space-y-8">
            <section className="rounded-[2.5rem] border border-border/70 bg-card/50 p-8">
              <h2 className="text-xl font-bold mb-6">General Profile</h2>
              <form action={updateOrganizationAction} className="space-y-4">
                <input type="hidden" name="id" value={organization.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted">Organization Name</label>
                    <input
                      name="name"
                      defaultValue={organization.name}
                      className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted">Slug (Internal ID)</label>
                    <input
                      disabled
                      value={organization.slug}
                      className="w-full rounded-xl border border-border/70 bg-surface px-4 py-2 text-sm text-muted cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted">Billing Email</label>
                  <input
                    name="billing_email"
                    type="email"
                    defaultValue={organization.billing_email || ""}
                    className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="pt-4">
                  <AdminSubmitButton idleLabel="Save Changes" pendingLabel="Updating..." />
                </div>
              </form>
            </section>

            <section className="rounded-[2.5rem] border border-border/70 bg-card/50 p-8">
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <Shield size={24} />
                <h2 className="text-xl font-bold">Danger Zone</h2>
              </div>
              <p className="text-sm text-muted mb-6">
                Deleting this organization will permanently remove all associated workspaces, members, and data. This action cannot be undone.
              </p>
              <button className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-500 transition hover:bg-red-500 hover:text-white">
                <Trash2 size={18} />
                Delete Organization
              </button>
            </section>
          </div>
        </div>
      </Container>
      <Footer />
    </main>
  );
}
