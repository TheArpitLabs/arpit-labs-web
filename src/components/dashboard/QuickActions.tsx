"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Plus, Github, User, Compass } from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      name: "Create Project",
      description: "Start a new engineering project",
      icon: Plus,
      href: "/creator/projects/new" as const,
      color: "bg-primary/10 text-primary hover:bg-primary/20",
    },
    {
      name: "Import GitHub",
      description: "Import from your repositories",
      icon: Github,
      href: "/profile" as const,
      color: "bg-secondary/10 text-secondary hover:bg-secondary/20",
    },
    {
      name: "View Profile",
      description: "Manage your profile settings",
      icon: User,
      href: "/profile" as const,
      color: "bg-muted/10 text-muted hover:bg-muted/20",
    },
    {
      name: "Explore Projects",
      description: "Discover community projects",
      icon: Compass,
      href: "/projects" as const,
      color: "bg-accent/10 text-accent hover:bg-accent/20",
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="mb-6 text-lg font-semibold text-foreground">Quick Actions</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="group"
          >
            <div className="flex items-start gap-4 rounded-lg border border-border/70 glass p-4 transition-all hover:border-primary/50 hover:shadow-md">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color} transition-colors`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {action.name}
                </h4>
                <p className="mt-1 text-sm text-muted">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
