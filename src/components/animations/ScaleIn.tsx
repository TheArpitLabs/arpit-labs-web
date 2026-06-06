"use client";

import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { variants, transitions, getMotionProps, animationConfig } from "@/lib/animations/config";

interface ScaleInProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function ScaleIn({
  children,
  className,
  delay = 0,
  duration = animationConfig.duration.normal,
  ...props
}: ScaleInProps) {
  const motionProps = getMotionProps({
    initial: "hidden",
    animate: "visible",
    variants: variants.scaleIn,
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
