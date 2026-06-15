import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { LeaderboardTable } from "@/components/gamification/LeaderboardTable";
import { supabaseServer } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { createPageMetadata } from "@/lib/seo";
import { Trophy, Users, Flame, Award } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Gamification Leaderboard",
  description: "Global rankings based on points, badges, achievements, and streaks.",
  path: "/gamification/leaderboard",
  keywords: ["Leaderboard", "Gamification", "Points", "Badges", "Achievements"],
});

export default async function GamificationLeaderboardPage() {
  const user = await getCurrentUser();
  const currentUserId = user?.id;

  // Get leaderboard data
  const { data: leaderboardData, error } = await supabaseServer
    .from('gamification_leaderboard')
    .select('*')
    .limit(50);

  const leaderboard = leaderboardData || [];

  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest text-primary">
              Gamification
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Global Leaderboard
            </h1>
            <p className="mt-6 text-lg text-muted">
              Compete with other users based on points, badges, achievements, and streaks. 
              Climb the ranks by engaging with the platform!
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Stats Overview */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card p-6 dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="text-yellow-500" size={20} />
                <h3 className="font-semibold">Points Leaderboard</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Ranked by total points earned across all activities
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex items-center gap-3 mb-4">
                <Award className="text-blue-500" size={20} />
                <h3 className="font-semibold">Badges Leaderboard</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Ranked by total badges earned
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex items-center gap-3 mb-4">
                <Flame className="text-orange-500" size={20} />
                <h3 className="font-semibold">Streaks Leaderboard</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Ranked by current login streak
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-purple-500" size={20} />
                <h3 className="font-semibold">Achievements Leaderboard</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Ranked by total achievements completed
              </p>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border/70 bg-card p-6 dark:border-slate-800 dark:bg-slate-950/80">
              <LeaderboardTable 
                entries={leaderboard}
                currentUserId={currentUserId}
              />
            </div>
          </div>
        </div>
      </Container>

      <Footer />
    </main>
  );
}
