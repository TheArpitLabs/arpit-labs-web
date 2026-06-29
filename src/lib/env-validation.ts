import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // Storage buckets
  SUPABASE_STORAGE_BUCKET_EXPERIMENTS: z.string().default('experiments'),
  SUPABASE_STORAGE_BUCKET_LAB_NOTES: z.string().default('lab-notes'),
  SUPABASE_STORAGE_BUCKET_UPLOADS: z.string().default('uploads'),
  SUPABASE_STORAGE_BUCKET_PROJECTS: z.string().default('future-projects'),

  // GitHub
  GITHUB_TOKEN: z.string().min(1, 'GitHub token is required').optional(),

  // Optional: Add more environment variables as needed
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Type for validated environment variables
type EnvVars = z.infer<typeof envSchema>;

// Validate and export environment variables
let validatedEnv: EnvVars;

try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors.map(e => e.path.join('.'));
    console.error('❌ Invalid environment variables:');
    error.errors.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    throw new Error(`Missing or invalid environment variables: ${missingVars.join(', ')}`);
  }
  throw error;
}

export const env = validatedEnv;

// Helper function to check if we're in development
export const isDevelopment = env.NODE_ENV === 'development';

// Helper function to check if we're in production
export const isProduction = env.NODE_ENV === 'production';

// Helper function to check if we're in test
export const isTest = env.NODE_ENV === 'test';
