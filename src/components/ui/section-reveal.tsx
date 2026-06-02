"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down";
}

export function SectionReveal({ children, className, delay = 0, direction = "up" }: SectionRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: direction === "up" ? 24 : -24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
