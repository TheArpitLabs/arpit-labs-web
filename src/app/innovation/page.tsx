import Image from 'next/image';
import { headers } from 'next/headers';
import { Container } from '@/components/layout/Container';
import { Footer } from '@/components/layout/Footer';
import {
  Lightbulb,
  Rocket,
  Target,
  Trophy,
  FileText,
  Video,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { ChallengeSubmissionForm, IncubationApplicationForm } from './InnovationForms';

async function apiUrl(path: string) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configuredBaseUrl?.trim()) return `${configuredBaseUrl.replace(/\/$/, '')}${path}`;

  const headerStore = await headers();
  const protocol = headerStore.get('x-forwarded-proto') || 'http';
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host') || 'localhost:3000';
  return `${protocol}://${host}${path}`;
}

async function loadData(path: string, fallback: any) {
  try {
    // Race against timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout')), 10000)
    );

    const response = (await Promise.race([
      fetch(await apiUrl(path), { cache: 'no-store' }),
      timeoutPromise,
    ])) as Response;

    if (!response.ok) return fallback;
    const json = await response.json();
    return json.data ?? fallback;
  } catch {
    return fallback;
  }
}

export default async function InnovationHubPage() {
  const [startups, programs, challenges, resources, stories, metrics] = await Promise.all([
    loadData('/api/innovation/startups?limit=9', []),
    loadData('/api/innovation/programs', []),
    loadData('/api/innovation/challenges', []),
    loadData('/api/innovation/resources', []),
    loadData('/api/innovation/success-stories', []),
    loadData('/api/innovation/metrics', {}),
  ]);

  const metricCards = [
    ['Active Startups', metrics.active_startups || 0],
    ['Incubated Projects', metrics.incubated_projects || 0],
    ['Funding Tracked', `$${Number(metrics.total_funding || 0).toLocaleString()}`],
    ['Active Mentors', metrics.mentors_active || 0],
  ];

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border/70 bg-gradient-to-b from-surface/50 to-background py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-1.5 text-sm font-bold tracking-wide text-secondary">
                <Lightbulb size={18} /> Innovation Hub
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl">
                Where ideas become <span className="text-primary text-glow">impact.</span>
              </h1>
              <p className="max-w-2xl text-xl leading-relaxed text-muted">
                Discover startups, incubation programs, challenges, resources, and success stories
                powered by the Axiora innovation database.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#incubation"
                  className="premium-button inline-flex items-center justify-center"
                >
                  Apply for Incubation
                </a>
                <a
                  href="#challenges"
                  className="premium-button-secondary inline-flex items-center justify-center"
                >
                  Innovation Challenges
                </a>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {metricCards.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border/70 bg-card p-6">
                  <p className="text-sm text-muted">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Container className="space-y-20 py-20">
        <section className="space-y-8" id="startups">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl font-bold">Startup Showcase</h2>
              <p className="mt-2 text-muted">Featured and latest startups loaded from Supabase.</p>
            </div>
          </div>
          {startups.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {startups.map((startup: any) => (
                <article
                  key={startup.id}
                  className="flex flex-col rounded-2xl border border-border/70 bg-card p-6"
                >
                  <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
                    {startup.logo_url ? (
                      <Image
                        src={startup.logo_url}
                        alt={startup.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <Rocket className="text-primary" size={32} />
                    )}
                  </div>
                  <div className="mb-3 flex gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      {startup.stage}
                    </span>
                    {startup.featured ? (
                      <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-2xl font-bold">{startup.name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                    {startup.description}
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    {startup.website_url ? (
                      <a
                        href={startup.website_url}
                        className="text-sm font-bold text-primary hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Website
                      </a>
                    ) : null}
                    {startup.slug ? (
                      <a
                        href={`/innovation/${startup.slug}`}
                        className="text-sm text-muted hover:text-foreground"
                      >
                        Profile <ArrowRight className="inline h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/70 bg-card p-10 text-center text-muted">
              No public startups are available yet.
            </div>
          )}
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]" id="incubation">
          <div>
            <h2 className="text-4xl font-bold">Incubation Program</h2>
            <p className="mt-3 text-muted">
              Open programs, validation rules, and applications are connected to Supabase.
            </p>
            <div className="mt-6 space-y-4">
              {programs.map((program: any) => (
                <div key={program.id} className="rounded-2xl border border-border/70 bg-card p-5">
                  <h3 className="font-bold">{program.name}</h3>
                  <p className="mt-2 text-sm text-muted">{program.description}</p>
                </div>
              ))}
            </div>
          </div>
          <IncubationApplicationForm programs={programs} />
        </section>

        <section className="space-y-8" id="challenges">
          <h2 className="text-4xl font-bold">Innovation Challenges</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {challenges.map((challenge: any) => (
              <article
                key={challenge.id}
                className="rounded-2xl border border-border/70 bg-card p-6"
              >
                <Trophy className="mb-4 text-primary" />
                <h3 className="text-xl font-bold">{challenge.title}</h3>
                <p className="mt-2 text-sm text-muted">{challenge.description}</p>
                <p className="mt-4 text-sm font-semibold">
                  Deadline: {new Date(challenge.end_date).toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>
          <ChallengeSubmissionForm challenges={challenges} />
        </section>

        <section className="space-y-8">
          <h2 className="text-4xl font-bold">Innovation Resources</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource: any) => {
              const Icon =
                resource.resource_type === 'video'
                  ? Video
                  : resource.resource_type === 'document'
                    ? FileText
                    : ExternalLink;
              return (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-border/70 bg-card p-6 hover:border-primary"
                >
                  <Icon className="mb-4 text-primary" />
                  <h3 className="font-bold">{resource.title}</h3>
                  <p className="mt-2 text-sm text-muted">{resource.description}</p>
                </a>
              );
            })}
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-4xl font-bold">Success Stories</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {stories.map((story: any) => (
              <article key={story.id} className="rounded-2xl border border-border/70 bg-card p-6">
                <div className="mb-4 flex items-center gap-3 text-primary">
                  <Target size={20} />
                  <span className="text-sm font-bold">
                    {story.founder_name || story.startups?.name || 'Innovation Team'}
                  </span>
                </div>
                <h3 className="text-2xl font-bold">{story.title}</h3>
                <p className="mt-3 text-muted">{story.excerpt || story.story}</p>
              </article>
            ))}
          </div>
        </section>
      </Container>

      <Footer />
    </main>
  );
}
