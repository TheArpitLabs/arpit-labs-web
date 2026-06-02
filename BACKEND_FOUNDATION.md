# Arpit Labs Backend Foundation

This backend foundation is built to support the future architecture of Arpit Labs.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Supabase
- PostgreSQL
- Zod
- React Hook Form
- Server Actions

## Structure

- `src/lib/supabase` — client and server Supabase helpers
- `src/lib/repositories` — data access repositories for each content model
- `src/lib/validation` — Zod schemas for inputs and backend forms
- `src/lib/actions` — server actions for form submission and query access
- `src/lib/logger.ts` — centralized logging utility
- `src/lib/errors.ts` — error handling utilities
- `src/lib/seo.ts` — metadata utilities for SEO support
- `src/types/content.ts` — centralized content type definitions
- `supabase/schema.sql` — database schema definitions for Supabase/PostgreSQL

## Backend capabilities

- Experiments
- Lab Notes
- Journey Timeline
- Contact Messages
- Newsletter Subscribers
- Future Projects / Case Studies / Documentation

## Notes

- No frontend redesign was made.
- No dashboard, project detail, or CMS UI was added.
- This foundation focuses on separation of concerns and future scalability.
