"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/utils";

interface FloatingIconProps {
  label: string;
  icon: React.ReactNode;
  accentClass?: string;
  className?: string;
}

export function FloatingIcon({ label, icon, accentClass = "bg-primary/10 text-primary", className }: FloatingIconProps) {
  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className={cn("inline-flex flex-col items-center gap-3 rounded-[2rem] border border-border/80 bg-card px-5 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-950", className)}
      aria-label={label}
    >
      <div className={cn("inline-flex h-14 w-14 items-center justify-center rounded-3xl shadow-sm", accentClass)}>{icon}</div>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </motion.div>
  );
}
