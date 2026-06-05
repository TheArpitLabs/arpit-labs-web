"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadFileToBucket } from "@/lib/admin-storage";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  bucket: "projects" | "blog" | "experiments" | "uploads";
  folder: string;
  initialValue?: string;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
  label?: string;
}

export function ImageUploader({
  bucket,
  folder,
  initialValue,
  onUploadComplete,
  onRemove,
  label = "Image"
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | undefined>(initialValue);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const url = await uploadFileToBucket(bucket, folder, file);
      if (url) {
        setPreview(url);
        onUploadComplete(url);
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      {preview ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
          <Image src={preview} alt="Preview" fill className="object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/70 bg-muted/10 transition hover:border-primary/50 hover:bg-muted/20"
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted transition group-hover:text-primary">
              <Upload className="h-8 w-8" />
              <p className="text-xs font-medium">Click to upload or drag & drop</p>
              <p className="text-[10px]">PNG, JPG or WebP (max. 5MB)</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={onFileChange}
            disabled={isUploading}
          />
        </div>
      )}
      
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
