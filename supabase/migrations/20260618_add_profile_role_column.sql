-- Add role column to profiles table
-- Migration: 20260618_add_profile_role_column.sql
-- Description: Add role column to support admin, moderator, creator, user roles

-- Add role column with default 'user'
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' NOT NULL;

-- Add check constraint for valid roles
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'moderator', 'creator', 'user'));

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- Set admin role for the platform admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'arpitkumar0211@gmail.com';

-- Add comment to document the role column
COMMENT ON COLUMN profiles.role IS 'User role: admin, moderator, creator, or user';
