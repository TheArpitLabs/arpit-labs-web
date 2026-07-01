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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
                <Card key={label} variant="elevated" className="p-6">
                  <p className="text-sm text-muted">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
                </Card>
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
                <Card key={startup.id} className="group overflow-hidden">
                  <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 p-6">
                    <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-surface shadow-sm">
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
                  </div>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {startup.stage}
                      </span>
                      {startup.featured ? (
                        <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <CardTitle className="text-2xl">{startup.name}</CardTitle>
                    <CardDescription>{startup.description}</CardDescription>
                  </CardContent>
                  <CardFooter className="justify-between gap-4 flex-wrap">
                    {startup.website_url ? (
                      <a
                        href={startup.website_url}
                        className="text-sm font-semibold text-primary transition hover:text-primary/80"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Website
                      </a>
                    ) : null}
                    {startup.slug ? (
                      <a
                        href={`/innovation/${startup.slug}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-muted transition hover:text-foreground"
                      >
                        Profile <ArrowRight className="h-4 w-4" />
                      </a>
                    ) : null}
                  </CardFooter>
                </Card>
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
                <Card key={program.id} className="rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-xl">{program.name}</CardTitle>
                    <CardDescription>{program.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
          <IncubationApplicationForm programs={programs} />
        </section>

        <section className="space-y-8" id="challenges">
          <h2 className="text-4xl font-bold">Innovation Challenges</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {challenges.map((challenge: any) => (
              <Card key={challenge.id} className="rounded-3xl">
                <CardHeader className="flex items-center gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Trophy size={20} />
                  </div>
                  <CardTitle className="text-xl">{challenge.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{challenge.description}</CardDescription>
                  <p className="mt-4 text-sm font-semibold text-foreground">
                    Deadline: {new Date(challenge.end_date).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
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
                  className="group rounded-3xl border border-border/70 bg-card p-6 transition hover:border-primary hover:bg-surface"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-105">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold text-foreground transition group-hover:text-primary">
                    {resource.title}
                  </h3>
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
              <Card key={story.id} className="rounded-3xl">
                <CardHeader className="flex items-center gap-3 text-primary">
                  <Target size={20} />
                  <span className="text-sm font-bold">
                    {story.founder_name || story.startups?.name || 'Innovation Team'}
                  </span>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-2xl">{story.title}</CardTitle>
                  <CardDescription>{story.excerpt || story.story}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </Container>

      <Footer />
    </main>
  );
}
