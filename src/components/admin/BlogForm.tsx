"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { labNoteSchema, LabNoteInput } from "@/lib/validation/labnote.schema";
import { saveLabNoteAction } from "@/lib/actions/admin-actions";
import { ImageUploader } from "./ImageUploader";
import { RichTextEditor } from "./RichTextEditor";
import { AdminSubmitButton } from "./AdminSubmitButton";
import { X, Clock, Hash } from "lucide-react";

interface BlogFormProps {
  note?: LabNoteInput & { id: string };
}

export function BlogForm({ note }: BlogFormProps) {
  const [coverImage, setCoverImage] = useState<string>(note?.cover_image || "");
  const [content, setContent] = useState<string>(note?.content || "");
  const [tags, setTags] = useState<string[]>(note?.tags || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(labNoteSchema) as any,
    defaultValues: {
      title: note?.title || "",
      slug: note?.slug || "",
      excerpt: note?.excerpt || null,
      content: note?.content || "",
      category: note?.category || null,
      cover_image: note?.cover_image || null,
      tags: note?.tags || [],
      published: note?.published ?? false,
      reading_time: note?.reading_time ?? 0,
    },
  });

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <form action={saveLabNoteAction} className="space-y-6">
      {note?.id && <input type="hidden" name="id" value={note.id} />}
      <input type="hidden" name="cover_image" value={coverImage} />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="tags" value={tags.join(",")} />

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              {...register("title")}
              placeholder="Article title"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug</label>
            <input
              {...register("slug")}
              placeholder="article-slug"
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
              placeholder="e.g. Engineering, AI"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Reading Time (min)</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="number"
                {...register("reading_time", { valueAsNumber: true })}
                className="w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span key={i} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Hash className="h-3 w-3" />
                {tag}
                <button type="button" onClick={() => removeTag(i)}><X className="h-3 w-3" /></button>
              </span>
            ))}
            <input
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
              placeholder="Add tag..."
              className="rounded-full border border-border/70 bg-transparent px-3 py-1 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        <ImageUploader
          bucket="blog"
          folder="covers"
          initialValue={coverImage}
          onUploadComplete={(url) => setCoverImage(url)}
          onRemove={() => setCoverImage("")}
          label="Feature Image"
        />

        <div className="space-y-1">
          <label className="text-sm font-medium">Excerpt</label>
          <textarea
            {...register("excerpt")}
            rows={2}
            placeholder="Brief summary for cards..."
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
          {errors.excerpt && <p className="text-xs text-red-500">{errors.excerpt.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Content</label>
          <RichTextEditor content={content} onChange={setContent} />
          {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
        </div>

        <div className="flex items-center gap-6 rounded-2xl border border-border/50 bg-muted/20 p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register("published")} className="h-4 w-4 rounded border-gray-300" />
            Publish immediately
          </label>
        </div>

        <AdminSubmitButton 
          idleLabel={note?.id ? "Update Article" : "Create Article"} 
          pendingLabel="Publishing..." 
        />
      </div>
    </form>
  );
}
