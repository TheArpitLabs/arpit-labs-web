# ADMIN API INVENTORY

## Overview
Complete inventory of all admin-related API endpoints in the Arpit Labs application.

## Admin-Specific Routes (/api/admin/*)

| Route | Method | File Path | Purpose | Auth Check |
|-------|--------|-----------|---------|------------|
| `/api/admin/journey/reorder` | POST | `src/app/api/admin/journey/reorder/route.ts` | Reorder journey timeline items | `requireAdmin()` ✅ |
| `/api/admin/memberships` | PATCH | `src/app/api/admin/memberships/route.ts` | Update membership plans | `getAdminUserFromRequest()` (commented out) ⚠️ DISABLED |

## Admin Dashboard Routes (/admin/*)

| Route | Method | File Path | Purpose | Auth Check |
|-------|--------|-----------|---------|------------|
| `/admin/(dashboard)/newsletter/export` | GET | `src/app/admin/(dashboard)/newsletter/export/route.ts` | Export newsletter subscribers as CSV | `requireAdmin()` ✅ |

## Routes with Admin Authorization Checks

| Route | Method | File Path | Purpose | Auth Check |
|-------|--------|-----------|---------|------------|
| `/api/community/[slug]` | GET | `src/app/api/community/[slug]/route.ts` | Get community post | User auth + admin override for delete ✅ |
| `/api/community/[slug]` | DELETE | `src/app/api/community/[slug]/route.ts` | Delete community post | User auth + admin override ✅ |

## Summary

- **Total admin-specific routes**: 2
- **Total admin dashboard routes**: 1
- **Routes with admin authorization**: 1 (with 2 methods)
- **Protected routes**: 3
- **Disabled routes**: 1 (memberships - payments temporarily disabled)

## Auth Methods Used

1. **`requireAdmin()`** - Checks for admin session via cookies, redirects to `/admin/login` if not authenticated
2. **`getAdminUserFromRequest()`** - Checks for admin session via Authorization header or cookies, returns null if not authenticated
3. **Admin override** - Allows admins to perform actions on behalf of other users (e.g., delete posts they don't own)

## Notes

- `/api/admin/memberships` is currently disabled (returns 501) due to payments being temporarily disabled
- The original implementation used `getAdminUserFromRequest()` which is properly secured
- All active admin routes use proper authentication checks
