import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { hackathonsRepository } from "@/lib/repositories/hackathons.repository";
import { saveHackathonAction, saveHackathonScoreAction } from "@/lib/actions/admin-actions";
import { Hackathon } from "@/types/content";
import Link from "next/link";
import { Plus, Trophy, Sparkles, Users } from "lucide-react";

export const metadata = {
  title: "Hackathon Management | Admin",
};

export default async function AdminHackathonsPage() {
  const hackathons = await hackathonsRepository.getHackathons();

  return (
    <div className="space-y-6">
      <AdminSection title="Hackathon Events" description="Create and manage hackathon events, submissions, and leaderboard scoring.">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {hackathons.length > 0 ? (
              <div className="space-y-4">
                {hackathons.map((hackathon: Hackathon) => (
                  <div key={hackathon.id} className="rounded-[2rem] border border-border/70 bg-card p-6 dark:border-slate-800 dark:bg-slate-950/90">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{hackathon.title}</h3>
                        <p className="text-sm text-muted">{hackathon.organizer}</p>
                      </div>
                      <Link href={`/hackathons/${hackathon.slug}`} className="rounded-2xl border border-border/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5">
                        View event
                      </Link>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-muted">
                      <span>{hackathon.status}</span>
                      <span>Starts: {hackathon.start_date ?? "TBD"}</span>
                      <span>Ends: {hackathon.end_date ?? "TBD"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AdminEmptyState title="No hackathon events" description="Create your first hackathon event to start accepting teams and submissions." />
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[2rem] border border-border/70 bg-card p-6 dark:border-slate-800 dark:bg-slate-950/90">
              <div className="mb-4 flex items-center gap-3 text-sm uppercase tracking-[0.22em] text-primary">
                <Plus size={18} /> Create event
              </div>
              <form action={saveHackathonAction} className="space-y-4">
                <input name="title" placeholder="Title" className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary" />
                <input name="slug" placeholder="Slug" className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary" />
                <input name="organizer" placeholder="Organizer" className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary" />
                <input name="status" placeholder="Status" defaultValue="active" className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary" />
                <input name="start_date" type="date" className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary" />
                <input name="end_date" type="date" className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary" />
                <input name="registration_deadline" type="date" className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary" />
                <textarea name="description" placeholder="Description" rows={4} className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary" />
                <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
                  <Sparkles size={16} /> Create Hackathon
                </button>
              </form>
            </div>
            <div className="rounded-[2rem] border border-border/70 bg-card p-6 dark:border-slate-800 dark:bg-slate-950/90">
              <div className="mb-4 flex items-center gap-3 text-sm uppercase tracking-[0.22em] text-primary">
                <Trophy size={18} /> Score submissions
              </div>
              <p className="text-sm text-muted">Use the submission score editor on the event detail pages to update team rankings.</p>
            </div>
          </div>
        </div>
      </AdminSection>
    </div>
  );
}
