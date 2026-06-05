"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductInput, ProductFeatureInput } from "@/lib/validation/product.schema";
import { saveProductAction } from "@/lib/actions/admin-actions";
import { ImageUploader } from "./ImageUploader";
import { AdminSubmitButton } from "./AdminSubmitButton";
import { X, Plus } from "lucide-react";
import { Product, ProductFeature, ProductScreenshot } from "@/types/content";

interface ProductFormProps {
  product?: Product & { features?: ProductFeature[]; screenshots?: ProductScreenshot[] };
}

export function ProductForm({ product }: ProductFormProps) {
  const [coverImage, setCoverImage] = useState<string>(product?.cover_image || "");
  const [screenshots, setScreenshots] = useState<string[]>(
    product?.screenshots?.map(s => s.image_url) || []
  );
  const [features, setFeatures] = useState<ProductFeatureInput[]>(
    product?.features?.map(f => ({ title: f.title, description: f.description })) || []
  );

  const {
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      title: product?.title || "",
      slug: product?.slug || "",
      description: product?.description || "",
      category: product?.category || "",
      pricing_type: product?.pricing_type || "",
      overview: product?.overview || null,
      pricing_details: product?.pricing_details || null,
      demo_url: product?.demo_url || null,
      documentation_url: product?.documentation_url || null,
      cover_image: product?.cover_image || null,
      featured: product?.featured ?? false,
      published: product?.published ?? false,
    },
  });

  const addFeature = () => {
    setFeatures([...features, { title: "", description: "" }]);
  };

  const updateFeature = (index: number, key: keyof ProductFeatureInput, value: string) => {
    setFeatures((current) => current.map((feature, idx) => idx === index ? { ...feature, [key]: value } : feature));
  };

  const removeFeature = (index: number) => {
    setFeatures((current) => current.filter((_, idx) => idx !== index));
  };

  return (
    <form action={saveProductAction} className="space-y-6">
      {product?.id && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="cover_image" value={coverImage} />
      <input type="hidden" name="screenshots" value={JSON.stringify(screenshots)} />
      <input type="hidden" name="features" value={JSON.stringify(features)} />

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              {...register("title")}
              placeholder="AI Resume Analyzer"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug</label>
            <input
              {...register("slug")}
              placeholder="ai-resume-analyzer"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Category</label>
            <input
              {...register("category")}
              placeholder="AI Product"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Pricing Type</label>
            <input
              {...register("pricing_type")}
              placeholder="Subscription / One-time"
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            {errors.pricing_type && <p className="text-xs text-red-500">{errors.pricing_type.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Short Description</label>
          <textarea
            {...register("description")}
            rows={2}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <ImageUploader
          bucket="projects"
          folder="product-covers"
          initialValue={coverImage}
          onUploadComplete={(url) => setCoverImage(url)}
          onRemove={() => setCoverImage("")}
          label="Cover Image"
        />

        <div className="space-y-1">
          <label className="text-sm font-medium">Overview</label>
          <textarea
            {...register("overview")}
            rows={3}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Pricing Details</label>
          <textarea
            {...register("pricing_details")}
            rows={3}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Demo URL</label>
            <input
              {...register("demo_url")}
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Documentation URL</label>
            <input
              {...register("documentation_url")}
              className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Screenshots</p>
              <p className="text-xs text-muted">Add URLs for product visual gallery.</p>
            </div>
            <button
              type="button"
              onClick={() => setScreenshots([...screenshots, ""])}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary"
            >
              <Plus className="h-4 w-4" /> Add Screenshot
            </button>
          </div>
          <div className="space-y-3">
            {screenshots.map((screenshot, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={screenshot}
                  onChange={(event) => {
                    const next = [...screenshots];
                    next[index] = event.target.value;
                    setScreenshots(next);
                  }}
                  placeholder="https://example.com/screenshot.jpg"
                  className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setScreenshots((current) => current.filter((_, idx) => idx !== index))}
                  className="text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Product Features</p>
              <p className="text-xs text-muted">Add the measurable value your product delivers.</p>
            </div>
            <button
              type="button"
              onClick={addFeature}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary"
            >
              <Plus className="h-4 w-4" /> Add Feature
            </button>
          </div>
          <div className="space-y-4">
            {features.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/80 p-6 text-center text-sm text-muted">
                Add feature cards to showcase capabilities.
              </div>
            ) : (
              features.map((feature, index) => (
                <div key={index} className="rounded-2xl border border-border/70 bg-surface p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-sm font-medium">Title</label>
                      <input
                        value={feature.title}
                        onChange={(event) => updateFeature(index, "title", event.target.value)}
                        className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <button type="button" onClick={() => removeFeature(index)} className="text-red-500 mt-6">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 space-y-1">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={feature.description}
                      onChange={(event) => updateFeature(index, "description", event.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-border/70 bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 rounded-2xl border border-border/50 bg-muted/20 p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register("published")} className="h-4 w-4 rounded border-gray-300" />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register("featured")} className="h-4 w-4 rounded border-gray-300" />
            Featured
          </label>
        </div>

        <AdminSubmitButton
          idleLabel={product?.id ? "Update Product" : "Create Product"}
          pendingLabel="Saving..."
        />
      </div>
    </form>
  );
}
