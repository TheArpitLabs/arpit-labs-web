"use client";

import { motion } from "framer-motion";
import { Brain, Cpu, Shield, Wifi, Code2 } from "lucide-react";
import { NexusLogo } from "@/components/shared/NexusLogo";
import { DottedPath } from "@/components/shared/DottedPath";
import { Pulse, Orbit, OrbitNode } from "@/components/animations";
import { cn } from "@/lib/utils/utils";

const ecosystemItems = [
  { title: "AI & ML", icon: Brain, x: "10%", y: "10%" },
  { title: "IoT Systems", icon: Wifi, x: "74%", y: "6%" },
  { title: "Software Engineering", icon: Code2, x: "82%", y: "60%" },
  { title: "Hardware Design", icon: Cpu, x: "12%", y: "72%" },
  { title: "Cybersecurity", icon: Shield, x: "56%", y: "88%" }
];

const orbitNodes = [
  { angle: 0, radius: 95 },
  { angle: 72, radius: 95 },
  { angle: 144, radius: 95 },
  { angle: 216, radius: 95 },
  { angle: 288, radius: 95 },
];

export function TechnologyEcosystem() {
  return (
    <div className="relative mx-auto flex max-w-2xl flex-col items-center justify-center overflow-visible px-2 py-8">
      <div className="absolute inset-0 hidden md:block">
        <div className="absolute left-0 top-12 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute right-0 top-20 h-24 w-24 rounded-full bg-secondary/10 blur-2xl" />
      </div>

      <div className="relative flex h-[520px] w-full max-w-xl items-center justify-center rounded-[2rem] border border-border/80 bg-surface/80 p-6 shadow-glow dark:border-slate-800 dark:bg-slate-950/80">
        <div className="absolute inset-0 opacity-70">
          <DottedPath className="absolute left-2 top-8 h-40 w-40 text-muted/60" />
          <DottedPath className="absolute right-8 top-24 h-32 w-48 rotate-90 text-muted/60" />
          <DottedPath className="absolute left-16 bottom-16 h-28 w-40 rotate-45 text-muted/60" />
          <DottedPath className="absolute right-14 bottom-12 h-20 w-32 -rotate-45 text-muted/60" />
        </div>

        <Pulse intensity={0.03} duration={3.5}>
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 flex h-40 w-40 items-center justify-center rounded-full bg-background/95 shadow-[0_24px_80px_rgba(37,99,235,0.12)] dark:bg-slate-950"
          >
            <div className="flex h-32 w-32 items-center justify-center rounded-full border border-border/80 bg-primary/5 text-primary dark:border-slate-700">
              <NexusLogo className="h-16 w-16" />
            </div>
          </motion.div>
        </Pulse>

        <Orbit duration={25} radius={95} className="pointer-events-none">
          {orbitNodes.map((node, index) => (
            <OrbitNode key={index} angle={node.angle} radius={node.radius}>
              <div className="h-2 w-2 rounded-full bg-primary/40" />
            </OrbitNode>
          ))}
        </Orbit>

        {ecosystemItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 * index }}
              className={cn(
                "absolute min-h-[84px] w-40 rounded-[1.5rem] border border-border/70 bg-card/95 p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-950",
                "flex flex-col gap-3"
              )}
              style={{ left: item.x, top: item.y }}
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <Icon size={18} />
              </div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
