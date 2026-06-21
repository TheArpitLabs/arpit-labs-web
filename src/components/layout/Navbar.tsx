"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, ChevronDown, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NexusLogo } from "@/components/shared/NexusLogo";
import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/research", label: "Research" },
  { href: "/innovation", label: "Innovation" },
  { href: "/community/global", label: "Community" },
  { href: "/about", label: "About" },
] as const satisfies ReadonlyArray<{ href: Route; label: string }>;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [locale, setLocale] = useState('en');
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Read locale from cookie
    const getLocale = () => {
      const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : 'en';
    };
    setLocale(getLocale());
  }, []);

  useEffect(() => {
    let mounted = true;

    // Get initial session from Supabase
    async function init() {
      const { data: { session } } = await supabaseClient.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        const { data: p } = await supabaseClient.from("profiles").select("full_name,avatar_url,role").eq("id", session.user.id).single();
        if (mounted) {
          setProfile(p ?? null);
          setUserRole(p?.role ?? null);
        }
      } else {
        setUser(null);
        setProfile(null);
        setUserRole(null);
      }
    }

    init();

    // Listen for auth state changes
    const { data: listener } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: p } = await supabaseClient.from("profiles").select("full_name,avatar_url,role").eq("id", session.user.id).single();
        if (mounted) {
          setProfile(p ?? null);
          setUserRole(p?.role ?? null);
        }
      } else {
        setProfile(null);
        setUserRole(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const switchLanguage = (newLocale: string) => {
    // Set the locale cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    // Update local state
    setLocale(newLocale);
    // Refresh the page to apply the new locale
    window.location.reload();
    setLangOpen(false);
  };

  const currentLang = locale === 'hi' ? 'Hindi' : 'English';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-3 text-lg font-heading font-semibold text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
            <NexusLogo className="h-5 w-5" />
          </span>
          <span className="sr-only">Arpit Labs</span>
          <span className="hidden sm:inline text-foreground">Arpit Labs</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative text-sm font-medium transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
                pathname === item.href ? "text-foreground" : "text-muted"
              )}
            >
              {item.label}
              {pathname === item.href && (
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent"
                  layoutId="navbar-underline"
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground transition hover:border-primary/50 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
              aria-expanded={langOpen}
              aria-haspopup="true"
            >
              <Globe size={14} />
              <span className="hidden sm:inline">{currentLang}</span>
              <ChevronDown size={12} className={cn("transition", langOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 z-50 mt-2 w-32 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl backdrop-blur"
                  role="menu"
                >
                  <button onClick={() => switchLanguage('en')} className="w-full rounded-lg px-4 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70" role="menuitem">English</button>
                  <button onClick={() => switchLanguage('hi')} className="w-full rounded-lg px-4 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70" role="menuitem">हिन्दी</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ThemeToggle />
          
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href={userRole === 'admin' ? '/admin' : '/dashboard'}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-bold text-white shadow-glow transition hover:opacity-90"
              >
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="Avatar"
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <User size={16} />
                )}
                <span className="hidden sm:inline">{profile?.full_name || user.email?.split('@')[0]}</span>
                {userRole === 'admin' && (
                  <span className="hidden sm:inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                    ADMIN
                  </span>
                )}
              </Link>
              <button
                onClick={async () => {
                  await supabaseClient.auth.signOut();
                  await fetch('/api/auth/session', { method: 'DELETE' });
                  router.push('/login');
                }}
                className="hidden rounded-xl border border-border px-3 py-2 text-sm font-bold text-foreground transition hover:bg-surface sm:block"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden cursor-pointer rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold text-foreground transition hover:bg-surface-elevated sm:block"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="cursor-pointer rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-bold text-white shadow-glow transition hover:opacity-90"
              >
                Get Started
              </Link>
            </div>
          )}
          
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 md:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden md:hidden"
          >
            <div className="border-t border-border bg-card px-4 pb-6 pt-4 backdrop-blur-xl" role="navigation" aria-label="Mobile navigation">
              <div className="flex flex-col gap-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-xl px-4 py-3 text-base font-medium transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
                      pathname === item.href ? "bg-surface text-foreground" : "text-muted"
                    )}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
                
                <div className="h-px bg-border my-2" />
                
                <div className="flex items-center justify-between rounded-2xl px-4 py-3">
                  <span className="text-sm font-medium text-muted">Language</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => switchLanguage('en')}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                        locale === 'en' ? "bg-primary text-white" : "bg-surface text-muted hover:bg-surface-elevated"
                      )}
                    >
                      English
                    </button>
                    <button
                      onClick={() => switchLanguage('hi')}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                        locale === 'hi' ? "bg-primary text-white" : "bg-surface text-muted hover:bg-surface-elevated"
                      )}
                    >
                      हिन्दी
                    </button>
                  </div>
                </div>
                
                {user ? (
                  <>
                    <Link
                      href={userRole === 'admin' ? '/admin' : '/dashboard'}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium text-muted transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                      onClick={() => setOpen(false)}
                    >
                      <User size={18} />
                      {userRole === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                      {userRole === 'admin' && (
                        <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                          ADMIN
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={async () => {
                        await supabaseClient.auth.signOut();
                        await fetch('/api/auth/session', { method: 'DELETE' });
                        router.push('/login');
                        setOpen(false);
                      }}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium text-muted transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-2xl border border-border bg-surface px-4 py-3 text-center text-base font-bold text-foreground transition hover:bg-surface-elevated"
                      onClick={() => setOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-2xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-center text-base font-bold text-white shadow-glow transition hover:opacity-90"
                      onClick={() => setOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
