"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseSchema, CourseInput } from "@/lib/validation/learning.schema";
import { saveCourseAction } from "@/lib/actions/admin-actions";
import { ImageUploader } from "./ImageUploader";
import { AdminSubmitButton } from "./AdminSubmitButton";
import { RichTextEditor } from "./RichTextEditor";

interface CourseFormProps {
  course?: CourseInput & { id: string };
}

const categories = ['IoT', 'AI', 'Cybersecurity', 'Web Development'];
const difficulties = ['beginner', 'intermediate', 'advanced'];

export function CourseForm({ course }: CourseFormProps) {
  const [thumbnail, setThumbnail] = useState<string>(course?.thumbnail || "");
  const [content, setContent] = useState<string>(course?.content || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseSchema) as any,
    defaultValues: {
      title: course?.title || "",
      slug: course?.slug || "",
      description: course?.description || "",
      content: course?.content || "",
      category: course?.category || "AI",
      difficulty: course?.difficulty || "beginner",
      duration: course?.duration || 60,
      thumbnail: course?.thumbnail || "",
      published: course?.published ?? false,
    },
  });

  return (
    <form action={saveCourseAction} className="space-y-6">
      {course?.id && <input type="hidden" name="id" value={course.id} />}
      <input type="hidden" name="thumbnail" value={thumbnail} />
      <input type="hidden" name="content" value={content} />

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              {...register("title")}
              placeholder="e.g. Introduction to AI"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug</label>
            <input
              {...register("slug")}
              placeholder="introduction-to-ai"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            {...register("description")}
            placeholder="Course description..."
            rows={3}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Content</label>
          <RichTextEditor content={content} onChange={setContent} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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

          <div className="space-y-1">
            <label className="text-sm font-medium">Duration (minutes)</label>
            <input
              {...register("duration", { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="60"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.duration && <p className="text-xs text-red-500">{errors.duration.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Thumbnail</label>
          <ImageUploader
            bucket="uploads"
            folder="courses"
            initialValue={thumbnail}
            onUploadComplete={setThumbnail}
            onRemove={() => setThumbnail("")}
            label="Course Thumbnail"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            {...register("published")}
            type="checkbox"
            id="published"
            className="rounded border-border/70"
          />
          <label htmlFor="published" className="text-sm font-medium">
            Publish Course
          </label>
        </div>
      </div>

      <AdminSubmitButton idleLabel={course ? "Update Course" : "Create Course"} />
    </form>
  );
}
