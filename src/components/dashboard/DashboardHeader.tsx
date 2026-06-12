"use client";

import React from "react";
import { Menu, Bell, Search } from "lucide-react";

interface DashboardHeaderProps {
  user: any;
  profile: any;
  onMenuClick: () => void;
}

export function DashboardHeader({ user, profile, onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border/70 bg-card px-4 py-4 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-2 hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] ?? "User"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-border/70 bg-muted/50 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 hover:bg-muted">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  );
}
