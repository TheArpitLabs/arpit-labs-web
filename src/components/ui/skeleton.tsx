"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function Skeleton({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "card" | "text" | "avatar" | "button" }) {
  const variants = {
    default: "rounded-md bg-muted/30",
    card: "rounded-2xl bg-muted/20",
    text: "h-4 rounded bg-muted/25",
    avatar: "h-12 w-12 rounded-full bg-muted/25",
    button: "h-11 rounded-xl bg-muted/25"
  };

  return (
    <motion.div
      className={cn("animate-pulse", variants[variant], className)}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }}
      {...props as any}
    />
  );
}

export { Skeleton };
