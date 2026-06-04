import { z } from "zod";

export const labNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().nullable().default(null),
  content: z.string().min(1, "Content is required"),
  category: z.string().nullable().default(null),
  cover_image: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  reading_time: z.number().int().default(0),
});

export type LabNoteInput = z.infer<typeof labNoteSchema>;
