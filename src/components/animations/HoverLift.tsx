"use client";

import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils/utils";
import { transitions, getMotionProps, animationConfig } from "@/lib/animations/config";

interface HoverLiftProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  liftAmount?: number;
  duration?: number;
  disabled?: boolean;
}

export function HoverLift({
  children,
  className,
  liftAmount = 6,
  duration = animationConfig.duration.normal,
  disabled = false,
  ...props
}: HoverLiftProps) {
  const motionProps = getMotionProps({
    whileHover: disabled ? undefined : { y: -liftAmount },
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
