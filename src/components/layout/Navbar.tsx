"use client";

import { useState, useEffect } from "react";
import { Menu, X, LayoutDashboard, Globe, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NexusLogo } from "@/components/shared/NexusLogo";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/research", label: "Research" },
  { href: "/university", label: "University" },
  { href: "/innovation", label: "Innovation" },
  { href: "/community/global", label: "Community" },
  { href: "/products", label: "Products" },
  { href: "/marketplace", label: "Marketplace" },
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

    async function init() {
      // Read from custom cookies instead of localStorage
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
      };

      const accessToken = getCookie('arpitlabs-user-access-token');
      const refreshToken = getCookie('arpitlabs-user-refresh-token');

      if (!mounted) return;

      if (accessToken && refreshToken) {
        // Set session from custom cookies
        const { data: sessionData, error } = await supabaseClient.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error && sessionData.session?.user) {
          setUser(sessionData.session.user);
          const { data: p } = await supabaseClient.from("profiles").select("full_name,avatar_url").eq("id", sessionData.session.user.id).single();
          if (mounted) setProfile(p ?? null);
        } else {
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    }

    init();

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
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-3 text-lg font-semibold text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-surface text-primary shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <NexusLogo className="h-5 w-5" />
          </span>
          <span className="sr-only">Arpit Labs</span>
          <span className="hidden sm:inline">Arpit Labs</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
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
          {/* Language Switcher */}
          <div className="relative">
            <button 
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-surface px-3 py-1.5 text-xs font-bold text-foreground transition hover:border-primary"
            >
              <Globe size={14} />
              <span className="hidden sm:inline">{currentLang}</span>
              <ChevronDown size={12} className={cn("transition", langOpen && "rotate-180")} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-32 overflow-hidden rounded-2xl border border-border/70 bg-card p-1 shadow-xl">
                <button onClick={() => switchLanguage('en')} className="w-full rounded-xl px-4 py-2 text-left text-xs font-medium hover:bg-surface">English</button>
                <button onClick={() => switchLanguage('hi')} className="w-full rounded-xl px-4 py-2 text-left text-xs font-medium hover:bg-surface">हिन्दी</button>
              </div>
            )}
          </div>

          <ThemeToggle />
          
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                {profile?.full_name || user.email?.split('@')[0]}
              </Link>
              <button
                onClick={async () => {
                  await supabaseClient.auth.signOut();
                  router.push('/login');
                }}
                className="rounded-2xl border border-border/70 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-surface"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            >
              Sign In
            </Link>
          )}
          
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-surface text-foreground md:hidden"
            onClick={() => setOpen((prev) => !prev)}
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
                  "rounded-2xl px-4 py-3 text-base font-medium transition hover:bg-surface",
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
