import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { supabaseServer } from "@/lib/supabase/server";
import { Briefcase, TrendingUp, Users } from "lucide-react";

export default async function AdminVenturePage() {
  const { data: funding } = await supabaseServer
    .from("funding_rounds")
    .select("*, startups(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Venture Studio" 
        subtitle="Manage startup creation, investor relations, and funding rounds." 
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6">
          <div className="flex items-center gap-3 text-primary">
            <Briefcase size={20} />
            <span className="font-semibold">Active Rounds</span>
          </div>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6">
          <div className="flex items-center gap-3 text-green-500">
            <TrendingUp size={20} />
            <span className="font-semibold">Total Capital</span>
          </div>
          <p className="mt-2 text-3xl font-bold">$0</p>
        </div>
        <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6">
          <div className="flex items-center gap-3 text-secondary">
            <Users size={20} />
            <span className="font-semibold">Investors</span>
          </div>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
      </div>

      <AdminSection title="Funding Rounds" description="Tracking capital flow into ecosystem startups.">
        {(funding && funding.length > 0) ? (
          <AdminTable headers={["Startup", "Round", "Amount", "Date"]}>
            {funding.map((round: any) => (
              <tr key={round.id} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-4 font-medium">{round.startups?.name}</td>
                <td className="px-4 py-4 capitalize">{round.round_type}</td>
                <td className="px-4 py-4">${round.amount?.toLocaleString()}</td>
                <td className="px-4 py-4 text-sm text-muted">
                  {round.closed_at ? new Date(round.closed_at).toLocaleDateString() : "Open"}
                </td>
              </tr>
            ))}
          </AdminTable>
        ) : (
          <AdminEmptyState title="No funding rounds" description="Start tracking investments for your startups." />
        )}
      </AdminSection>
    </div>
  );
}
