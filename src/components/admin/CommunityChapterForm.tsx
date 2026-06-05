"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { communityChapterSchema, CommunityChapterInput } from "@/lib/validation/ecosystem.schema";
import { saveCommunityChapterAction } from "@/lib/actions/ecosystem-actions";
import { AdminSubmitButton } from "./AdminSubmitButton";
import { Globe } from "lucide-react";

interface CommunityChapterFormProps {
  chapter?: CommunityChapterInput & { id: string };
}

export function CommunityChapterForm({ chapter }: CommunityChapterFormProps) {
  const {
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(communityChapterSchema),
    defaultValues: {
      name: chapter?.name || "",
      country: chapter?.country || "",
      city: chapter?.city || "",
    },
  });

  return (
    <form action={saveCommunityChapterAction} className="space-y-6">
      {chapter?.id && <input type="hidden" name="id" value={chapter.id} />}

      <div className="space-y-1">
        <label className="text-sm font-medium">Chapter Name</label>
        <input
          {...register("name")}
          placeholder="e.g. Delhi Chapter, London AI Group"
          className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Country</label>
          <input
            {...register("country")}
            placeholder="India"
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
          {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">City (Optional)</label>
          <input
            {...register("city")}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <AdminSubmitButton 
        idleLabel={chapter?.id ? "Update Chapter" : "Create Chapter"} 
        pendingLabel="Saving..." 
      />
    </form>
  );
}
