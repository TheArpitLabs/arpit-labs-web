"use client";

import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { variants, transitions, getMotionProps, animationConfig } from "@/lib/animations/config";

interface FadeInProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = animationConfig.duration.normal,
  direction = "up",
  ...props
}: FadeInProps) {
  const variantMap = {
    up: variants.fadeUp,
    down: variants.fadeDown,
    left: variants.slideInLeft,
    right: variants.slideInRight,
    none: variants.fadeIn,
  };

  const motionProps = getMotionProps({
    initial: "hidden",
    animate: "visible",
    variants: variantMap[direction],
    transition: {
      ...transitions.default,
      duration,
      delay,
    },
    ...props,
  });

  return (
    <motion.div className={cn("w-full", className)} {...motionProps}>
      {children}
    </motion.div>
  );
}
