import { z } from "zod";

export const experimentSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  status: z.string().min(3),
  difficulty: z.string().optional(),
  category: z.string().optional(),
  tech_stack: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  cover_image: z.string().url().optional(),
  content: z.string().optional()
});

export type ExperimentInput = z.infer<typeof experimentSchema>;
