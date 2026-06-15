import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { PointsDisplay } from "@/components/gamification/PointsDisplay";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { LevelProgress } from "@/components/gamification/LevelProgress";
import { supabaseServer } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { createPageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Star, Flame, Trophy, Award, ArrowRight } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Gamification Dashboard",
  description: "Track your points, badges, achievements, and streaks.",
  path: "/gamification",
  keywords: ["Gamification", "Points", "Badges", "Achievements", "Dashboard"],
});

export default async function GamificationDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="bg-background text-foreground">
        <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
          <Container>
            <div className="max-w-3xl text-center">
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest text-primary">
                Gamification
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Sign In to Track Progress
              </h1>
              <p className="mt-6 text-lg text-muted">
                Create an account or sign in to start earning points, badges, and achievements!
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Link href="/login">
                  <Button>Sign In</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline">Sign Up</Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>
        <Footer />
      </main>
    );
  }

  // Get user gamification summary
  const { data: summary } = await supabaseServer
    .from('user_gamification_summary')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get user's badges
  const { data: userBadges } = await supabaseServer
    .from('user_badges')
    .select(`
      *,
      badges (*)
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })
    .limit(6);

  // Get user's achievements
  const { data: userAchievements } = await supabaseServer
    .from('user_achievements')
    .select(`
      *,
      achievements (*)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(6);

  // Get recent transactions
  const { data: recentTransactions } = await supabaseServer
    .from('point_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const userSummary = summary || {
    points: 0,
    level: 1,
    current_streak: 0,
    longest_streak: 0,
    badges_earned: 0,
    achievements_completed: 0
  };

  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest text-primary">
              Gamification
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Your Progress
            </h1>
            <p className="mt-6 text-lg text-muted">
              Track your points, badges, achievements, and streaks. Compete with others and climb the leaderboard!
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <PointsDisplay 
                points={userSummary.points} 
                level={userSummary.level}
              />
              <StreakDisplay 
                currentStreak={userSummary.current_streak}
                longestStreak={userSummary.longest_streak}
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 dark:border-slate-800 dark:bg-slate-950/80">
              <LevelProgress 
                points={userSummary.points}
                level={userSummary.level}
              />
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-card p-6 text-center dark:border-slate-800 dark:bg-slate-950/80">
                <Award className="mx-auto mb-2 text-blue-500" size={24} />
                <div className="text-3xl font-bold">{userSummary.badges_earned}</div>
                <div className="text-sm text-muted-foreground">Badges Earned</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-6 text-center dark:border-slate-800 dark:bg-slate-950/80">
                <Trophy className="mx-auto mb-2 text-yellow-500" size={24} />
                <div className="text-3xl font-bold">{userSummary.achievements_completed}</div>
                <div className="text-sm text-muted-foreground">Achievements</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-6 text-center dark:border-slate-800 dark:bg-slate-950/80">
                <Star className="mx-auto mb-2 text-purple-500" size={24} />
                <div className="text-3xl font-bold">{userSummary.points.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/70 bg-card p-6 dark:border-slate-800 dark:bg-slate-950/80">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentTransactions && recentTransactions.length > 0 ? (
                  recentTransactions.map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`font-semibold ${transaction.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 dark:border-slate-800 dark:bg-slate-950/80">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/gamification/leaderboard" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    <span>View Leaderboard</span>
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/gamification/badges" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    <span>View Badges</span>
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/gamification/achievements" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    <span>View Achievements</span>
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <Footer />
    </main>
  );
}
