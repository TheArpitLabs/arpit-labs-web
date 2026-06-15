"use client";

import React from "react";
import { Menu, Bell, Search } from "lucide-react";

interface DashboardHeaderProps {
  user: any;
  profile: any;
  onMenuClick: () => void;
}

export function DashboardHeader({ user, profile, onMenuClick }: DashboardHeaderProps) {
  const profileFirstName = profile?.full_name?.trim().split(/\s+/)[0];
  const metadataFirstName = user?.user_metadata?.full_name?.trim().split(/\s+/)[0];
  const usableName = (value?: string | null) => {
    const normalized = value?.trim();
    return normalized && !["user", "creator", "member"].includes(normalized.toLowerCase()) ? normalized : null;
  };
  const displayName =
    (user?.email || profile?.email)?.split("@")[0] ||
    usableName(profileFirstName) ||
    usableName(metadataFirstName) ||
    "Creator";

  return (
    <header className="flex items-center justify-between border-b border-border/70 glass px-4 py-4 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-2 hover:bg-surface"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted">
            Welcome back, {displayName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-border/70 glass px-3 py-2">
          <Search className="h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 hover:bg-surface">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  );
}
