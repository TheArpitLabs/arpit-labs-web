"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { experimentSchema, ExperimentInput } from "@/lib/validation/experiment.schema";
import { saveExperimentAction } from "@/lib/actions/admin-actions";
import { ImageUploader } from "./ImageUploader";
import { RichTextEditor } from "./RichTextEditor";
import { AdminSubmitButton } from "./AdminSubmitButton";
import { X, Beaker, Layers } from "lucide-react";

interface ExperimentFormProps {
  experiment?: ExperimentInput & { id: string };
}

export function ExperimentForm({ experiment }: ExperimentFormProps) {
  const [coverImage, setCoverImage] = useState<string>(experiment?.cover_image || "");
  const [content, setContent] = useState<string>(experiment?.content || "");
  const [techStack, setTechStack] = useState<string[]>(experiment?.tech_stack || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(experimentSchema) as any,
    defaultValues: {
      title: experiment?.title || "",
      slug: experiment?.slug || "",
      description: experiment?.description || "",
      content: experiment?.content || null,
      category: experiment?.category || null,
      difficulty: experiment?.difficulty || null,
      tech_stack: experiment?.tech_stack || [],
      status: experiment?.status || "draft",
      featured: experiment?.featured ?? false,
      published: experiment?.published ?? false,
      cover_image: experiment?.cover_image || null,
    },
  });

  const addTech = (tech: string) => {
    if (tech && !techStack.includes(tech)) {
      setTechStack([...techStack, tech]);
    }
  };

  const removeTech = (index: number) => {
    setTechStack(techStack.filter((_, i) => i !== index));
  };

  return (
    <form action={saveExperimentAction} className="space-y-6">
      {experiment?.id && <input type="hidden" name="id" value={experiment.id} />}
      <input type="hidden" name="cover_image" value={coverImage} />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="tech_stack" value={techStack.join(",")} />

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              {...register("title")}
              placeholder="Experiment Title"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug</label>
            <input
              {...register("slug")}
              placeholder="experiment-slug"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Category</label>
            <input
              {...register("category")}
              placeholder="e.g. AI, IoT"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <select
              {...register("status")}
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Difficulty</label>
            <select
              {...register("difficulty")}
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Tech Stack</label>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech, i) => (
              <span key={i} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {tech}
                <button type="button" onClick={() => removeTech(i)}><X className="h-3 w-3" /></button>
              </span>
            ))}
            <input
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTech(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
              placeholder="Add tech..."
              className="rounded-full border border-border/70 bg-transparent px-3 py-1 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        <ImageUploader
          bucket="experiments"
          folder="covers"
          initialValue={coverImage}
          onUploadComplete={(url) => setCoverImage(url)}
          onRemove={() => setCoverImage("")}
          label="Experiment Image"
        />

        <div className="space-y-1">
          <label className="text-sm font-medium">Short Description</label>
          <textarea
            {...register("description")}
            rows={2}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Experiment Content</label>
          <RichTextEditor content={content} onChange={setContent} />
        </div>

        <div className="flex items-center gap-6 rounded-2xl border border-border/50 bg-muted/20 p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register("published")} className="h-4 w-4 rounded border-gray-300" />
            Publicly Visible
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register("featured")} className="h-4 w-4 rounded border-gray-300" />
            Feature in Lab
          </label>
        </div>

        <AdminSubmitButton 
          idleLabel={experiment?.id ? "Update Experiment" : "Create Experiment"} 
          pendingLabel="Saving..." 
        />
      </div>
    </form>
  );
}
