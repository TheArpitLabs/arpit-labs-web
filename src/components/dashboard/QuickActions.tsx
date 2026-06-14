"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, FeatureCard } from "@/components/ui/card";
import { Plus, Github, User, Compass, ArrowRight } from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      name: "Create Project",
      description: "Start a new engineering project",
      icon: Plus,
      href: "/creator/projects/new" as const,
    },
    {
      name: "Import GitHub",
      description: "Import from your repositories",
      icon: Github,
      href: "/profile" as const,
    },
    {
      name: "View Profile",
      description: "Manage your profile settings",
      icon: User,
      href: "/profile" as const,
    },
    {
      name: "Explore Projects",
      description: "Discover community projects",
      icon: Compass,
      href: "/projects" as const,
    },
  ];

  return (
    <Card variant="glass" className="p-6">
      <h3 className="mb-6 text-lg font-semibold text-foreground">Quick Actions</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map((action, index) => (
          <motion.div
            key={action.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link href={action.href} className="group block">
              <div className="flex items-start gap-4 rounded-2xl border border-border/50 bg-gradient-to-br from-surface/50 to-surface/30 p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary shadow-lg"
                >
                  <action.icon className="h-6 w-6" />
                </motion.div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {action.name}
                  </h4>
                  <p className="mt-1 text-sm text-muted">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
