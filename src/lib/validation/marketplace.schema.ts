import * as z from "zod";

export const marketplaceItemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category_id: z.string().uuid("Please select a category"),
  price: z.coerce.number().min(0, "Price must be at least 0"),
  currency: z.string().default("USD"),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  preview_image: z.string().url("Please provide a valid image URL").nullable().optional(),
  download_url: z.string().url("Please provide a valid download URL").nullable().optional(),
});

export type MarketplaceItemInput = z.infer<typeof marketplaceItemSchema>;
