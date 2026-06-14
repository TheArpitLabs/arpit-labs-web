import { Users, Handshake, Briefcase, BookOpen, Trophy, Clock, CheckCircle } from "lucide-react";
import { Suspense } from "react";

export default function CollaborationAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Handshake size={32} className="text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Collaboration Marketplace</h1>
        </div>
        <p className="text-muted">Team formation, mentor discovery, research collaboration, startup collaboration, and hackathon collaboration</p>
      </div>

      <Suspense fallback={<CollaborationDashboardLoading />}>
        <CollaborationDashboard />
      </Suspense>
    </div>
  );
}

function CollaborationDashboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

async function CollaborationDashboard() {
  const [teamFormations, mentorOpportunities, researchCollaborations, startupCollaborations, hackathonCollaborations] = await Promise.all([
    fetchCollaborations("team_formation"),
    fetchCollaborations("mentor_discovery"),
    fetchCollaborations("research_collaboration"),
    fetchCollaborations("startup_collaboration"),
    fetchCollaborations("hackathon_collaboration"),
  ]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard
          title="Team Formations"
          value={teamFormations.length}
          icon={<Users size={20} />}
        />
        <SummaryCard
          title="Mentor Opportunities"
          value={mentorOpportunities.length}
          icon={<BookOpen size={20} />}
        />
        <SummaryCard
          title="Research Collaborations"
          value={researchCollaborations.length}
          icon={<Briefcase size={20} />}
        />
        <SummaryCard
          title="Startup Collaborations"
          value={startupCollaborations.length}
          icon={<Trophy size={20} />}
        />
        <SummaryCard
          title="Hackathon Collaborations"
          value={hackathonCollaborations.length}
          icon={<Clock size={20} />}
        />
      </div>

      {/* Team Formations */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Users size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Team Formations</h2>
        </div>
        <CollaborationsList collaborations={teamFormations} />
      </div>

      {/* Mentor Opportunities */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Mentor Opportunities</h2>
        </div>
        <CollaborationsList collaborations={mentorOpportunities} />
      </div>

      {/* Research Collaborations */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Briefcase size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Research Collaborations</h2>
        </div>
        <CollaborationsList collaborations={researchCollaborations} />
      </div>

      {/* Startup Collaborations */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Trophy size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Startup Collaborations</h2>
        </div>
        <CollaborationsList collaborations={startupCollaborations} />
      </div>

      {/* Hackathon Collaborations */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Hackathon Collaborations</h2>
        </div>
        <CollaborationsList collaborations={hackathonCollaborations} />
      </div>
    </div>
  );
}

async function fetchCollaborations(type: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/collaboration?action=all&type=${type}`);
  const data = await response.json();
  return data.result || [];
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-primary">{icon}</div>
        <h3 className="text-sm font-medium text-muted">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function CollaborationsList({ collaborations }: { collaborations: any[] }) {
  if (collaborations.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        No collaborations found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {collaborations.map((collab) => (
        <div
          key={collab.id}
          className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <div className="flex-1">
            <div className="font-medium text-foreground">{collab.title}</div>
            <div className="text-sm text-muted">{collab.description}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">
                {collab.type.replace(/_/g, " ")}
              </span>
              <span className="text-xs bg-muted/50 text-muted px-2 py-1 rounded-full capitalize">
                {collab.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold text-foreground">{collab.applicants?.length || 0}</div>
              <div className="text-xs text-muted">Applicants</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">{(collab.matchScore * 100).toFixed(0)}%</div>
              <div className="text-xs text-muted">Match</div>
            </div>
            <CheckCircle size={20} className={collab.status === "open" ? "text-green-500" : "text-muted"} />
          </div>
        </div>
      ))}
    </div>
  );
}
