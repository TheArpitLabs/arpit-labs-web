"use client";

import { motion } from "framer-motion";
import { Github, Linkedin, Mail } from "lucide-react";
import { NexusLogo } from "@/components/shared/NexusLogo";
import Link from "next/link";

const navLinks = [
  { label: "About", href: "/about" },
  { label: "Research", href: "/research" },
  { label: "University", href: "/university" },
  { label: "Innovation", href: "/innovation" },
  { label: "Contact", href: "mailto:hello@arpitlabs.example" }
];

const categories = [
  "AI & ML",
  "IoT Systems",
  "Software Engineering",
  "Hardware Design",
  "Cybersecurity"
];

const socialLinks = [
  { label: "GitHub", href: "https://github.com/arpit-labs", icon: Github },
  { label: "LinkedIn", href: "https://linkedin.com/in/arpit-labs", icon: Linkedin },
  { label: "Email", href: "mailto:hello@arpitlabs.example", icon: Mail }
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border/70 bg-surface/90 px-4 py-16 text-foreground dark:border-slate-800 dark:bg-slate-950/90 sm:px-6 lg:px-8">
      <div className="absolute right-12 top-8 h-4 w-4 rounded-full bg-primary/20 blur-2xl" aria-hidden="true" />
      <div className="absolute left-8 bottom-12 h-3 w-3 rounded-full bg-secondary/20 blur-2xl" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.8fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 text-xl font-semibold text-foreground">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <NexusLogo className="h-6 w-6" />
            </span>
            Arpit Labs
          </div>
          <p className="max-w-sm text-body text-muted">
            Build • Learn • Impact — a modern engineering lab for systems, experiments, and connected technology work.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-muted">Explore</h3>
          <div className="flex flex-col gap-2 text-body">
            {navLinks.map((link) => (
              link.href.startsWith('mailto') ? (
                <a key={link.href} href={link.href} className="transition hover:text-foreground">
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} className="transition hover:text-foreground">
                  {link.label}
                </Link>
              )
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-muted">Technology</h3>
          <div className="grid gap-2 text-body">
            {categories.map((category) => (
              <span key={category} className="rounded-full border border-border/70 bg-background/90 px-3 py-2 text-sm text-foreground transition dark:border-slate-700 dark:bg-slate-900">
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-6 rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/90 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Newsletter</p>
          <p className="mt-3 max-w-md text-body text-muted">
            Get short notes on systems thinking, lab experiments, and engineering stories.
          </p>
        </div>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={(e) => { e.preventDefault(); }}>
          <label htmlFor="footer-newsletter" className="sr-only">
            Subscribe to updates
          </label>
          <input
            id="footer-newsletter"
            type="email"
            placeholder="Email address"
            className="w-full max-w-sm rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900"
            required
          />
          <motion.button
            type="submit"
            className="rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:bg-primary disabled:opacity-50"
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(37,99,235,0.3)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            Join
          </motion.button>
        </form>
      </div>

      <div className="mt-12 flex flex-col gap-4 border-t border-border/70 pt-8 text-sm text-muted dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Arpit Labs. Modern engineering lab experiences.</p>
        <div className="flex items-center gap-4">
          {socialLinks.map((item) => (
            <motion.a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 text-muted transition hover:text-foreground"
              whileHover={{ scale: 1.1, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <item.icon size={18} />
              {item.label}
            </motion.a>
          ))}
        </div>
      </div>
    </footer>
  );
}
