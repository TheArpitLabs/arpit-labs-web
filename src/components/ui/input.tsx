"use client";

import * as React from "react";
import { cn } from "@/lib/utils/utils";
import { motion } from "framer-motion";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, leftIcon, rightIcon, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {leftIcon}
            </div>
          )}
          <motion.input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-all duration-200",
              "placeholder:text-muted/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "hover:border-border-dark",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-error focus-visible:ring-error/20 focus-visible:border-error",
              className
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            animate={{
              borderColor: isFocused ? "var(--primary)" : error ? "var(--error)" : "var(--border)",
              boxShadow: isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none"
            }}
            transition={{ duration: 0.2 }}
            {...props as any}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-error"
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
