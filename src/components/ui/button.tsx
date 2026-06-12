"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-gradient-to-r from-primary to-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:from-primary/90 hover:to-primary/90",
        secondary: "border border-border/80 bg-surface text-foreground hover:bg-surface/95 hover:border-primary/30 dark:border-slate-700 dark:bg-slate-900",
        ghost: "border border-transparent bg-transparent text-foreground hover:bg-surface/80 dark:hover:bg-slate-900",
        outline: "border border-border/80 bg-transparent text-foreground hover:bg-surface/95 hover:border-primary/50 dark:border-slate-700 dark:hover:bg-slate-900",
        icon: "h-11 w-11 rounded-2xl border border-border/80 bg-surface p-0 text-foreground transition hover:bg-surface/95 hover:border-primary/50 dark:border-slate-700 dark:bg-slate-900",
        premium: "border border-transparent bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:from-primary/90 hover:to-secondary/90",
        success: "border-transparent bg-success text-white shadow-lg shadow-success/25 hover:shadow-xl hover:shadow-success/30 hover:bg-success/90",
        danger: "border-transparent bg-error text-white shadow-lg shadow-error/25 hover:shadow-xl hover:shadow-error/30 hover:bg-error/90"
      },
      size: {
        sm: "h-10 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-base",
        xl: "h-14 px-6 text-lg"
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
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({ className, variant, size, isLoading, leftIcon, rightIcon, children, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isLoading || props.disabled}
      {...(props as HTMLMotionProps<"button">)}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
}
