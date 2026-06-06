import { Container } from "@/components/layout/Container";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getTenantContext } from "@/lib/saas";
import Link from "next/link";
import { Building2, Layout, ArrowRight, Plus } from "lucide-react";
import { redirect } from "next/navigation";

export default async function UserDashboardPage() {
  const context = await getTenantContext();
  
  if (!context) {
    redirect("/login");
  }

  const { user, organizations } = context;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <section className="bg-surface/30 border-b border-border/70 py-16">
        <Container>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.email?.split('@')[0]}</h1>
              <p className="text-muted">Overview of your organizations and active workspaces.</p>
            </div>
            <Link 
              href="/organizations"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
            >
              <Plus size={18} />
              Create Organization
            </Link>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Organizations Overview */}
          <div className="space-y-6">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Building2 size={20} className="text-primary" />
              Your Organizations
            </h2>
            
            <div className="grid gap-4">
              {organizations.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-border/70 p-10 text-center">
                  <p className="text-sm text-muted">You are not part of any organization yet.</p>
                  <Link href="/organizations" className="mt-4 inline-block text-sm font-semibold text-primary">Get started →</Link>
                </div>
              ) : (
                organizations.map((org) => (
                  <Link
                    key={org.id}
                    href={`/organizations/${org.slug}`}
                    className="flex items-center justify-between rounded-3xl border border-border/70 bg-card/50 p-6 transition hover:border-primary"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {org.name[0]}
                      </div>
                      <span className="font-bold">{org.name}</span>
                    </div>
                    <ArrowRight size={18} className="text-muted" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quick Stats/Activity Placeholder for SaaS */}
          <div className="space-y-6">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Layout size={20} className="text-primary" />
              Recent Workspaces
            </h2>
            <div className="rounded-[2.5rem] border border-border/70 bg-card/50 p-10 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-surface flex items-center justify-center text-muted mb-4">
                <Layout size={24} />
              </div>
              <h3 className="font-bold">Select an organization</h3>
              <p className="text-xs text-muted mt-2">Workspaces are nested within organizations. Choose an org to see active projects.</p>
            </div>
          </div>
        </div>
      </Container>
      
      <Footer />
    </main>
  );
}
