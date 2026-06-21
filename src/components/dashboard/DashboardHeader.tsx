"use client";

import React from "react";
import Image from "next/image";
import { Bell, Menu, Search, Settings } from "lucide-react";

interface DashboardHeaderProps {
  user: any;
  profile: any;
  onMenuClick: () => void;
}

export function DashboardHeader({ user, profile, onMenuClick }: DashboardHeaderProps) {
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Engineer";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07101f]/85 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden min-w-0 flex-1 items-center rounded-lg border border-white/10 bg-black/20 px-3 py-2 md:flex">
          <Search className="mr-2 h-4 w-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search projects, users, labs..."
            className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="relative rounded-lg p-2 text-slate-300 hover:bg-white/10">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10">
            <Settings className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-800">
              <Image src={profile?.avatar_url || "/avatar-placeholder.svg"} alt="Profile" fill className="object-cover" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#07101f]" />
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-white">{displayName}</p>
              <p className="text-[10px] text-blue-400">View Profile</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
