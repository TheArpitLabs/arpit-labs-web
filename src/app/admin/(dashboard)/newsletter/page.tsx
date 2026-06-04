import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { deleteSubscriberAction } from "@/lib/actions/admin-actions";
import { newsletterRepository } from "@/lib/repositories/newsletter.repository";
import { Search, Download, Trash2 } from "lucide-react";

interface AdminNewsletterPageProps {
  searchParams?: Promise<{
    q?: string;
  }>;
}

export default async function AdminNewsletterPage({ searchParams }: AdminNewsletterPageProps) {
  const params = await searchParams;
  const subscribers = await newsletterRepository.getSubscribers();
  
  const filteredSubscribers = params?.q 
    ? subscribers.filter(s => s.email.toLowerCase().includes(params.q!.toLowerCase()))
    : subscribers;

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Newsletter Management" 
        subtitle="Manage your audience and export subscriber lists." 
      />

      <AdminSection title="Subscribers" description="Manage newsletter registrations and growth.">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <form className="flex w-full max-w-sm items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                name="q"
                defaultValue={params?.q}
                placeholder="Search by email..."
                className="h-10 w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>
            <button type="submit" className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
              Search
            </button>
          </form>

          <Link 
            href="/admin/newsletter/export" 
            className="flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-background px-4 text-sm font-medium transition hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Link>
        </div>

        {filteredSubscribers.length > 0 ? (
          <AdminTable headers={["Email Address", "Subscription Date", "Actions"]}>
            {filteredSubscribers.map((subscriber) => (
              <tr key={subscriber.id} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-4 text-foreground font-medium">{subscriber.email}</td>
                <td className="px-4 py-4 text-muted">
                  {new Date(subscriber.subscribed_at).toLocaleDateString()} at {new Date(subscriber.subscribed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-4">
                  <form action={deleteSubscriberAction} onSubmit={(e) => !confirm("Unsubscribe this user?") && e.preventDefault()}>
                    <input type="hidden" name="id" value={subscriber.id} />
                    <button 
                      type="submit"
                      className="rounded-lg border border-red-500/30 p-2 text-red-500 transition hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </AdminTable>
        ) : (
          <AdminEmptyState title="No subscribers found" description="Try a different search or wait for new signups." />
        )}
      </AdminSection>
    </div>
  );
}
