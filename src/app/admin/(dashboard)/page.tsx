import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { MetricCard } from "@/components/admin/MetricCard";
import { contactsRepository } from "@/lib/repositories/contacts.repository";
import { experimentsRepository } from "@/lib/repositories/experiments.repository";
import { labNotesRepository } from "@/lib/repositories/labnotes.repository";
import { newsletterRepository } from "@/lib/repositories/newsletter.repository";
import { projectsRepository } from "@/lib/repositories/projects.repository";
import { productsRepository } from "@/lib/repositories/products.repository";
import { FileText, Beaker, Users, MessageSquare, Star, Layout, ShoppingBag } from "lucide-react";

export default async function AdminDashboardPage() {
  const [projects, notes, experiments, subscribers, messages, products] = await Promise.all([
    projectsRepository.getProjects(),
    labNotesRepository.getLabNotes(),
    experimentsRepository.getExperiments(),
    newsletterRepository.getSubscribers(),
    contactsRepository.getContactMessages(),
    productsRepository.getProducts(),
  ]);

  const stats = {
    projects: projects.length,
    articles: notes.length,
    experiments: experiments.length,
    subscribers: subscribers.length,
    messages: messages.length,
    products: products.length,
    drafts: [
      ...projects.filter(p => !p.published),
      ...notes.filter(n => !n.published),
      ...experiments.filter(e => !e.published),
      ...products.filter(p => !p.published)
    ].length,
    published: [
      ...projects.filter(p => p.published),
      ...notes.filter(n => n.published),
      ...experiments.filter(e => e.published),
      ...products.filter(p => p.published)
    ].length
  };

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Command Center" 
        subtitle="Operational overview of Arpit Labs content and audience growth." 
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <MetricCard label="Projects" value={stats.projects} helper="Engineering builds" />
        <MetricCard label="Articles" value={stats.articles} helper="Lab notes" />
        <MetricCard label="Experiments" value={stats.experiments} helper="Research" />
        <MetricCard label="Products" value={stats.products} helper="Software Suite" />
        <MetricCard label="Audience" value={stats.subscribers} helper="Subscribers" />
        <MetricCard label="Messages" value={stats.messages} helper="Inquiries" />
        <MetricCard label="Drafts" value={stats.drafts} helper="Pending" />
        <MetricCard label="Live" value={stats.published} helper="Published" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSection title="Recent Activity" description="Latest inbound interactions and content updates.">
          <div className="space-y-4">
            {messages.slice(0, 3).map((msg) => (
              <div key={msg.id} className="flex items-start gap-4 rounded-xl border border-border/40 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Message from {msg.name}</p>
                  <p className="truncate text-xs text-muted">{msg.subject}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {subscribers.slice(0, 2).map((sub) => (
              <div key={sub.id} className="flex items-start gap-4 rounded-xl border border-border/40 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">New Subscriber</p>
                  <p className="truncate text-xs text-muted">{sub.email}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{new Date(sub.subscribed_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </AdminSection>

        <AdminSection title="Quick Actions" description="Fast-track your content creation workflow.">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "New Project", href: "/admin/projects", icon: Layout },
              { label: "New Product", href: "/admin/products", icon: ShoppingBag },
              { label: "Draft Note", href: "/admin/blog", icon: FileText },
              { label: "Log Experiment", href: "/admin/experiments", icon: Beaker },
              { label: "Update Journey", href: "/admin/journey", icon: Star },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/50 p-6 transition hover:border-primary hover:bg-primary/5"
              >
                <action.icon className="h-6 w-6 text-primary" />
                <span className="text-xs font-semibold">{action.label}</span>
              </a>
            ))}
          </div>
        </AdminSection>
      </div>
    </div>
  );
}
