"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export function Card({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "glass" | "gradient" | "elevated" }) {
  const variants = {
    default: "bg-card border border-border rounded-xl shadow-md hover:shadow-lg transition-all duration-200",
    glass: "glass rounded-xl",
    gradient: "bg-card border border-border rounded-xl gradient-border shadow-md hover:shadow-lg transition-all duration-200",
    elevated: "bg-card border border-border rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(variants[variant], className)}
      {...(props as HTMLMotionProps<"div">)}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2 p-6 pb-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-card-title text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export function FeatureCard({ title, description, icon, className }: { title: string; description: string; icon: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn("premium-card p-6", className)}
    >
      <motion.div
        whileHover={{ scale: 1.05, rotate: 5 }}
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

export function InfoCard({ title, value, label, trend, className }: { title: string; value: string; label: string; trend?: string; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn("premium-card bg-surface p-6", className)}
    >
      <p className="text-sm uppercase tracking-[0.2em] text-muted">{label}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <h4 className="text-2xl font-semibold text-foreground">{value}</h4>
        {trend && (
          <span className={cn("text-sm font-semibold", trend.startsWith("+") ? "text-success" : "text-error")}>
            {trend}
          </span>
        )}
      </div>
      <p className="mt-2 text-body text-muted">{title}</p>
    </motion.div>
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
          whileHover={{ scale: 1.05, rotate: -5 }}
          transition={{ duration: 0.2 }}
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/10 to-primary/10 text-secondary"
        >
          {icon}
        </motion.div>
        <h4 className="text-lg font-semibold text-foreground">{title}</h4>
      </div>
      <p className="mt-3 text-body text-muted">{content}</p>
    </motion.div>
  );
}
