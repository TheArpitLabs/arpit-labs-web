"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Mail, Twitter, ArrowRight, Heart, Zap, Globe } from "lucide-react";
import { NexusLogo } from "@/components/shared/NexusLogo";
import Link from "next/link";
import type { Route } from "next";

type NavLink = {
  label: string;
  href: string;
  description?: string;
};

const navLinks: NavLink[] = [
  { label: "About", href: "/about", description: "Our mission and vision" },
  { label: "Projects", href: "/projects", description: "Engineering projects" },
  { label: "Research", href: "/research", description: "Research publications" },
  { label: "Innovation", href: "/innovation", description: "Startup initiatives" },
  { label: "Community", href: "/community/global", description: "Join the network" },
  { label: "Contact", href: "mailto:contact@arpitlabs.com", description: "Get in touch" }
];

const resources = [
  { label: "Engineering", href: "/engineering" },
  { label: "Learning", href: "/learning" },
  { label: "Blog", href: "/blog" },
  { label: "Marketplace", href: "/marketplace" }
];

const company = [
  { label: "Organizations", href: "/organizations" },
  { label: "Journey", href: "/journey" }
];

const socialLinks = [
  { label: "GitHub", href: "https://github.com/arpit-labs", icon: Github, color: "hover:text-white" },
  { label: "LinkedIn", href: "https://linkedin.com/in/arpit-labs", icon: Linkedin, color: "hover:text-blue-500" },
  { label: "Twitter", href: "https://twitter.com/arpitlabs", icon: Twitter, color: "hover:text-sky-400" },
  { label: "Email", href: "mailto:contact@arpitlabs.com", icon: Mail, color: "hover:text-purple-400" }
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-background text-foreground">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh" />
      </div>

      <div className="relative z-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Main Grid */}
          <div className="grid gap-12 pb-16 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            {/* Brand Column */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <Link href="/" className="inline-flex items-center gap-3 group">
                  <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow transition-shadow">
                    <NexusLogo className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-heading font-bold">Arpit Labs</h1>
                    <p className="text-xs text-accent">Engineering Discovery Platform</p>
                  </div>
                </Link>
                
                <p className="max-w-sm text-sm leading-relaxed text-muted">
                  A world-class engineering discovery platform. Explore AI, IoT, Software, Hardware, and Cybersecurity projects. Build resilient systems through systems thinking.
                </p>

                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((item) => (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-all hover:border-primary/50 hover:bg-surface-elevated"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <item.icon size={18} />
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Explore Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent">Explore</h3>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  link.href.startsWith('mailto') ? (
                    <li key={link.href}>
                      <a href={link.href} className="group flex items-center gap-2 text-sm text-muted transition hover:text-foreground">
                        <ArrowRight size={14} className="opacity-0 -translate-x-2 transition group-hover:opacity-100 group-hover:translate-x-0" />
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.href}>
                      <Link href={link.href as Route} className="group flex items-center gap-2 text-sm text-muted transition hover:text-foreground">
                        <ArrowRight size={14} className="opacity-0 -translate-x-2 transition group-hover:opacity-100 group-hover:translate-x-0" />
                        {link.label}
                      </Link>
                    </li>
                  )
                ))}
              </ul>
            </motion.div>

            {/* Resources Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent">Resources</h3>
              <ul className="space-y-3">
                {resources.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href as Route} className="group flex items-center gap-2 text-sm text-muted transition hover:text-foreground">
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 transition group-hover:opacity-100 group-hover:translate-x-0" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Company Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent">Company</h3>
              <ul className="space-y-3">
                {company.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href as Route} className="group flex items-center gap-2 text-sm text-muted transition hover:text-foreground">
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 transition group-hover:opacity-100 group-hover:translate-x-0" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Newsletter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16 rounded-2xl border border-border bg-card p-8 backdrop-blur"
          >
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-accent" />
                  <h3 className="text-lg font-heading font-bold">Stay Updated</h3>
                </div>
                <p className="text-sm text-muted">
                  Get the latest engineering insights, project updates, and research findings delivered to your inbox.
                </p>
              </div>
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  required
                />
                <motion.button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-glow transition hover:opacity-90"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Subscribe
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Bottom Bar */}
          <div className="flex flex-col gap-4 border-t border-border pt-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <p>© {new Date().getFullYear()} Arpit Labs</p>
              <span className="text-accent">•</span>
              <p>Built with <Heart className="inline h-4 w-4 text-error fill-error" /> for engineers</p>
            </div>
            <div className="flex items-center gap-6">
              <a href="/sitemap.xml" className="transition hover:text-foreground">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
