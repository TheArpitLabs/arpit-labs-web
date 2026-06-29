import { MotionProps } from "framer-motion";

/**
 * Centralized animation configuration for Axiora
 * Ensures consistent timing and easing across all animations
 */

export const animationConfig = {
  // Durations (in seconds)
  duration: {
    fast: 0.2,
    normal: 0.4,
    slow: 0.6,
    verySlow: 0.8,
  },

  // Easing functions
  easing: {
    easeOut: "easeOut",
    easeInOut: "easeInOut",
    easeIn: "easeIn",
    // Custom engineering-themed easing
    smooth: [0.25, 0.1, 0.25, 1],
    bounce: [0.34, 1.56, 0.64, 1],
  },

  // Stagger delays
  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.15,
  },

  // Viewport thresholds
  viewport: {
    once: true,
    amount: 0.2, // Trigger when 20% of element is visible
  },
} as const;

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Check if device is mobile for reduced animation intensity
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

/**
 * Get motion props that respect reduced motion preference
 */
export function getMotionProps(
  props: MotionProps,
  reducedMotionProps?: MotionProps
): MotionProps {
  if (prefersReducedMotion()) {
    return reducedMotionProps || { initial: false, animate: false };
  }
  return props;
}

/**
 * Get reduced animation intensity for mobile
 */
export function getMobileAdjustedDuration(baseDuration: number): number {
  if (isMobile()) {
    return baseDuration * 0.7; // 30% faster on mobile
  }
  return baseDuration;
}

/**
 * Common animation variants
 */
export const variants = {
  // Fade in
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },

  // Fade up
  fadeUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  },

  // Fade down
  fadeDown: {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
  },

  // Scale in
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },

  // Slide from left
  slideInLeft: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  },

  // Slide from right
  slideInRight: {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
  },

  // Stagger children
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: animationConfig.stagger.normal,
      },
    },
  },

  // Stagger item
  staggerItem: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
} as const;

/**
 * Transition presets
 */
export const transitions = {
  default: {
    duration: animationConfig.duration.normal,
    ease: animationConfig.easing.smooth,
  },
  fast: {
    duration: animationConfig.duration.fast,
    ease: animationConfig.easing.easeOut,
  },
  slow: {
    duration: animationConfig.duration.slow,
    ease: animationConfig.easing.smooth,
  },
  bouncy: {
    duration: animationConfig.duration.normal,
    ease: animationConfig.easing.bounce,
  },
} as const;
