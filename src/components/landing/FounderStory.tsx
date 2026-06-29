"use client";

import { motion } from "framer-motion";
import { Target, Rocket, Lightbulb, Code2, Cpu, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

const journeyMilestones = [
  { year: "2020", title: "Engineering Foundation", description: "Began exploration of embedded systems and IoT protocols while building hardware prototypes", icon: Lightbulb },
  { year: "2022", title: "Software Integration", description: "Expanded into full-stack development and AI/ML research, publishing initial open-source projects", icon: Code2 },
  { year: "2024", title: "Platform Launch", description: "Founded Axiora as a unified platform for hardware, software, and AI engineering projects", icon: Rocket },
  { year: "2026", title: "Ecosystem Growth", description: "Building comprehensive engineering resources and community for hands-on learning", icon: Target },
];

const coreValues = [
  { title: "Innovation First", description: "Pushing boundaries in AI, IoT, and emerging technologies", icon: Lightbulb },
  { title: "Quality Engineering", description: "Building production-ready systems with best practices", icon: Code2 },
  { title: "Knowledge Sharing", description: "Open-source philosophy with comprehensive documentation", icon: Shield },
  { title: "Community Driven", description: "Collaborative approach to engineering challenges", icon: Cpu },
];

export function FounderStory() {
  return (
    <section className="py-12">
      {/* Header */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <p className="mb-2 text-sm uppercase tracking-[0.28em] text-muted">Founder Story</p>
          <h2 className="mb-4 font-heading text-3xl font-bold sm:text-4xl">
            Building the Future of Engineering
          </h2>
          <p className="mx-auto max-w-3xl text-base text-muted">
            From hardware prototypes to AI-powered systems, follow Arpit Kumar&apos;s journey in creating a platform that bridges the gap between academic learning and industry-ready engineering.
          </p>
        </motion.div>

        {/* Vision & Mission */}
        <div className="mb-20 grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl glass p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 transition-opacity duration-300 hover:opacity-100" />
            <div className="relative">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                <Target size={32} />
              </div>
              <h3 className="mb-4 text-3xl font-heading font-bold text-foreground">Vision</h3>
              <p className="text-lg text-muted leading-relaxed">
                To democratize access to industry-grade engineering education by providing real-world projects, comprehensive documentation, and AI-powered learning tools that bridge the gap between academic knowledge and professional excellence.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl glass p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-primary/10 opacity-0 transition-opacity duration-300 hover:opacity-100" />
            <div className="relative">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 text-accent">
                <Rocket size={32} />
              </div>
              <h3 className="mb-4 text-3xl font-heading font-bold text-foreground">Mission</h3>
              <p className="text-lg text-muted leading-relaxed">
                To build the most comprehensive engineering platform that empowers students, researchers, and professionals to master AI, IoT, software, and hardware through hands-on experience with production-quality projects and cutting-edge tools.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Engineering Journey */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-heading font-bold text-foreground">The Engineering Journey</h3>
            <p className="mt-4 text-muted">Key milestones that shaped Arpit Labs</p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-primary via-accent to-primary opacity-20" />

            <div className="space-y-12">
              {journeyMilestones.map((milestone, index) => {
                const Icon = milestone.icon;
                return (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                      <div className="relative overflow-hidden rounded-2xl glass p-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                        <div className="relative">
                          <span className="mb-3 inline-block rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-1 text-sm font-semibold text-primary">
                            {milestone.year}
                          </span>
                          <h4 className="mb-2 text-xl font-heading font-bold text-foreground">{milestone.title}</h4>
                          <p className="text-muted">{milestone.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Timeline dot */}
                    <div className="absolute left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent shadow-lg">
                      <div className="h-2 w-2 rounded-full bg-background" />
                    </div>
                    
                    <div className="w-5/12" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Core Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-heading font-bold text-foreground">Core Values</h3>
            <p className="mt-4 text-muted">Principles that guide everything we build</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative overflow-hidden rounded-3xl glass p-6 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
                    <value.icon size={24} />
                  </div>
                  <h4 className="mb-2 text-lg font-heading font-bold text-foreground">{value.title}</h4>
                  <p className="text-sm text-muted">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Innovation Roadmap CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20"
        >
          <div className="relative overflow-hidden rounded-3xl glass p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
            <div className="relative">
              <h3 className="mb-4 text-3xl font-heading font-bold text-foreground">Join the Innovation Journey</h3>
              <p className="mb-8 max-w-2xl mx-auto text-lg text-muted">
                Be part of the next generation of engineering excellence. Explore projects, contribute to research, and build the future with Arpit Labs.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90 group"
                >
                  Explore Projects
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/research"
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated hover:border-primary/50"
                >
                  View Research
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
    </section>
  );
}
