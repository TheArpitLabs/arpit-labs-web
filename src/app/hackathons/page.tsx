import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { getHackathons } from "@/lib/actions/server-actions";
import { createPageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Calendar, MapPin, Sparkles } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Hackathon Hub",
  description: "Discover hackathon challenges, join teams, submit projects, and compete on the leaderboard.",
  path: "/hackathons",
  keywords: ["Hackathon", "Hackathons", "Events", "Competitions", "Teams"],
});

export default async function HackathonsPage() {
  const hackathons = await getHackathons();

  return (
    <main className="bg-background text-foreground">

      <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest text-primary">
              Hackathon Hub
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Build, collaborate, and compete in hackathon events.
            </h1>
            <p className="mt-6 text-lg text-muted">
              Browse current hackathons, form teams, submit projects, and track leaderboard standings from one place.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          {hackathons.length === 0 ? (
            <div className="rounded-[2rem] border border-border/70 bg-card p-12 text-center text-muted dark:border-slate-800 dark:bg-slate-950/80">
              <p>No hackathons are available yet. Check back soon for the next event.</p>
            </div>
          ) : (
            hackathons.map((hackathon) => (
              <Link key={hackathon.id} href={`/hackathons/${hackathon.slug}`}>
                <Card className="group cursor-pointer transition hover:border-primary/50 hover:bg-primary/5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-primary">
                        <Sparkles size={16} />
                        {hackathon.status}
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold text-foreground transition group-hover:text-primary">
                        {hackathon.title}
                      </h2>
                      <p className="mt-3 text-muted">{hackathon.organizer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted">Ends</p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {hackathon.end_date ? new Date(hackathon.end_date).toLocaleDateString() : "TBD"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-2">
                    <div className="inline-flex items-center gap-2">
                      <Calendar size={16} />
                      {hackathon.start_date ? new Date(hackathon.start_date).toLocaleDateString() : "Start date TBD"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <MapPin size={16} />
                      {hackathon.registration_deadline ? `Register by ${new Date(hackathon.registration_deadline).toLocaleDateString()}` : "Open registration"}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Badge variant="secondary">{hackathon.status}</Badge>
                    <Badge variant="outline">{hackathon.organizer}</Badge>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </Container>

      <Footer />
    </main>
  );
}
