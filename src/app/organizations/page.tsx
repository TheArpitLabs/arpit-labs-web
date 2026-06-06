import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { getTenantContext } from "@/lib/saas";
import { createOrganizationAction } from "@/lib/actions/saas-actions";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import Link from "next/link";
import { Plus, Building2, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";

export default async function OrganizationsPage() {
  const context = await getTenantContext();
  if (!context) {
    redirect("/login");
  }

  const organizations = context.organizations;

  return (
    <main className="min-h-screen bg-background">
      <Container className="py-20">
        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="flex-1 space-y-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Your Organizations</h1>
              <p className="mt-2 text-muted">Manage your workspace environments and team collaboration.</p>
            </div>

            <div className="grid gap-4">
              {organizations.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-border/70 p-12 text-center text-muted">
                  You haven&apos;t joined any organizations yet.
                </div>
              ) : (
                organizations.map((org) => (
                  <Link
                    key={org.id}
                    href={`/organizations/${org.slug}`}
                    className="group flex items-center justify-between rounded-3xl border border-border/70 bg-card/50 p-6 transition hover:border-primary hover:bg-surface"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{org.name}</h3>
                        <p className="text-sm text-muted">{org.slug}</p>
                      </div>
                    </div>
                    <ChevronRight className="text-muted transition group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                ))
              )}
            </div>
          </div>

          <aside className="w-full lg:w-80">
            <div className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm">
              <h2 className="text-xl font-bold">New Organization</h2>
              <p className="mt-2 text-sm text-muted">Establish a new hub for your projects and teams.</p>
              
              <form action={createOrganizationAction} className="mt-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">Org Name</label>
                  <input
                    name="name"
                    required
                    placeholder="Acme Corp"
                    className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">Slug</label>
                  <input
                    name="slug"
                    required
                    placeholder="acme-corp"
                    className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">Billing Email</label>
                  <input
                    name="billing_email"
                    type="email"
                    placeholder="billing@acme.com"
                    className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <AdminSubmitButton idleLabel="Create Org" pendingLabel="Building..." />
              </form>
            </div>
          </aside>
        </div>
      </Container>
      <Footer />
    </main>
  );
}
