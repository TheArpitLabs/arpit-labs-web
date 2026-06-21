"use client";

import { motion } from "framer-motion";
import { Sparkles, Flame, Clock, TrendingUp } from "lucide-react";
import { ProjectCard } from "./ProjectCard";

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

interface ProjectSectionProps {
  title: string;
  icon: React.ReactNode;
  projects: Project[];
  variant?: "featured" | "trending" | "latest" | "popular";
  authorMap?: Map<string, any>;
}

export function ProjectSection({ title, icon, projects, variant = "trending", authorMap }: ProjectSectionProps) {
  if (!projects || projects.length === 0) return null;

  const delayMap = {
    featured: 0.3,
    trending: 0.4,
    latest: 0.5,
    popular: 0
  };

  const cardVariant = variant === "featured" ? "elevated" : "glass";

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delayMap[variant] }}
      className="mb-16"
    >
      <div className="mb-8 flex items-center gap-3">
        {icon}
        <h2 className="text-2xl font-heading font-bold text-foreground">{title}</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={index}
            variant={cardVariant}
            authorMap={authorMap}
          />
        ))}
      </div>
    </motion.section>
  );
}

export function FeaturedProjects({ projects, authorMap }: { projects: Project[]; authorMap?: Map<string, any> }) {
  return (
    <ProjectSection
      title="Featured Projects"
      icon={<Sparkles className="h-6 w-6 text-primary" />}
      projects={projects}
      variant="featured"
      authorMap={authorMap}
    />
  );
}

export function TrendingProjects({ projects, authorMap }: { projects: Project[]; authorMap?: Map<string, any> }) {
  return (
    <ProjectSection
      title="Trending Projects"
      icon={<Flame className="h-6 w-6 text-primary" />}
      projects={projects}
      variant="trending"
      authorMap={authorMap}
    />
  );
}

export function LatestProjects({ projects, authorMap }: { projects: Project[]; authorMap?: Map<string, any> }) {
  return (
    <ProjectSection
      title="Latest Projects"
      icon={<Clock className="h-6 w-6 text-primary" />}
      projects={projects}
      variant="latest"
      authorMap={authorMap}
    />
  );
}

export function PopularProjects({ projects, authorMap }: { projects: Project[]; authorMap?: Map<string, any> }) {
  return (
    <ProjectSection
      title="Popular Projects"
      icon={<TrendingUp className="h-6 w-6 text-primary" />}
      projects={projects}
      variant="popular"
      authorMap={authorMap}
    />
  );
}
