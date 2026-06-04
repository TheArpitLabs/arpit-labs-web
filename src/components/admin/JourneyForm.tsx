"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { journeySchema, JourneyInput } from "@/lib/validation/journey.schema";
import { saveJourneyEntryAction } from "@/lib/actions/admin-actions";
import { AdminSubmitButton } from "./AdminSubmitButton";
import { MapPin, Building2 } from "lucide-react";

interface JourneyFormProps {
  entry?: JourneyInput & { id: string };
}

export function JourneyForm({ entry }: JourneyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(journeySchema) as any,
    defaultValues: {
      year: entry?.year || new Date().getFullYear(),
      title: entry?.title || "",
      description: entry?.description || "",
      entry_type: entry?.entry_type || "work",
      organization: entry?.organization || null,
      location: entry?.location || null,
      icon: entry?.icon || null,
      display_order: entry?.display_order ?? 0,
    },
  });

  return (
    <form action={saveJourneyEntryAction} className="space-y-6">
      {entry?.id && <input type="hidden" name="id" value={entry.id} />}

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              {...register("title")}
              placeholder="Position or Achievement"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Year</label>
            <input
              type="number"
              {...register("year", { valueAsNumber: true })}
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.year && <p className="text-xs text-red-500">{errors.year.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Type</label>
            <select
              {...register("entry_type")}
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="work">Work Experience</option>
              <option value="education">Education</option>
              <option value="achievement">Achievement</option>
              <option value="competition">Competition</option>
              <option value="hackathon">Hackathon</option>
              <option value="certification">Certification</option>
              <option value="milestone">Milestone</option>
            </select>
            {errors.entry_type && <p className="text-xs text-red-500">{errors.entry_type.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Icon</label>
            <select
              {...register("icon")}
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="briefcase">Briefcase (Work)</option>
              <option value="graduation-cap">Graduation Cap (Edu)</option>
              <option value="trophy">Trophy (Competition/Award)</option>
              <option value="sparkles">Sparkles (Hackathon)</option>
              <option value="award">Award (Certification)</option>
              <option value="milestone">Milestone (Flag)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Organization</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                {...register("organization")}
                className="w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                {...register("location")}
                className="w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <AdminSubmitButton 
          idleLabel={entry?.id ? "Update Entry" : "Add to Timeline"} 
          pendingLabel="Saving..." 
        />
      </div>
    </form>
  );
}
