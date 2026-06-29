"use client";

import { motion } from "framer-motion";
import { Brain, Cpu, Database, Wifi, Bot, Shield, Globe, Smartphone, Cloud, Server, CircuitBoard, Microchip, FlaskConical, Lightbulb, GitBranch, ArrowRight } from "lucide-react";
import Link from "next/link";

const featuredDomains = [
  {
    name: "AI & Machine Learning",
    icon: Brain,
    gradient: "from-primary/10 to-accent/10",
    iconGradient: "from-primary to-accent",
    projects: 160
  },
  {
    name: "Software Development",
    icon: Globe,
    gradient: "from-primary/10 to-accent/10",
    iconGradient: "from-primary to-accent",
    projects: 142
  },
  {
    name: "Cybersecurity",
    icon: Shield,
    gradient: "from-error/10 to-warning/10",
    iconGradient: "from-error to-warning",
    projects: 98
  },
  {
    name: "Data Science",
    icon: Database,
    gradient: "from-success/10 to-primary/10",
    iconGradient: "from-success to-primary",
    projects: 85
  },
  {
    name: "IoT",
    icon: Wifi,
    gradient: "from-accent/10 to-primary/10",
    iconGradient: "from-accent to-primary",
    projects: 76
  },
  {
    name: "Robotics",
    icon: Bot,
    gradient: "from-warning/10 to-error/10",
    iconGradient: "from-warning to-error",
    projects: 64
  }
];

export function EngineeringDomains() {
  const totalProjects = featuredDomains.reduce((sum, domain) => sum + domain.projects, 0);
  
  return (
    <section className="py-10">
      {/* Header */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-center"
        >
          <p className="mb-2 text-xs uppercase tracking-[0.28em] text-muted">Engineering Ecosystem</p>
          <h2 className="mb-3 font-heading text-2xl font-bold sm:text-3xl">
            15 Domains of Innovation
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted">
            Explore comprehensive engineering domains spanning AI, IoT, software, hardware, and emerging technologies.
          </p>
        </motion.div>

        {/* Statistics Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 flex flex-wrap items-center justify-center gap-3 text-xs text-muted"
        >
          <span className="font-semibold text-foreground">{totalProjects.toLocaleString()} Projects</span>
          <span className="text-border">•</span>
          <span>15 Domains</span>
          <span className="text-border">•</span>
          <span>92 Research</span>
          <span className="text-border">•</span>
          <span>310 Resources</span>
        </motion.div>

        {/* Featured Domains Grid */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredDomains.map((domain, index) => (
            <Link key={domain.name} href={`/projects?category=${domain.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative h-[100px] rounded-xl glass p-4 transition-all duration-300 hover:shadow-lg"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${domain.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                
                <div className="relative h-full flex items-center justify-between">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${domain.iconGradient} text-white shadow-md`}
                  >
                    <domain.icon size={18} />
                  </motion.div>
                  
                  {/* Title */}
                  <h3 className="flex-1 px-3 text-sm font-heading font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {domain.name}
                  </h3>
                  
                  {/* Projects Count */}
                  <span className="text-xs text-muted">{domain.projects.toLocaleString()}</span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <Link 
            href="/engineering"
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            View All 15 Domains →
          </Link>
        </motion.div>
    </section>
  );
}
