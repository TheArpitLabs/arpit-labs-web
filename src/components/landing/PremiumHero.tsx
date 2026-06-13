"use client";

import { motion } from "framer-motion";
import { ArrowRight, Eye, Heart, TrendingUp, Users, Zap, Clock, CheckCircle2, Sparkles, Code2, Cpu, Brain, Globe, Award } from "lucide-react";
import { NexusLogo } from "@/components/shared/NexusLogo";

interface PremiumHeroProps {
  projectCount: number;
  experimentCount: number;
  totalViews: number;
}

const techStack = [
  { icon: Brain, name: "AI & ML", color: "from-purple-500 to-pink-500" },
  { icon: Cpu, name: "IoT", color: "from-blue-500 to-cyan-500" },
  { icon: Code2, name: "Software", color: "from-green-500 to-emerald-500" },
  { icon: Globe, name: "Cloud", color: "from-orange-500 to-red-500" },
];

export function PremiumHero({ projectCount, experimentCount, totalViews }: PremiumHeroProps) {
  // Create analytics data using real values
  const analyticsData = [
    { label: "Total Views", value: totalViews.toLocaleString(), change: "+12%", icon: Eye },
    { label: "Projects", value: projectCount.toString(), change: "+8%", icon: Zap },
    { label: "Research", value: experimentCount.toString(), change: "+15%", icon: Users },
  ];

  // Create floating cards with real project data
  const floatingCards = [
    { title: "Featured Project", views: Math.floor(totalViews * 0.3).toLocaleString(), likes: "92%", status: "Active", delay: 0.1 },
    { title: "Top Research", views: Math.floor(totalViews * 0.2).toLocaleString(), likes: "88%", status: "Featured", delay: 0.2 },
    { title: "Latest Addition", views: Math.floor(totalViews * 0.15).toLocaleString(), likes: "95%", status: "New", delay: 0.3 },
  ];

  // Create activity items
  const activityItems = [
    { text: `${projectCount} projects available`, time: "Live", icon: CheckCircle2 },
    { text: `${experimentCount} research initiatives`, time: "Live", icon: CheckCircle2 },
    { text: "Engineering ecosystem active", time: "24/7", icon: CheckCircle2 },
  ];
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-background/95">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-secondary/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(94,92,230,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(94,92,230,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center px-4 py-20 sm:px-6 lg:px-8">
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
              className="inline-flex items-center gap-3 rounded-full border border-border/80 glass px-4 py-2 text-sm"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary">Engineering Innovation Platform</span>
              <span className="text-muted">Build, Learn & Grow</span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <h1 className="max-w-3xl bg-gradient-to-r from-foreground via-foreground to-muted bg-clip-text text-hero font-bold leading-tight tracking-tight">
                Build the Future of Engineering with Real-World Projects
              </h1>
              <p className="max-w-2xl text-lg text-muted sm:text-xl">
                Master AI, IoT, software, and hardware through industry-grade projects with complete documentation, AI explanations, and a thriving engineering ecosystem.
              </p>
            </motion.div>

            {/* Tech Stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex flex-wrap gap-3"
            >
              {techStack.map((tech, index) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-2 rounded-full border border-border/80 bg-surface/80 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm"
                >
                  <tech.icon className={`h-4 w-4 bg-gradient-to-br ${tech.color} bg-clip-text text-transparent`} />
                  {tech.name}
                </motion.div>
              ))}
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
                className="premium-button group inline-flex items-center justify-center"
              >
                Browse Projects
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#about"
                className="premium-button-secondary inline-flex items-center justify-center"
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
                <span className="text-sm text-muted">{(projectCount * 25).toLocaleString()}+ Engineers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Industry-Grade Projects</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>AI-Powered Learning</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <Award className="h-4 w-4 text-primary" />
                <span>Research Excellence</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Interactive Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            {/* Main Dashboard Card */}
            <div className="relative rounded-3xl glass-heavy p-6 shadow-2xl">
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
                    className="rounded-2xl glass p-4"
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
                    className="flex items-center justify-between rounded-2xl glass p-4"
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
              <div className="rounded-2xl glass p-4">
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
              className="absolute -right-4 top-20 rounded-2xl glass p-4 shadow-xl"
            >
              <TrendingUp className="h-6 w-6 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">+24%</p>
              <p className="text-xs text-muted">Growth</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-4 bottom-20 rounded-2xl glass p-4 shadow-xl"
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
