export const storageBuckets = {
  experiments: process.env.SUPABASE_STORAGE_BUCKET_EXPERIMENTS ?? "experiments",
  labNotes: process.env.SUPABASE_STORAGE_BUCKET_LAB_NOTES ?? "lab-notes",
  uploads: process.env.SUPABASE_STORAGE_BUCKET_UPLOADS ?? "uploads",
  futureProjects: process.env.SUPABASE_STORAGE_BUCKET_PROJECTS ?? "future-projects"
};

export function getStoragePath(bucket: keyof typeof storageBuckets, key: string) {
  return `${storageBuckets[bucket]}/${key}`;
}
