"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ExternalLink, Github, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NexusLogo } from "@/components/shared/NexusLogo";
import { cn } from "@/lib/utils";
import { Project } from "@/types/content";

interface ProjectsExplorerProps {
  projects: Project[];
}

export function ProjectsExplorer({ projects }: ProjectsExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const categories = ["All", ...new Set(projects.map((project) => project.category).filter(Boolean))];
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredProjects = projects.filter((project) => {
    const matchesCategory = selectedCategory === "All" || project.category === selectedCategory;
    const haystack = [
      project.title,
      project.description,
      project.category,
      ...project.tags,
      ...(project.tech_stack ?? []),
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = normalizedQuery.length === 0 || haystack.includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition",
                selectedCategory === category
                  ? "border-primary bg-primary text-white"
                  : "border-border/70 bg-background text-muted hover:border-primary hover:text-primary dark:border-slate-800 dark:bg-slate-950"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, tags, or stack..."
            className="w-full rounded-2xl border border-border/70 bg-surface py-3 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const projectHref = `/projects/${project.slug}` as Route;

            return (
              <Link key={project.id} href={projectHref} className="h-full">
                <Card className="group flex h-full flex-col overflow-hidden p-0">
                  <div className="relative aspect-video w-full bg-surface/50 dark:bg-slate-900">
                    {project.cover_image ? (
                      <img
                        src={project.cover_image}
                        alt={project.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted/20">
                        <NexusLogo className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute left-4 top-4">
                      <Badge className="border-none bg-background/80 text-foreground backdrop-blur-md">
                        {project.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold text-foreground transition group-hover:text-primary">
                      {project.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm text-muted">
                      {project.description}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {project.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="outline" className="px-2 py-1 text-[10px] tracking-[0.18em]">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center gap-4 text-muted">
                      {project.github_url ? <Github size={18} /> : null}
                      {project.demo_url ? <ExternalLink size={18} /> : null}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full rounded-[2rem] border border-dashed border-border/60 py-16 text-center text-muted dark:border-slate-800">
            No projects match the current search or category filter.
          </div>
        )}
      </div>
    </div>
  );
}
