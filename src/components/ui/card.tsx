import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-glow dark:border-slate-800 dark:bg-slate-950", className)} {...props} />;
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
    <motion.div whileHover={{ y: -6 }} className={cn("rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-sm transition duration-300 dark:border-slate-800 dark:bg-slate-950", className)}>
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">{icon}</div>
      <div className="mt-6 space-y-3">
        <h4 className="text-lg font-semibold text-foreground">{title}</h4>
        <p className="text-body text-muted">{description}</p>
      </div>
    </motion.div>
  );
}

export function InfoCard({ title, value, label, className }: { title: string; value: string; label: string; className?: string }) {
  return (
    <div className={cn("rounded-[1.75rem] border border-border/70 bg-surface p-6 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900", className)}>
      <p className="text-sm uppercase tracking-[0.2em] text-muted">{label}</p>
      <h4 className="mt-3 text-2xl font-semibold text-foreground">{value}</h4>
      <p className="mt-2 text-body text-muted">{title}</p>
    </div>
  );
}

export function BentoCard({ icon, title, content, className }: { icon: React.ReactNode; title: string; content: string; className?: string }) {
  return (
    <div className={cn("grid gap-4 rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950", className)}>
      <div className="flex items-center gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-secondary/10 text-secondary">{icon}</div>
        <h4 className="text-lg font-semibold text-foreground">{title}</h4>
      </div>
      <p className="text-body text-muted">{content}</p>
    </div>
  );
}
