import { z } from "zod";

export const journeySchema = z.object({
  year: z.number().int().min(1900, "Year must be a valid number."),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  entry_type: z.enum([
    "work", 
    "education", 
    "achievement", 
    "milestone", 
    "competition", 
    "hackathon", 
    "certification"
  ]),
  organization: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  display_order: z.number().int().default(0)
});

export type JourneyInput = z.infer<typeof journeySchema>;
