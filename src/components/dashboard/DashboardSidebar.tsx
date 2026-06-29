'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Bookmark,
  FlaskConical,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Mail,
  Map,
  Settings,
  User,
  Users,
  X,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { NexusLogo } from '@/components/shared/NexusLogo';

interface DashboardSidebarProps {
  user: any;
  profile: any;
  onClose?: () => void;
}

export function DashboardSidebar({ user, profile, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const messages = 8;
  const notifications = 12;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' as const, icon: LayoutDashboard },
    { name: 'My Profile', href: '/profile' as const, icon: User },
    { name: 'My Projects', href: '/profile/projects' as const, icon: FolderKanban },
    { name: 'My Research', href: '/research' as const, icon: FlaskConical },
    { name: 'My Labs', href: '/labs' as const, icon: FlaskConical },
    { name: 'Saved Projects', href: '/profile' as const, icon: Bookmark },
    { name: 'My Roadmaps', href: '/roadmaps' as const, icon: Map },
    { name: 'Community', href: '/community' as const, icon: Users },
    { name: 'Messages', href: '/dashboard' as const, icon: Mail, badge: messages },
    {
      name: 'Notifications',
      href: '/dashboard' as const,
      icon: Bell,
      badge: notifications,
      danger: true,
    },
    { name: 'Analytics', href: '/analytics/intelligence/trends' as const, icon: BarChart3 },
    { name: 'Settings', href: '/profile' as const, icon: Settings },
  ];

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/login');
  };

  return (
    <aside className="flex h-full flex-col p-4">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 ring-1 ring-blue-400/30">
            <NexusLogo className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white">Axiora</p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">User</p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive
                  ? 'bg-blue-600/25 text-white shadow-[0_0_0_1px_rgba(96,165,250,0.18)]'
                  : 'text-slate-300 hover:bg-white/7 hover:text-white'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.name}</span>
              {item.badge ? (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white ${item.danger ? 'bg-rose-500' : 'bg-indigo-500'}`}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-800">
            <Image
              src={profile?.avatar_url || '/avatar-placeholder.svg'}
              alt="Profile"
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {profile?.full_name || user?.email?.split('@')[0] || 'Engineer'}
            </p>
            <p className="truncate text-xs text-slate-400">Level 7 Engineer</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
