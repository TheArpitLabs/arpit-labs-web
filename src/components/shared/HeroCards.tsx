"use client";

import { motion } from "framer-motion";

const cards = ["AI", "IoT", "Software", "Hardware"];

export function HeroCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
      {cards.map((item, index) => (
        <motion.div
          key={item}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 * index }}
          className="rounded-3xl border border-border/70 bg-card/90 px-4 py-3 text-center text-sm font-semibold text-foreground shadow-sm dark:border-slate-800 dark:bg-slate-950/90"
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
}
