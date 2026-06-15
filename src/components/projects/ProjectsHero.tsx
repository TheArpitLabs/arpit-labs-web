"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/Container";

interface ProjectsHeroProps {
  allProjectsCount: number;
}

export function ProjectsHero({ allProjectsCount }: ProjectsHeroProps) {
  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="border-b border-border/70 bg-gradient-to-b from-primary/5 to-background/75 py-20 dark:border-slate-800 dark:from-primary/10 dark:to-slate-950/70"
      >
        <Container>
          <div className="max-w-3xl">
            <Badge variant="premium" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest">
              Portfolio
            </Badge>
            <h1 className="text-hero text-gradient">
              Engineering Showcase
            </h1>
            <p className="mt-6 text-lg text-muted">
              A collection of systems, tools, and platforms built with a focus on performance, scalability, and clean engineering.
            </p>
          </div>
        </Container>
      </motion.section>

      <Container className="py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">
            <p className="text-sm font-medium text-muted">Published Projects</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{allProjectsCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <p className="text-sm font-medium text-muted">Featured Builds</p>
            <p className="mt-2 text-3xl font-bold text-foreground">3</p>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
            <p className="text-sm font-medium text-muted">Total Views</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {allProjectsCount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <p className="text-sm font-medium text-muted">Engineering Areas</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              6
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
