"use client";

import { motion } from "framer-motion";
import { Eye, Heart, ArrowRight, Clock, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { NexusLogo } from "@/components/shared/NexusLogo";

interface PremiumProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    cover_image?: string;
    tags?: string[];
    views_count?: number;
    likes_count?: number;
    slug: string;
    author?: string;
    category?: string;
    status?: string;
  };
  index: number;
}

export function PremiumProjectCard({ project, index }: PremiumProjectCardProps) {
  return (
    <Link href={`/projects/${project.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -8 }}
        className="group relative h-full overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-surface/90 to-background/90 backdrop-blur-xl shadow-xl transition-all duration-300 hover:shadow-2xl dark:border-slate-800 dark:from-slate-950/90 dark:to-slate-900/90"
      >
        {/* Cover Image */}
        <div className="relative aspect-video overflow-hidden">
          {project.cover_image ? (
            <Image
              src={project.cover_image}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <NexusLogo className="h-20 w-20 text-primary/40" />
            </div>
          )}
          
          {/* Status Badge */}
          {project.status && (
            <div className="absolute left-4 top-4">
              <span className="rounded-full bg-gradient-to-r from-primary to-secondary px-3 py-1 text-xs font-bold text-white shadow-lg">
                {project.status}
              </span>
            </div>
          )}

          {/* Category Badge */}
          {project.category && (
            <div className="absolute right-4 top-4">
              <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur-sm dark:bg-slate-950/90">
                {project.category}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tags */}
          <div className="mb-4 flex flex-wrap gap-2">
            {project.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h3 className="mb-3 text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {project.title}
          </h3>

          {/* Description */}
          <p className="mb-4 line-clamp-2 text-base text-muted">
            {project.description}
          </p>

          {/* Author */}
          {project.author && (
            <div className="mb-4 flex items-center gap-2 text-sm text-muted">
              <User size={14} />
              <span>{project.author}</span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between border-t border-border/70 pt-4 dark:border-slate-800">
            <div className="flex items-center gap-4 text-sm text-muted">
              <div className="flex items-center gap-1.5">
                <Eye size={14} />
                <span>{(project.views_count || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart size={14} />
                <span>{(project.likes_count || 0).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
