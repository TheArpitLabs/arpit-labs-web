import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition",
  {
    variants: {
      variant: {
        technology: "bg-primary/10 text-primary",
        status: "bg-secondary/10 text-secondary",
        category: "bg-success/10 text-success",
        outline: "border border-border/80 bg-background text-foreground dark:border-slate-700 dark:bg-slate-900",
        secondary: "bg-muted/10 text-muted dark:bg-slate-800"
      }
    },
    defaultVariants: {
      variant: "technology"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
