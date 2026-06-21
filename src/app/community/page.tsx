import Link from 'next/link';
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, TrendingUp, Calendar, ArrowRight, Sparkles, Trophy, Megaphone, Handshake, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";

export default async function CommunityPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/community`, { cache: 'no-store' });
  const json = await res.json().catch(() => ({ posts: [] }));
  const posts = json?.posts || [];

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
          </AnimatedSection>
        </Container>
      </section>

      <Container className="py-20">
        <AnimatedSection>
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
