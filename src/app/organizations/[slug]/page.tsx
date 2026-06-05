import { Container } from "@/components/layout/Container";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { saasRepository } from "@/lib/repositories/saas.repository";
import { createWorkspaceAction, inviteMemberAction, removeMemberAction } from "@/lib/actions/saas-actions";
import { AdminSubmitButton } from "@/components/admin/AdminSubmitButton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Layout, Users, Settings, Plus, ChevronRight, UserPlus, Trash2 } from "lucide-react";

interface OrganizationDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function OrganizationDetailPage({ params }: OrganizationDetailPageProps) {
  const { slug } = await params;
  const organization = await saasRepository.getOrganizationBySlug(slug).catch(() => null);

  if (!organization) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <section className="border-b border-border/70 bg-card/30 py-12">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 text-primary shadow-inner">
                <Building2 size={40} />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-bold tracking-tight">{organization.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{organization.slug}</Badge>
                  <span className="text-xs text-muted">ID: {organization.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link
                href={`/organizations/${slug}/settings`}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border/70 bg-surface px-5 text-sm font-semibold transition hover:border-primary"
              >
                <Settings size={18} />
                Settings
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_350px]">
          <div className="space-y-10">
            {/* Workspaces Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Layout size={24} className="text-primary" />
                  Workspaces
                </h2>
              </div>
              
              <div className="grid gap-4">
                {organization.workspaces.length === 0 ? (
                  <div className="rounded-[2.5rem] border border-dashed border-border/70 p-12 text-center text-muted">
                    No workspaces found. Create one to get started.
                  </div>
                ) : (
                  organization.workspaces.map((ws: any) => (
                    <Link
                      key={ws.id}
                      href={`/workspaces/${ws.slug}`}
                      className="group flex items-center justify-between rounded-[2rem] border border-border/70 bg-card/50 p-6 transition hover:border-primary hover:shadow-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-foreground group-hover:bg-primary/10 group-hover:text-primary transition">
                          <Layout size={22} />
                        </div>
                        <div>
                          <h3 className="font-bold">{ws.name}</h3>
                          <p className="text-xs text-muted">/{ws.slug}</p>
                        </div>
                      </div>
                      <ChevronRight className="text-muted transition group-hover:translate-x-1 group-hover:text-primary" />
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Members Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users size={24} className="text-primary" />
                Team Members
              </h2>
              <div className="overflow-hidden rounded-[2.5rem] border border-border/70 bg-card/50">
                <table className="w-full text-left">
                  <thead className="bg-surface/50 border-b border-border/70">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted">User</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted">Role</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted text-right">Joined</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {organization.members.map((member: any) => (
                      <tr key={member.id} className="group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {member.user?.email?.[0].toUpperCase() || "U"}
                            </div>
                            <span className="text-sm font-medium">{member.user?.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="px-2 py-0 text-[10px] uppercase font-bold tracking-tighter">
                            {member.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-muted">
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {member.role !== 'owner' && (
                            <form action={removeMemberAction}>
                              <input type="hidden" name="organization_id" value={organization.id} />
                              <input type="hidden" name="user_id" value={member.user_id} />
                              <button className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition">
                                <Trash2 size={16} />
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2.5rem] border border-border/70 bg-card/90 p-8 shadow-sm">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Plus size={20} className="text-primary" />
                New Workspace
              </h3>
              <p className="mt-2 text-xs text-muted">Create a scoped environment for specific projects.</p>
              
              <form action={createWorkspaceAction} className="mt-6 space-y-4">
                <input type="hidden" name="organization_id" value={organization.id} />
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Name</label>
                  <input
                    name="name"
                    required
                    placeholder="Engineering"
                    className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Slug</label>
                  <input
                    name="slug"
                    required
                    placeholder="eng"
                    className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <AdminSubmitButton idleLabel="Create Workspace" pendingLabel="Provisioning..." />
              </form>
            </div>
            
            <div className="rounded-[2.5rem] border border-border/70 bg-card/90 p-8 shadow-sm">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserPlus size={20} className="text-primary" />
                Invite Member
              </h3>
              <p className="mt-2 text-xs text-muted">Add a team member to this organization.</p>
              
              <form action={inviteMemberAction} className="mt-6 space-y-4">
                <input type="hidden" name="organization_id" value={organization.id} />
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="team@example.com"
                    className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Role</label>
                  <select
                    name="role"
                    className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <AdminSubmitButton idleLabel="Send Invite" pendingLabel="Inviting..." />
              </form>
            </div>
          </aside>
        </div>
      </Container>
      
      <Footer />
    </main>
  );
}
