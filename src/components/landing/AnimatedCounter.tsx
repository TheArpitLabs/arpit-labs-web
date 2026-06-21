"use client";

import { motion, useInView, useAnimation } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import * as LucideIcons from "lucide-react";

interface AnimatedCounterProps {
  value: number;
  label: string;
  icon: keyof typeof LucideIcons;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({ value, label, icon, suffix = "", duration = 2 }: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();
  const [displayValue, setDisplayValue] = useState(0);
  const Icon = LucideIcons[icon] as LucideIcons.LucideIcon;

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
      let startTime: number;
      const animateValue = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(Math.floor(easeOutQuart * value));
        if (progress < 1) {
          requestAnimationFrame(animateValue);
        }
      };
      requestAnimationFrame(animateValue);
    }
  }, [isInView, value, duration, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl glass p-8"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
      <div className="relative">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary shadow-lg">
          <Icon size={32} />
        </div>
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-5xl font-heading font-bold bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent sm:text-6xl"
          >
            {displayValue.toLocaleString()}{suffix}
          </motion.div>
          <p className="mt-3 text-lg font-heading font-semibold text-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

