"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface ProjectFiltersProps {
  searchQuery: string;
  branch: string;
  projectType: string;
  sort: string;
}

export function ProjectFilters({ searchQuery, branch, projectType, sort }: ProjectFiltersProps) {
  return (
    <section className="mb-12 space-y-6">
      <form>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            placeholder="Search projects by title, description, tags, or technologies..."
            className="pl-12 h-12 text-lg rounded-2xl glass"
            name="search"
            defaultValue={searchQuery}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Branch Filter */}
          <select
            name="branch"
            defaultValue={branch || ''}
            className="rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-heading focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
          >
            <option value="">All Branches</option>
            <option value="Computer Science">Computer Science</option>
            <option value="AI/ML">AI/ML</option>
            <option value="Data Science">Data Science</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="IoT">IoT</option>
            <option value="Electronics">Electronics</option>
            <option value="Electrical">Electrical</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
            <option value="Robotics">Robotics</option>
            <option value="Aerospace">Aerospace</option>
            <option value="Biomedical">Biomedical</option>
          </select>

          {/* Project Type Filter */}
          <select
            name="project_type"
            defaultValue={projectType || ''}
            className="rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-heading focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
          >
            <option value="">All Types</option>
            <option value="software">Software</option>
            <option value="hardware">Hardware</option>
            <option value="research">Research</option>
            <option value="opensource">Open Source</option>
            <option value="hackathon">Hackathon</option>
            <option value="hybrid">Hybrid</option>
          </select>

          {/* Sort */}
          <select
            name="sort"
            defaultValue={sort || 'newest'}
            className="rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-heading focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="views">Most Viewed</option>
            <option value="likes">Most Liked</option>
          </select>

          <Button type="submit" variant="primary" className="ml-auto">
            Apply Filters
          </Button>
        </div>
      </form>
    </section>
  );
}
