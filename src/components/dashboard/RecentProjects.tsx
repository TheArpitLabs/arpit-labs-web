"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { FolderKanban, Eye, Heart, Calendar, ArrowRight } from "lucide-react";

interface RecentProjectsProps {
  projects: any[];
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  const recentProjects = projects.slice(0, 6);

  if (recentProjects.length === 0) {
    return (
      <Card variant="glass" className="p-8">
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Start creating and track your engineering projects here."
          actionLabel="Create Project"
          actionHref="/creator/projects/new"
          variant="minimal"
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {recentProjects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Link href={`/projects/${project.slug}`} className="group block">
            <Card variant="elevated" className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
              {/* Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-surface">
                {project.cover_image ? (
                  <Image
                    src={project.cover_image}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                    <FolderKanban className="h-12 w-12 text-primary/40" />
                  </div>
                )}
                <div className="absolute left-3 top-3">
                  <Badge variant="outline" className="border-none glass text-foreground">
                    {project.project_type}
                  </Badge>
                </div>
                {project.featured && (
                  <div className="absolute right-3 top-3">
                    <Badge variant="glow" className="bg-primary text-primary-foreground">
                      Featured
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {project.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted">
                  {project.description}
                </p>

                {/* Stats */}
                <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{(project.views_count || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" />
                    <span>{(project.likes_count || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Status & View */}
                <div className="mt-4 flex items-center justify-between">
                  <Badge
                    variant={project.status === "published" ? "success" : project.status === "draft" ? "warning" : "secondary"}
                    size="sm"
                  >
                    {project.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    View
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
