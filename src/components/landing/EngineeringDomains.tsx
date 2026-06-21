"use client";

import { motion } from "framer-motion";
import { Brain, Cpu, Database, Wifi, Bot, Shield, Globe, Smartphone, Cloud, Server, CircuitBoard, Microchip, FlaskConical, Lightbulb, GitBranch, ArrowRight } from "lucide-react";
import Link from "next/link";

const engineeringDomains = [
  {
    name: "Artificial Intelligence",
    description: "Advanced AI systems, neural networks, and intelligent automation solutions",
    icon: Brain,
    gradient: "from-primary/10 to-accent/10",
    iconGradient: "from-primary to-accent",
    projects: 12,
    research: 8,
    resources: 24
  },
  {
    name: "Machine Learning",
    description: "ML algorithms, predictive models, and data-driven intelligence systems",
    icon: Brain,
    gradient: "from-accent/10 to-success/10",
    iconGradient: "from-accent to-success",
    projects: 10,
    research: 6,
    resources: 18
  },
  {
    name: "Data Science",
    description: "Big data analytics, visualization, and statistical modeling projects",
    icon: Database,
    gradient: "from-success/10 to-primary/10",
    iconGradient: "from-success to-primary",
    projects: 8,
    research: 5,
    resources: 15
  },
  {
    name: "IoT",
    description: "Connected devices, sensor networks, and smart system implementations",
    icon: Wifi,
    gradient: "from-accent/10 to-primary/10",
    iconGradient: "from-accent to-primary",
    projects: 15,
    research: 7,
    resources: 22
  },
  {
    name: "Robotics",
    description: "Autonomous systems, robotic arms, and intelligent automation projects",
    icon: Bot,
    gradient: "from-warning/10 to-error/10",
    iconGradient: "from-warning to-error",
    projects: 6,
    research: 4,
    resources: 12
  },
  {
    name: "Cybersecurity",
    description: "Security protocols, encryption systems, and network protection solutions",
    icon: Shield,
    gradient: "from-error/10 to-warning/10",
    iconGradient: "from-error to-warning",
    projects: 9,
    research: 6,
    resources: 16
  },
  {
    name: "Web Development",
    description: "Full-stack applications, modern frameworks, and responsive web solutions",
    icon: Globe,
    gradient: "from-primary/10 to-accent/10",
    iconGradient: "from-primary to-accent",
    projects: 18,
    research: 3,
    resources: 30
  },
  {
    name: "Mobile Development",
    description: "Native and cross-platform mobile applications with modern UI/UX",
    icon: Smartphone,
    gradient: "from-accent/10 to-primary/10",
    iconGradient: "from-accent to-primary",
    projects: 7,
    research: 2,
    resources: 14
  },
  {
    name: "Cloud Computing",
    description: "Cloud architecture, serverless solutions, and distributed systems",
    icon: Cloud,
    gradient: "from-primary/10 to-accent/10",
    iconGradient: "from-primary to-accent",
    projects: 11,
    research: 5,
    resources: 20
  },
  {
    name: "DevOps",
    description: "CI/CD pipelines, infrastructure automation, and deployment strategies",
    icon: Server,
    gradient: "from-muted/10 to-muted-dark/10",
    iconGradient: "from-muted to-muted-dark",
    projects: 8,
    research: 3,
    resources: 17
  },
  {
    name: "Electronics",
    description: "Circuit design, PCB development, and electronic system prototyping",
    icon: CircuitBoard,
    gradient: "from-warning/10 to-accent/10",
    iconGradient: "from-warning to-accent",
    projects: 14,
    research: 8,
    resources: 25
  },
  {
    name: "Embedded Systems",
    description: "Microcontroller programming, firmware development, and real-time systems",
    icon: Microchip,
    gradient: "from-accent/10 to-warning/10",
    iconGradient: "from-accent to-warning",
    projects: 13,
    research: 7,
    resources: 21
  },
  {
    name: "Research",
    description: "Academic research, whitepapers, and technical publications",
    icon: FlaskConical,
    gradient: "from-success/10 to-accent/10",
    iconGradient: "from-success to-accent",
    projects: 5,
    research: 15,
    resources: 28
  },
  {
    name: "Innovation",
    description: "Cutting-edge prototypes, experimental projects, and emerging technologies",
    icon: Lightbulb,
    gradient: "from-success/10 to-primary/10",
    iconGradient: "from-success to-primary",
    projects: 4,
    research: 9,
    resources: 13
  },
  {
    name: "Open Source",
    description: "Community-driven projects, contributions, and collaborative development",
    icon: GitBranch,
    gradient: "from-success/10 to-accent/10",
    iconGradient: "from-success to-accent",
    projects: 20,
    research: 4,
    resources: 35
  }
];

export function EngineeringDomains() {
  return (
    <section className="py-24">
      {/* Header */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-4 text-sm uppercase tracking-[0.28em] text-muted">Engineering Ecosystem</p>
          <h2 className="mb-6 font-heading text-section-title font-bold">
            15 Domains of Innovation
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-muted">
            Explore comprehensive engineering domains spanning AI, IoT, software, hardware, and emerging technologies. Each domain offers projects, research, and resources for hands-on learning.
          </p>
        </motion.div>

        {/* Domains Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {engineeringDomains.map((domain, index) => (
            <Link key={domain.name} href={`/projects?category=${domain.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative h-full rounded-3xl glass p-6 transition-all duration-300 hover:shadow-2xl"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${domain.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                
                <div className="relative h-full">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${domain.iconGradient} text-white shadow-lg`}
                  >
                    <domain.icon size={28} />
                  </motion.div>
                  
                  {/* Title */}
                  <h3 className="mb-2 text-lg font-heading font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {domain.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="mb-4 text-sm text-muted leading-relaxed line-clamp-2">
                    {domain.description}
                  </p>
                  
                  {/* Metrics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Projects</span>
                      <span className="font-semibold text-foreground">{domain.projects}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Research</span>
                      <span className="font-semibold text-foreground">{domain.research}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Resources</span>
                      <span className="font-semibold text-foreground">{domain.resources}</span>
                    </div>
                  </div>

                  {/* Explore Link */}
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore
                    <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16"
        >
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-3xl glass p-8 text-center">
              <div className="text-4xl font-heading font-bold bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                {engineeringDomains.reduce((sum, d) => sum + d.projects, 0)}
              </div>
              <p className="mt-2 text-sm font-heading font-semibold text-foreground">Total Projects</p>
              <p className="text-xs text-muted">Across all domains</p>
            </div>
            <div className="rounded-3xl glass p-8 text-center">
              <div className="text-4xl font-heading font-bold bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                {engineeringDomains.reduce((sum, d) => sum + d.research, 0)}
              </div>
              <p className="mt-2 text-sm font-heading font-semibold text-foreground">Research Papers</p>
              <p className="text-xs text-muted">Academic publications</p>
            </div>
            <div className="rounded-3xl glass p-8 text-center">
              <div className="text-4xl font-heading font-bold bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                {engineeringDomains.reduce((sum, d) => sum + d.resources, 0)}
              </div>
              <p className="mt-2 text-sm font-heading font-semibold text-foreground">Resources</p>
              <p className="text-xs text-muted">Learning materials</p>
            </div>
          </div>
        </motion.div>
    </section>
  );
}
