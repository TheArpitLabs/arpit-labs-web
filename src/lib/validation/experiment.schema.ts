import { z } from "zod";

export const experimentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable().default(null),
  tech_stack: z.array(z.string()).default([]),
  status: z.enum(["draft", "completed", "in-progress"]).default("draft"),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  cover_image: z.string().nullable().optional(),
});

export type ExperimentInput = z.infer<typeof experimentSchema>;
