"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Loader2, Users, Copy, Plus, ArrowRight, MinusCircle } from "lucide-react";

interface HackathonTeamsClientProps {
  hackathonId: string;
}

interface TeamRecord {
  id: string;
  team_name: string;
  leader_id: string;
  description?: string | null;
  created_at: string;
}

interface TeamMemberRecord {
  id: string;
  team_id: string;
  user_id: string;
}

export default function HackathonTeamsClient({ hackathonId }: HackathonTeamsClientProps) {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [members, setMembers] = useState<TeamMemberRecord[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const membershipByTeam = useMemo(() => {
    return members.reduce<Record<string, number>>((acc, member) => {
      acc[member.team_id] = (acc[member.team_id] ?? 0) + 1;
      return acc;
    }, {});
  }, [members]);

  const userTeamId = useMemo(() => {
    return members.find((member) => member.user_id === userId)?.team_id ?? null;
  }, [members, userId]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [{ data: sessionData }, { data: teamsData }, { data: membersData }] = await Promise.all([
        supabaseClient.auth.getUser(),
        supabaseClient.from("hackathon_teams").select("*").eq("hackathon_id", hackathonId).order("created_at", { ascending: false }),
        supabaseClient.from("hackathon_team_members").select("*").order("team_id", { ascending: true }),
      ]);

      if (!mounted) {
        return;
      }

      setUserId(sessionData?.user?.id ?? null);
      setTeams((teamsData ?? []) as TeamRecord[]);
      setMembers((membersData ?? []) as TeamMemberRecord[]);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [hackathonId]);

  async function refresh() {
    const [{ data: teamsData }, { data: membersData }] = await Promise.all([
      supabaseClient.from("hackathon_teams").select("*").eq("hackathon_id", hackathonId).order("created_at", { ascending: false }),
      supabaseClient.from("hackathon_team_members").select("*").order("team_id", { ascending: true }),
    ]);

    setTeams((teamsData ?? []) as TeamRecord[]);
    setMembers((membersData ?? []) as TeamMemberRecord[]);
  }

  async function handleCreateTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!userId) {
      setError("Please sign in to create a team.");
      setLoading(false);
      return;
    }

    try {
      const { error: createError } = await supabaseClient.from("hackathon_teams").insert({
        hackathon_id: hackathonId,
        team_name: teamName,
        leader_id: userId,
        description,
      });

      if (createError) {
        throw createError;
      }

      setTeamName("");
      setDescription("");
      await refresh();
    } catch (err) {
      setError((err as Error).message || "Unable to create team.");
    } finally {
      setLoading(false);
    }
  }

  async function joinTeam(teamId: string) {
    if (!userId) {
      setError("Please sign in to join a team.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabaseClient.from("hackathon_team_members").insert({ team_id: teamId, user_id: userId });
      if (insertError) {
        throw insertError;
      }
      await refresh();
    } catch (err) {
      setError((err as Error).message || "Unable to join team.");
    } finally {
      setLoading(false);
    }
  }

  async function leaveTeam(teamId: string) {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabaseClient
        .from("hackathon_team_members")
        .delete()
        .match({ team_id: teamId, user_id: userId });

      if (deleteError) {
        throw deleteError;
      }
      await refresh();
    } catch (err) {
      setError((err as Error).message || "Unable to leave team.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-primary">Team formation</p>
            <h2 className="text-2xl font-semibold text-foreground">Create or join a hackathon team.</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl bg-surface px-4 py-3 text-sm text-muted">
            <Users size={18} /> {teams.length} teams
          </div>
        </div>

        <form onSubmit={handleCreateTeam} className="mt-6 grid gap-4 sm:grid-cols-2">
          <input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder="Team name"
            className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Team description"
            className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
            Create team
          </button>
        </form>

        {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
      </div>

      <div className="space-y-4">
        {teams.map((team) => {
          const isMember = members.some((member) => member.team_id === team.id && member.user_id === userId);
          const isLeader = team.leader_id === userId;
          const teamCount = membershipByTeam[team.id] ?? 0;

          return (
            <div key={team.id} className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">{team.team_name}</h3>
                  <p className="text-sm text-muted">{team.description || "No team description provided."}</p>
                  <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-muted">
                    <span>{teamCount} members</span>
                    <span>Leader: {team.leader_id.slice(0, 8)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  {userId ? (
                    isMember ? (
                      <button
                        type="button"
                        onClick={() => leaveTeam(team.id)}
                        className="inline-flex items-center gap-2 rounded-3xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/5"
                      >
                        <MinusCircle size={16} /> Leave team
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => joinTeam(team.id)}
                        className="inline-flex items-center gap-2 rounded-3xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                      >
                        <ArrowRight size={16} /> Join team
                      </button>
                    )
                  ) : (
                    <p className="text-sm text-muted">Sign in to join or create teams.</p>
                  )}
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-xs text-muted">
                    <Copy size={14} />
                    <span className="break-all">Invite link: /hackathons/{hackathonId}/teams?team={team.id}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
