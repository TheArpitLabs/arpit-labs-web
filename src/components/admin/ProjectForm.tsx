"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, ProjectInput } from "@/lib/validation/project.schema";
import { saveProjectAction } from "@/lib/actions/admin-actions";
import { ImageUploader } from "./ImageUploader";
import { AdminSubmitButton } from "./AdminSubmitButton";
import { X, Plus } from "lucide-react";

interface ProjectFormProps {
  project?: ProjectInput & { id: string };
}

export function ProjectForm({ project }: ProjectFormProps) {
  const [coverImage, setCoverImage] = useState<string>(project?.cover_image || "");
  const [screenshots, setScreenshots] = useState<string[]>(project?.screenshots || []);
  const [techStack, setTechStack] = useState<string[]>(project?.tech_stack || []);
  const [tags, setTags] = useState<string[]>(project?.tags || []);
  const [lessons, setLessons] = useState<string[]>(project?.lessons_learned || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: {
      title: project?.title || "",
      slug: project?.slug || "",
      description: project?.description || "",
      category: project?.category || "",
      content: project?.content || null,
      overview: project?.overview || null,
      problem_statement: project?.problem_statement || null,
      architecture: project?.architecture || null,
      tech_stack: project?.tech_stack || [],
      github_url: project?.github_url || null,
      demo_url: project?.demo_url || null,
      cover_image: project?.cover_image || null,
      screenshots: project?.screenshots || [],
      lessons_learned: project?.lessons_learned || null,
      tags: project?.tags || [],
      featured: project?.featured ?? false,
      published: project?.published ?? false,
    },
  });

  const addItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (value && !list.includes(value)) {
      setList([...list, value]);
    }
  };

  const removeItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  return (
    <form action={saveProjectAction} className="space-y-6">
      {project?.id && <input type="hidden" name="id" value={project.id} />}
      <input type="hidden" name="cover_image" value={coverImage} />
      <input type="hidden" name="tech_stack" value={techStack.join(",")} />
      <input type="hidden" name="tags" value={tags.join(",")} />
      <input type="hidden" name="screenshots" value={screenshots.join(",")} />
      <input type="hidden" name="lessons_learned" value={lessons.join("|")} />

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              {...register("title")}
              placeholder="e.g. Nexus AI"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug</label>
            <input
              {...register("slug")}
              placeholder="nexus-ai"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Category</label>
            <input
              {...register("category")}
              placeholder="e.g. AI & ML, Web Platform"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Short Description</label>
            <textarea
              {...register("description")}
              rows={1}
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>
        </div>

        <ImageUploader
          bucket="projects"
          folder="covers"
          initialValue={coverImage}
          onUploadComplete={(url) => setCoverImage(url)}
          onRemove={() => setCoverImage("")}
          label="Cover Image"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">GitHub URL</label>
            <input
              {...register("github_url")}
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Demo URL</label>
            <input
              {...register("demo_url")}
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tech Stack</label>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech, i) => (
              <span key={i} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {tech}
                <button type="button" onClick={() => removeItem(techStack, setTechStack, i)}><X className="h-3 w-3" /></button>
              </span>
            ))}
            <input
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem(techStack, setTechStack, e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
              placeholder="Add tech..."
              className="rounded-full border border-border/70 bg-transparent px-3 py-1 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Problem Statement</label>
          <textarea
            {...register("problem_statement")}
            rows={3}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Architecture</label>
          <textarea
            {...register("architecture")}
            rows={3}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Lessons Learned</label>
          <div className="space-y-2">
            {lessons.map((lesson, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={lesson}
                  onChange={(e) => {
                    const newLessons = [...lessons];
                    newLessons[i] = e.target.value;
                    setLessons(newLessons);
                  }}
                  className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                />
                <button type="button" onClick={() => removeItem(lessons, setLessons, i)} className="text-red-500"><X className="h-4 w-4" /></button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLessons([...lessons, ""])}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Plus className="h-4 w-4" /> Add Lesson
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 rounded-2xl border border-border/50 bg-muted/20 p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register("published")} className="h-4 w-4 rounded border-gray-300" />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register("featured")} className="h-4 w-4 rounded border-gray-300" />
            Featured
          </label>
        </div>

        <AdminSubmitButton 
          idleLabel={project?.id ? "Update Project" : "Create Project"} 
          pendingLabel="Saving..." 
        />
      </div>
    </form>
  );
}
