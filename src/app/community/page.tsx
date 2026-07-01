import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Footer } from '@/components/layout/Footer';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  ArrowRight,
  Sparkles,
  Trophy,
  Megaphone,
  Handshake,
  Search,
  Filter,
  MapPin,
  Clock,
  Code2,
  Award,
  Crown,
  ImageIcon,
  BookOpen,
  Mail,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { StatCard } from './components/StatCard';
import { ChapterCard } from './components/ChapterCard';
import { EventCard } from './components/EventCard';
import { CollaborationCard } from './components/CollaborationCard';
import { LeaderboardCard } from './components/LeaderboardCard';
import { AmbassadorCard } from './components/AmbassadorCard';
import { GalleryCard } from './components/GalleryCard';

export default async function CommunityPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  // Helper to fetch with timeout using AbortController
  const createTimeoutFetch = (url: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    return fetch(url, { cache: 'no-store', signal: controller.signal }).finally(() =>
      clearTimeout(timeout)
    );
  };

  // Fetch all data in parallel with error handling
  const [
    postsRes,
    statsRes,
    chaptersRes,
    eventsRes,
    collaborationsRes,
    leaderboardRes,
    ambassadorsRes,
    galleryRes,
  ] = await Promise.allSettled([
    createTimeoutFetch(`${baseUrl}/api/community`),
    createTimeoutFetch(`${baseUrl}/api/community/statistics`),
    createTimeoutFetch(`${baseUrl}/api/community/chapters`),
    createTimeoutFetch(`${baseUrl}/api/community/events`),
    createTimeoutFetch(`${baseUrl}/api/community/collaborations`),
    createTimeoutFetch(`${baseUrl}/api/community/leaderboard`),
    createTimeoutFetch(`${baseUrl}/api/community/ambassadors`),
    createTimeoutFetch(`${baseUrl}/api/community/gallery`),
  ]);

  // Parse responses with fallbacks
  const posts =
    postsRes.status === 'fulfilled'
      ? (await postsRes.value.json().catch(() => ({ posts: [] })))?.posts || []
      : [];

  const stats =
    statsRes.status === 'fulfilled'
      ? (await statsRes.value.json().catch(() => ({})))?.data || {
          total_members: 18250,
          total_countries: 42,
          active_chapters: 180,
          events_hosted: 620,
          projects_collaborated: 7036,
          active_contributors: 540,
        }
      : {
          total_members: 18250,
          total_countries: 42,
          active_chapters: 180,
          events_hosted: 620,
          projects_collaborated: 7036,
          active_contributors: 540,
        };

  const chapters =
    chaptersRes.status === 'fulfilled'
      ? (await chaptersRes.value.json().catch(() => ({ data: [] })))?.data || []
      : [];

  const events =
    eventsRes.status === 'fulfilled'
      ? (await eventsRes.value.json().catch(() => ({ data: [] })))?.data || []
      : [];

  const collaborations =
    collaborationsRes.status === 'fulfilled'
      ? (await collaborationsRes.value.json().catch(() => ({ data: [] })))?.data || []
      : [];

  const leaderboard =
    leaderboardRes.status === 'fulfilled'
      ? (await leaderboardRes.value.json().catch(() => ({ data: [] })))?.data || []
      : [];

  const ambassadors =
    ambassadorsRes.status === 'fulfilled'
      ? (await ambassadorsRes.value.json().catch(() => ({ data: [] })))?.data || []
      : [];

  const gallery =
    galleryRes.status === 'fulfilled'
      ? (await galleryRes.value.json().catch(() => ({ data: [] })))?.data || []
      : [];

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border/70 bg-gradient-to-b from-surface/50 to-background py-20">
        <Container>
          <AnimatedSection>
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-heading font-bold tracking-wide text-primary">
                <Users size={18} /> Engineering Network
              </div>
              <h1 className="text-5xl font-heading font-extrabold tracking-tight text-foreground sm:text-6xl">
                Connect, Collaborate, <span className="text-gradient">Build Together</span>
              </h1>
              <p className="text-xl text-muted leading-relaxed">
                Join a global network of engineers, researchers, and innovators.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button variant="primary">Start a Discussion</Button>
                <Button variant="secondary">Explore Topics</Button>
              </div>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon="Users"
                label="Community Members"
                value={stats.total_members}
                suffix="+"
                color="primary"
              />
              <StatCard
                icon="TrendingUp"
                label="Countries"
                value={stats.total_countries}
                color="accent"
              />
              <StatCard
                icon="Calendar"
                label="Active Chapters"
                value={stats.active_chapters}
                color="blue"
              />
            </div>
          </AnimatedSection>
        </Container>
      </section>

      <Container className="py-20">
        <AnimatedSection>
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground">
                  Regional Chapters
                </h2>
                <p className="mt-2 text-muted">Connect with engineers in your local area</p>
              </div>
              <Link
                href="/community/chapters"
                className="premium-button-secondary inline-flex items-center justify-center"
              >
                View All Chapters
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            {chapters.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {chapters.map((chapter: any) => (
                  <ChapterCard key={chapter.id} chapter={chapter} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl glass p-12 text-center">
                <MapPin className="mx-auto mb-4 h-12 w-12 text-muted" />
                <h3 className="text-xl font-heading font-bold text-foreground">No chapters yet</h3>
                <p className="mt-2 text-muted">Be the first to start a chapter in your region!</p>
              </div>
            )}
          </div>
        </AnimatedSection>
      </Container>

      <Container className="py-20">
        <AnimatedSection>
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground">Upcoming Events</h2>
                <p className="mt-2 text-muted">Join meetups, workshops, and hackathons</p>
              </div>
              <Link
                href="/community/events"
                className="premium-button-secondary inline-flex items-center justify-center"
              >
                View All Events
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            {events.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl glass p-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted" />
                <h3 className="text-xl font-heading font-bold text-foreground">
                  No upcoming events
                </h3>
                <p className="mt-2 text-muted">Check back soon for exciting events!</p>
              </div>
            )}
          </div>
        </AnimatedSection>
      </Container>

      <Container className="py-20">
        <AnimatedSection>
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground">
                  Open Collaborations
                </h2>
                <p className="mt-2 text-muted">Find team members for your next project</p>
              </div>
              <Link
                href="/community/collaborations"
                className="premium-button-secondary inline-flex items-center justify-center"
              >
                View All Projects
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            {collaborations.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {collaborations.map((collaboration: any) => (
                  <CollaborationCard key={collaboration.id} collaboration={collaboration} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl glass p-12 text-center">
                <Code2 className="mx-auto mb-4 h-12 w-12 text-muted" />
                <h3 className="text-xl font-heading font-bold text-foreground">
                  No open collaborations
                </h3>
                <p className="mt-2 text-muted">Start a new project and invite collaborators!</p>
              </div>
            )}
          </div>

          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground">
                  Community Leaderboard
                </h2>
                <p className="mt-2 text-muted">Top contributors this month</p>
              </div>
              <Link
                href="/community/leaderboard"
                className="premium-button-secondary inline-flex items-center justify-center"
              >
                View Full Leaderboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry: any, index: number) => (
                  <LeaderboardCard key={entry.id} entry={entry} rank={index + 1} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl glass p-12 text-center">
                <Award className="mx-auto mb-4 h-12 w-12 text-muted" />
                <h3 className="text-xl font-heading font-bold text-foreground">
                  Leaderboard coming soon
                </h3>
                <p className="mt-2 text-muted">Start contributing to climb the ranks!</p>
              </div>
            )}
          </div>

          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground">
                  Community Ambassadors
                </h2>
                <p className="mt-2 text-muted">Meet the leaders driving our community forward</p>
              </div>
              <Link
                href="/community/ambassadors"
                className="premium-button-secondary inline-flex items-center justify-center"
              >
                View All Ambassadors
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            {ambassadors.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {ambassadors.map((ambassador: any) => (
                  <AmbassadorCard key={ambassador.id} ambassador={ambassador} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl glass p-12 text-center">
                <Crown className="mx-auto mb-4 h-12 w-12 text-muted" />
                <h3 className="text-xl font-heading font-bold text-foreground">
                  Ambassador program coming soon
                </h3>
                <p className="mt-2 text-muted">Apply to become a community ambassador!</p>
              </div>
            )}
          </div>

          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground">
                  Community Gallery
                </h2>
                <p className="mt-2 text-muted">Moments from our events and meetups</p>
              </div>
              <Link
                href="/community/gallery"
                className="premium-button-secondary inline-flex items-center justify-center"
              >
                View All Photos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            {gallery.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {gallery.map((item: any) => (
                  <GalleryCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl glass p-12 text-center">
                <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted" />
                <h3 className="text-xl font-heading font-bold text-foreground">
                  Gallery coming soon
                </h3>
                <p className="mt-2 text-muted">Share your community moments!</p>
              </div>
            )}
          </div>
        </AnimatedSection>
      </Container>

      <Footer />
    </main>
  );
}
