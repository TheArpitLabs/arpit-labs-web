"use client";

import { motion } from "framer-motion";
import { ArrowRight, Rocket, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

export function LaunchCTA() {
  return (
    <section className="relative py-32">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20"
          >
            <Rocket className="h-10 w-10 text-primary" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6 bg-gradient-to-r from-foreground via-foreground to-muted bg-clip-text text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
          >
            Build The Future With Arpit Labs
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mx-auto mb-12 max-w-3xl text-xl text-muted"
          >
            Join thousands of engineers, researchers, and innovators who are already building the next generation of AI, IoT, and software systems.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center"
          >
            <Link
              href="/projects"
              className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-secondary px-10 py-5 text-base font-bold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/30"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Explore Projects
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/community/global"
              className="group inline-flex items-center justify-center rounded-2xl border-2 border-border/80 bg-surface/80 px-10 py-5 text-base font-bold text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:scale-105 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80"
            >
              <Zap className="mr-2 h-5 w-5" />
              Join Community
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span>Free to join</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-10 top-20 hidden lg:block"
        >
          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-primary/20 to-secondary/20 p-4 backdrop-blur-xl dark:border-slate-800">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-10 bottom-20 hidden lg:block"
        >
          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-secondary/20 to-primary/20 p-4 backdrop-blur-xl dark:border-slate-800">
            <Zap className="h-6 w-6 text-secondary" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
