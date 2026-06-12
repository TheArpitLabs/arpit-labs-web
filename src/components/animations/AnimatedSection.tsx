"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "fadeUp" | "fadeDown" | "fadeIn" | "scaleIn" | "slideLeft" | "slideRight";
}

const variants = {
  fadeUp: { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 } },
  fadeDown: { initial: { opacity: 0, y: -28 }, animate: { opacity: 1, y: 0 } },
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  scaleIn: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } },
  slideLeft: { initial: { opacity: 0, x: 28 }, animate: { opacity: 1, x: 0 } },
  slideRight: { initial: { opacity: 0, x: -28 }, animate: { opacity: 1, x: 0 } },
};

export function AnimatedSection({ children, className, delay = 0, variant = "fadeUp" }: AnimatedSectionProps) {
  const selectedVariant = variants[variant];
  
  return (
    <motion.div
      className={cn("w-full", className)}
      initial={selectedVariant.initial}
      whileInView={selectedVariant.animate}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
