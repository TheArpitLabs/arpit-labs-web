"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  variant?: "default" | "minimal" | "illustrated";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  variant = "default",
}: EmptyStateProps) {
  const variants = {
    default: {
      container: "py-20",
      iconSize: "h-24 w-24",
      iconBg: "bg-gradient-to-br from-primary/10 to-secondary/10",
      iconColor: "text-primary/40",
      titleSize: "text-2xl",
      descriptionSize: "text-base"
    },
    minimal: {
      container: "py-12",
      iconSize: "h-16 w-16",
      iconBg: "bg-muted/10",
      iconColor: "text-muted/40",
      titleSize: "text-lg",
      descriptionSize: "text-sm"
    },
    illustrated: {
      container: "py-24",
      iconSize: "h-32 w-32",
      iconBg: "bg-gradient-to-br from-primary/20 to-secondary/20",
      iconColor: "text-primary/60",
      titleSize: "text-3xl",
      descriptionSize: "text-lg"
    }
  };

  const currentVariant = variants[variant];

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        currentVariant.container,
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {Icon && (
        <motion.div
          className={cn(
            "mb-8 flex items-center justify-center rounded-full",
            currentVariant.iconSize,
            currentVariant.iconBg
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Icon className={cn(currentVariant.iconColor)} />
        </motion.div>
      )}
      <motion.h3
        className={cn("font-semibold text-foreground", currentVariant.titleSize)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {title}
      </motion.h3>
      <motion.p
        className={cn("mt-3 max-w-md text-muted", currentVariant.descriptionSize)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {description}
      </motion.p>
      {(actionLabel || actionHref || onAction) && (
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {actionHref ? (
            <a href={actionHref} className="premium-button inline-flex items-center justify-center">
              {actionLabel}
            </a>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
