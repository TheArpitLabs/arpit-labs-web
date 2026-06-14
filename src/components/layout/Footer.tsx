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
  { label: "Documentation", href: "/docs" },
  { label: "Tutorials", href: "/tutorials" },
  { label: "Blog", href: "/blog" },
  { label: "API Reference", href: "/api" }
];

const company = [
  { label: "Careers", href: "/careers" },
  { label: "Press Kit", href: "/press" }
];

const socialLinks = [
  { label: "GitHub", href: "https://github.com/arpit-labs", icon: Github, color: "hover:text-white" },
  { label: "LinkedIn", href: "https://linkedin.com/in/arpit-labs", icon: Linkedin, color: "hover:text-blue-500" },
  { label: "Twitter", href: "https://twitter.com/arpitlabs", icon: Twitter, color: "hover:text-sky-400" },
  { label: "Email", href: "mailto:contact@arpitlabs.com", icon: Mail, color: "hover:text-purple-400" }
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/5 blur-3xl" />
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
                  <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg group-hover:shadow-purple-500/25 transition-shadow">
                    <NexusLogo className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Arpit Labs</h1>
                    <p className="text-xs text-purple-300">Engineering the Future</p>
                  </div>
                </Link>
                
                <p className="max-w-sm text-sm leading-relaxed text-gray-300">
                  A digital engineering lab exploring AI, IoT, Software, and Hardware. Building resilient systems through systems thinking and innovation.
                </p>

                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((item) => (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-950/50 text-gray-400 transition-all hover:border-purple-500 hover:bg-purple-900/50"
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">Explore</h3>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  link.href.startsWith('mailto') ? (
                    <li key={link.href}>
                      <a href={link.href} className="group flex items-center gap-2 text-sm text-gray-300 transition hover:text-white">
                        <ArrowRight size={14} className="opacity-0 -translate-x-2 transition group-hover:opacity-100 group-hover:translate-x-0" />
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.href}>
                      <Link href={link.href as Route} className="group flex items-center gap-2 text-sm text-gray-300 transition hover:text-white">
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">Resources</h3>
              <ul className="space-y-3">
                {resources.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href as Route} className="group flex items-center gap-2 text-sm text-gray-300 transition hover:text-white">
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">Company</h3>
              <ul className="space-y-3">
                {company.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href as Route} className="group flex items-center gap-2 text-sm text-gray-300 transition hover:text-white">
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
            className="mb-16 rounded-3xl border border-purple-500/30 bg-purple-950/50 p-8 backdrop-blur-sm"
          >
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-bold">Stay Updated</h3>
                </div>
                <p className="text-sm text-gray-300">
                  Get the latest engineering insights, project updates, and research findings delivered to your inbox.
                </p>
              </div>
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-xl border border-purple-500/30 bg-purple-900/50 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  required
                />
                <motion.button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Subscribe
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Bottom Bar */}
          <div className="flex flex-col gap-4 border-t border-purple-500/30 pt-8 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <p>© {new Date().getFullYear()} Arpit Labs</p>
              <span className="text-purple-500">•</span>
              <p>Built with <Heart className="inline h-4 w-4 text-red-500 fill-red-500" /> for engineers</p>
            </div>
            <div className="flex items-center gap-6">
              <a href="/sitemap.xml" className="transition hover:text-white">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
