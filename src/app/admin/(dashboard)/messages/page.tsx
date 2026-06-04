import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { deleteContactMessageAction, markMessageReadAction } from "@/lib/actions/admin-actions";
import { contactsRepository } from "@/lib/repositories/contacts.repository";
import { Search, Mail, MailOpen, Trash2, CheckCircle, Circle } from "lucide-react";

interface AdminMessagesPageProps {
  searchParams?: Promise<{
    q?: string;
    isRead?: string;
  }>;
}

export default async function AdminMessagesPage({ searchParams }: AdminMessagesPageProps) {
  const params = await searchParams;
  const filters = {
    search: params?.q,
    isRead: params?.isRead === "true" ? true : params?.isRead === "false" ? false : undefined,
  };

  const messages = await contactsRepository.getContactMessages(filters);

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Inbox" 
        subtitle="Manage inbound inquiries and communication from your visitors." 
      />

      <AdminSection title="Messages" description="Review and respond to contact form submissions.">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <form className="flex w-full max-w-lg items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                name="q"
                defaultValue={params?.q}
                placeholder="Search by name, email, or content..."
                className="h-10 w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>
            <select
              name="isRead"
              defaultValue={params?.isRead}
              className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="">All Messages</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
            <button type="submit" className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
              Filter
            </button>
          </form>
        </div>

        {messages.length > 0 ? (
          <AdminTable headers={["Sender", "Message", "Status", "Actions"]}>
            {messages.map((msg) => (
              <tr key={msg.id} className={`border-b border-border/40 last:border-0 ${!msg.is_read ? "bg-primary/5" : ""}`}>
                <td className="px-4 py-4">
                  <div>
                    <p className="font-semibold text-foreground">{msg.name}</p>
                    <p className="text-xs text-muted">{msg.email}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="max-w-md">
                    <p className="font-medium text-foreground text-xs">{msg.subject}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{msg.message}</p>
                    <p className="mt-2 text-[10px] text-muted">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <form action={markMessageReadAction}>
                    <input type="hidden" name="id" value={msg.id} />
                    <input type="hidden" name="isRead" value={(!msg.is_read).toString()} />
                    <button 
                      type="submit"
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                        msg.is_read 
                          ? "bg-muted text-muted-foreground hover:bg-muted/80" 
                          : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                      }`}
                    >
                      {msg.is_read ? (
                        <>
                          <CheckCircle className="h-3 w-3" /> Read
                        </>
                      ) : (
                        <>
                          <Circle className="h-3 w-3 fill-current" /> Unread
                        </>
                      )}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <form action={deleteContactMessageAction} onSubmit={(e) => !confirm("Permanently delete this message?") && e.preventDefault()}>
                      <input type="hidden" name="id" value={msg.id} />
                      <button 
                        type="submit"
                        className="rounded-lg border border-red-500/30 p-2 text-red-500 transition hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        ) : (
          <AdminEmptyState title="No messages found" description="Your inbox is clear! Any new contact form submissions will appear here." />
        )}
      </AdminSection>
    </div>
  );
}
