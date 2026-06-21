"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, TrendingUp, Heart, User, ArrowUpRight, Code2 } from "lucide-react";
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
  const categoryLabel = project.branch || project.project_type || "Engineering";

  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/projects/${project.slug}`} className="group block">
        <Card variant={variant} className="group h-full overflow-hidden border border-white/10 bg-slate-950/70 transition-all duration-300 hover:border-blue-400/40 hover:shadow-xl">
          <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
            {project.cover_image ? (
              <Image
                src={project.cover_image}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="relative flex h-full w-full flex-col justify-between bg-[radial-gradient(circle_at_25%_20%,rgba(59,130,246,0.42),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(16,185,129,0.28),transparent_32%),linear-gradient(135deg,#07111f,#111827)] p-5">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />
                <div className="relative flex items-center justify-between">
                  <div className="rounded-xl border border-white/10 bg-white/10 p-2 text-blue-100 backdrop-blur">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <NexusLogo className="h-9 w-9 text-white/35" />
                </div>
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100/80">{categoryLabel}</p>
                  <p className="mt-2 line-clamp-2 text-xl font-bold text-white">{project.title}</p>
                </div>
              </div>
            )}
            <div className="absolute left-4 top-4">
              <Badge variant="outline" className="border-white/10 bg-black/35 text-white backdrop-blur">
                {categoryLabel}
              </Badge>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-blue-300">{project.title}</h3>
              <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-300" />
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{project.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(project.created_at).toLocaleDateString('en-US')}
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
