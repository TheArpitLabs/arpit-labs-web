"use client";

import { motion } from "framer-motion";
import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/animations/config";

interface DottedPathProps {
  className?: string;
  showPlane?: boolean;
}

export function DottedPath({ className, showPlane = false }: DottedPathProps) {
  const shouldAnimate = !prefersReducedMotion() && showPlane;

  return (
    <svg viewBox="0 0 280 120" fill="none" aria-hidden="true" className={className}>
      <path d="M14 20C74 36 154 18 190 46C218 68 218 82 256 96" stroke="currentColor" strokeWidth="2" strokeDasharray="6 10" strokeLinecap="round" />
      <circle cx="14" cy="20" r="4" fill="currentColor" />
      <circle cx="256" cy="96" r="4" fill="currentColor" />
      {shouldAnimate && (
        <motion.foreignObject
          x="0"
          y="0"
          width="20"
          height="20"
          animate={{
            offsetPath: "path('M14 20C74 36 154 18 190 46C218 68 218 82 256 96')",
          }}
          style={{ offsetRotate: "auto" }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="flex h-full w-full items-center justify-center text-primary">
            <Plane size={14} className="-rotate-45" />
          </div>
        </motion.foreignObject>
      )}
    </svg>
  );
}
