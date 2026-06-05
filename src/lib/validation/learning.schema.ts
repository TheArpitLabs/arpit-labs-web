import { z } from 'zod';

export const courseSchema = z.object({
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(1, 'Description is required').min(10, 'Description must be at least 10 characters'),
  content: z.string().optional().nullable(),
  category: z.enum(['IoT', 'AI', 'Cybersecurity', 'Web Development']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  thumbnail: z.string().optional().nullable(),
  published: z.boolean().default(false),
});

export type CourseInput = z.infer<typeof courseSchema>;

export const courseModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
  content: z.string().min(1, 'Content is required'),
  order_index: z.number().min(0, 'Order index must be 0 or greater'),
});

export type CourseModuleInput = z.infer<typeof courseModuleSchema>;

export const labSchema = z.object({
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(1, 'Description is required').min(10, 'Description must be at least 10 characters'),
  instructions: z.string().min(1, 'Instructions are required').min(20, 'Instructions must be at least 20 characters'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.enum(['IoT', 'AI', 'Cybersecurity', 'Web Development']),
  published: z.boolean().default(false),
});

export type LabInput = z.infer<typeof labSchema>;

export const roadmapSchema = z.object({
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(1, 'Description is required').min(10, 'Description must be at least 10 characters'),
  category: z.enum(['IoT', 'AI', 'Cybersecurity', 'Web Development']),
  content: z.string().min(1, 'Content is required').min(20, 'Content must be at least 20 characters'),
  published: z.boolean().default(false),
});

export type RoadmapInput = z.infer<typeof roadmapSchema>;
