"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Download, Code, Layout, Database, Settings, ArrowRight, BookOpen, Layers, Zap } from "lucide-react";
import Link from "next/link";

const resourceCategories = [
  {
    name: "Learning Resources",
    description: "Tutorials, guides, and educational materials for engineering learning",
    icon: BookOpen,
    gradient: "from-purple-500/10 to-pink-500/10",
    iconGradient: "from-purple-500 to-pink-500",
    count: 24
  },
  {
    name: "Templates",
    description: "Ready-to-use project templates and boilerplates for quick development",
    icon: Layout,
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconGradient: "from-blue-500 to-cyan-500",
    count: 18
  },
  {
    name: "Starter Kits",
    description: "Complete starter kits with everything needed to begin projects",
    icon: Zap,
    gradient: "from-green-500/10 to-emerald-500/10",
    iconGradient: "from-green-500 to-emerald-500",
    count: 12
  },
  {
    name: "Design Assets",
    description: "UI components, design systems, and visual resources for projects",
    icon: Layers,
    gradient: "from-orange-500/10 to-red-500/10",
    iconGradient: "from-orange-500 to-red-500",
    count: 15
  }
];

const featuredResources = [
  {
    title: "IoT Development Starter Kit",
    category: "Starter Kits",
    description: "Complete IoT development environment with sensor libraries, communication protocols, and sample projects.",
    downloads: "2.4K",
    rating: "4.9",
    type: "Kit"
  },
  {
    title: "React Dashboard Template",
    category: "Templates",
    description: "Modern React dashboard template with charts, tables, and authentication system built-in.",
    downloads: "3.8K",
    rating: "4.8",
    type: "Template"
  },
  {
    title: "Machine Learning Course Bundle",
    category: "Learning Resources",
    description: "Comprehensive ML course covering neural networks, deep learning, and practical implementations.",
    downloads: "5.2K",
    rating: "4.9",
    type: "Course"
  }
];

const resourceTypes = [
  {
    title: "Code Snippets",
    description: "Reusable code blocks and utilities for common engineering tasks",
    icon: Code,
    count: 150
  },
  {
    title: "Documentation",
    description: "Technical documentation and API references for projects and tools",
    icon: BookOpen,
    count: 85
  },
  {
    title: "Datasets",
    description: "Curated datasets for machine learning, analytics, and research",
    icon: Database,
    count: 42
  },
  {
    title: "Configuration Files",
    description: "Pre-configured settings and environment files for various tools",
    icon: Settings,
    count: 68
  }
];

export function MarketplaceResourcesSection() {
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
          <p className="mb-4 text-sm uppercase tracking-[0.28em] text-muted">Marketplace Resources</p>
          <h2 className="mb-6 text-section-title">
            Engineering Resource Hub
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-muted">
            Access premium resources, templates, starter kits, and learning materials to accelerate your engineering projects and skill development.
          </p>
        </motion.div>

        {/* Resource Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-foreground">Resource Categories</h3>
            <p className="mt-2 text-muted">Explore resources by type and use case</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {resourceCategories.map((category, index) => (
              <Link key={category.name} href="/marketplace">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative h-full rounded-3xl glass p-6 transition-all duration-300 hover:shadow-2xl"
                >
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${category.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                  
                  <div className="relative h-full">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${category.iconGradient} text-white shadow-lg`}
                    >
                      <category.icon size={24} />
                    </motion.div>
                    
                    <h4 className="mb-2 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {category.name}
                    </h4>
                    
                    <p className="mb-4 text-sm text-muted leading-relaxed line-clamp-2">
                      {category.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Resources</span>
                      <span className="font-semibold text-foreground">{category.count}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Featured Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-foreground">Featured Resources</h3>
              <p className="mt-2 text-muted">Top downloads and highly-rated resources</p>
            </div>
            <Link 
              href="/marketplace"
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary hover:gap-4 transition-all"
            >
              Browse All Resources
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {featuredResources.map((resource, index) => (
              <motion.div
                key={resource.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative overflow-hidden rounded-3xl glass p-6 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {resource.category}
                    </span>
                    <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                      ⭐ {resource.rating}
                    </span>
                  </div>
                  
                  <h4 className="mb-3 text-lg font-bold text-foreground line-clamp-2">
                    {resource.title}
                  </h4>
                  
                  <p className="mb-4 text-sm text-muted leading-relaxed line-clamp-3">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Download size={12} />
                      <span>{resource.downloads} downloads</span>
                    </div>
                    <span className="text-xs font-semibold text-muted">{resource.type}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 sm:hidden">
            <Link 
              href="/marketplace"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-primary"
            >
              Browse All Resources
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>

        {/* Resource Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-foreground">Resource Types</h3>
            <p className="mt-2 text-muted">Different formats for various engineering needs</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {resourceTypes.map((type, index) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative overflow-hidden rounded-3xl glass p-6 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                    <type.icon size={24} />
                  </div>
                  
                  <h4 className="mb-2 text-lg font-bold text-foreground line-clamp-1">
                    {type.title}
                  </h4>
                  
                  <p className="mb-4 text-sm text-muted leading-relaxed line-clamp-2">
                    {type.description}
                  </p>
                  
                  <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                    {type.count}
                  </div>
                  <p className="text-xs text-muted">Available</p>
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
          className="mt-20"
        >
          <div className="relative overflow-hidden rounded-3xl glass p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
            <div className="relative">
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-4 text-3xl font-bold text-foreground">Explore the Marketplace</h3>
              <p className="mb-8 max-w-2xl mx-auto text-lg text-muted">
                Discover thousands of resources to accelerate your engineering projects and enhance your skills.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
                <Link
                  href="/marketplace"
                  className="premium-button group inline-flex items-center justify-center"
                >
                  Browse Marketplace
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/marketplace?filter=free"
                  className="premium-button-secondary inline-flex items-center justify-center"
                >
                  View Free Resources
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
    </section>
  );
}
