import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().optional(),
  overview: z.string().optional(),
  problem_statement: z.string().optional(),
  architecture: z.string().optional(),
  tech_stack: z.array(z.string()).optional().default([]),
  screenshots: z.array(z.string().url()).optional().default([]),
  lessons_learned: z.array(z.string()).optional().default([]),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).default([]),
  github_url: z.string().url().optional().or(z.literal("")),
  demo_url: z.string().url().optional().or(z.literal("")),
  cover_image: z.string().url().optional().or(z.literal("")),
  published: z.boolean().optional().default(false),
  featured: z.boolean().default(false),
});

export type ProjectInput = z.infer<typeof projectSchema>;
