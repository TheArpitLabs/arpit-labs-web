import { z } from "zod";

export const labNoteSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters."),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters.").optional(),
  content: z.string().optional(),
  category: z.string().optional(),
  cover_image: z.string().url().optional(),
  tags: z.array(z.string()).optional().default([]),
  published: z.boolean().optional().default(false),
  reading_time: z.number().int().optional()
});

export type LabNoteInput = z.infer<typeof labNoteSchema>;
