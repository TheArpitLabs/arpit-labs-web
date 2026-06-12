"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Eye, Heart, Calendar } from "lucide-react";

interface RecentProjectsProps {
  projects: any[];
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  const recentProjects = projects.slice(0, 6);

  if (recentProjects.length === 0) {
    return (
      <Card className="border-border/70 bg-card p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start creating and track your engineering projects here.
          </p>
          <Link
            href="/creator/projects/new"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Create Project
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recentProjects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.slug}`}
          className="group"
        >
          <Card className="border-border/70 bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
            {/* Thumbnail */}
            <div className="relative aspect-video w-full bg-muted/20">
              {project.cover_image ? (
                <Image
                  src={project.cover_image}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted/20">
                  <FolderKanban className="h-12 w-12" />
                </div>
              )}
              <div className="absolute left-3 top-3">
                <Badge
                  variant="outline"
                  className="border-none bg-background/80 text-foreground backdrop-blur-md"
                >
                  {project.project_type}
                </Badge>
              </div>
              {project.featured && (
                <div className="absolute right-3 top-3">
                  <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {project.description}
              </p>

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {project.views_count || 0}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {project.likes_count || 0}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Status */}
              <div className="mt-3">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    project.status === "published"
                      ? "border-green-500/50 text-green-500"
                      : project.status === "draft"
                      ? "border-yellow-500/50 text-yellow-500"
                      : "border-gray-500/50 text-gray-500"
                  }`}
                >
                  {project.status}
                </Badge>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
