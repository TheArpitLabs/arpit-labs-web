"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "var(--shadow-xl)" }}
      transition={{ duration: 0.2 }}
      className={cn("premium-card", className)}
      {...(props as HTMLMotionProps<"div">)}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-card-title text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body text-muted", className)} {...props} />;
}

export function FeatureCard({ title, description, icon, className }: { title: string; description: string; icon: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn("premium-card p-6", className)}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
        className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary"
      >
        {icon}
      </motion.div>
      <div className="mt-4 space-y-2">
        <h4 className="text-lg font-semibold text-foreground">{title}</h4>
        <p className="text-body text-muted">{description}</p>
      </div>
    </motion.div>
  );
}

export function InfoCard({ title, value, label, className }: { title: string; value: string; label: string; className?: string }) {
  return (
    <div className={cn("premium-card bg-surface p-6", className)}>
      <p className="text-sm uppercase tracking-[0.2em] text-muted">{label}</p>
      <h4 className="mt-3 text-2xl font-semibold text-foreground">{value}</h4>
      <p className="mt-2 text-body text-muted">{title}</p>
    </div>
  );
}

export function BentoCard({ icon, title, content, className }: { icon: React.ReactNode; title: string; content: string; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn("premium-card p-6", className)}
    >
      <div className="flex items-center gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/10 to-primary/10 text-secondary"
        >
          {icon}
        </motion.div>
        <h4 className="text-lg font-semibold text-foreground">{title}</h4>
      </div>
      <p className="text-body text-muted">{content}</p>
    </motion.div>
  );
}
