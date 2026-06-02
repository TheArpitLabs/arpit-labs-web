# Supabase Setup for Arpit Labs

## Environment Variables

Copy `.env.example` to `.env.local` and provide your Supabase project credentials:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Database Schema

Use `supabase/schema.sql` to create the table structure for:

- `experiments`
- `lab_notes`
- `journey`
- `contact_messages`
- `newsletter_subscribers`

## Storage Buckets

Prepare these buckets:

- `experiments`
- `lab-notes`
- `uploads`
- `future-projects`

## Supabase Helpers

- `src/lib/supabase/client.ts` — client-side access.
- `src/lib/supabase/server.ts` — server-side access with service role.

## Recommended workflow

1. Create database tables using `supabase/schema.sql`.
2. Configure `.env.local`.
3. Use server actions to connect forms and repository queries.
