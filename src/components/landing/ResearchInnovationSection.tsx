"use client";

import { motion } from "framer-motion";
import { Microscope, Lightbulb, FileText, TrendingUp, ArrowRight, BookOpen, Zap, Target } from "lucide-react";
import Link from "next/link";

const researchCategories = [
  {
    name: "Artificial Intelligence",
    description: "Neural networks, deep learning, and AI systems research",
    icon: Microscope,
    gradient: "from-primary/10 to-accent/10",
    iconGradient: "from-primary to-accent",
    count: 8
  },
  {
    name: "IoT & Embedded Systems",
    description: "Connected devices, sensor networks, and edge computing",
    icon: Zap,
    gradient: "from-accent/10 to-success/10",
    iconGradient: "from-accent to-success",
    count: 7
  },
  {
    name: "Cybersecurity",
    description: "Security protocols, encryption, and network protection",
    icon: Target,
    gradient: "from-error/10 to-warning/10",
    iconGradient: "from-error to-warning",
    count: 6
  },
  {
    name: "Data Science",
    description: "Big data analytics, visualization, and statistical modeling",
    icon: TrendingUp,
    gradient: "from-success/10 to-primary/10",
    iconGradient: "from-success to-primary",
    count: 5
  }
];

const featuredResearch = [
  {
    title: "Advanced Neural Network Architectures for IoT",
    category: "AI & IoT",
    excerpt: "Exploring lightweight neural network designs optimized for edge computing devices in IoT environments.",
    date: "2024",
    type: "Paper"
  },
  {
    title: "Real-time Anomaly Detection in Industrial IoT",
    category: "Cybersecurity",
    excerpt: "Machine learning approaches for detecting security threats in industrial IoT systems.",
    date: "2024",
    type: "Research"
  },
  {
    title: "Energy-Efficient Embedded Systems Design",
    category: "Embedded Systems",
    excerpt: "Optimization techniques for low-power embedded systems in battery-operated applications.",
    date: "2023",
    type: "Paper"
  }
];

const innovationHighlights = [
  {
    title: "AI-Powered Code Analysis",
    description: "Intelligent system for automated code review and optimization suggestions",
    status: "In Development"
  },
  {
    title: "Smart IoT Dashboard",
    description: "Real-time monitoring platform for IoT device networks with predictive analytics",
    status: "Beta"
  },
  {
    title: "Automated Testing Framework",
    description: "Comprehensive testing suite for hardware-software integration projects",
    status: "Released"
  }
];

export function ResearchInnovationSection() {
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
          <p className="mb-2 text-xs uppercase tracking-[0.28em] text-muted">Research & Innovation</p>
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
            Engineering Knowledge Hub
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted">
            Explore cutting-edge research papers, technical publications, and innovative projects pushing the boundaries of AI, IoT, and emerging technologies.
          </p>
        </motion.div>

        {/* Research Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="mb-8">
            <h3 className="text-xl font-heading font-bold text-foreground">Research Categories</h3>
            <p className="mt-1 text-sm text-muted">Explore research across key engineering domains</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {researchCategories.map((category, index) => (
              <Link key={category.name} href="/research">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative h-full rounded-2xl glass p-5 transition-all duration-300 hover:shadow-lg"
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${category.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                  
                  <div className="relative h-full">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${category.iconGradient} text-white shadow-md`}
                    >
                      <category.icon size={20} />
                    </motion.div>
                    
                    <h4 className="mb-2 text-sm font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                      {category.name}
                    </h4>
                    
                    <p className="mb-3 text-xs text-muted leading-relaxed line-clamp-2">
                      {category.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Papers</span>
                      <span className="font-semibold text-foreground">{category.count}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Featured Research */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">Featured Research</h3>
              <p className="mt-1 text-sm text-muted">Latest publications and technical papers</p>
            </div>
            <Link 
              href="/research"
              className="hidden sm:flex items-center gap-2 text-xs font-semibold text-primary hover:gap-4 transition-all"
            >
              View All Research
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {featuredResearch.map((research, index) => (
              <motion.div
                key={research.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="relative overflow-hidden rounded-2xl glass p-5 transition-all duration-300 hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <div className="relative">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {research.category}
                    </span>
                    <span className="text-[10px] text-muted">{research.date}</span>
                  </div>
                  
                  <h4 className="mb-2 text-sm font-bold text-foreground line-clamp-2">
                    {research.title}
                  </h4>
                  
                  <p className="mb-3 text-xs text-muted leading-relaxed line-clamp-2">
                    {research.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-muted">{research.type}</span>
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-primary">
                      Read More
                      <ArrowRight size={10} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 sm:hidden">
            <Link 
              href="/research"
              className="flex items-center justify-center gap-2 text-xs font-semibold text-primary"
            >
              View All Research
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>

        {/* Innovation Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h3 className="text-xl font-bold text-foreground">Innovation Highlights</h3>
            <p className="mt-1 text-sm text-muted">Cutting-edge projects and experimental prototypes</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {innovationHighlights.map((highlight, index) => (
              <motion.div
                key={highlight.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="relative overflow-hidden rounded-2xl glass p-5 transition-all duration-300 hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <div className="relative">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                    <Lightbulb size={20} />
                  </div>
                  
                  <h4 className="mb-2 text-sm font-bold text-foreground line-clamp-1">
                    {highlight.title}
                  </h4>
                  
                  <p className="mb-3 text-xs text-muted leading-relaxed line-clamp-2">
                    {highlight.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      highlight.status === 'Released' 
                        ? 'bg-success/10 text-success' 
                        : highlight.status === 'Beta'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {highlight.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12"
        >
          <div className="relative overflow-hidden rounded-2xl glass p-8 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
            <div className="relative">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">Explore Our Research</h3>
              <p className="mb-6 max-w-xl mx-auto text-sm text-muted">
                Dive deep into technical papers, case studies, and innovative projects shaping the future of engineering.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
                <Link
                  href="/research"
                  className="premium-button group inline-flex items-center justify-center"
                >
                  Browse Research
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/innovation"
                  className="premium-button-secondary inline-flex items-center justify-center"
                >
                  View Innovations
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
    </section>
  );
}
