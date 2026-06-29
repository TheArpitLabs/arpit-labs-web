import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { supabaseServer } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { createPageMetadata } from "@/lib/seo";
import { Award } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Badges Collection",
  description: "View all available badges and your earned badges.",
  path: "/gamification/badges",
  keywords: ["Badges", "Achievements", "Collection", "Gamification"],
});

export default async function BadgesPage() {
  const user = await getCurrentUser();

  // Get all badges
  const { data: badges } = await supabaseServer
    .from('badges')
    .select('*')
    .order('requirement_value', { ascending: true });

  // Get user's badges if authenticated
  let userBadges = [];
  if (user) {
    const { data: userBadgesData } = await supabaseServer
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id);

    userBadges = userBadgesData || [];
  }

  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest text-primary">
              Gamification
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Badge Collection
            </h1>
            <p className="mt-6 text-lg text-muted">
              Earn badges by completing various activities on the platform. 
              Collect them all to showcase your achievements!
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-6">All Badges</h2>
            <BadgeGrid 
              badges={badges || []}
              userBadges={userBadges}
            />
          </div>
        </div>
      </Container>

      <Footer />
    </main>
  );
}
