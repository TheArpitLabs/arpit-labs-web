"use client";

import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils/utils";
import { variants, transitions, getMotionProps, animationConfig } from "@/lib/animations/config";

interface StaggerContainerProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delay?: number;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = animationConfig.stagger.normal,
  delay = 0,
  ...props
}: StaggerContainerProps) {
  const motionProps = getMotionProps({
    initial: "hidden",
    animate: "visible",
    variants: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: delay,
        },
      },
    },
    ...props,
  });

  return (
    <motion.div className={cn("w-full", className)} {...motionProps}>
      {children}
    </motion.div>
  );
}

interface StaggerItemProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export function StaggerItem({
  children,
  className,
  duration = animationConfig.duration.normal,
  ...props
}: StaggerItemProps) {
  const motionProps = getMotionProps({
    variants: variants.staggerItem,
    transition: {
      ...transitions.default,
      duration,
    },
    ...props,
  });

  return (
    <motion.div className={cn("", className)} {...motionProps}>
      {children}
    </motion.div>
  );
}
