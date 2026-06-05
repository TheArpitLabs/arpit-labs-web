"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { certificationSchema, CertificationInput } from "@/lib/validation/ecosystem.schema";
import { saveCertificationAction } from "@/lib/actions/ecosystem-actions";
import { AdminSubmitButton } from "./AdminSubmitButton";

interface CertificationFormProps {
  cert?: CertificationInput & { id: string };
}

export function CertificationForm({ cert }: CertificationFormProps) {
  const {
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      title: cert?.title || "",
      slug: cert?.slug || "",
      description: cert?.description || "",
      topic: cert?.topic || "AI",
      level: cert?.level || "intermediate",
      image_url: cert?.image_url || "",
    },
  });

  return (
    <form action={saveCertificationAction} className="space-y-6">
      {cert?.id && <input type="hidden" name="id" value={cert.id} />}

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
          <label className="text-sm font-medium">Topic</label>
          <select
            {...register("topic")}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="AI">AI</option>
            <option value="IoT">IoT</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="Web Development">Web Development</option>
            <option value="Data Science">Data Science</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Level</label>
          <select
            {...register("level")}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Image URL</label>
        <input
          {...register("image_url")}
          placeholder="https://..."
          className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <AdminSubmitButton 
        idleLabel={cert?.id ? "Update Certification" : "Create Certification"} 
        pendingLabel="Saving..." 
      />
    </form>
  );
}
