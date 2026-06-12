"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Bookmark, 
  User, 
  Settings,
  X,
  LogOut
} from "lucide-react";
import { supabaseClient } from "@/lib/supabase/client";

interface DashboardSidebarProps {
  user: any;
  profile: any;
  onClose?: () => void;
}

export function DashboardSidebar({ user, profile, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Overview", href: "/dashboard" as const, icon: LayoutDashboard },
    { name: "My Projects", href: "/profile/projects" as const, icon: FolderKanban },
    { name: "Bookmarks", href: "/profile" as const, icon: Bookmark },
    { name: "Profile", href: "/profile" as const, icon: User },
    { name: "Settings", href: "/profile" as const, icon: Settings },
  ];

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
  };

  return (
    <div className="flex h-full flex-col border-r border-border/70 glass">
      {/* Logo Section */}
      <div className="flex items-center justify-between border-b border-border/70 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="text-lg font-bold">AL</span>
          </div>
          <span className="text-lg font-semibold text-foreground">Arpit Labs</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-2 hover:bg-surface"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User Profile */}
      <div className="border-b border-border/70 p-6">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-surface">
            <Image
              src={profile?.avatar_url ?? "/avatar-placeholder.svg"}
              alt="avatar"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{profile?.full_name ?? user?.email}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="border-t border-border/70 p-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
