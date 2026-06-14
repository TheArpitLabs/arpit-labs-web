import { Users, Award, TrendingUp, Target, Github, Gitlab, BookOpen, Trophy } from "lucide-react";
import { Suspense } from "react";
import Image from "next/image";

export default function ContributorsAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users size={32} className="text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Contributor Intelligence</h1>
        </div>
        <p className="text-muted">Unified contributor profiles with scoring and expertise tracking</p>
      </div>

      <Suspense fallback={<ContributorsDashboardLoading />}>
        <ContributorsDashboard />
      </Suspense>
    </div>
  );
}

function ContributorsDashboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

async function ContributorsDashboard() {
  const [topContributors, topByExpertise, topByContribution, topByResearch] = await Promise.all([
    fetchTopContributors("overall"),
    fetchTopContributors("expertise"),
    fetchTopContributors("contribution"),
    fetchTopContributors("research"),
  ]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Top Overall"
          value={topContributors[0]?.displayName || "N/A"}
          icon={<Trophy size={20} />}
        />
        <SummaryCard
          title="Top Expertise"
          value={topByExpertise[0]?.displayName || "N/A"}
          icon={<Award size={20} />}
        />
        <SummaryCard
          title="Top Contribution"
          value={topByContribution[0]?.displayName || "N/A"}
          icon={<TrendingUp size={20} />}
        />
        <SummaryCard
          title="Top Research"
          value={topByResearch[0]?.displayName || "N/A"}
          icon={<BookOpen size={20} />}
        />
      </div>

      {/* Top Overall Contributors */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Trophy size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Top Overall Contributors</h2>
        </div>
        <ContributorsList contributors={topContributors} />
      </div>

      {/* Top by Expertise */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Award size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Top by Expertise Score</h2>
        </div>
        <ContributorsList contributors={topByExpertise} />
      </div>

      {/* Top by Contribution */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Top by Contribution Score</h2>
        </div>
        <ContributorsList contributors={topByContribution} />
      </div>

      {/* Top by Research */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Top by Research Score</h2>
        </div>
        <ContributorsList contributors={topByResearch} />
      </div>
    </div>
  );
}

async function fetchTopContributors(scoreType: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/contributors?action=top&scoreType=${scoreType}`);
  const data = await response.json();
  return data.result;
}

function SummaryCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-primary">{icon}</div>
        <h3 className="text-sm font-medium text-muted">{title}</h3>
      </div>
      <div className="text-lg font-bold text-foreground truncate">{value}</div>
    </div>
  );
}

function ContributorsList({ contributors }: { contributors: any[] }) {
  return (
    <div className="space-y-2">
      {contributors.map((contributor, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <div className="flex items-center gap-4">
            <div className="text-muted text-sm">#{index + 1}</div>
            {contributor.avatar && (
              <Image
                src={contributor.avatar}
                alt={contributor.displayName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <div className="font-medium text-foreground">{contributor.displayName}</div>
              <div className="text-sm text-muted">@{contributor.username}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold text-foreground">{contributor.score.toFixed(2)}</div>
              <div className="text-xs text-muted">Score</div>
            </div>
            <div className="flex gap-1">
              {contributor.expertise.slice(0, 2).map((exp: string, i: number) => (
                <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {exp}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
