'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  Microscope,
  Lightbulb,
  Globe,
  Brain,
  ShoppingBag,
  FolderOpen,
} from 'lucide-react';
import Link from 'next/link';

const platformFeatures = [
  {
    title: 'Research',
    description:
      'Explore cutting-edge research papers, datasets, and publications across AI, IoT, and cybersecurity.',
    icon: Microscope,
    href: '/research',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    iconGradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Innovation',
    description:
      'Discover startups, venture initiatives, and innovation projects transforming ideas into reality.',
    icon: Lightbulb,
    href: '/innovation',
    gradient: 'from-yellow-500/10 to-orange-500/10',
    iconGradient: 'from-yellow-500 to-orange-500',
  },
  {
    title: 'Community',
    description:
      'Join a global network of engineers, researchers, and innovators collaborating on the future.',
    icon: Globe,
    href: '/community/global',
    gradient: 'from-green-500/10 to-emerald-500/10',
    iconGradient: 'from-green-500 to-emerald-500',
  },
  {
    title: 'AI & Automation',
    description:
      'Leverage AI-powered tools, automation workflows, and intelligent systems for your projects.',
    icon: Brain,
    href: '/ai',
    gradient: 'from-purple-500/10 to-pink-500/10',
    iconGradient: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Marketplace',
    description: 'Browse and discover products, tools, and resources built by the community.',
    icon: ShoppingBag,
    href: '/marketplace',
    gradient: 'from-red-500/10 to-rose-500/10',
    iconGradient: 'from-red-500 to-rose-500',
  },
  {
    title: 'Projects',
    description:
      'Explore a comprehensive collection of open-source projects across all technology domains.',
    icon: FolderOpen,
    href: '/projects',
    gradient: 'from-indigo-500/10 to-violet-500/10',
    iconGradient: 'from-indigo-500 to-violet-500',
  },
];

export function PremiumPlatformGrid() {
  return (
    <section className="py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-8 text-center"
      >
        <p className="mb-2 text-xs uppercase tracking-[0.28em] text-muted">Platform</p>
        <h2 className="mb-3 font-heading text-2xl font-bold sm:text-3xl">Explore the Ecosystem</h2>
        <p className="mx-auto max-w-2xl text-sm text-muted">
          From research to marketplace, discover the full suite of tools and communities driving
          innovation at Axiora.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platformFeatures.map((feature, index) => (
          <Link key={feature.title} href={feature.href as any}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative h-full rounded-2xl glass p-6 transition-all duration-300 hover:shadow-lg"
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
              />

              <div className="relative h-full">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.iconGradient} text-white shadow-md`}
                >
                  <feature.icon size={24} />
                </motion.div>

                <h3 className="mb-3 text-lg font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>

                <p className="mb-4 text-sm text-muted leading-relaxed">{feature.description}</p>

                <div className="flex items-center gap-2 text-xs font-semibold text-primary group-hover:gap-4 transition-all">
                  Explore
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}
