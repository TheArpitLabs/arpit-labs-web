"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { Loader2, Upload, Github, MonitorPlay, FileText } from "lucide-react";

interface HackathonSubmissionsClientProps {
  hackathonId: string;
}

interface TeamRecord {
  id: string;
  team_name: string;
  leader_id: string;
}

interface SubmissionRecord {
  id: string;
  team_id: string;
  title: string;
  description?: string | null;
  github_url?: string | null;
  demo_url?: string | null;
  documentation_url?: string | null;
  score?: number | null;
  submitted_at: string;
}

export default function HackathonSubmissionsClient({ hackathonId }: HackathonSubmissionsClientProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState(""
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [documentationFile, setDocumentationFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [{ data: sessionData }, { data: teamData }, { data: submissionData }] = await Promise.all([
        supabaseClient.auth.getUser(),
        supabaseClient.from("hackathon_teams").select("*").eq("hackathon_id", hackathonId).order("created_at", { ascending: false }),
        supabaseClient.from("hackathon_submissions").select("*").eq("hackathon_id", hackathonId).order("submitted_at", { ascending: false }),
      ]);

      if (!mounted) return;
      setUserId(sessionData?.user?.id ?? null);
      setTeams((teamData ?? []) as TeamRecord[]);
      setSubmissions((submissionData ?? []) as SubmissionRecord[]);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [hackathonId]);

  const userTeams = useMemo(() => {
    if (!userId) return [];
    return teams.filter((team) => team.leader_id === userId);
  }, [teams, userId]);

  async function refresh() {
    const { data: submissionData } = await supabaseClient.from("hackathon_submissions").select("*").eq("hackathon_id", hackathonId).order("submitted_at", { ascending: false });
    setSubmissions((submissionData ?? []) as SubmissionRecord[]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!userId) {
      setError("Please sign in to submit a project.");
      setLoading(false);
      return;
    }

    if (!selectedTeamId) {
      setError("Select a team to submit from.");
      setLoading(false);
      return;
    }

    try {
      let documentation_url: string | null = null;

      if (documentationFile) {
        const fileExtension = documentationFile.name.split(".").pop() || "pdf";
        const filePath = `hackathon-docs/${crypto.randomUUID()}.${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from("uploads")
          .upload(filePath, documentationFile, {
            contentType: documentationFile.type,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabaseClient.storage.from("uploads").getPublicUrl(filePath);
        documentation_url = urlData.publicUrl;
      }

      const { error: insertError } = await supabaseClient.from("hackathon_submissions").insert({
        hackathon_id: hackathonId,
        team_id: selectedTeamId,
        title,
        description,
        github_url: githubUrl || null,
        demo_url: demoUrl || null,
        documentation_url,
        score: 0,
      });

      if (insertError) {
        throw insertError;
      }

      setTitle("");
      setDescription("");
      setGithubUrl("");
      setDemoUrl("");
      setDocumentationFile(null);
      await refresh();
    } catch (err) {
      setError((err as Error).message || "Unable to submit your project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-primary">Project submission</p>
            <h2 className="text-2xl font-semibold text-foreground">Upload your submission for review.</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl bg-surface px-4 py-3 text-sm text-muted">
            <Upload size={18} /> {submissions.length} submissions
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <select
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            >
              <option value="">Select your team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.team_name}</option>
              ))}
            </select>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Submission title"
              className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Project description"
            rows={4}
            className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={githubUrl}
              onChange={(event) => setGithubUrl(event.target.value)}
              placeholder="GitHub URL"
              className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
            <input
              value={demoUrl}
              onChange={(event) => setDemoUrl(event.target.value)}
              placeholder="Demo URL"
              className="w-full rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>

          <label className="group flex cursor-pointer items-center gap-3 rounded-3xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground transition hover:border-primary">
            <FileText size={18} />
            <span>{documentationFile ? documentationFile.name : "Upload documentation"}</span>
            <input
              type="file"
              accept="application/pdf,image/*,.doc,.docx"
              className="sr-only"
              onChange={(event) => setDocumentationFile(event.target.files?.[0] ?? null)}
            />
          </label>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github size={16} />}
            Submit project
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-[2rem] border border-border/70 bg-card px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
          <MonitorPlay size={20} />
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary">Review queue</p>
            <p className="text-sm text-muted">Submissions are visible below once they are submitted.</p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-[2rem] border border-border/70 bg-background p-10 text-center text-muted dark:border-slate-800 dark:bg-slate-950/80">
            No submissions have been posted yet.
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{submission.title}</p>
                    <p className="text-sm text-muted">Team: {submission.team_id}</p>
                  </div>
                  <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-muted dark:border-slate-800 dark:bg-slate-950/90">
                    <span>Score {submission.score ?? 0}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted">{submission.description || "No description provided."}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-primary">
                  {submission.github_url ? <a href={submission.github_url} target="_blank" rel="noreferrer" className="underline">GitHub</a> : null}
                  {submission.demo_url ? <a href={submission.demo_url} target="_blank" rel="noreferrer" className="underline">Demo</a> : null}
                  {submission.documentation_url ? <a href={submission.documentation_url} target="_blank" rel="noreferrer" className="underline">Documentation</a> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
