import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getHackathonBySlug, getHackathonTeams, getHackathonSubmissions, generateHackathonSuggestions } from "@/lib/actions/server-actions";
import { createPageMetadata } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles, Trophy, Users, Calendar } from "lucide-react";

interface HackathonDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: HackathonDetailPageProps) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);

  if (!hackathon) {
    return { title: "Hackathon Not Found" };
  }

  return createPageMetadata({
    title: `${hackathon.title} | Hackathon Hub`,
    description: hackathon.description,
    path: `/hackathons/${slug}`,
    keywords: ["Hackathon", hackathon.organizer, hackathon.status],
  });
}

export default async function HackathonDetailPage({ params }: HackathonDetailPageProps) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);

  if (!hackathon) {
    notFound();
  }

  const [teams, submissions, suggestions] = await Promise.all([
    getHackathonTeams(hackathon.id),
    getHackathonSubmissions(hackathon.id),
    generateHackathonSuggestions(hackathon.title),
  ]);

  return (
    <main className="bg-background text-foreground">
      <Navbar />

      <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="max-w-3xl">
            <Link href="/hackathons" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
              <ArrowLeft size={16} /> Back to hackathons
            </Link>
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-sm uppercase tracking-[0.22em] text-primary">
                <Sparkles size={18} />
                {hackathon.status}
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {hackathon.title}
              </h1>
              <p className="text-lg leading-8 text-muted">{hackathon.description}</p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <Card className="space-y-2 bg-surface/80">
                <p className="text-sm uppercase tracking-[0.22em] text-muted">Organizer</p>
                <p className="text-base font-semibold text-foreground">{hackathon.organizer}</p>
              </Card>
              <Card className="space-y-2 bg-surface/80">
                <p className="text-sm uppercase tracking-[0.22em] text-muted">Teams</p>
                <p className="text-base font-semibold text-foreground">{teams.length}</p>
              </Card>
              <Card className="space-y-2 bg-surface/80">
                <p className="text-sm uppercase tracking-[0.22em] text-muted">Submissions</p>
                <p className="text-base font-semibold text-foreground">{submissions.length}</p>
              </Card>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                <Card className="bg-card/90">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-primary">
                      <Calendar size={16} />
                      Event details
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted">Starts</p>
                        <p className="mt-1 text-foreground">{hackathon.start_date ? new Date(hackathon.start_date).toLocaleDateString() : "TBD"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted">Ends</p>
                        <p className="mt-1 text-foreground">{hackathon.end_date ? new Date(hackathon.end_date).toLocaleDateString() : "TBD"}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-sm text-muted">Registration</p>
                        <p className="mt-1 text-foreground">{hackathon.registration_deadline ? new Date(hackathon.registration_deadline).toLocaleDateString() : "Open until event begins"}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-card/90">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-primary">
                      <Users size={16} /> Team hub
                    </div>
                    <p className="text-muted">Create teams, join a group, and collaborate with other participants as the event progresses.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link href={`/hackathons/${hackathon.slug}/teams`} className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5">
                        View teams
                      </Link>
                      <Link href={`/hackathons/${hackathon.slug}/submissions`} className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5">
                        Submit project
                      </Link>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="bg-surface/90 p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-primary">
                    <Trophy size={16} /> AI project suggestions
                  </div>
                  {suggestions.length > 0 ? (
                    <ul className="space-y-3 text-sm text-muted">
                      {suggestions.map((item, index) => (
                        <li key={index} className="rounded-3xl border border-border/70 bg-background/70 p-4">
                          <span className="font-semibold text-foreground">{index + 1}.</span> {item.replace(/^\d+\.\s*/, "")}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">No suggestions available at the moment.</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-8">
            <Card className="bg-card/90">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Event overview</h2>
                <p className="text-muted leading-relaxed">{hackathon.description}</p>
              </div>
            </Card>

            <Card className="bg-card/90">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Latest submissions</h3>
                {submissions.length === 0 ? (
                  <p className="text-muted">No submissions have been made yet.</p>
                ) : (
                  <div className="space-y-3">
                    {submissions.slice(0, 4).map((submission) => (
                      <div key={submission.id} className="rounded-3xl border border-border/70 bg-background/70 p-4">
                        <p className="font-semibold text-foreground">{submission.title}</p>
                        <p className="text-sm text-muted">Team: {submission.team_id}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-muted">
                          <span>Score: {submission.score ?? 0}</span>
                          <span>{new Date(submission.submitted_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Container>

      <Footer />
    </main>
  );
}
