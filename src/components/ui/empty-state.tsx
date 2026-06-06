"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const ActionButton = actionHref ? "a" : onAction ? "button" : "span";

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {Icon && (
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/10">
          <Icon className="h-10 w-10 text-muted/40" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {(actionLabel || actionHref || onAction) && (
        <div className="mt-6">
          <ActionButton
            href={actionHref}
            onClick={onAction}
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            {actionLabel}
          </ActionButton>
        </div>
      )}
    </motion.div>
  );
}
