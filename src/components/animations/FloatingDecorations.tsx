"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/utils";
import { Sparkles, Star, Diamond, CircuitBoard, Cpu, Zap } from "lucide-react";
import { animationConfig, prefersReducedMotion, isMobile } from "@/lib/animations/config";

interface Decoration {
  icon: React.ReactNode;
  x: string;
  y: string;
  delay: number;
  duration: number;
  size: number;
}

const decorations: Decoration[] = [
  { icon: <Sparkles size={16} />, x: "5%", y: "15%", delay: 0, duration: 6, size: 32 },
  { icon: <Star size={14} />, x: "92%", y: "8%", delay: 1.5, duration: 7, size: 28 },
  { icon: <Diamond size={12} />, x: "88%", y: "85%", delay: 0.8, duration: 5.5, size: 24 },
  { icon: <CircuitBoard size={14} />, x: "8%", y: "78%", delay: 2, duration: 8, size: 28 },
  { icon: <Cpu size={12} />, x: "15%", y: "45%", delay: 1.2, duration: 6.5, size: 24 },
  { icon: <Zap size={10} />, x: "82%", y: "35%", delay: 0.5, duration: 5, size: 20 },
];

interface FloatingDecorationsProps {
  className?: string;
  count?: number;
}

export function FloatingDecorations({ className, count = 6 }: FloatingDecorationsProps) {
  // Disable on mobile or if user prefers reduced motion
  if (prefersReducedMotion() || isMobile()) {
    return null;
  }

  // Reduce count on smaller screens
  const actualCount = isMobile() ? Math.min(count, 3) : count;

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {decorations.slice(0, actualCount).map((decoration, index) => (
        <motion.div
          key={index}
          className="absolute text-muted/30"
          style={{
            left: decoration.x,
            top: decoration.y,
            width: decoration.size,
            height: decoration.size,
          }}
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: decoration.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: decoration.delay,
          }}
        >
          {decoration.icon}
        </motion.div>
      ))}
    </div>
  );
}
