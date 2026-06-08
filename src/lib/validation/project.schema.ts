import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  project_type: z.enum(['software', 'hardware', 'research', 'opensource', 'hackathon', 'hybrid']),
  branch: z.string().nullable().default(null),
  domain: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
  technologies: z.record(z.array(z.string())).default({}),
  languages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  tools: z.record(z.array(z.string())).default({}),
  github_url: z.string().url().nullable().default(null),
  demo_url: z.string().url().nullable().default(null),
  documentation_url: z.string().url().nullable().default(null),
  video_url: z.string().url().nullable().default(null),
  cover_image: z.string().nullable().default(null),
  owner_id: z.string().uuid().nullable().default(null),
  organization_id: z.string().uuid().nullable().default(null),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  // Legacy fields for backward compatibility
  content: z.string().nullable().default(null),
  overview: z.string().nullable().default(null),
  problem_statement: z.string().nullable().default(null),
  architecture: z.string().nullable().default(null),
  tech_stack: z.array(z.string()).default([]),
  screenshots: z.array(z.string()).default([]),
  lessons_learned: z.array(z.string()).nullable().default(null),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
});

export type ProjectInput = z.infer<typeof projectSchema>;
