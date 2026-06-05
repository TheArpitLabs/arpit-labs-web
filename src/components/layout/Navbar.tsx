"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NexusLogo } from "@/components/shared/NexusLogo";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { supabaseClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/experiments", label: "Experiments" },
  { href: "/blog", label: "Lab Notes" },
  { href: "/journey", label: "Journey" },
  { href: "/contact", label: "Contact" }
] as const satisfies ReadonlyArray<{ href: Route; label: string }>;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabaseClient.auth.getUser();
      if (!mounted) return;
      setUser(data?.user ?? null);

      if (data?.user) {
        const { data: p } = await supabaseClient.from("profiles").select("full_name,avatar_url").eq("id", data.user.id).single();
        setProfile(p ?? null);
      }
    }

    init();

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabaseClient.from("profiles").select("full_name,avatar_url").eq("id", session.user.id).single().then(({ data: p }) => setProfile(p ?? null));
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-3 text-lg font-semibold text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-surface text-primary shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <NexusLogo className="h-5 w-5" />
          </span>
          <span className="sr-only">Arpit Labs</span>
          <span>Arpit Labs</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
                href={item.href} 
                className={cn(
                  "text-sm font-medium transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
                  pathname === item.href ? "text-primary" : "text-muted"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!user ? (
            <>
              <Link
                href="/login"
                className="rounded-2xl px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="hidden rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900 sm:inline-flex"
              >
                Register
              </Link>
            </>
          ) : (
            <div className="relative">
              <div className="inline-flex items-center gap-2">
                <Link href="/profile" className="text-sm font-medium text-foreground">
                  {profile?.full_name ?? user.email}
                </Link>
                <button
                  onClick={async () => {
                    await supabaseClient.auth.signOut();
                    setUser(null);
                    setProfile(null);
                    window.location.href = "/";
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-surface text-foreground transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 dark:border-slate-700 dark:bg-slate-900"
                  title="Logout"
                >
                  <span className="sr-only">Logout</span>
                  {/* Simple logout icon */}
                  ⎋
                </button>
              </div>
            </div>
          )}
          <Link
            href="/contact"
            className="hidden rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900 sm:inline-flex"
          >
            Let&apos;s Connect
          </Link>
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
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl px-4 py-3 text-base font-medium transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 dark:hover:bg-slate-900",
                  pathname === item.href ? "bg-primary/5 text-primary" : "text-foreground"
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
