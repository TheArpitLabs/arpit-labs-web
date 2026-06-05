"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { communityEventSchema, CommunityEventInput } from "@/lib/validation/ecosystem.schema";
import { saveCommunityEventAction } from "@/lib/actions/ecosystem-actions";
import { AdminSubmitButton } from "./AdminSubmitButton";

interface CommunityEventFormProps {
  event?: CommunityEventInput & { id: string };
  chapters: { id: string; name: string }[];
}

export function CommunityEventForm({ event, chapters }: CommunityEventFormProps) {
  const {
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(communityEventSchema),
    defaultValues: {
      chapter_id: event?.chapter_id || "",
      title: event?.title || "",
      description: event?.description || "",
      event_type: event?.event_type || "meetup",
      location: event?.location || "",
      start_time: event?.start_time || new Date().toISOString().slice(0, 16),
      end_time: event?.end_time || "",
      max_attendees: event?.max_attendees || null,
    },
  });

  return (
    <form action={saveCommunityEventAction} className="space-y-6">
      {event?.id && <input type="hidden" name="id" value={event.id} />}

      <div className="space-y-1">
        <label className="text-sm font-medium">Chapter</label>
        <select
          {...register("chapter_id")}
          className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">Select a chapter</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.chapter_id && <p className="text-xs text-red-500">{errors.chapter_id.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Event Title</label>
        <input
          {...register("title")}
          className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Event Type</label>
          <select
            {...register("event_type")}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="meetup">Meetup</option>
            <option value="webinar">Webinar</option>
            <option value="workshop">Workshop</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Max Attendees</label>
          <input
            type="number"
            {...register("max_attendees", { valueAsNumber: true })}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Start Time</label>
          <input
            type="datetime-local"
            {...register("start_time")}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">End Time (Optional)</label>
          <input
            type="datetime-local"
            {...register("end_time")}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Location / Link</label>
        <input
          {...register("location")}
          className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <AdminSubmitButton 
        idleLabel={event?.id ? "Update Event" : "Schedule Event"} 
        pendingLabel="Scheduling..." 
      />
    </form>
  );
}
