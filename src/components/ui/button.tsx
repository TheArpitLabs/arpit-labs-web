"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-primary text-white shadow-lg shadow-primary/10 hover:bg-primary/90",
        secondary: "border border-border/80 bg-surface text-foreground hover:bg-surface/95 dark:border-slate-700 dark:bg-slate-900",
        ghost: "border border-transparent bg-transparent text-foreground hover:bg-surface/80 dark:hover:bg-slate-900",
        outline: "border border-border/80 bg-transparent text-foreground hover:bg-surface/95 dark:border-slate-700 dark:hover:bg-slate-900",
        icon: "h-11 w-11 rounded-2xl border border-border/80 bg-surface p-0 text-foreground transition hover:bg-surface/95 dark:border-slate-700 dark:bg-slate-900"
      },
      size: {
        sm: "h-10 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-base"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export function Button({ className, variant, size, isLoading, children, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, boxShadow: variant === "primary" ? "0 0 20px rgba(37,99,235,0.3)" : "0 4px 12px rgba(0,0,0,0.1)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isLoading || props.disabled}
      {...(props as HTMLMotionProps<"button">)}
    >
      {isLoading ? <span className="animate-pulse">Loading...</span> : children}
    </motion.button>
  );
}
