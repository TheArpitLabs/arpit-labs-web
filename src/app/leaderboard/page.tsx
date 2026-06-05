import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getLeaderboard } from "@/lib/actions/server-actions";
import { createPageMetadata } from "@/lib/seo";
import Link from "next/link";
import { List, Trophy, Users } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Hackathon Leaderboard",
  description: "Rankings and scores from the latest hackathon submissions.",
  path: "/leaderboard",
  keywords: ["Leaderboard", "Hackathon", "Scores", "Teams"],
});

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <main className="bg-background text-foreground">
      <Navbar />

      <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest text-primary">
              Leaderboard
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Top hackathon submissions.
            </h1>
            <p className="mt-6 text-lg text-muted">
              Review the highest scoring projects and explore the teams leading the competition.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <div className="space-y-6">
          {leaderboard.length === 0 ? (
            <div className="rounded-[2rem] border border-border/70 bg-card p-12 text-center text-muted dark:border-slate-800 dark:bg-slate-950/80">
              <p>No submissions have been scored yet.</p>
            </div>
          ) : (
            leaderboard.map((submission, index) => (
              <Card key={submission.id} className="group">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-primary">
                      <Trophy size={16} />
                      Rank {index + 1}
                    </div>
                    <Link href={`/hackathons/${submission.hackathon_id}`} className="text-lg font-semibold text-foreground transition hover:text-primary">
                      {submission.title}
                    </Link>
                    <p className="text-sm text-muted">Team: {submission.team_id}</p>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-surface px-6 py-4 text-center dark:border-slate-800 dark:bg-slate-950">
                    <span className="text-sm text-muted">Score</span>
                    <p className="mt-2 text-3xl font-semibold text-foreground">{submission.score ?? 0}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Container>

      <Footer />
    </main>
  );
}
