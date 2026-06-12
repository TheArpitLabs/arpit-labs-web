import Link from 'next/link';
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, TrendingUp, Calendar, ArrowRight, Sparkles } from "lucide-react";
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
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold tracking-wide text-primary">
                <Users size={18} /> Community Hub
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
                Connect, Collaborate, <span className="text-gradient">Build Together</span>
              </h1>
              <p className="text-xl text-muted leading-relaxed">
                Join a global network of engineers, researchers, and innovators. Share knowledge, get feedback, and accelerate your projects with community support.
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
          {/* Stats Section */}
          <div className="mb-16 grid gap-6 sm:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl glass p-8 text-center"
            >
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                <Users size={28} />
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                1,200+
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">Active Members</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-3xl glass p-8 text-center"
            >
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                <MessageSquare size={28} />
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                5,000+
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">Discussions</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-3xl glass p-8 text-center"
            >
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                <TrendingUp size={28} />
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                24/7
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">Active Engagement</p>
            </motion.div>
          </div>

          {/* Posts Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Recent Discussions</h2>
                <p className="text-muted">Latest conversations from the community</p>
              </div>
              <Link href="/community/new" className="premium-button inline-flex items-center justify-center">
                <Sparkles className="mr-2 h-5 w-5" />
                New Post
              </Link>
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
                            <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
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
            ) : (
              <Card variant="glass" className="p-12 text-center">
                <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                  <MessageSquare className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">No discussions yet</h3>
                <p className="text-muted mb-8 max-w-md mx-auto">
                  Be the first to start a conversation and help build our community knowledge base.
                </p>
                <Link href="/community/new" className="premium-button inline-flex items-center justify-center">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start First Discussion
                </Link>
              </Card>
            )}
          </div>
        </AnimatedSection>
      </Container>

      <Footer />
    </main>
  );
}
