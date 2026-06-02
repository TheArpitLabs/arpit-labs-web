"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NexusLogo } from "@/components/shared/NexusLogo";

const navItems = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#experiments", label: "Experiments" },
  { href: "#lab-notes", label: "Lab Notes" },
  { href: "#journey", label: "Journey" },
  { href: "#contact", label: "Contact" }
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <a href="#home" className="group inline-flex items-center gap-3 text-lg font-semibold text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-surface text-primary shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <NexusLogo className="h-5 w-5" />
          </span>
          <span className="sr-only">Arpit Labs</span>
          <span>Arpit Labs</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="#contact"
            className="hidden rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900 sm:inline-flex"
          >
            Let&apos;s Connect
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-surface text-foreground transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 dark:border-slate-700 dark:bg-slate-900"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className={cn("md:hidden", open ? "block" : "hidden")}> 
        <div className="border-t border-border/70 bg-background/95 px-4 pb-6 pt-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-base font-medium text-foreground transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 dark:hover:bg-slate-900"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
