"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

interface AppShellProps {
  children: React.ReactNode;
}

const immersiveRoutePrefixes = [
  "/admin",
  "/dashboard",
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isImmersiveRoute = immersiveRoutePrefixes.some((prefix) => pathname.startsWith(prefix));

  return (
    <>
      {!isImmersiveRoute && <Navbar />}
      <main id="main-content">
        {children}
      </main>
    </>
  );
}
