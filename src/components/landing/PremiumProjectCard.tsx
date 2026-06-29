"use client";

import { motion } from "framer-motion";
import { Eye, Heart, ArrowRight, User, Code2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { NexusLogo } from "@/components/shared/NexusLogo";

interface PremiumProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    cover_image?: string | null;
    tags?: string[];
    views_count?: number;
    likes_count?: number;
    slug: string;
    author?: string;
    category?: string | null;
    status?: string;
  };
  index: number;
}

export function PremiumProjectCard({ project, index }: PremiumProjectCardProps) {
  const categoryLabel = project.category || "Engineering";

  return (
    <Link href={`/projects/${project.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -4 }}
        className="group relative h-full overflow-hidden rounded-lg border border-border bg-card p-0.5 transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
      >
        {/* Cover Image */}
        <div className="relative aspect-video overflow-hidden rounded-lg bg-surface">
          {project.cover_image ? (
            <Image
              src={project.cover_image}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="relative flex h-full flex-col justify-between bg-gradient-to-br from-primary/20 via-background to-accent/20 p-5">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />
              <div className="relative flex items-center justify-between">
                <div className="rounded-xl border border-border bg-surface p-2 text-primary backdrop-blur">
                  <Code2 className="h-5 w-5" />
                </div>
                <NexusLogo className="h-10 w-10 text-muted" />
              </div>
              <div className="relative">
                <p className="text-xs font-heading font-semibold uppercase tracking-[0.22em] text-primary/80">{categoryLabel}</p>
                <p className="mt-2 line-clamp-2 text-xl font-heading font-bold text-foreground">{project.title}</p>
              </div>
            </div>
          )}

          {/* Status Badge */}
          {project.status && (
            <div className="absolute left-3 top-3">
              <span className="rounded-full bg-gradient-to-r from-primary to-accent px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                {project.status}
              </span>
            </div>
          )}

          {/* Category Badge */}
          {project.category && (
            <div className="absolute right-3 top-3">
              <span className="rounded-full glass px-2 py-0.5 text-[10px] font-semibold text-foreground">
                {categoryLabel}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="mb-2 text-base font-heading font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {project.title}
          </h3>

          {/* Description */}
          <p className="mb-3 line-clamp-2 text-xs text-muted">
            {project.description}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between border-t border-border/70 pt-3">
            <div className="flex items-center gap-3 text-xs text-muted">
              <div className="flex items-center gap-1">
                <Eye size={12} />
                <span>{(project.views_count || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart size={12} />
                <span>{(project.likes_count || 0).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
