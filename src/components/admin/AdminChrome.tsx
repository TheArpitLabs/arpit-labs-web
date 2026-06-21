"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface AdminChromeProps {
  children: React.ReactNode;
}

export function AdminChrome({ children }: AdminChromeProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#050b16] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.1),transparent_26%)]" />
      <div className="relative grid min-h-screen lg:grid-cols-[270px_1fr]">
        <div className="hidden border-r border-white/10 bg-[#07101f]/95 lg:block">
          <AdminSidebar pathname={pathname} />
        </div>
        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
