import { z } from "zod";

// RESEARCH
export const researchPaperSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  abstract: z.string().min(1, "Abstract is required"),
  content: z.string().optional(),
  authors: z.array(z.string()).default([]),
  division: z.enum(["ai", "iot", "cybersecurity"]),
  tags: z.array(z.string()).default([]),
  published_at: z.string().optional().nullable(),
  is_featured: z.boolean().default(false),
});

export type ResearchPaperInput = z.infer<typeof researchPaperSchema>;

// UNIVERSITY
export const certificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  topic: z.enum(["AI", "IoT", "Cybersecurity", "Web Development", "Data Science"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  image_url: z.string().url().optional().nullable(),
});

export type CertificationInput = z.infer<typeof certificationSchema>;

// INNOVATION
export const startupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  logo_url: z.string().url().optional().nullable(),
  website_url: z.string().url().optional().nullable(),
  stage: z.string().default("ideation"),
});

export type StartupInput = z.infer<typeof startupSchema>;

// COMMUNITY
export const communityChapterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
});

export type CommunityChapterInput = z.infer<typeof communityChapterSchema>;

export const communityEventSchema = z.object({
  chapter_id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  event_type: z.enum(["meetup", "webinar", "workshop"]),
  location: z.string().optional().nullable(),
  start_time: z.string(),
  end_time: z.string().optional().nullable(),
  max_attendees: z.number().optional().nullable(),
});

export type CommunityEventInput = z.infer<typeof communityEventSchema>;
