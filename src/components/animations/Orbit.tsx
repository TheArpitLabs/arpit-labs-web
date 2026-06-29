"use client";

import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils/utils";
import { getMotionProps, animationConfig, prefersReducedMotion, isMobile } from "@/lib/animations/config";

interface OrbitProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  radius?: number;
  disabled?: boolean;
}

export function Orbit({
  children,
  className,
  duration = 25,
  radius = 100,
  disabled = false,
  ...props
}: OrbitProps) {
  // Disable on mobile or if user prefers reduced motion
  const shouldAnimate = !disabled && !prefersReducedMotion() && !isMobile();

  const motionProps = getMotionProps(
    {
      animate: shouldAnimate
        ? {
            rotate: 360,
          }
        : undefined,
      transition: {
        duration,
        repeat: Infinity,
        ease: "linear",
      },
      ...props,
    },
    { initial: false, animate: false }
  );

  return (
    <motion.div
      className={cn("absolute", className)}
      style={{
        width: radius * 2,
        height: radius * 2,
      }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

interface OrbitNodeProps {
  children: React.ReactNode;
  className?: string;
  angle?: number;
  radius?: number;
}

export function OrbitNode({ children, className, angle = 0, radius = 100 }: OrbitNodeProps) {
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return (
    <div
      className={cn("absolute", className)}
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {children}
    </div>
  );
}
