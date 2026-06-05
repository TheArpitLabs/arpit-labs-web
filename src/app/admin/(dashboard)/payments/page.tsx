import React from "react";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminTable } from "@/components/admin/AdminTable";
import { paymentRepository } from "@/lib/repositories/payment.repository";
import { CreditCard, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminPaymentsPage() {
  const transactions = await paymentRepository.getRevenueMetrics().then(m => m.transactions);

  return (
    <div className="space-y-6">
      <AdminTopbar
        title="Payment Transactions"
        subtitle="Manage all incoming payments, refunds, and transaction history."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full rounded-xl border border-border/70 bg-card px-10 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <AdminSection title="Recent Activity" description="Detailed list of all platform transactions.">
        <AdminTable
          headers={["Transaction ID", "User", "Amount", "Provider", "Type", "Status", "Date"]}
          data={transactions.map((t: any) => ({
            id: t.id,
            "Transaction ID": (
              <span className="font-mono text-xs text-muted-foreground">
                {t.provider_transaction_id.substring(0, 12)}...
              </span>
            ),
            User: t.user_id || "Guest",
            Amount: (
              <span className="font-semibold text-foreground">
                ${t.amount}
              </span>
            ),
            Provider: (
              <span className="capitalize">{t.provider}</span>
            ),
            Type: (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                t.type === "subscription" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
              }`}>
                {t.type}
              </span>
            ),
            Status: (
              <span className={`px-2 py-1 rounded-full text-xs ${
                t.status === "succeeded" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              }`}>
                {t.status}
              </span>
            ),
            Date: new Date(t.created_at).toLocaleDateString(),
          }))}
        />
      </AdminSection>
    </div>
  );
}
