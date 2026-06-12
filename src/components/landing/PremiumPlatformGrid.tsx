"use client";

import { motion } from "framer-motion";
import { ArrowRight, Microscope, Lightbulb, Globe, Brain, ShoppingBag, FolderOpen } from "lucide-react";
import Link from "next/link";

const platformFeatures = [
  {
    title: "Research",
    description: "Explore cutting-edge research papers, datasets, and publications across AI, IoT, and cybersecurity.",
    icon: Microscope,
    href: "/research",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconGradient: "from-blue-500 to-cyan-500"
  },
  {
    title: "Innovation",
    description: "Discover startups, venture initiatives, and innovation projects transforming ideas into reality.",
    icon: Lightbulb,
    href: "/innovation",
    gradient: "from-yellow-500/10 to-orange-500/10",
    iconGradient: "from-yellow-500 to-orange-500"
  },
  {
    title: "Community",
    description: "Join a global network of engineers, researchers, and innovators collaborating on the future.",
    icon: Globe,
    href: "/community/global",
    gradient: "from-green-500/10 to-emerald-500/10",
    iconGradient: "from-green-500 to-emerald-500"
  },
  {
    title: "AI & Automation",
    description: "Leverage AI-powered tools, automation workflows, and intelligent systems for your projects.",
    icon: Brain,
    href: "/ai",
    gradient: "from-purple-500/10 to-pink-500/10",
    iconGradient: "from-purple-500 to-pink-500"
  },
  {
    title: "Marketplace",
    description: "Browse and discover products, tools, and resources built by the community.",
    icon: ShoppingBag,
    href: "/marketplace",
    gradient: "from-red-500/10 to-rose-500/10",
    iconGradient: "from-red-500 to-rose-500"
  },
  {
    title: "Projects",
    description: "Explore a comprehensive collection of open-source projects across all technology domains.",
    icon: FolderOpen,
    href: "/projects",
    gradient: "from-indigo-500/10 to-violet-500/10",
    iconGradient: "from-indigo-500 to-violet-500"
  }
];

export function PremiumPlatformGrid() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-4 text-sm uppercase tracking-[0.28em] text-muted">Platform</p>
          <h2 className="mb-6 bg-gradient-to-r from-foreground via-foreground to-muted bg-clip-text text-4xl font-bold sm:text-5xl">
            Explore the Ecosystem
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-muted">
            From research to marketplace, discover the full suite of tools and communities driving innovation at Arpit Labs.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {platformFeatures.map((feature, index) => (
            <Link key={feature.title} href={feature.href as any}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative h-full rounded-3xl border border-border/80 bg-gradient-to-br from-surface/90 to-background/90 p-8 backdrop-blur-xl shadow-xl transition-all duration-300 hover:shadow-2xl dark:border-slate-800 dark:from-slate-950/90 dark:to-slate-900/90"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                
                <div className="relative h-full">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.iconGradient} text-white shadow-lg`}
                  >
                    <feature.icon size={32} />
                  </motion.div>
                  
                  <h3 className="mb-4 text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="mb-6 text-base text-muted leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-4 transition-all">
                    Explore
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
