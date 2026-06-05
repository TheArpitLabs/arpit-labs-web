"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { researchPaperSchema, ResearchPaperInput } from "@/lib/validation/ecosystem.schema";
import { saveResearchPaperAction } from "@/lib/actions/ecosystem-actions";
import { AdminSubmitButton } from "./AdminSubmitButton";

interface ResearchPaperFormProps {
  paper?: ResearchPaperInput & { id: string };
}

export function ResearchPaperForm({ paper }: ResearchPaperFormProps) {
  const {
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(researchPaperSchema),
    defaultValues: {
      title: paper?.title || "",
      slug: paper?.slug || "",
      abstract: paper?.abstract || "",
      content: paper?.content || "",
      division: paper?.division || "ai",
      authors: paper?.authors || [],
      tags: paper?.tags || [],
      is_featured: paper?.is_featured || false,
    },
  });

  return (
    <form action={saveResearchPaperAction} className="space-y-6">
      {paper?.id && <input type="hidden" name="id" value={paper.id} />}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <input
            {...register("title")}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Slug</label>
          <input
            {...register("slug")}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Division</label>
          <select
            {...register("division")}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="ai">AI Research</option>
            <option value="iot">IoT Innovation</option>
            <option value="cybersecurity">Cybersecurity</option>
          </select>
        </div>
        <div className="flex items-center gap-2 pt-8">
          <input type="checkbox" {...register("is_featured")} id="is_featured" />
          <label htmlFor="is_featured" className="text-sm font-medium">Featured Paper</label>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Abstract</label>
        <textarea
          {...register("abstract")}
          rows={3}
          className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Authors (comma separated)</label>
        <input
          name="authors"
          defaultValue={paper?.authors?.join(", ")}
          placeholder="e.g. Arpit, Jane Doe"
          className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <AdminSubmitButton 
        idleLabel={paper?.id ? "Update Paper" : "Publish Paper"} 
        pendingLabel="Saving..." 
      />
    </form>
  );
}
