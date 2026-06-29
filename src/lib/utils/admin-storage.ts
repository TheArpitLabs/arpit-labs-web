"use server";

import { randomUUID } from "crypto";
import { supabaseServer } from "@/lib/supabase/server";
import { storageBuckets } from "@/lib/utils/storage";

type BucketName = keyof typeof storageBuckets;

export async function uploadFileToBucket(bucket: BucketName, folder: string, file: File) {
  if (!file || file.size === 0) {
    return null;
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${folder}/${randomUUID()}.${extension}`;

  const { error } = await supabaseServer.storage
    .from(storageBuckets[bucket])
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabaseServer.storage.from(storageBuckets[bucket]).getPublicUrl(path);
  return data.publicUrl;
}
