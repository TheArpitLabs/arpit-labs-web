"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Search, Settings, Shield, Sparkles } from "lucide-react";
import { adminSignOut } from "@/lib/actions/admin-actions";
import { supabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface AdminTopbarProps {
  title: string;
  subtitle: string;
}

export function AdminTopbar({ title, subtitle }: AdminTopbarProps) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabaseClient.from("profiles").select("full_name,avatar_url").eq("id", session.user.id).single();
        if (mounted) setProfile(data ?? null);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mb-5">
      <div className="text-center">
        <h1 className="text-2xl font-black uppercase tracking-wide text-white md:text-3xl">{title}</h1>
        <p className="text-sm text-slate-300">{subtitle}</p>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#07101f]/85 p-3 backdrop-blur-xl">
        <div className="relative hidden min-w-0 flex-1 items-center rounded-lg border border-white/10 bg-black/20 px-3 py-2 md:flex">
          <Search className="mr-2 h-4 w-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search admin resources"
            className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>
        <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10"><Search className="h-4 w-4" /></button>
        <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10"><Sparkles className="h-4 w-4" /></button>
        <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10"><Bell className="h-4 w-4" /></button>
        <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10"><Settings className="h-4 w-4" /></button>
        {user ? (
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-800">
              <Image src={profile?.avatar_url || "/avatar-placeholder.svg"} alt="Admin" fill className="object-cover" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white">{profile?.full_name || user.email?.split("@")[0]}</p>
              <p className="text-[10px] text-slate-400">Super Admin</p>
            </div>
          </div>
        ) : (
          <Link href="/admin/login" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300">Login</Link>
        )}
        <form action={adminSignOut} className="hidden lg:block">
          <button type="submit" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10">
            <Shield className="mr-1 inline h-3.5 w-3.5" />
            Secure
          </button>
        </form>
      </div>
    </div>
  );
}
