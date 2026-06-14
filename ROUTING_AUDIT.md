# ROUTING AUDIT REPORT

## Objective
Eliminate route mismatches between `/project/[slug]` and `/projects/[slug]` by standardizing to `/projects/[slug]` as the canonical route.

## Current State

### Route Structure
- **EXISTS:** `src/app/project/[slug]/page.tsx` (old route - needs removal)
- **EXISTS:** `src/app/projects/page.tsx` (projects listing page - keep)
- **MISSING:** `src/app/projects/[slug]/page.tsx` (new canonical route - needs creation)

### Files Using `/project/` (INCORRECT - needs standardization)

1. **src/components/dashboard/RecentProjects.tsx**
   - Line 44: `href={`/project/${project.slug}`}`
   - **Action:** Change to `href={`/projects/${project.slug}`}`

2. **src/app/profile/page.tsx**
   - Line 239: `href={`/project/${featuredProject.slug}`}`
   - Line 250: `href={`/project/${project.slug}`}`
   - **Action:** Change both to `href={`/projects/${slug}`}`

3. **src/app/profile/projects/page.tsx**
   - Line 222: `href={`/project/${mostViewed.slug}}`
   - Line 297: `href={`/project/${project.slug}}`
   - **Action:** Change both to `href={`/projects/${slug}}`

4. **src/app/project/[slug]/page.tsx**
   - Line 539: `href={`/project/${relatedProject.slug}}`
   - **Action:** Change to `href={`/projects/${relatedProject.slug}}`

5. **src/components/landing/PremiumProjectCard.tsx**
   - Line 29: `href={`/project/${project.slug}}`
   - **Action:** Change to `href={`/projects/${project.slug}}`

### Files Already Using `/projects/` (CORRECT - keep as is)

1. **src/lib/knowledge-ecosystem/recommendations.ts**
   - Line 64: `url: `/projects/${project.slug}``

2. **src/lib/knowledge-ecosystem/search.ts**
   - Line 49: `url: `/projects/${project.slug}``

3. **src/lib/knowledge-ecosystem/enhanced-recommendations.ts**
   - Line 79: `url: `/projects/${candidate.slug}``

4. **src/lib/knowledge-ecosystem/enhanced-search.ts**
   - Lines 145, 205, 248: `url: `/projects/${project.slug}``

5. **src/lib/ai-services.ts**
   - Line 651: `url: `/projects/${project.slug}``

6. **API Routes** (these are API routes, not page routes - keep as is)
   - `src/app/api/projects/[slug]/route.ts`
   - `src/app/api/projects/[slug]/contributors/route.ts`
   - `src/app/api/projects/[slug]/contributors/[userId]/route.ts`
   - `src/app/api/projects/[slug]/media/route.ts`
   - `src/app/api/projects/[slug]/media/[mediaId]/route.ts`

## Summary

**Files requiring updates:** 5 files
**Total href changes needed:** 7 instances
**New route to create:** `src/app/projects/[slug]/page.tsx`
**Old route to remove:** `src/app/project/[slug]/page.tsx`
**Redirect needed:** `/project/:slug` → `/projects/:slug`

## Next Steps

1. Create `src/app/projects/[slug]/page.tsx` with existing implementation
2. Update all href references from `/project/` to `/projects/`
3. Add permanent redirect in Next.js config
4. Remove old `src/app/project/[slug]/` directory
5. Verify hydration and build
6. Generate final report
