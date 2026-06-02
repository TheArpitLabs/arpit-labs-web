import { z } from "zod";

export const newsletterSchema = z.object({
  email: z.string().email("Please provide a valid email address.")
});

export type NewsletterFormInput = z.infer<typeof newsletterSchema>;
