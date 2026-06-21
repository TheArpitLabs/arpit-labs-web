# Admin Authentication Audit Report

**Date:** 2026-06-18  
**Issue:** Admin user (arpitkumar0211@gmail.com) redirects to /dashboard instead of /admin after login  
**Status:** ✅ Fixed

---

## Problem Statement

The platform administrator (arpitkumar0211@gmail.com) was being redirected to `/dashboard` instead of `/admin` after login, despite having admin privileges. The system relied on environment variable-based admin detection instead of database-driven role management.

---

## Files Modified

### Database Schema
- **supabase/migrations/20260618_add_profile_role_column.sql** (NEW)
  - Added `role` column to `profiles` table
  - Set default value to 'user'
  - Added check constraint for valid roles (admin, moderator, creator, user)
  - Created index on role for performance
  - Migrated arpitkumar0211@gmail.com to role='admin'

### Authentication Core
- **src/lib/auth/admin.ts** (NEW)
  - Central admin helper module
  - Role hierarchy: admin (4) > moderator (3) > creator (2) > user (1)
  - Functions: getUserRole, isAdmin, isModerator, isCreator, hasRoleLevel, setUserRole, getUsersByRole

- **src/lib/auth.ts** (MODIFIED)
  - Imported getUserRole from admin helper
  - Updated hasAdminRole to async function
  - Primary check: profiles.role
  - Fallback: app_metadata.role, user_metadata.role, ADMIN_EMAILS env var

### Authentication Flow
- **src/app/api/auth/session/route.ts** (MODIFIED)
  - Updated hasAdminRole calls to await
  - Returns redirectTo: "/admin" for admin, "/dashboard" for users

- **src/app/auth/callback/route.ts** (MODIFIED)
  - Updated hasAdminRole calls to await
  - OAuth callback redirects to "/admin" for admin, "/dashboard" for users

- **src/lib/actions/admin-actions.ts** (MODIFIED)
  - Updated adminSignIn to await hasAdminRole
  - Prevents non-admin users from accessing admin login

### Middleware
- **src/middleware.ts** (MODIFIED)
  - Changed from sync to async function
  - Added role verification for /admin routes (not just token presence)
  - Added redirect: admin users on /dashboard → /admin
  - Non-admin users attempting /admin → /dashboard

---

## Redirect Flow

### Login Flow (Password)
```
User submits credentials
  ↓
POST /api/auth/session
  ↓
Set user session cookies
  ↓
Check hasAdminRole(user) → profiles.role
  ↓
If role = 'admin':
  - Set admin session cookies
  - Return redirectTo: "/admin"
Else:
  - Return redirectTo: "/dashboard"
  ↓
Client redirects to appropriate dashboard
```

### Login Flow (OAuth)
```
User initiates OAuth (Google/GitHub)
  ↓
Redirect to /auth/callback
  ↓
Exchange code for session
  ↓
Set user session cookies
  ↓
Check hasAdminRole(user) → profiles.role
  ↓
If role = 'admin':
  - Set admin session cookies
  - Redirect to "/admin"
Else:
  - Redirect to "/dashboard"
```

### Admin Login Flow
```
User submits admin credentials
  ↓
POST adminSignIn action
  ↓
Check hasAdminRole(user) → profiles.role
  ↓
If role != 'admin':
  - Redirect to /admin/login with error
Else:
  - Set admin session cookies
  - Redirect to /admin
```

---

## Middleware Flow

### Admin Route Protection (/admin/*)
```
Request to /admin/*
  ↓
Check admin access token
  ↓
If token missing:
  - Redirect to /admin/login?redirectTo=...
  ↓
Verify token and get user
  ↓
Check getUserRole(user.id)
  ↓
If role != 'admin':
  - Redirect to /dashboard
Else:
  - Allow access
```

### Dashboard Redirect Logic (/dashboard/*)
```
Request to /dashboard/*
  ↓
Check user access token
  ↓
If token present:
  - Verify token and get user
  - Check getUserRole(user.id)
  - If role = 'admin':
    - Redirect to /admin
  - Else:
    - Allow access
Else:
  - Allow access (will be handled by requireUser)
```

---

## Role Hierarchy

```
admin (4)
  ├── Can access /admin routes
  ├── Redirected to /admin after login
  ├── Blocked from /dashboard (redirected to /admin)
  └── Full platform management

moderator (3)
  ├── Can access /dashboard
  ├── Future: Content moderation features
  └── Limited admin features

creator (2)
  ├── Can access /dashboard
  ├── Future: Content creation features
  └── Standard user features

user (1)
  ├── Can access /dashboard
  ├── Standard user features
  └── No admin access
```

---

## Test Cases

### Test Case 1: Admin Login Redirect
**Given:** Admin user (arpitkumar0211@gmail.com) with role='admin'  
**When:** User logs in via password or OAuth  
**Then:** User is redirected to `/admin`  
**Status:** ✅ Implemented

### Test Case 2: User Login Redirect
**Given:** Regular user with role='user'  
**When:** User logs in via password or OAuth  
**Then:** User is redirected to `/dashboard`  
**Status:** ✅ Implemented

### Test Case 3: Admin Dashboard Redirect
**Given:** Admin user with role='admin'  
**When:** Admin visits `/dashboard`  
**Then:** Admin is redirected to `/admin`  
**Status:** ✅ Implemented

### Test Case 4: Non-Admin Route Protection
**Given:** Regular user with role='user'  
**When:** User attempts to access `/admin`  
**Then:** User is redirected to `/dashboard`  
**Status:** ✅ Implemented

### Test Case 5: Admin Route Protection
**Given:** Admin user with role='admin'  
**When:** Admin accesses `/admin`  
**Then:** Access is granted  
**Status:** ✅ Implemented

### Test Case 6: Admin Login Verification
**Given:** Regular user with role='user'  
**When:** User attempts to use admin login form  
**Then:** User is redirected to `/admin/login` with error  
**Status:** ✅ Implemented

### Test Case 7: Role Migration
**Given:** Existing admin email (arpitkumar0211@gmail.com)  
**When:** Migration runs  
**Then:** Profile role is set to 'admin'  
**Status:** ✅ Implemented

### Test Case 8: Backward Compatibility
**Given:** User with app_metadata.role='admin' but no profiles.role  
**When:** hasAdminRole is called  
**Then:** Returns true (fallback to app_metadata)  
**Status:** ✅ Implemented

---

## Success Criteria

✅ **Admin always lands on /admin** - Implemented via session API and OAuth callback  
✅ **Users always land on /dashboard** - Implemented via session API and OAuth callback  
✅ **Admin routes protected** - Middleware verifies role='admin' before allowing access  
✅ **Dashboard routes protected** - Middleware redirects admin users from /dashboard to /admin  
✅ **Future role system supported** - Role hierarchy and helper functions ready for moderator/creator roles  

---

## Deployment Instructions

1. **Run Database Migration**
   ```bash
   # Apply the migration to add role column and set admin role
   supabase db push
   ```

2. **Verify Migration**
   ```sql
   -- Check that role column exists
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'role';
   
   -- Verify admin role is set
   SELECT id, email, role FROM profiles WHERE email = 'arpitkumar0211@gmail.com';
   ```

3. **Test Admin Login**
   - Log out if currently logged in
   - Log in as arpitkumar0211@gmail.com
   - Verify redirect to `/admin`

4. **Test Dashboard Redirect**
   - As admin, manually navigate to `/dashboard`
   - Verify redirect to `/admin`

5. **Test Route Protection**
   - As regular user, attempt to access `/admin`
   - Verify redirect to `/dashboard`

---

## Future Enhancements

1. **Role Management UI**
   - Add admin panel to manage user roles
   - Bulk role assignments
   - Role change history

2. **Granular Permissions**
   - Feature-level permissions within roles
   - Custom role creation

3. **Audit Logging**
   - Log role changes
   - Log admin access attempts
   - Log permission denials

4. **Session Management**
   - Force logout on role change
   - Session invalidation on privilege escalation

---

## Notes

- The system maintains backward compatibility with existing admin detection methods (app_metadata, user_metadata, ADMIN_EMAILS env var)
- The profiles.role is now the primary source of truth for role determination
- Middleware is async to support database role checks
- Admin helper module provides reusable role checking functions for future features
