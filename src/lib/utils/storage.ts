export const storageBuckets = {
  experiments: process.env.SUPABASE_STORAGE_BUCKET_EXPERIMENTS ?? "experiments",
  blog: process.env.SUPABASE_STORAGE_BUCKET_BLOG ?? "blog",
  uploads: process.env.SUPABASE_STORAGE_BUCKET_UPLOADS ?? "uploads",
  projects: process.env.SUPABASE_STORAGE_BUCKET_PROJECTS ?? "projects"
};

export function getStoragePath(bucket: keyof typeof storageBuckets, key: string) {
  return `${storageBuckets[bucket]}/${key}`;
}
