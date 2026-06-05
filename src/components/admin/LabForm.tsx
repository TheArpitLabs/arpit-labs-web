"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { labSchema, LabInput } from "@/lib/validation/learning.schema";
import { saveLabAction } from "@/lib/actions/admin-actions";
import { AdminSubmitButton } from "./AdminSubmitButton";
import { RichTextEditor } from "./RichTextEditor";

interface LabFormProps {
  lab?: LabInput & { id: string };
}

const categories = ['IoT', 'AI', 'Cybersecurity', 'Web Development'];
const difficulties = ['beginner', 'intermediate', 'advanced'];

export function LabForm({ lab }: LabFormProps) {
  const [instructions, setInstructions] = React.useState<string>(lab?.instructions || "");

  const {
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(labSchema) as any,
    defaultValues: {
      title: lab?.title || "",
      slug: lab?.slug || "",
      description: lab?.description || "",
      instructions: lab?.instructions || "",
      difficulty: lab?.difficulty || "beginner",
      category: lab?.category || "AI",
      published: lab?.published ?? false,
    },
  });

  return (
    <form action={saveLabAction} className="space-y-6">
      {lab?.id && <input type="hidden" name="id" value={lab.id} />}
      <input type="hidden" name="instructions" value={instructions} />

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              {...register("title")}
              placeholder="e.g. IoT Weather Station"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug</label>
            <input
              {...register("slug")}
              placeholder="iot-weather-station"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            {...register("description")}
            placeholder="Lab description..."
            rows={3}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Instructions</label>
          <RichTextEditor content={instructions} onChange={setInstructions} />
          {errors.instructions && <p className="text-xs text-red-500">{errors.instructions.message}</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
            <label className="text-sm font-medium">Difficulty</label>
            <select
              {...register("difficulty")}
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </option>
              ))}
            </select>
            {errors.difficulty && <p className="text-xs text-red-500">{errors.difficulty.message}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            {...register("published")}
            type="checkbox"
            id="published"
            className="rounded border-border/70"
          />
          <label htmlFor="published" className="text-sm font-medium">
            Publish Lab
          </label>
        </div>
      </div>

      <AdminSubmitButton idleLabel={lab ? "Update Lab" : "Create Lab"} />
    </form>
  );
}
