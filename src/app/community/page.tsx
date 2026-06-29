import Link from 'next/link';
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, TrendingUp, Calendar, ArrowRight, Sparkles, Trophy, Megaphone, Handshake, Search, Filter, MapPin, Clock, Code2, Award, Crown, Image as ImageIcon, BookOpen, Mail, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "./components/StatCard";
import { ChapterCard } from "./components/ChapterCard";
import { EventCard } from "./components/EventCard";
import { CollaborationCard } from "./components/CollaborationCard";
import { LeaderboardCard } from "./components/LeaderboardCard";
import { AmbassadorCard } from "./components/AmbassadorCard";
import { GalleryCard } from "./components/GalleryCard";

export default async function CommunityPage() {
  // Fetch all data in parallel with error handling
  const [
    postsRes,
    statsRes,
    chaptersRes,
    eventsRes,
    collaborationsRes,
    leaderboardRes,
    ambassadorsRes,
    galleryRes
  ] = await Promise.allSettled([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/community`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/community/statistics`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/community/chapters`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/community/events`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/community/collaborations`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/community/leaderboard`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/community/ambassadors`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/community/gallery`, { cache: 'no-store' })
  ]);

  // Parse responses with fallbacks
  const posts = postsRes.status === 'fulfilled' 
    ? (await postsRes.value.json().catch(() => ({ posts: [] })))?.posts || []
    : [];

  const stats = statsRes.status === 'fulfilled'
    ? (await statsRes.value.json().catch(() => ({})))?.data || {
        total_members: 18250,
        total_countries: 42,
        active_chapters: 180,
        events_hosted: 620,
        projects_collaborated: 7036,
        active_contributors: 540
      }
    : {
        total_members: 18250,
        total_countries: 42,
        active_chapters: 180,
        events_hosted: 620,
        projects_collaborated: 7036,
        active_contributors: 540
      };

  const chapters = chaptersRes.status === 'fulfilled'
    ? (await chaptersRes.value.json().catch(() => ({ data: [] })))?.data || []
    : [];

  const events = eventsRes.status === 'fulfilled'
    ? (await eventsRes.value.json().catch(() => ({ data: [] })))?.data || []
    : [];

  const collaborations = collaborationsRes.status === 'fulfilled'
    ? (await collaborationsRes.value.json().catch(() => ({ data: [] })))?.data || []
    : [];

  const leaderboard = leaderboardRes.status === 'fulfilled'
    ? (await leaderboardRes.value.json().catch(() => ({ data: [] })))?.data || []
    : [];

  const ambassadors = ambassadorsRes.status === 'fulfilled'
    ? (await ambassadorsRes.value.json().catch(() => ({ data: [] })))?.data || []
    : [];

  const gallery = galleryRes.status === 'fulfilled'
    ? (await galleryRes.value.json().catch(() => ({ data: [] })))?.data || []
    : [];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
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
                Join a global network of engineers, researchers, and innovators. Engage in discussions, participate in challenges, stay updated with announcements, and find collaboration opportunities.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/community/new" className="premium-button inline-flex items-center justify-center">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start a Discussion
                </Link>
                <Link href="/community/global" className="premium-button-secondary inline-flex items-center justify-center">
                  Explore Topics
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Live Statistics */}
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon={Users}
                label="Community Members"
                value={stats.total_members}
                suffix="+"
                color="primary"
              />
              <StatCard
                icon={TrendingUp}
                label="Countries"
                value={stats.total_countries}
                color="accent"
              />
              <StatCard
                icon={Calendar}
                label="Active Chapters"
                value={stats.active_chapters}
                color="blue"
              />
              <StatCard
                icon={Trophy}
                label="Events Hosted"
                value={stats.events_hosted}
                color="yellow"
              />
              <StatCard
                icon={Handshake}
                label="Projects Collaborated"
                value={stats.projects_collaborated}
                color="green"
              />
              <StatCard
                icon={Sparkles}
                label="Active Contributors"
                value={stats.active_contributors}
                color="purple"
              />
            </div>
          </AnimatedSection>
        </Container>
      </section>

      <Container className="py-20">
        <AnimatedSection>
          {/* Regional Chapters */}
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground">Regional Chapters</h2>
                <p className="mt-2 text-muted">Connect with engineers in your local area</p>
              </div>
              <Link href="/community/chapters" className="premium-button-secondary inline-flex items-center justify-center">
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

          {/* Upcoming Events */}
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground">Upcoming Events</h2>
                <p className="mt-2 text-muted">Join meetups, workshops, and hackathons</p>
              </div>
              <Link href="/community/events" className="premium-button-secondary inline-flex items-center justify-center">
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
                <h3 className="text-xl font-heading font-bold text-foreground">No upcoming events</h3>
                <p className="mt-2 text-muted">Check back soon for exciting events!</p>
              </div>
            )}
          </div>

          {/* Projects Showcase */}
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground">Open Collaborations</h2>
                <p className="mt-2 text-muted">Find team members for your next project</p>
              </div>
              <Link href="/community/collaborations" className="premium-button-secondary inline-flex items-center justify-center">
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
                <h3 className="text-xl font-heading font-bold text-foreground">No open collaborations</h3>
                <p className="mt-2 text-muted">Start a new project and invite collaborators!</p>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground">Community Leaderboard</h2>
                <p className="mt-2 text-muted">Top contributors this month</p>
              </div>
              <Link href="/community/leaderboard" className="premium-button-secondary inline-flex items-center justify-center">
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
                <h3 className="text-xl font-heading font-bold text-foreground">Leaderboard coming soon</h3>
                <p className="mt-2 text-muted">Start contributing to climb the ranks!</p>
              </div>
            )}
          </div>

          {/* Ambassador Program */}
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground">Community Ambassadors</h2>
                <p className="mt-2 text-muted">Meet the leaders driving our community forward</p>
              </div>
              <Link href="/community/ambassadors" className="premium-button-secondary inline-flex items-center justify-center">
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
                <h3 className="text-xl font-heading font-bold text-foreground">Ambassador program coming soon</h3>
                <p className="mt-2 text-muted">Apply to become a community ambassador!</p>
              </div>
            )}
          </div>

          {/* Community Gallery */}
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground">Community Gallery</h2>
                <p className="mt-2 text-muted">Moments from our events and meetups</p>
              </div>
              <Link href="/community/gallery" className="premium-button-secondary inline-flex items-center justify-center">
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
                <h3 className="text-xl font-heading font-bold text-foreground">Gallery coming soon</h3>
                <p className="mt-2 text-muted">Share your community moments!</p>
              </div>
            )}
          </div>

          {/* Resources & Learning */}
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-3xl font-heading font-bold text-foreground">Resources & Learning</h2>
              <p className="mt-2 text-muted">Educational content and community resources</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/learning" className="group">
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="relative overflow-hidden rounded-2xl glass p-6 transition-all hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 text-blue-500">
                      <BookOpen size={28} />
                    </div>
                    <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-blue-500 transition-colors">Learning Paths</h3>
                    <p className="mt-2 text-sm text-muted">Structured courses and tutorials</p>
                  </div>
                </motion.div>
              </Link>
              <Link href="/research" className="group">
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="relative overflow-hidden rounded-2xl glass p-6 transition-all hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 text-purple-500">
                      <Trophy size={28} />
                    </div>
                    <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-purple-500 transition-colors">Research Papers</h3>
                    <p className="mt-2 text-sm text-muted">Latest engineering research</p>
                  </div>
                </motion.div>
              </Link>
              <a href="/datasets" className="group">
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="relative overflow-hidden rounded-2xl glass p-6 transition-all hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 text-green-500">
                      <Zap size={28} />
                    </div>
                    <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-green-500 transition-colors">Datasets</h3>
                    <p className="mt-2 text-sm text-muted">Open source datasets</p>
                  </div>
                </motion.div>
              </a>
              <a href="/docs" className="group">
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="relative overflow-hidden rounded-2xl glass p-6 transition-all hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 text-orange-500">
                      <Code2 size={28} />
                    </div>
                    <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-orange-500 transition-colors">Documentation</h3>
                    <p className="mt-2 text-sm text-muted">API docs and guides</p>
                  </div>
                </motion.div>
              </a>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="mb-16">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 p-12 text-center">
              <div className="relative">
                <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />
                <h2 className="text-3xl font-heading font-bold text-foreground">Stay Updated</h2>
                <p className="mt-2 text-lg text-muted">
                  Subscribe to our newsletter for the latest community updates, events, and opportunities.
                </p>
                <div className="mt-8 flex max-w-md mx-auto gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 rounded-xl bg-surface px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button className="premium-button inline-flex items-center justify-center px-6">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Network Activity Types */}
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-3xl font-heading font-bold text-foreground">Network Activity</h2>
              <p className="mt-2 text-muted">Explore different types of community engagement</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/community?filter=discussions">
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative overflow-hidden rounded-3xl glass p-6 transition-all hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
                      <MessageSquare size={28} />
                    </div>
                    <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors">Discussions</h3>
                    <p className="mt-2 text-sm text-muted">Technical conversations and knowledge sharing</p>
                  </div>
                </motion.div>
              </Link>
              <Link href="/community?filter=challenges">
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative overflow-hidden rounded-3xl glass p-6 transition-all hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 text-yellow-500">
                      <Trophy size={28} />
                    </div>
                    <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-yellow-500 transition-colors">Challenges</h3>
                    <p className="mt-2 text-sm text-muted">Engineering challenges and competitions</p>
                  </div>
                </motion.div>
              </Link>
              <Link href="/community?filter=announcements">
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative overflow-hidden rounded-3xl glass p-6 transition-all hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-500">
                      <Megaphone size={28} />
                    </div>
                    <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-blue-500 transition-colors">Announcements</h3>
                    <p className="mt-2 text-sm text-muted">Platform updates and important news</p>
                  </div>
                </motion.div>
              </Link>
              <Link href="/community?filter=collaborations">
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative overflow-hidden rounded-3xl glass p-6 transition-all hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 text-green-500">
                      <Handshake size={28} />
                    </div>
                    <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-green-500 transition-colors">Collaborations</h3>
                    <p className="mt-2 text-sm text-muted">Project partnerships and team opportunities</p>
                  </div>
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Posts Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold text-foreground">Recent Network Activity</h2>
                <p className="text-muted">Latest discussions, challenges, and collaborations</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search network..."
                    className="w-64 rounded-xl glass pl-10 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <button className="flex items-center gap-2 text-sm font-heading font-semibold text-primary hover:underline">
                  <Filter size={16} /> Filter
                </button>
                <Link href="/community/new" className="premium-button inline-flex items-center justify-center">
                  <Sparkles className="mr-2 h-5 w-5" />
                  New Post
                </Link>
              </div>
            </div>

            {posts.length > 0 ? (
              <div className="grid gap-6">
                {posts.map((p: any, index: number) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Link href={`/community/${p.slug}`} className="group block">
                      <Card variant="elevated" className="p-8 transition-all duration-300 hover:shadow-xl">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="mb-4 flex items-center gap-3">
                              <Badge variant="outline" className="px-3 py-1">
                                {p.category || 'General'}
                              </Badge>
                              <div className="flex items-center gap-2 text-sm text-muted">
                                <Calendar size={14} />
                                <span>{new Date(p.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <h3 className="text-2xl font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                              {p.title}
                            </h3>
                            <p className="mt-3 line-clamp-2 text-lg text-muted">
                              {p.content}
                            </p>
                          </div>
                          <ArrowRight className="h-6 w-6 text-muted opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : null}
          </div>
        </AnimatedSection>
      </Container>

      <Footer />
    </main>
  );
}
