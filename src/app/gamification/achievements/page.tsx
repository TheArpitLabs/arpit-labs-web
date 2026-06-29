import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AchievementList } from "@/components/gamification/AchievementList";
import { supabaseServer } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { createPageMetadata } from "@/lib/seo";
import { Target } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Achievements",
  description: "Track your progress and complete achievements to earn rewards.",
  path: "/gamification/achievements",
  keywords: ["Achievements", "Progress", "Goals", "Gamification"],
});

export default async function AchievementsPage() {
  const user = await getCurrentUser();

  // Get all achievements
  const { data: achievements } = await supabaseServer
    .from('achievements')
    .select('*')
    .order('points_reward', { ascending: false });

  // Get user's achievements if authenticated
  let userAchievements = [];
  if (user) {
    const { data: userAchievementsData } = await supabaseServer
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id);

    userAchievements = userAchievementsData || [];
  }

  // Get unique categories
  const categories = [...new Set((achievements || []).map(a => a.category))];

  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest text-primary">
              Gamification
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Achievements
            </h1>
            <p className="mt-6 text-lg text-muted">
              Track your progress and complete achievements to earn points and badges. 
              Each achievement brings you closer to becoming a platform champion!
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <div className="space-y-12">
          {categories.map(category => (
            <div key={category}>
              <h2 className="text-2xl font-bold mb-6 capitalize">{category}</h2>
              <AchievementList 
                achievements={achievements || []}
                userAchievements={userAchievements}
                category={category}
              />
            </div>
          ))}
        </div>
      </Container>

      <Footer />
    </main>
  );
}
