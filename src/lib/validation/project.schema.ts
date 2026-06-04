import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  content: z.string().nullable().default(null),
  overview: z.string().nullable().default(null),
  problem_statement: z.string().nullable().default(null),
  architecture: z.string().nullable().default(null),
  tech_stack: z.array(z.string()).default([]),
  github_url: z.string().nullable().default(null),
  demo_url: z.string().nullable().default(null),
  cover_image: z.string().nullable().default(null),
  screenshots: z.array(z.string()).default([]),
  lessons_learned: z.array(z.string()).nullable().default(null),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
});

export type ProjectInput = z.infer<typeof projectSchema>;
