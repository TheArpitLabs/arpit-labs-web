import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminTable } from "@/components/admin/AdminTable";
import { MetricCard } from "@/components/admin/MetricCard";
import { saasRepository } from "@/lib/repositories/saas.repository";
import { Globe, Building2, Layout, Users, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function SaasAdminDashboard() {
  const [organizations, stats] = await Promise.all([
    saasRepository.getOrganizations(),
    saasRepository.getAdminStats()
  ]);

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="SaaS Infrastructure" 
        subtitle="Global management of organizations, workspaces, and tenant isolation." 
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Organizations" value={stats.organizationsCount} icon={<Building2 className="h-4 w-4" />} />
        <MetricCard label="Workspaces" value={stats.workspacesCount} icon={<Layout className="h-4 w-4" />} />
        <MetricCard label="Total Members" value={stats.totalMembersCount} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Active Workspaces" value={stats.activeWorkspacesCount} icon={<Activity className="h-4 w-4" />} />
      </section>

      <div className="grid gap-6">
        <AdminSection title="Organization Directory" description="Complete list of all registered tenants on the platform.">
          <AdminTable headers={["Organization", "Slug", "Workspaces", "Members", "Created", "Actions"]}>
            {organizations.map((org) => (
              <tr key={org.id} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {org.name[0]}
                    </div>
                    <span className="font-semibold">{org.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest">
                    {org.slug}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm text-muted">--</td>
                <td className="px-4 py-4 text-sm text-muted">--</td>
                <td className="px-4 py-4 text-xs text-muted">
                  {new Date(org.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  <button className="text-xs font-bold text-primary hover:underline">Manage</button>
                </td>
              </tr>
            ))}
          </AdminTable>
        </AdminSection>

        <div className="grid gap-6 lg:grid-cols-2">
          <AdminSection title="System Health" description="Real-time multi-tenant performance metrics.">
            <div className="space-y-4">
              {[
                { label: "Database Isolation", status: "Healthy", color: "text-green-500" },
                { label: "Storage Buckets", status: "Active", color: "text-green-500" },
                { label: "Auth Sync", status: "Synchronized", color: "text-green-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/40 p-4">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className={`text-xs font-bold uppercase ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </AdminSection>

          <AdminSection title="Provisioning Logs" description="Recent workspace and organization lifecycle events.">
            <div className="space-y-3">
              {[
                "New Org: Nebula AI created",
                "Workspace: 'prod-1' provisioned for Acme Corp",
                "Member: arpit@labs.com joined Dev Team",
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-muted">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
