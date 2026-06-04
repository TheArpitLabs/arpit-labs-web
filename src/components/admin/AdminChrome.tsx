"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface AdminChromeProps {
  children: React.ReactNode;
}

export function AdminChrome({ children }: AdminChromeProps) {
  const pathname = usePathname();

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
        <AdminSidebar pathname={pathname} />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
