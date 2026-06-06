import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { getCurrentWorkspace } from "@/lib/saas";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Layout, ArrowLeft, Settings, Database, Activity, Cpu } from "lucide-react";

interface WorkspaceDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function WorkspaceDetailPage({ params }: WorkspaceDetailPageProps) {
  const { slug } = await params;
  
  const workspace = await getCurrentWorkspace(slug);

  if (!workspace) {
    notFound();
  }

  const organization = (workspace as any).organization;

  return (
    <main className="min-h-screen bg-background text-foreground">
      
      <section className="border-b border-border/70 bg-card/30 py-8">
        <Container>
          <div className="flex flex-col gap-6">
            <Link 
              href={`/organizations/${organization.slug}`}
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition"
            >
              <ArrowLeft size={16} />
              Back to {organization.name}
            </Link>

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Layout size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{workspace.name}</h1>
                  <p className="text-sm text-muted">Workspace • {workspace.slug}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`/workspaces/${slug}/settings`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-surface px-4 text-sm font-semibold transition hover:border-primary"
                >
                  <Settings size={16} />
                  Workspace Settings
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-border/70 bg-card/50 p-8 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Data Storage</h3>
              <p className="text-sm text-muted">Manage your workspace data and assets.</p>
            </div>
            <div className="pt-4">
              <div className="h-2 w-full rounded-full bg-surface">
                <div className="h-full w-1/3 rounded-full bg-blue-500" />
              </div>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted">3.2 GB / 10 GB Used</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/50 p-8 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-500">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Usage Metrics</h3>
              <p className="text-sm text-muted">API calls and compute hours for this month.</p>
            </div>
            <div className="pt-4">
              <div className="h-2 w-full rounded-full bg-surface">
                <div className="h-full w-2/3 rounded-full bg-green-500" />
              </div>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted">12,402 / 20,000 Requests</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/50 p-8 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
              <Cpu size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Infrastructure</h3>
              <p className="text-sm text-muted">Manage dedicated AI nodes and model deployments.</p>
            </div>
            <Link href="#" className="mt-4 inline-flex text-xs font-bold text-primary uppercase tracking-widest">
              Manage Nodes →
            </Link>
          </div>
        </div>

        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold">Infrastructure Overview</h2>
          <div className="rounded-[2.5rem] border border-border/70 bg-card/50 p-12 text-center text-muted italic">
            Dashboard content for workspace services (Logs, Deployments, Databases) is being provisioned.
          </div>
        </div>
      </Container>
      
      <Footer />
    </main>
  );
}
