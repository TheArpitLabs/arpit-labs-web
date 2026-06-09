# Media Workflow Audit

**Project:** Arpit Labs  
**Phase:** P4 - Creator Experience Optimization  
**Date:** 2026-06-09  
**Auditor:** Cascade

---

## Executive Summary

The media workflow provides basic upload, delete, and ordering capabilities but lacks critical features like image optimization, drag-and-drop reordering, alt text support, and proper error handling. The implementation uses destructive updates on save, which is inefficient and risky.

---

## System Overview

**Storage:** Supabase Storage (`project-images` bucket)  
**Database:** `project_media` table  
**Repository:** `/src/lib/repositories/media.repository.ts`  
**UI:** `/src/app/creator/projects/new/page.tsx` and `/src/app/creator/projects/[slug]/edit/page.tsx`

---

## Database Schema

### project_media Table

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | uuid | Yes | Primary key |
| project_id | uuid | Yes | Foreign key to projects |
| media_type | enum | Yes | 'image', 'document', 'video' |
| file_url | text | Yes | Public URL to file |
| file_name | text | No | Original filename |
| file_size | bigint | No | File size in bytes |
| mime_type | text | No | MIME type |
| alt_text | text | No | Alt text for accessibility |
| caption | text | No | Image caption |
| order_index | integer | Yes | Display order |
| created_at | timestamptz | Yes | Creation timestamp |

---

## Upload Workflow

### Cover Image Upload

**Location:** Both new and edit pages

**Flow:**
```
1. User selects file via file input
2. handleImageUpload(file) called
3. Extract file extension
4. Generate unique filename (timestamp + extension)
5. Upload to Supabase storage (project-images bucket)
6. Get public URL
7. Set state (coverImage)
8. Display preview
```

**Code:**
```typescript
const handleImageUpload = async (file: File) => {
  try {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('project-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabaseClient.storage
      .from('project-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    alert('Failed to upload image. Please try again.');
    return null;
  } finally {
    setUploading(false);
  }
};
```

**Issues:**
1. **No file size validation** - Could upload very large files
2. **No file type validation** - Only checks accept attribute on input
3. **No image compression** - Uploads original size
4. **No aspect ratio validation** - Could upload non-rectangular images
5. **No dimension validation** - No minimum/maximum size checks
6. **No duplicate detection** - Could upload same image multiple times
7. **No progress indication** - Only loading state
8. **No error recovery** - Alert on error, no retry

### Gallery Images Upload

**Location:** Both new and edit pages

**Flow:**
```
1. User selects file via file input
2. handleImageUpload(file) called (same function)
3. Upload to Supabase storage
4. Get public URL
5. Add to galleryImages array
6. Display in grid
```

**Issues:**
1. **No bulk upload** - One file at a time
2. **No drag-and-drop** - Must use file input
3. **No caption/alt text input** - Cannot add metadata
4. **No reordering UI** - Cannot change order
5. **Sequential uploads** - Slow for multiple images
6. **No upload limit** - Could upload unlimited images

---

## Replace Workflow

### Cover Image Replace

**Current Implementation:**
- User clicks remove button (X icon)
- Sets coverImage state to empty string
- User uploads new image
- New image replaces old one

**Issues:**
1. **No confirmation** - Immediate deletion
2. **No backup** - Cannot undo
3. **No storage cleanup** - Old file remains in storage
4. **No diff tracking** - Doesn't know if image changed

### Gallery Images Replace

**Current Implementation:**
- User clicks remove button on specific image
- Removes from galleryImages array by index
- User uploads new image
- New image added to array

**Issues:**
1. **No confirmation** - Immediate deletion
2. **No backup** - Cannot undo
3. **No storage cleanup** - Old file remains in storage
4. **No reordering** - Cannot change position

---

## Delete Workflow

### Cover Image Delete

**Current Implementation:**
```typescript
<button onClick={() => setCoverImage("")}>
  <X className="h-4 w-4" />
</button>
```

**Issues:**
1. **No confirmation dialog** - Immediate deletion
2. **No storage cleanup** - File remains in Supabase storage
3. **No undo** - Cannot restore
4. **No soft delete** - Permanent removal

### Gallery Images Delete

**Current Implementation:**
```typescript
onClick={() => {
  setGalleryImages(galleryImages.filter((_, idx) => idx !== i));
}}
```

**Issues:**
1. **No confirmation dialog** - Immediate deletion
2. **No storage cleanup** - File remains in Supabase storage
3. **No undo** - Cannot restore
4. **No bulk delete** - One at a time

---

## Cover Image Selection

### Current Implementation

**UI:**
- Single cover image field
- 32x32 thumbnail preview
- Remove button
- File input for upload

**Selection Logic:**
- First image uploaded becomes cover
- Can be replaced by uploading new image
- Can be removed by clicking X

**Issues:**
1. **No set as cover option** - Cannot select from gallery
2. **No cover from gallery** - Must upload separately
3. **No default cover** - No placeholder generation
4. **No cover templates** - Cannot use templates

---

## Screenshot Ordering

### Current Implementation

**Database:**
- `order_index` field in project_media table
- Set based on array position in galleryImages

**UI:**
- Images displayed in grid (4 columns)
- No drag-and-drop
- No move up/down buttons
- No reorder controls

**Save Logic:**
```typescript
const mediaInserts = galleryImages.map((url, index) => ({
  project_id: project.id,
  media_type: 'image',
  file_url: url,
  order_index: index,
}));
```

**Issues:**
1. **No reordering UI** - Cannot change order
2. **No drag-and-drop** - Modern expectation missing
3. **No move buttons** - No alternative to drag
4. **No visual feedback** - Cannot see order during edit
5. **Destructive update** - All media deleted and re-inserted on save

---

## API Analysis

### Media Repository

**Location:** `/src/lib/repositories/media.repository.ts`

**Available Methods:**

#### getMedia(projectId, mediaType?)
```typescript
async getMedia(projectId: string, mediaType?: 'image' | 'document' | 'video')
```
- Fetches media for a project
- Optional filter by media type
- Ordered by order_index (ascending), created_at (descending)

**Issues:**
- No pagination for large media sets
- No caching
- No error handling for missing project

#### addMedia(input)
```typescript
async addMedia(input: MediaInput)
```
- Adds single media item
- Returns created media with ID

**Issues:**
- No bulk add
- No duplicate detection
- No validation of file URL accessibility

#### removeMedia(mediaId)
```typescript
async removeMedia(mediaId: string)
```
- Removes media by ID
- Returns boolean

**Issues:**
- No storage cleanup
- No confirmation
- No soft delete

#### updateMedia(mediaId, updates)
```typescript
async updateMedia(mediaId: string, updates: Partial<MediaInput>)
```
- Updates media metadata
- Returns updated media

**Issues:**
- Not used in UI
- No validation of updates

#### reorderMedia(projectId, mediaItems)
```typescript
async reorderMedia(projectId: string, mediaItems: Array<{ id: string; order_index: number }>)
```
- Updates order_index for multiple media items
- Uses Promise.all for parallel updates

**Issues:**
- Not used in UI
- No validation of order uniqueness
- No atomic transaction

### Media API Route

**Location:** `/src/app/api/projects/[slug]/media/route.ts`

#### GET /api/projects/[slug]/media
- Lists media for a project
- Optional type filter
- Authentication not required for GET

**Issues:**
- No pagination
- No caching

#### POST /api/projects/[slug]/media
- Adds media to project
- Requires authentication (owner or admin)
- Validates media_type, file_url

**Issues:**
- No file upload endpoint
- No multipart/form-data support
- No validation of file URL

---

## Storage Analysis

### Supabase Storage Configuration

**Bucket:** `project-images`

**Current Usage:**
- No size limits configured
- No file type restrictions
- No CDN configuration
- No image optimization

**Issues:**
1. **No size limits** - Could fill storage
2. **No type restrictions** - Could upload non-images
3. **No CDN** - Slow image delivery
4. **No optimization** - Large images served as-is
5. **No expiration** - Files never auto-delete
6. **No versioning** - No backup of old versions

---

## Performance Issues

### Upload Performance

**Current:** Sequential uploads, no compression

**Issues:**
- Slow for multiple images
- No client-side resizing
- No parallel uploads
- No progress bars

**Recommendation:**
- Add client-side compression (browser-image-compression)
- Implement parallel uploads
- Add upload progress bars
- Add upload queue management

### Storage Costs

**Current:** No optimization, full-size images stored

**Issues:**
- Unnecessary storage costs
- Slow delivery
- Poor mobile experience

**Recommendation:**
- Implement image compression
- Generate multiple sizes (thumbnail, medium, large)
- Use responsive images
- Implement lazy loading

---

## Accessibility Issues

### Alt Text

**Current:** alt_text field exists in schema but not in UI

**Impact:**
- Images not accessible to screen readers
- SEO penalty
- Accessibility non-compliance

**Recommendation:** Add alt text input for all images

### Captions

**Current:** caption field exists in schema but not in UI

**Impact:**
- No image descriptions
- Poor user experience

**Recommendation:** Add caption input for gallery images

---

## Error Handling

### Current Error Handling

```typescript
try {
  // upload logic
} catch (error) {
  console.error('Error uploading image:', error);
  alert('Failed to upload image. Please try again.');
  return null;
}
```

**Issues:**
1. **Generic error message** - No specific feedback
2. **No retry logic** - Single attempt only
3. **No error classification** - Cannot distinguish error types
4. **No user guidance** - No help on how to fix
5. **No error logging** - Console only

**Recommendation:**
- Add specific error messages (file too large, invalid type, network error)
- Implement retry with exponential backoff
- Add error classification
- Add user guidance
- Add server-side error logging

---

## Security Issues

### File Validation

**Current:** Only HTML accept attribute

**Issues:**
1. **No server-side validation** - Client-side only
2. **No MIME type verification** - Could spoof extension
3. **No magic number check** - Could upload executables
4. **No virus scanning** - Security risk
5. **No file content sanitization** - Could embed malicious code

**Recommendation:**
- Add server-side file type validation
- Verify MIME type matches extension
- Check magic numbers
- Implement file size limits
- Add virus scanning for uploads

### URL Validation

**Current:** No validation of file URLs

**Issues:**
1. **No URL format validation** - Could accept malformed URLs
2. **No accessibility check** - Could store broken URLs
3. **No domain whitelist** - Could accept external URLs

**Recommendation:**
- Add URL format validation
- Verify URL accessibility on insert
- Add domain whitelist for external URLs

---

## Recommendations

### High Priority

1. **Add image optimization** - Compress images before upload
2. **Add file validation** - Server-side type and size validation
3. **Add drag-and-drop reordering** - Modern UI for screenshot ordering
4. **Add alt text input** - Accessibility requirement
5. **Fix destructive updates** - Use differential media updates

### Medium Priority

6. **Add storage cleanup** - Delete files when media removed
7. **Add bulk upload** - Support multiple file selection
8. **Add upload progress** - Show progress for each file
9. **Add confirmation dialogs** - Prevent accidental deletion
10. **Add cover from gallery** - Allow selecting cover from existing images

### Low Priority

11. **Add image templates** - Pre-designed cover images
12. **Add image editing** - Crop, rotate, filter
13. **Add versioning** - Keep old versions of images
14. **Add CDN integration** - Improve delivery speed
15. **Add watermarking** - Brand images automatically

---

## Maturity Score

**Current Score:** 5/10

**Breakdown:**
- Upload Functionality: 7/10 ✓ (basic upload works)
- Delete Functionality: 4/10 ✗ (no storage cleanup, no confirmation)
- Ordering: 2/10 ✗ (no reordering UI)
- Validation: 3/10 ✗ (client-side only)
- Accessibility: 2/10 ✗ (no alt text)
- Performance: 4/10 ✗ (no optimization)

**Primary Blockers:** No image optimization, no reordering UI, no storage cleanup, no alt text support.
