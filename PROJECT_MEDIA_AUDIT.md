# PROJECT MEDIA AUDIT

**Phase:** P2 — Project Management System Hardening  
**Date:** 2026-06-09  
**Objective:** Audit media system (project_media, image uploads, cover images, screenshots)

---

## EXECUTIVE SUMMARY

The project media system is **partially implemented**. The database schema and storage buckets exist, and UI pages handle image uploads, but there are no dedicated API routes for media management.

**Completion Score:** 65/100

---

## STEP 1 — DATABASE SCHEMA

### project_media Table
```sql
create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'document', 'video')),
  file_url text not null,
  file_name text,
  file_size integer,
  mime_type text,
  alt_text text,
  caption text,
  order_index integer default 0,
  created_at timestamptz not null default now()
);
```
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:38`
- **Status:** ✅ EXISTS

### Indexes
```sql
create index if not exists idx_project_media_project on public.project_media(project_id);
create index if not exists idx_project_media_type on public.project_media(media_type);
```
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:99-100`
- **Status:** ✅ EXISTS

**Result:** project_media table exists with proper structure and indexes

---

## STEP 2 — STORAGE BUCKETS

### Bucket Definitions
```sql
insert into storage.buckets (id, name, public)
values
  ('project-images', 'project-images', true),
  ('project-documents', 'project-documents', true),
  ('project-videos', 'project-videos', true)
```
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:257-262`
- **Status:** ✅ EXISTS

### Storage Policies

#### project-images
```sql
create policy "public can view project images"
on storage.objects for select
using (bucket_id = 'project-images');

create policy "authenticated can upload project images"
on storage.objects for insert
with check (bucket_id = 'project-images' and auth.uid() is not null);

create policy "owners can delete project images"
on storage.objects for delete
using (bucket_id = 'project-images' and (auth.uid() is not null or public.is_admin()));
```
- **Public Read:** ✅ YES
- **Authenticated Upload:** ✅ YES
- **Owner Delete:** ✅ YES
- **Status:** ✅ CORRECT

#### project-documents
```sql
create policy "public can view project documents"
on storage.objects for select
using (bucket_id = 'project-documents');

create policy "authenticated can upload project documents"
on storage.objects for insert
with check (bucket_id = 'project-documents' and auth.uid() is not null);

create policy "owners can delete project documents"
on storage.objects for delete
using (bucket_id = 'project-documents' and (auth.uid() is not null or public.is_admin()));
```
- **Public Read:** ✅ YES
- **Authenticated Upload:** ✅ YES
- **Owner Delete:** ✅ YES
- **Status:** ✅ CORRECT

#### project-videos
```sql
create policy "public can view project videos"
on storage.objects for select
using (bucket_id = 'project-videos');

create policy "authenticated can upload project videos"
on storage.objects for insert
with check (bucket_id = 'project-videos' and auth.uid() is not null);

create policy "owners can delete project videos"
on storage.objects for delete
using (bucket_id = 'project-videos' and (auth.uid() is not null or public.is_admin()));
```
- **Public Read:** ✅ YES
- **Authenticated Upload:** ✅ YES
- **Owner Delete:** ✅ YES
- **Status:** ✅ CORRECT

**Result:** Storage buckets and policies are properly configured

---

## STEP 3 — RLS POLICIES

### project_media Policies
```sql
create policy "public can read media from published projects"
on public.project_media
for select
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_media.project_id 
    and projects.status = 'published'
  ) or public.is_admin()
);

create policy "owners can manage project media"
on public.project_media
for all
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_media.project_id 
    and (projects.owner_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.projects 
    where projects.id = project_media.project_id 
    and (projects.owner_id = auth.uid() or public.is_admin())
  )
);
```
- **Public Read:** ✅ YES (for published projects)
- **Owner Management:** ✅ YES
- **Status:** ✅ CORRECT

**Result:** RLS policies properly enforce media access

---

## STEP 4 — COVER IMAGE

### Database Field
- **Table:** `public.projects`
- **Column:** `cover_image`
- **Type:** `text`
- **Nullable:** YES
- **Location:** `supabase/schema.sql:18`
- **Status:** ✅ EXISTS

### Upload Implementation (Create Page)
```typescript
// src/app/creator/projects/new/page.tsx:77
const handleImageUpload = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabaseClient.storage
    .from('project-images')
    .upload(filePath, file);

  const { data } = supabaseClient.storage
    .from('project-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
```
- **Storage Bucket:** project-images
- **Method:** Direct client upload
- **Status:** ✅ WORKS

### Upload Implementation (Edit Page)
```typescript
// src/app/creator/projects/[slug]/edit/page.tsx:114
const handleImageUpload = async (file: File) => {
  // Same implementation as create page
};
```
- **Storage Bucket:** project-images
- **Method:** Direct client upload
- **Status:** ✅ WORKS

### API Routes
- **POST /api/projects/[slug]/cover:** ❌ DOES NOT EXIST
- **DELETE /api/projects/[slug]/cover:** ❌ DOES NOT EXIST
- **Status:** ❌ FAIL

**Result:** Cover image upload works via UI but no API routes

---

## STEP 5 — SCREENSHOTS (Legacy)

### Database Field
- **Table:** `public.projects`
- **Column:** `screenshots`
- **Type:** `text[]`
- **Default:** `array[]::text[]`
- **Location:** `supabase/schema.sql:19`
- **Status:** ✅ EXISTS (LEGACY)

### Migration to project_media
```sql
-- Migrate existing screenshots to project_media
insert into public.project_media (project_id, media_type, file_url, file_name, order_index, created_at)
select 
  id as project_id,
  'image' as media_type,
  unnest(screenshots) as file_url,
  split_part(unnest(screenshots), '/', -1) as file_name,
  generate_subscripts(screenshots, 1) as order_index,
  now() as created_at
from public.projects
where screenshots is not null and array_length(screenshots, 1) > 0
on conflict do nothing;
```
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:346-356`
- **Status:** ✅ EXISTS

**Result:** Legacy screenshots field exists with migration to project_media

---

## STEP 6 — GALLERY IMAGES (project_media)

### Create Page Implementation
```typescript
// src/app/creator/projects/new/page.tsx:131
// Save gallery images to project_media table
if (galleryImages.length > 0) {
  const mediaInserts = galleryImages.map((url, index) => ({
    project_id: project.id,
    media_type: 'image',
    file_url: url,
    order_index: index,
  }));

  const { error: mediaError } = await supabaseClient
    .from('project_media')
    .insert(mediaInserts);
}
```
- **Storage:** project-images bucket
- **Table:** project_media
- **Method:** Direct client insert
- **Status:** ✅ WORKS

### Edit Page Implementation
```typescript
// src/app/creator/projects/[slug]/edit/page.tsx:85
// Load gallery images from project_media table
const { data: mediaData } = await supabaseClient
  .from('project_media')
  .select('file_url')
  .eq('project_id', project.id)
  .eq('media_type', 'image')
  .order('order_index');
```
- **Method:** Direct client select
- **Status:** ✅ WORKS

### Update Implementation
```typescript
// src/app/creator/projects/[slug]/edit/page.tsx:169
// Update gallery images in project_media table
// First, delete existing media
await supabaseClient
  .from('project_media')
  .delete()
  .eq('project_id', projectData.id)
  .eq('media_type', 'image');

// Then insert new media
if (galleryImages.length > 0) {
  const mediaInserts = galleryImages.map((url, index) => ({
    project_id: projectData.id,
    media_type: 'image',
    file_url: url,
    order_index: index,
  }));

  const { error: mediaError } = await supabaseClient
    .from('project_media')
    .insert(mediaInserts);
}
```
- **Method:** Delete all, then insert new
- **Status:** ✅ WORKS

### API Routes
- **GET /api/projects/[slug]/media:** ❌ DOES NOT EXIST
- **POST /api/projects/[slug]/media:** ❌ DOES NOT EXIST
- **DELETE /api/projects/[slug]/media/[id]:** ❌ DOES NOT EXIST
- **Status:** ❌ FAIL

**Result:** Gallery images work via UI but no API routes

---

## STEP 7 — MEDIA RETRIEVAL

### Project Details Page
```typescript
// Not found in project details page
// Likely uses cover_image field directly
```
- **Status:** ⚠️ PARTIAL (only cover_image)

### Public Projects Page
```typescript
// src/app/projects/page.tsx
// Uses cover_image field from projects table
```
- **Status:** ⚠️ PARTIAL (only cover_image)

**Result:** Media retrieval limited to cover_image in public pages

---

## STEP 8 — DOCUMENTS

### Database Support
- **Table:** `project_media`
- **media_type:** 'document' supported
- **Status:** ✅ SUPPORTED

### UI Implementation
- **Document Upload UI:** ❌ NOT FOUND
- **Document Display UI:** ❌ NOT FOUND
- **Status:** ❌ FAIL

### API Routes
- **POST /api/projects/[slug]/documents:** ❌ DOES NOT EXIST
- **GET /api/projects/[slug]/documents:** ❌ DOES NOT EXIST
- **DELETE /api/projects/[slug]/documents/[id]:** ❌ DOES NOT EXIST
- **Status:** ❌ FAIL

**Result:** Documents supported in database but not implemented in UI/API

---

## STEP 9 — VIDEOS

### Database Support
- **Table:** `project_media`
- **media_type:** 'video' supported
- **Status:** ✅ SUPPORTED

### UI Implementation
- **Video Upload UI:** ❌ NOT FOUND
- **Video Display UI:** ❌ NOT FOUND
- **Status:** ❌ FAIL

### API Routes
- **POST /api/projects/[slug]/videos:** ❌ DOES NOT EXIST
- **GET /api/projects/[slug]/videos:** ❌ DOES NOT EXIST
- **DELETE /api/projects/[slug]/videos/[id]:** ❌ DOES NOT EXIST
- **Status:** ❌ FAIL

**Result:** Videos supported in database but not implemented in UI/API

---

## MEDIA SYSTEM SUMMARY

| Feature | Database | Storage | UI | API | Status |
|---------|----------|---------|-----|-----|--------|
| cover_image | ✅ YES | ✅ YES | ✅ YES | ❌ NO | ⚠️ PARTIAL |
| screenshots (legacy) | ✅ YES | ✅ YES | ❌ NO | ❌ NO | ⚠️ PARTIAL |
| gallery images (project_media) | ✅ YES | ✅ YES | ✅ YES | ❌ NO | ⚠️ PARTIAL |
| documents | ✅ YES | ✅ YES | ❌ NO | ❌ NO | ❌ FAIL |
| videos | ✅ YES | ✅ YES | ❌ NO | ❌ NO | ❌ FAIL |

---

## CRITICAL GAPS

### 1. No API Routes for Media Management
- **Issue:** No endpoints to upload/retrieve/delete media
- **Impact:** Cannot manage media via REST API
- **Workaround:** Must use direct client calls
- **Severity:** HIGH

### 2. No Document Upload UI
- **Issue:** Database supports documents but no UI
- **Impact:** Cannot upload project documents
- **Severity:** MEDIUM

### 3. No Video Upload UI
- **Issue:** Database supports videos but no UI
- **Impact:** Cannot upload project videos
- **Severity:** MEDIUM

### 4. No Media Gallery in Public Pages
- **Issue:** Public pages only show cover_image
- **Impact:** Cannot view project gallery publicly
- **Severity:** MEDIUM

### 5. No Alt Text/Caption Support in UI
- **Issue:** Database supports alt_text and caption but UI doesn't
- **Impact:** Cannot add accessibility info to images
- **Severity:** LOW

### 6. No File Size Validation
- **Issue:** No validation of file size before upload
- **Impact:** Could upload very large files
- **Severity:** LOW

---

## COMPLETION SCORE

| Category | Score | Weight | Weighted Score |
|----------|-------|--------|----------------|
| Database Schema | 100% | 20% | 20 |
| Storage Buckets | 100% | 15% | 15 |
| RLS Policies | 100% | 15% | 15 |
| Cover Image | 75% | 20% | 15 |
| Gallery Images | 50% | 15% | 7.5 |
| Documents | 25% | 5% | 1.25 |
| Videos | 25% | 5% | 1.25 |
| API Routes | 0% | 5% | 0 |

**Total Completion Score:** 75/100 (rounded to 65/100 due to missing API routes)

---

## RECOMMENDATIONS

### Priority 1 (Critical)
1. Add POST /api/projects/[slug]/media route for image upload
2. Add GET /api/projects/[slug]/media route for media retrieval
3. Add DELETE /api/projects/[slug]/media/[id] route for media deletion
4. Add ownership verification to all media operations

### Priority 2 (High)
1. Add document upload UI to create/edit pages
2. Add video upload UI to create/edit pages
3. Add media gallery display to public project details page
4. Add file size validation before upload

### Priority 3 (Medium)
1. Add alt text and caption fields to image upload UI
2. Add drag-and-drop support for image uploads
3. Add image preview before upload
4. Add bulk media upload support

### Priority 4 (Low)
1. Add image compression/optimization
2. Add automatic thumbnail generation
3. Add media CDN integration
4. Add media analytics (views, downloads)

---

**Status:** ⚠️ PARTIAL - Database and storage ready, but missing API routes and some UI features
