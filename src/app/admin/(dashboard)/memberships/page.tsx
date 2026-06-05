import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminTable } from "@/components/admin/AdminTable";
import { MetricCard } from "@/components/admin/MetricCard";
import { membershipRepository } from "@/lib/repositories/membership.repository";
import { MembershipPlanEditor } from "@/components/admin/MembershipPlanEditor";
import { ArrowUpRight } from "lucide-react";

export default async function AdminMembershipsPage() {
  const [plans, subscriptions, metrics] = await Promise.all([
    membershipRepository.getAllPlans(),
    membershipRepository.getAllSubscriptions(),
    membershipRepository.getSubscriptionMetrics(),
  ]);

  return (
    <div className="space-y-6">
      <AdminTopbar
        title="Memberships"
        subtitle="Review active subscribers, edit membership plans, and prepare your revenue forecast."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Active Subscribers" value={metrics.activeCount.toString()} helper="Live memberships" />
        <MetricCard label="Total Subscriptions" value={metrics.totalCount.toString()} helper="Customer records" />
        <MetricCard label="Revenue Estimate" value={`$${metrics.revenueEstimate.toFixed(0)}`} helper="Without discounts" />
      </section>

      <AdminSection title="Plans" description="Edit active pricing plans and track membership availability.">
        <MembershipPlanEditor plans={plans} />
      </AdminSection>

      <AdminSection title="Subscription Metrics" description="View current membership distribution and billing activity.">
        <div className="rounded-3xl border border-border/70 bg-background/70 p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Object.entries(metrics.byPlan).map(([planName, count]) => (
              <div key={planName} className="rounded-3xl border border-border/70 bg-surface p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-muted">{planName}</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{count}</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminSection>

      <AdminSection title="Subscriber List" description="Review every subscription record with plan context.">
        {subscriptions.length > 0 ? (
          <AdminTable headers={["User", "Plan", "Status", "Cycle", "Started", "Ends"]}>
            {subscriptions.map((subscription) => (
              <tr key={subscription.id} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-4 text-foreground">{subscription.user_id}</td>
                <td className="px-4 py-4 text-muted">{subscription.membership_plans?.name ?? "Unknown"}</td>
                <td className="px-4 py-4 capitalize">{subscription.status}</td>
                <td className="px-4 py-4 capitalize">{subscription.billing_cycle}</td>
                <td className="px-4 py-4">{new Date(subscription.start_date).toLocaleDateString()}</td>
                <td className="px-4 py-4">{new Date(subscription.end_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </AdminTable>
        ) : (
          <p className="text-sm text-muted">No subscription records available yet.</p>
        )}
      </AdminSection>
    </div>
  );
}
