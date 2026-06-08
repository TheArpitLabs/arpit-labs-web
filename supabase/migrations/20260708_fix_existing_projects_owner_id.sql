-- Fix: Set owner_id for existing projects
-- This migration ensures existing projects have an owner_id set
-- so they can be accessed via the RLS policy (auth.uid() = owner_id)

-- For existing projects without an owner_id, set it to the first admin user
-- This is a temporary fix - in production, you should manually assign the correct owner

update public.projects
set owner_id = (
  select id 
  from public.profiles 
  limit 1
)
where owner_id is null;

-- Alternative: If you want to assign to a specific user, uncomment and use:
-- update public.projects
-- set owner_id = 'YOUR_USER_UUID_HERE'
-- where owner_id is null;
