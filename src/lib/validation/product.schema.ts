import { z } from "zod";

export const productFeatureSchema = z.object({
  title: z.string().min(1, "Feature title is required"),
  description: z.string().min(1, "Feature description is required"),
});

export const productScreenshotSchema = z.object({
  image_url: z.string().url("Must be a valid URL"),
  sort_order: z.number().default(0),
});

export const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  overview: z.string().nullable().default(null),
  category: z.string().min(1, "Category is required"),
  pricing_type: z.string().min(1, "Pricing type is required"),
  pricing_details: z.string().nullable().default(null),
  demo_url: z.string().nullable().default(null),
  documentation_url: z.string().nullable().default(null),
  cover_image: z.string().nullable().default(null),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductFeatureInput = z.infer<typeof productFeatureSchema>;
export type ProductScreenshotInput = z.infer<typeof productScreenshotSchema>;
