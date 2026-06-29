"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-gradient-to-r from-primary to-accent text-white shadow-glow hover:shadow-glow-lg hover:opacity-90",
        secondary: "border border-border bg-surface text-foreground hover:bg-surface-elevated hover:border-primary/50",
        ghost: "border border-transparent bg-transparent text-foreground hover:bg-surface",
        outline: "border border-border bg-transparent text-foreground hover:bg-surface hover:border-primary/50",
        icon: "h-11 w-11 rounded-xl border border-border bg-surface p-0 text-foreground transition hover:bg-surface-elevated hover:border-primary/50",
        premium: "border border-transparent bg-gradient-to-r from-primary to-accent text-white shadow-glow hover:shadow-glow-lg hover:opacity-90",
        success: "border-transparent bg-success text-white shadow-lg shadow-success/25 hover:shadow-xl hover:shadow-success/30 hover:bg-success/90",
        danger: "border-transparent bg-error text-white shadow-lg shadow-error/25 hover:shadow-xl hover:shadow-error/30 hover:bg-error/90",
        warning: "border-transparent bg-warning text-white shadow-lg shadow-warning/25 hover:shadow-xl hover:shadow-warning/30 hover:bg-warning/90"
      },
      size: {
        sm: "h-9 px-3 text-xs",
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
