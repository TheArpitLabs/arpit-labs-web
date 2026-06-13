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
        const { data: p } = await supabaseClient.from("profiles").select("full_name,avatar_url").eq("id", session.user.id).single();
        if (mounted) setProfile(p ?? null);
      } else {
        setUser(null);
        setProfile(null);
      }
    }

    init();

    // Listen for auth state changes
    const { data: listener } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: p } = await supabaseClient.from("profiles").select("full_name,avatar_url").eq("id", session.user.id).single();
        setProfile(p ?? null);
      } else {
        setProfile(null);
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
    <header className="sticky top-0 z-50 border-b border-purple-900/30 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-3 text-lg font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg">
            <NexusLogo className="h-5 w-5" />
          </span>
          <span className="sr-only">Arpit Labs</span>
          <span className="hidden sm:inline text-white">Arpit Labs</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative text-sm font-medium transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
                pathname === item.href ? "text-white" : "text-gray-300"
              )}
            >
              {item.label}
              {pathname === item.href && (
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-500"
                  layoutId="navbar-underline"
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Search Button */}
          <Link
            href="/search"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/50 px-3 py-1.5 text-xs font-bold text-white transition hover:border-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            <Search size={14} />
            <span>Search</span>
          </Link>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/50 px-3 py-1.5 text-xs font-bold text-white transition hover:border-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
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
                  className="absolute right-0 mt-2 w-32 overflow-hidden rounded-2xl border border-purple-500/30 bg-purple-950/95 backdrop-blur-sm p-1 shadow-xl z-50"
                  role="menu"
                >
                  <button onClick={() => switchLanguage('en')} className="w-full rounded-xl px-4 py-2 text-left text-xs font-medium text-white hover:bg-purple-900/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70" role="menuitem">English</button>
                  <button onClick={() => switchLanguage('hi')} className="w-full rounded-xl px-4 py-2 text-left text-xs font-medium text-white hover:bg-purple-900/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70" role="menuitem">हिन्दी</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ThemeToggle />
          
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
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
              </Link>
              <button
                onClick={async () => {
                  await supabaseClient.auth.signOut();
                  router.push('/login');
                }}
                className="rounded-xl border border-purple-500/30 px-3 py-2 text-sm font-bold text-white transition hover:bg-purple-900/50 hidden sm:block"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-xl border border-purple-500/30 bg-white px-4 py-2 text-sm font-bold text-gray-900 transition hover:bg-gray-100 cursor-pointer pointer-events-auto hidden sm:block"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:opacity-90 cursor-pointer pointer-events-auto"
              >
                Get Started
              </Link>
            </div>
          )}
          
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-950/50 text-white md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
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
            className="md:hidden overflow-hidden"
          >
            <div className="border-t border-purple-900/30 bg-purple-950/95 px-4 pb-6 pt-4 backdrop-blur-xl" role="navigation" aria-label="Mobile navigation">
              <div className="flex flex-col gap-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-base font-medium transition hover:bg-purple-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
                      pathname === item.href ? "bg-purple-900/50 text-white" : "text-gray-300"
                    )}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
                
                <div className="h-px bg-purple-900/30 my-2" />
                
                <Link
                  href="/search"
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium text-gray-300 transition hover:bg-purple-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                  onClick={() => setOpen(false)}
                >
                  <Search size={18} />
                  Search
                </Link>
                
                <div className="flex items-center justify-between rounded-2xl px-4 py-3">
                  <span className="text-sm font-medium text-gray-300">Language</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => switchLanguage('en')}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                        locale === 'en' ? "bg-purple-500 text-white" : "bg-purple-900/50 text-gray-300 hover:bg-purple-900/70"
                      )}
                    >
                      English
                    </button>
                    <button
                      onClick={() => switchLanguage('hi')}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                        locale === 'hi' ? "bg-purple-500 text-white" : "bg-purple-900/50 text-gray-300 hover:bg-purple-900/70"
                      )}
                    >
                      हिन्दी
                    </button>
                  </div>
                </div>
                
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium text-gray-300 transition hover:bg-purple-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                      onClick={() => setOpen(false)}
                    >
                      <User size={18} />
                      Profile
                    </Link>
                    <button
                      onClick={async () => {
                        await supabaseClient.auth.signOut();
                        router.push('/login');
                        setOpen(false);
                      }}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium text-gray-300 transition hover:bg-purple-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-2xl border border-purple-500/30 bg-white px-4 py-3 text-center text-base font-bold text-gray-900 transition hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-2xl bg-gradient-to-r from-purple-500 to-purple-700 px-4 py-3 text-center text-base font-bold text-white shadow-lg transition hover:opacity-90"
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
