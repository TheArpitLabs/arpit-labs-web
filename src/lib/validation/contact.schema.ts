import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(2, "Please provide your name."),
  email: z.string().email("Please provide a valid email address."),
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  message: z.string().min(20, "Message must be at least 20 characters.")
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
