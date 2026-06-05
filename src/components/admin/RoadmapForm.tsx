"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roadmapSchema, RoadmapInput } from "@/lib/validation/learning.schema";
import { saveRoadmapAction } from "@/lib/actions/admin-actions";
import { AdminSubmitButton } from "./AdminSubmitButton";
import { RichTextEditor } from "./RichTextEditor";

interface RoadmapFormProps {
  roadmap?: RoadmapInput & { id: string };
}

const categories = ['IoT', 'AI', 'Cybersecurity', 'Web Development'];

export function RoadmapForm({ roadmap }: RoadmapFormProps) {
  const [content, setContent] = React.useState<string>(roadmap?.content || "");

  const {
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(roadmapSchema) as any,
    defaultValues: {
      title: roadmap?.title || "",
      slug: roadmap?.slug || "",
      description: roadmap?.description || "",
      category: roadmap?.category || "AI",
      content: roadmap?.content || "",
      published: roadmap?.published ?? false,
    },
  });

  return (
    <form action={saveRoadmapAction} className="space-y-6">
      {roadmap?.id && <input type="hidden" name="id" value={roadmap.id} />}
      <input type="hidden" name="content" value={content} />

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              {...register("title")}
              placeholder="e.g. AI Learning Roadmap"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug</label>
            <input
              {...register("slug")}
              placeholder="ai-learning-roadmap"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            {...register("description")}
            placeholder="Roadmap description..."
            rows={3}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Category</label>
          <select
            {...register("category")}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Content</label>
          <RichTextEditor content={content} onChange={setContent} />
          {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            {...register("published")}
            type="checkbox"
            id="published"
            className="rounded border-border/70"
          />
          <label htmlFor="published" className="text-sm font-medium">
            Publish Roadmap
          </label>
        </div>
      </div>

      <AdminSubmitButton idleLabel={roadmap ? "Update Roadmap" : "Create Roadmap"} />
    </form>
  );
}
