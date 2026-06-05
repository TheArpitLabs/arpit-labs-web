"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { marketplaceItemSchema, MarketplaceItemInput } from "@/lib/validation/marketplace.schema";
import { saveMarketplaceItemAction } from "@/lib/actions/marketplace-actions";
import { AdminSubmitButton } from "./AdminSubmitButton";
import { DollarSign, Tag, Image as ImageIcon, Link as LinkIcon } from "lucide-react";

interface MarketplaceItemFormProps {
  item?: MarketplaceItemInput & { id: string };
  categories: { id: string; name: string }[];
}

export function MarketplaceItemForm({ item, categories }: MarketplaceItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(marketplaceItemSchema) as any,
    defaultValues: {
      title: item?.title || "",
      slug: item?.slug || "",
      description: item?.description || "",
      category_id: item?.category_id || "",
      price: item?.price || 0,
      currency: item?.currency || "USD",
      featured: item?.featured || false,
      published: item?.published || false,
      preview_image: item?.preview_image || "",
      download_url: item?.download_url || "",
    },
  });

  return (
    <form action={saveMarketplaceItemAction} className="space-y-6">
      {item?.id && <input type="hidden" name="id" value={item.id} />}

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              {...register("title")}
              placeholder="Asset Name"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug</label>
            <input
              {...register("slug")}
              placeholder="asset-name"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Category</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <select
                {...register("category_id")}
                className="w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 py-2 text-sm outline-none focus:border-primary appearance-none"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.category_id && <p className="text-xs text-red-500">{errors.category_id.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Price</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="number"
                step="0.01"
                {...register("price")}
                className="w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Preview Image URL</label>
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              {...register("preview_image")}
              placeholder="https://..."
              className="w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          {errors.preview_image && <p className="text-xs text-red-500">{errors.preview_image.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Download URL (Product File)</label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              {...register("download_url")}
              placeholder="https://..."
              className="w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          {errors.download_url && <p className="text-xs text-red-500">{errors.download_url.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("published")} className="rounded border-border" />
            <span className="text-sm">Published</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("featured")} className="rounded border-border" />
            <span className="text-sm">Featured</span>
          </label>
        </div>

        <AdminSubmitButton 
          idleLabel={item?.id ? "Update Item" : "Create Item"} 
          pendingLabel="Saving..." 
        />
      </div>
    </form>
  );
}
