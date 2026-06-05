import { z } from "zod";

export const hackathonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().min(1, "Description is required"),
  organizer: z.string().min(1, "Organizer is required"),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  registration_deadline: z.string().optional().nullable(),
  status: z.string().min(1, "Status is required"),
});

export const hackathonTeamSchema = z.object({
  hackathon_id: z.string().min(1, "Hackathon is required"),
  team_name: z.string().min(1, "Team name is required"),
  leader_id: z.string().min(1, "Leader is required"),
  description: z.string().optional().nullable(),
});

export const hackathonSubmissionSchema = z.object({
  hackathon_id: z.string().min(1, "Hackathon is required"),
  team_id: z.string().min(1, "Team is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  github_url: z.string().url("Please provide a valid URL").optional().nullable(),
  demo_url: z.string().url("Please provide a valid URL").optional().nullable(),
  documentation_url: z.string().optional().nullable(),
  score: z.number().int().optional(),
});

export type HackathonInput = z.infer<typeof hackathonSchema>;
export type HackathonTeamInput = z.infer<typeof hackathonTeamSchema>;
export type HackathonSubmissionInput = z.infer<typeof hackathonSubmissionSchema>;
