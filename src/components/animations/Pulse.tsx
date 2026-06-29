"use client";

import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils/utils";
import { getMotionProps, animationConfig, prefersReducedMotion, isMobile } from "@/lib/animations/config";

interface PulseProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  duration?: number;
  disabled?: boolean;
}

export function Pulse({
  children,
  className,
  intensity = 0.03,
  duration = 3.5,
  disabled = false,
  ...props
}: PulseProps) {
  // Disable on mobile or if user prefers reduced motion
  const shouldAnimate = !disabled && !prefersReducedMotion() && !isMobile();

  const motionProps = getMotionProps(
    {
      animate: shouldAnimate
        ? {
            scale: [1, 1 + intensity, 1],
          }
        : undefined,
      transition: {
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      },
      ...props,
    },
    { initial: false, animate: false }
  );

  return (
    <motion.div className={cn("", className)} {...motionProps}>
      {children}
    </motion.div>
  );
}
