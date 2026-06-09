"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Github, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { GitHubService, GitHubRepository } from "@/lib/github.service";
import { supabaseClient } from "@/lib/supabase/client";
import { ProjectInput } from "@/lib/validation/project.schema";

const PROJECT_TYPES = [
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'research', label: 'Research' },
  { value: 'opensource', label: 'Open Source' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;

export default function ImportProjectPage() {
  const router = useRouter();
  const [githubUrl, setGithubUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repository, setRepository] = useState<GitHubRepository | null>(null);
  const [user, setUser] = useState<any | null>(null);

  React.useEffect(() => {
    const getUser = async () => {
      const { data } = await supabaseClient.auth.getUser();
      setUser(data?.user ?? null);
    };
    getUser();
  }, []);

  const handleFetchRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRepository(null);

    if (!githubUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    setIsFetching(true);

    try {
      const data = await GitHubService.importRepository(githubUrl);
      setRepository(data.repository);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch repository");
    } finally {
      setIsFetching(false);
    }
  };

  const handleImportProject = async () => {
    if (!repository || !user) {
      setError("You must be logged in to import a project");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      // Check for duplicate
      const { data: existingProject } = await supabaseClient
        .from('projects')
        .select('id')
        .eq('github_url', repository.html_url)
        .single();

      if (existingProject) {
        setError("This repository has already been imported. You can edit the existing project instead.");
        setIsImporting(false);
        return;
      }

      // Map topics to taxonomy
      const taxonomies = GitHubService.mapTopicsToTaxonomy(repository.topics);
      const languages = GitHubService.extractLanguages(repository.languages);
      
      // Generate slug
      const slug = GitHubService.generateSlug(repository.name);

      // Prepare project payload
      const payload: ProjectInput = {
        title: repository.name.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        slug,
        description: repository.description || `A ${repository.name} project imported from GitHub`,
        project_type: 'opensource',
        branch: repository.default_branch,
        domain: taxonomies[0] || null,
        category: taxonomies.length > 1 ? taxonomies[1] : null,
        technologies: {
          languages: languages,
          frameworks: repository.topics.filter(t => 
            ['react', 'vue', 'angular', 'nextjs', 'nuxt', 'express', 'django', 'rails', 'spring', 'laravel'].includes(t.toLowerCase())
          ),
        },
        languages,
        frameworks: repository.topics.filter(t => 
          ['react', 'vue', 'angular', 'nextjs', 'nuxt', 'express', 'django', 'rails', 'spring', 'laravel'].includes(t.toLowerCase())
        ),
        tools: {
          github: ['GitHub'],
        },
        github_url: repository.html_url,
        demo_url: repository.homepage || null,
        documentation_url: null,
        video_url: null,
        cover_image: GitHubService.generateCoverPlaceholder(repository.owner.login, repository.name),
        owner_id: user.id,
        organization_id: null,
        status: 'draft',
        featured: false,
        // Legacy fields
        content: null,
        overview: null,
        problem_statement: null,
        architecture: null,
        tech_stack: languages,
        screenshots: [],
        lessons_learned: null,
        tags: repository.topics,
        published: false,
      };

      // Create project
      const { data: project, error: insertError } = await supabaseClient
        .from('projects')
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;

      // Redirect to edit page
      router.push(`/creator/projects/${project.slug}/edit`);
    } catch (err) {
      console.error('Error importing project:', err);
      setError(err instanceof Error ? err.message : "Failed to import project");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <Link href="/profile/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Import from GitHub</h1>
        <p className="mt-2 text-muted-foreground">Import a public GitHub repository to create a new project.</p>
      </div>

      {/* URL Input */}
      <Card className="border-border/70 bg-card p-6">
        <form onSubmit={handleFetchRepository} className="flex gap-4">
          <div className="flex-1">
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/vercel/next.js"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              disabled={isFetching || isImporting}
            />
          </div>
          <Button
            type="submit"
            disabled={isFetching || isImporting || !githubUrl.trim()}
            className="gap-2"
          >
            {isFetching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Github className="h-4 w-4" />
                Fetch Repository
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </Card>

      {/* Repository Preview */}
      {repository && (
        <Card className="mt-6 border-border/70 bg-card p-6">
          <div className="flex items-start gap-4">
            <Image
              src={repository.owner.avatar_url}
              alt={repository.owner.login}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{repository.name}</h2>
              <p className="text-sm text-muted-foreground">
                by {repository.owner.login}
              </p>
              <p className="mt-2 text-sm">{repository.description || "No description available"}</p>
              
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Github className="h-4 w-4" />
                  <span>{repository.stargazers_count} stars</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{repository.forks_count} forks</span>
                </div>
                {repository.language && (
                  <div className="flex items-center gap-1">
                    <span>{repository.language}</span>
                  </div>
                )}
                {repository.license && (
                  <div className="flex items-center gap-1">
                    <span>{repository.license.name}</span>
                  </div>
                )}
              </div>

              {repository.topics.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {repository.topics.slice(0, 10).map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {Object.keys(repository.languages).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium">Languages:</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.keys(repository.languages).map((lang) => (
                      <span
                        key={lang}
                        className="rounded-full border border-border/70 px-3 py-1 text-xs"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-6">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span>Repository data fetched successfully</span>
            </div>
            <Button
              onClick={handleImportProject}
              disabled={isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Github className="h-4 w-4" />
                  Import as Draft
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </main>
  );
}
