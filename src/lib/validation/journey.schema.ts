import { z } from "zod";

export const journeySchema = z.object({
  year: z.number().int().min(2000, "Year must be a valid number."),
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  icon: z.string().optional(),
  display_order: z.number().int().optional().default(0)
});

export type JourneyInput = z.infer<typeof journeySchema>;
