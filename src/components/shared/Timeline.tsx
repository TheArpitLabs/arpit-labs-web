"use client";

import { motion } from "framer-motion";
import { JourneyItem } from "@/types/content";
import { StaggerContainer, StaggerItem } from "@/components/animations";

interface TimelineProps {
  items: JourneyItem[];
}

export function Timeline({ items }: TimelineProps) {
  if (!items || items.length === 0) {
    return (
      <div className="my-8 rounded-[2rem] border border-border/70 bg-surface p-12 text-center dark:border-slate-800 dark:bg-slate-950">
        <p className="text-muted">No journey milestones recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="relative my-8 overflow-hidden rounded-[2rem] border border-border/70 bg-surface p-6 dark:border-slate-800 dark:bg-slate-950">
      <motion.div
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="absolute left-6 top-0 bottom-0 w-px origin-top bg-border/50 dark:bg-slate-700"
      />
      <StaggerContainer>
        <div className="space-y-10 pl-12">
          {items.map((item) => (
            <StaggerItem key={item.id}>
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="absolute -left-6 top-2 flex h-12 w-12 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary text-sm font-bold"
                >
                  {item.year}
                </motion.div>
                <div className="space-y-2 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-body text-muted">{item.description}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>
    </div>
  );
}
