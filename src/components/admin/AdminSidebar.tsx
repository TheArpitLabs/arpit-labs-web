import Link from "next/link";
import type { Route } from "next";
import {
  BarChart3,
  Blocks,
  BookOpen,
  Bot,
  Database,
  FileText,
  Globe,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { NexusLogo } from "@/components/shared/NexusLogo";

const navigationItems: Array<{
  href: Route;
  label: string;
  icon: React.ReactNode;
  children?: string[];
}> = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { href: "/admin/projects", label: "Projects", icon: <Blocks size={16} />, children: ["All Projects", "Pending Review", "Published", "Rejected", "Featured", "Archived"] },
  { href: "/admin/discovery" as Route, label: "Discovery Engine", icon: <Search size={16} /> },
  { href: "/admin/contributors" as Route, label: "Users", icon: <Users size={16} /> },
  { href: "/admin/research" as Route, label: "Research", icon: <BookOpen size={16} /> },
  { href: "/admin/community" as Route, label: "Community", icon: <Globe size={16} /> },
  { href: "/admin/courses" as Route, label: "Courses", icon: <FileText size={16} /> },
  { href: "/admin/marketplace" as Route, label: "Marketplace", icon: <ShoppingCart size={16} /> },
  { href: "/admin/intelligence/trends" as Route, label: "Analytics", icon: <BarChart3 size={16} /> },
  { href: "/admin/acquisition" as Route, label: "Acquisition", icon: <Database size={16} /> },
  { href: "/admin/ai" as Route, label: "AI Systems", icon: <Bot size={16} /> },
  { href: "/admin/messages" as Route, label: "System Logs", icon: <ListChecks size={16} /> },
  { href: "/admin/saas" as Route, label: "Settings", icon: <Settings size={16} /> },
];

interface AdminSidebarProps {
  pathname: string;
}

export function AdminSidebar({ pathname }: AdminSidebarProps) {
  return (
    <aside className="flex h-screen flex-col p-4">
      <Link href="/admin" className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 ring-1 ring-blue-400/30">
          <NexusLogo className="h-8 w-8" />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-white">Arpit Labs</p>
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Admin</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navigationItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-blue-600/35 text-white shadow-[0_0_0_1px_rgba(96,165,250,0.2)]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
              </Link>
              {active && item.children ? (
                <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-4">
                  {item.children.map((child) => (
                    <p key={child} className="py-1 text-xs text-slate-400">{child}</p>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Super Admin</p>
            <p className="text-xs text-amber-300">Full Access</p>
          </div>
        </div>
      </div>

      <Link href="/login" className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Link>
    </aside>
  );
}
