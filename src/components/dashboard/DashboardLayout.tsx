"use client";

import React, { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: any;
  profile: any;
}

export function DashboardLayout({ children, user, profile }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050b16] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.16),transparent_30%)]" />
      <div className="relative flex min-h-screen">
        <div className="hidden w-[270px] shrink-0 border-r border-white/10 bg-[#07101f]/95 lg:block">
          <DashboardSidebar user={user} profile={profile} />
        </div>

        {sidebarOpen && (
          <button
            aria-label="Close dashboard navigation"
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {sidebarOpen && (
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-white/10 bg-[#07101f] lg:hidden">
            <DashboardSidebar user={user} profile={profile} onClose={() => setSidebarOpen(false)} />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader user={user} profile={profile} onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
