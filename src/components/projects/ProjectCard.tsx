"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, TrendingUp, Heart, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NexusLogo } from "@/components/shared/NexusLogo";

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  project_type: string;
  cover_image?: string | null;
  views_count?: number;
  likes_count?: number;
  created_at: string;
  branch?: string | null;
  owner_id?: string | null;
}

interface ProjectCardProps {
  project: Project;
  index: number;
  variant?: "elevated" | "glass";
  authorMap?: Map<string, any>;
}

export function ProjectCard({ project, index, variant = "glass", authorMap }: ProjectCardProps) {
  const author = project.owner_id ? authorMap?.get(project.owner_id) : null;

  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/projects/${project.slug}`} className="group block">
        <Card variant={variant} className="group h-full overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div className="relative aspect-video w-full bg-surface">
            {project.cover_image ? (
              <Image
                src={project.cover_image}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                <NexusLogo className="h-12 w-12 text-primary/40" />
              </div>
            )}
            <div className="absolute left-4 top-4">
              <Badge variant="outline" className="border-none glass text-foreground">
                {project.project_type}
              </Badge>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-muted">{project.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(project.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                {(project.views_count || 0).toLocaleString()} views
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {(project.likes_count || 0).toLocaleString()} likes
              </div>
              {project.branch && (
                <Badge variant="secondary" size="sm">
                  {project.branch}
                </Badge>
              )}
              {author && (
                <div className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <span>{author.full_name || 'Unknown'}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
