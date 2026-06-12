"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition-all duration-200",
  {
    variants: {
      variant: {
        technology: "bg-primary/10 text-primary hover:bg-primary/20",
        status: "bg-secondary/10 text-secondary hover:bg-secondary/20",
        category: "bg-success/10 text-success hover:bg-success/20",
        outline: "border border-border/80 bg-background text-foreground hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-900",
        secondary: "bg-muted/10 text-muted hover:bg-muted/20 dark:bg-slate-800",
        premium: "bg-gradient-to-r from-primary/10 to-secondary/10 text-foreground hover:from-primary/20 hover:to-secondary/20",
        glow: "bg-primary/10 text-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
        success: "bg-success/10 text-success hover:bg-success/20",
        warning: "bg-warning/10 text-warning hover:bg-warning/20",
        error: "bg-error/10 text-error hover:bg-error/20"
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm"
      }
    },
    defaultVariants: {
      variant: "technology",
      size: "md"
    }
  }
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  dot?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ className, variant, size, dot, children }: BadgeProps) {
  return (
    <motion.span
      className={cn(badgeVariants({ variant, size }), className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {dot && (
        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {children}
    </motion.span>
  );
}
