import React from "react";
import { AdminSection } from "@/components/admin/AdminSection";
import { MetricCard } from "@/components/admin/MetricCard";
import { AdminTable } from "@/components/admin/AdminTable";
import { paymentRepository } from "@/lib/repositories/payment.repository";
import { DollarSign, Users, CreditCard, ShoppingBag, TrendingUp } from "lucide-react";

export default async function RevenueDashboardPage() {
  const metrics = await paymentRepository.getRevenueMetrics();

  return (
    <div className="space-y-8">
      <AdminSection title="Revenue Overview" description="Monitor platform earnings and subscription growth.">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={`$${metrics.totalRevenue.toLocaleString()}`}
            icon={<DollarSign className="h-5 w-5" />}
            trend="+12% from last month"
          />
          <MetricCard
            title="Subscription Revenue"
            value={`$${metrics.subscriptionRevenue.toLocaleString()}`}
            icon={<CreditCard className="h-5 w-5" />}
            trend="+5% from last month"
          />
          <MetricCard
            title="Marketplace Revenue"
            value={`$${metrics.marketplaceRevenue.toLocaleString()}`}
            icon={<ShoppingBag className="h-5 w-5" />}
            trend="+24% from last month"
          />
          <MetricCard
            title="Active Subscribers"
            value={metrics.activeSubscribers.toString()}
            icon={<Users className="h-5 w-5" />}
            trend="+3% from last month"
          />
        </div>
      </AdminSection>

      <AdminSection title="Recent Transactions" description="List of the most recent payments.">
        <AdminTable
          headers={["Date", "User", "Amount", "Provider", "Type", "Status"]}
          data={metrics.transactions.slice(0, 10).map((t: any) => ({
            id: t.id,
            Date: new Date(t.created_at).toLocaleDateString(),
            User: t.user_id || "Anonymous",
            Amount: `$${t.amount}`,
            Provider: t.provider.toUpperCase(),
            Type: t.type === "subscription" ? "Subscription" : "One-Time",
            Status: (
              <span className={`px-2 py-1 rounded-full text-xs ${
                t.status === "succeeded" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              }`}>
                {t.status}
              </span>
            ),
          }))}
        />
      </AdminSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSection title="Revenue Trends" description="Monthly revenue growth.">
          <div className="h-64 rounded-xl border border-border/50 bg-card/50 flex items-center justify-center">
            <TrendingUp className="h-10 w-10 text-muted/30" />
            <span className="ml-2 text-muted">Chart: Revenue over time</span>
          </div>
        </AdminSection>
        <AdminSection title="Sales Distribution" description="Revenue by product category.">
           <div className="h-64 rounded-xl border border-border/50 bg-card/50 flex items-center justify-center">
            <CreditCard className="h-10 w-10 text-muted/30" />
            <span className="ml-2 text-muted">Chart: Marketplace vs Subscriptions</span>
          </div>
        </AdminSection>
      </div>
    </div>
  );
}
