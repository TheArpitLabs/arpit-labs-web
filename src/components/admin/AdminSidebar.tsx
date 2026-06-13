import Link from "next/link";
import type { Route } from "next";
import {
  Blocks,
  CreditCard,
  FileText,
  FlaskConical,
  Inbox,
  LayoutDashboard,
  Milestone,
  Rocket,
  Sparkles,
  Users,
  Globe,
  ShoppingBag,
  BarChart3,
  Receipt,
  GraduationCap,
  Microscope,
  Lightbulb,
  Briefcase,
  User,
  UploadCloud
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems: Array<{
  href: Route;
  label: string;
  icon: React.ReactNode;
}> = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/revenue" as Route, label: "Revenue", icon: <BarChart3 size={18} /> },
  { href: "/admin/research" as Route, label: "Research Labs", icon: <Microscope size={18} /> },
  { href: "/admin/university" as Route, label: "University", icon: <GraduationCap size={18} /> },
  { href: "/admin/innovation" as Route, label: "Innovation Hub", icon: <Lightbulb size={18} /> },
  { href: "/admin/venture" as Route, label: "Venture Studio", icon: <Briefcase size={18} /> },
  { href: "/admin/acquisition" as Route, label: "Acquisition", icon: <UploadCloud size={18} /> },
  { href: "/admin/saas" as Route, label: "SaaS Infrastructure", icon: <Globe size={18} /> },
  { href: "/admin/marketplace" as Route, label: "Marketplace", icon: <ShoppingBag size={18} /> },
  { href: "/admin/projects", label: "Projects", icon: <Blocks size={18} /> },
  { href: "/admin/experiments", label: "Experiments", icon: <FlaskConical size={18} /> },
  { href: "/admin/blog", label: "Blog", icon: <FileText size={18} /> },
  { href: "/admin/hackathons", label: "Hackathons", icon: <Sparkles size={18} /> },
  // PAYMENTS TEMPORARILY DISABLED - Hide Memberships and Payments navigation
  // { href: "/admin/memberships", label: "Memberships", icon: <CreditCard size={18} /> },
  // { href: "/admin/payments" as Route, label: "Payments", icon: <Receipt size={18} /> },
  { href: "/admin/journey", label: "Journey", icon: <Milestone size={18} /> },
  { href: "/admin/newsletter", label: "Newsletter", icon: <Users size={18} /> },
  { href: "/admin/community" as Route, label: "Community", icon: <Users size={18} /> },
  { href: "/admin/messages", label: "Messages", icon: <Inbox size={18} /> },
  { href: "/profile", label: "Profile", icon: <User size={18} /> },
];

interface AdminSidebarProps {
  pathname: string;
}

export function AdminSidebar({ pathname }: AdminSidebarProps) {
  return (
    <aside className="flex h-full w-full flex-col rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Rocket size={22} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Admin</p>
          <h2 className="text-lg font-bold text-foreground">Arpit Labs Ecosystem</h2>
        </div>
      </div>

      <nav className="space-y-2 overflow-y-auto pr-2 scrollbar-hide">
        {navigationItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-primary text-white shadow-lg shadow-primary/10"
                  : "text-muted hover:bg-surface hover:text-foreground dark:hover:bg-slate-900"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
