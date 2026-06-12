"use client";

import { motion } from "framer-motion";
import { ArrowRight, Eye, Heart, TrendingUp, Users, Zap, Clock, CheckCircle2 } from "lucide-react";
import { NexusLogo } from "@/components/shared/NexusLogo";

const floatingCards = [
  { title: "AI Project", views: "2.4K", likes: "89%", status: "Active", delay: 0.1 },
  { title: "IoT System", views: "1.8K", likes: "92%", status: "Completed", delay: 0.2 },
  { title: "ML Model", views: "3.1K", likes: "95%", status: "Featured", delay: 0.3 },
];

const analyticsData = [
  { label: "Total Views", value: "12.5K", change: "+24%", icon: Eye },
  { label: "Active Users", value: "1.2K", change: "+18%", icon: Users },
  { label: "Projects", value: "48", change: "+12%", icon: Zap },
];

const activityItems = [
  { text: "New AI project published", time: "2m ago", icon: CheckCircle2 },
  { text: "IoT system updated", time: "15m ago", icon: CheckCircle2 },
  { text: "Research paper added", time: "1h ago", icon: CheckCircle2 },
];

export function PremiumHero() {
  return (
    <section className="relative h-screen overflow-hidden bg-gradient-to-b from-background via-background to-background/95">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-secondary/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex h-full items-center px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-3 rounded-full border border-border/80 bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-2 text-sm backdrop-blur-sm"
            >
              <span className="font-semibold text-primary">Engineering Innovation Platform</span>
              <span className="text-muted">Build, Learn & Grow</span>
              <span className="text-secondary">✧</span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <h1 className="max-w-3xl bg-gradient-to-r from-foreground via-foreground to-muted bg-clip-text text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                Build Your Engineering Career with Real-World Projects
              </h1>
              <p className="max-w-2xl text-lg text-muted sm:text-xl">
                Master AI, IoT, software, and hardware through industry-grade projects with complete documentation, AI explanations, and a thriving engineering ecosystem.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <a
                href="#featured-projects"
                className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-secondary px-8 py-4 text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
              >
                Browse Projects
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#about"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-border/70 bg-surface/80 px-8 py-4 text-sm font-bold text-foreground transition-all hover:border-primary hover:bg-primary/5 backdrop-blur-sm"
              >
                Learn More
              </a>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-6 pt-4"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-primary/20 to-secondary/20"
                    />
                  ))}
                </div>
                <span className="text-sm text-muted">1,200+ Engineers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Industry-Grade Projects</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>AI-Powered Learning</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Interactive Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Main Dashboard Card */}
            <div className="relative rounded-3xl border border-border/80 bg-gradient-to-br from-surface/90 to-background/90 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:from-slate-950/90 dark:to-slate-900/90">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                    <NexusLogo className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Dashboard</h3>
                    <p className="text-xs text-muted">Real-time analytics</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs text-muted">Live</span>
                </div>
              </div>

              {/* Analytics Cards */}
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                {analyticsData.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="rounded-2xl border border-border/70 bg-surface/80 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80"
                  >
                    <div className="flex items-center justify-between">
                      <item.icon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-success">{item.change}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted">{item.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Floating Project Cards */}
              <div className="relative mb-6 space-y-3">
                {floatingCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + card.delay }}
                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface/80 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                        <NexusLogo className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{card.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {card.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {card.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {card.status}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Activity Feed */}
              <div className="rounded-2xl border border-border/70 bg-surface/80 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Recent Activity</h4>
                <div className="space-y-3">
                  {activityItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      <item.icon className="h-4 w-4 text-success" />
                      <span className="flex-1 text-muted">{item.text}</span>
                      <span className="text-xs text-muted">{item.time}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 top-20 rounded-2xl border border-border/80 bg-gradient-to-br from-primary/20 to-secondary/20 p-4 shadow-xl backdrop-blur-xl dark:border-slate-800"
            >
              <TrendingUp className="h-6 w-6 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">+24%</p>
              <p className="text-xs text-muted">Growth</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-4 bottom-20 rounded-2xl border border-border/80 bg-gradient-to-br from-secondary/20 to-primary/20 p-4 shadow-xl backdrop-blur-xl dark:border-slate-800"
            >
              <Clock className="h-6 w-6 text-secondary" />
              <p className="mt-2 text-sm font-semibold text-foreground">24/7</p>
              <p className="text-xs text-muted">Available</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
