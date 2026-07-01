-- Add missing columns to projects table
-- This migration adds columns that are expected by the seed script but missing from the database

alter table if exists public.projects
  add column if not exists overview text,
  add column if not exists problem_statement text,
  add column if not exists architecture text,
  add column if not exists lessons_learned text;

-- Update existing records to have default values if needed
update public.projects
set 
  overview = coalesce(overview, description),
  problem_statement = coalesce(problem_statement, ''),
  architecture = coalesce(architecture, ''),
  lessons_learned = coalesce(lessons_learned, '')
where overview is null or problem_statement is null or architecture is null or lessons_learned is null;
