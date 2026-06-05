"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { startupSchema, StartupInput } from "@/lib/validation/ecosystem.schema";
import { saveStartupAction } from "@/lib/actions/ecosystem-actions";
import { AdminSubmitButton } from "./AdminSubmitButton";
import { Rocket, Globe, Link as LinkIcon } from "lucide-react";

interface StartupFormProps {
  startup?: StartupInput & { id: string };
}

export function StartupForm({ startup }: StartupFormProps) {
  const {
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(startupSchema),
    defaultValues: {
      name: startup?.name || "",
      slug: startup?.slug || "",
      description: startup?.description || "",
      logo_url: startup?.logo_url || "",
      website_url: startup?.website_url || "",
      stage: startup?.stage || "ideation",
    },
  });

  return (
    <form action={saveStartupAction} className="space-y-6">
      {startup?.id && <input type="hidden" name="id" value={startup.id} />}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Startup Name</label>
          <input
            {...register("name")}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
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

      <div className="space-y-1">
        <label className="text-sm font-medium">Stage</label>
        <select
          {...register("stage")}
          className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="ideation">Ideation</option>
          <option value="mvp">MVP</option>
          <option value="scaling">Scaling</option>
          <option value="exit">Exit</option>
        </select>
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Logo URL</label>
          <input
            {...register("logo_url")}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Website URL</label>
          <input
            {...register("website_url")}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <AdminSubmitButton 
        idleLabel={startup?.id ? "Update Startup" : "Register Startup"} 
        pendingLabel="Saving..." 
      />
    </form>
  );
}
