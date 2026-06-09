# Project Editor Audit

**Project:** Arpit Labs  
**Phase:** P4 - Creator Experience Optimization  
**Date:** 2026-06-09  
**Auditor:** Cascade

---

## Executive Summary

The project editor provides basic field editing capabilities but has a critical gap: it does not support all fields that are displayed on the public project page. This creates a disconnect where creators cannot edit content that users see. Additionally, contributor management is missing entirely, and the technical stack editing requires manual JSON input.

---

## System Overview

**Location:** `/src/app/creator/projects/[slug]/edit/page.tsx`  
**Schema:** `/src/lib/validation/project.schema.ts`  
**Public Display:** `/src/app/projects/[slug]/page.tsx`

---

## Field Coverage Analysis

### Editor vs Public Display Mismatch

| Field | Schema | Editor | Public Page | Gap |
|-------|--------|--------|-------------|-----|
| **Basic Info** |
| title | ✓ | ✓ | ✓ | - |
| slug | ✓ | ✓ | ✓ | - |
| description | ✓ | ✓ | ✓ | - |
| project_type | ✓ | ✓ | ✓ | - |
| branch | ✓ | ✓ | ✓ | - |
| domain | ✓ | ✓ | ✓ | - |
| category | ✓ | ✓ | ✓ | - |
| **Rich Content** |
| overview | ✓ | ✗ | ✓ | **CRITICAL** |
| problem_statement | ✓ | ✗ | ✓ | **CRITICAL** |
| architecture | ✓ | ✗ | ✓ | **CRITICAL** |
| lessons_learned | ✓ | ✗ | ✓ | **CRITICAL** |
| **Technical Stack** |
| technologies | ✓ | ✓ | ✗ | Not used |
| languages | ✓ | ✓ | ✓ (fallback) | - |
| frameworks | ✓ | ✓ | ✗ | Not used |
| tools | ✓ | ✓ | ✗ | Not used |
| tech_stack (legacy) | ✓ | ✗ | ✓ | **CRITICAL** |
| **Links** |
| github_url | ✓ | ✓ | ✓ | - |
| demo_url | ✓ | ✓ | ✓ | - |
| documentation_url | ✓ | ✓ | ✓ | - |
| video_url | ✓ | ✓ | ✓ | - |
| **Media** |
| cover_image | ✓ | ✓ | ✓ | - |
| screenshots (legacy) | ✓ | ✗ | ✓ | **CRITICAL** |
| gallery_images | ✓ | ✓ | ✗ | Not used |
| **Tags** |
| tags (legacy) | ✓ | ✗ | ✓ | **CRITICAL** |
| **Status** |
| status | ✓ | ✓ | ✓ | - |
| featured | ✓ | ✓ | ✓ | - |
| **Contributors** |
| contributors | ✓ | ✗ | ✗ | No UI |

### Critical Gap Analysis

**The editor cannot edit 6 fields that are displayed on the public page:**

1. **overview** - Shown in "Overview" section on public page
2. **problem_statement** - Shown in "Problem Statement" section
3. **architecture** - Shown in "Architecture" section
4. **lessons_learned** - Shown in "Lessons Learned" section
5. **tech_stack** - Shown in "Tech Stack" section (fallback to tags)
6. **screenshots** - Shown in "Screenshots" section
7. **tags** - Shown in tags display

**Impact:** Creators can create projects but cannot edit the rich content that appears on the public page. The public page falls back to generic placeholder text for these fields.

---

## Supported Fields Detail

### Basic Information Section

**Fields:**
- title (text input)
- slug (text input)
- description (textarea)
- project_type (select: software, hardware, research, opensource, hackathon, hybrid)
- branch (text input)
- domain (text input)
- category (text input)

**Validation:** Zod schema validation
- title: required, min 1 char
- slug: required, min 1 char
- description: required, min 1 char
- project_type: required, enum
- branch: optional
- domain: optional
- category: optional

**UX Issues:**
- No slug auto-generation from title
- No character limits on description
- No help text for domain/category fields

### Technical Stack Section

**Languages (Tag Input)**
- Type: Array of strings
- UI: Badge-based tag input with Enter key
- Validation: Optional
- UX: Good - intuitive tag input

**Frameworks (Tag Input)**
- Type: Array of strings
- UI: Badge-based tag input with Enter key
- Validation: Optional
- UX: Good - intuitive tag input

**Technologies (JSON Textarea)**
- Type: Record<string, string[]>
- UI: Raw JSON textarea
- Validation: Optional
- UX: **Poor** - requires manual JSON editing
- Example: `{"frontend": ["React"], "backend": ["Node.js"]}`

**Tools (JSON Textarea)**
- Type: Record<string, string[]>
- UI: Raw JSON textarea
- Validation: Optional
- UX: **Poor** - requires manual JSON editing
- Example: `{"devops": ["Docker"], "testing": ["Jest"]}`

**Issues:**
- JSON syntax errors not caught until save
- No validation of JSON structure
- No autocomplete or suggestions
- Error-prone for non-technical users

### Links Section

**Fields:**
- github_url (text input, URL validation)
- demo_url (text input, URL validation)
- documentation_url (text input, URL validation)
- video_url (text input, URL validation)

**Validation:** URL format validation via Zod
- All fields are optional
- Must be valid URLs if provided

**Issues:**
- No URL preview
- No validation of URL accessibility
- No embedded video preview for video_url

### Cover Image Section

**Upload Flow:**
1. User selects file via file input
2. File uploaded to Supabase storage (`project-images` bucket)
3. Public URL retrieved
4. URL stored in `cover_image` field
5. Preview displayed

**Features:**
- Image preview (32x32 thumbnail)
- Remove button (X icon)
- Upload progress indicator
- Recommended size hint (1200x630px)

**Issues:**
- No image size validation
- No image format validation
- No image compression
- No aspect ratio enforcement
- No file size limit
- No drag-and-drop support

### Gallery Images Section

**Upload Flow:**
1. User selects file via file input
2. File uploaded to Supabase storage
3. URL added to gallery_images array
4. Images displayed in 4-column grid
5. order_index assigned based on array position

**Features:**
- Multiple image support
- Grid preview (aspect-square)
- Remove button per image
- Upload progress indicator

**Issues:**
- No drag-and-drop reordering
- No caption/alt text input
- No image metadata storage
- Destructive save (all deleted and re-inserted)
- No bulk upload

---

## Missing Functionality

### Rich Content Editing

**Missing Fields (Critical):**
1. **overview** - Rich text editor needed
2. **problem_statement** - Rich text editor needed
3. **architecture** - Rich text editor needed
4. **lessons_learned** - Array of strings, list editor needed

**Recommendation:** Add rich text editor (e.g., TipTap, Quill) for overview, problem_statement, architecture. Add list editor for lessons_learned.

### Legacy Field Support

**Missing Fields:**
1. **tech_stack** - Array of strings (used in public display)
2. **screenshots** - Array of strings (used in public display)
3. **tags** - Array of strings (used in public display)

**Recommendation:** Either:
- Add these fields to editor for backward compatibility
- Migrate public page to use new schema fields (technologies, gallery_images)

### Contributor Management

**Current State:** No contributor management in editor

**Available API:** `/src/lib/repositories/contributors.repository.ts`
- getContributors(projectId)
- addContributor(input)
- removeContributor(projectId, userId)
- updateContributorRole(projectId, userId, role)
- isContributor(projectId, userId)

**Missing UI:**
- No contributor list display
- No add contributor form
- No role management UI
- No invite system

**Recommendation:** Add contributor management section with:
- List of current contributors
- Add contributor by email
- Role selection (owner, maintainer, contributor, collaborator)
- Contribution type tags

### Tag Management

**Current State:** Tags field exists in schema but not in UI

**Available API:** `/src/lib/repositories/tags.repository.ts`
- getTags(projectId)
- addTag(input)
- removeTag(projectId, tag)
- addTags(projectId, tags)
- removeTags(projectId, tags)
- replaceTags(projectId, tags)

**Missing UI:**
- No tag display
- No tag input
- No tag suggestions

**Recommendation:** Add tag management with:
- Tag input with autocomplete
- Tag suggestions from existing tags
- Tag removal

---

## Data Flow Analysis

### Load Flow

```
1. User navigates to /creator/projects/[slug]/edit
2. Component loads
3. useEffect triggers
4. Fetch user from supabaseClient.auth.getUser()
5. Fetch project from supabaseClient.from('projects').select().eq('slug')
6. Fetch media from supabaseClient.from('project_media').select()
7. Populate form with reset()
8. Set state for cover_image, gallery_images, technologies, languages, frameworks, tools
9. Set loading = false
```

**Issues:**
- No loading state during media fetch
- No error handling for failed loads
- No ownership validation on load
- No concurrent request optimization

### Save Flow

```
1. User clicks "Save Draft" or "Publish"
2. handleSubmit triggered
3. Form validation via react-hook-form + zod
4. onSubmit called
5. Check user authentication
6. Build payload with form data + state
7. supabaseClient.from('projects').update()
8. Delete all existing media (DELETE from project_media)
9. Insert new media (INSERT into project_media)
10. Redirect to /profile/projects
```

**Issues:**
- Destructive media update (delete all, insert all)
- No optimistic UI update
- No error handling for media operations
- No confirmation on destructive operations
- No rollback on failure

---

## UX Blockers

### 1. JSON Text Areas

**Problem:** Technologies and tools require manual JSON editing

**Impact:**
- Error-prone for non-technical users
- No syntax highlighting
- No validation until save
- Poor discoverability of structure

**Recommendation:** Replace with:
- Nested category editors
- Dynamic form fields
- JSON schema validation with real-time feedback

### 2. No Change Detection

**Problem:** Cannot see what changed before saving

**Impact:**
- Risk of unintended changes
- No review before commit
- Difficult to track edits

**Recommendation:** Add:
- Change indicator per field
- Summary of changes
- Diff view before save

### 3. No Autosave

**Problem:** Must manually save to persist changes

**Impact:**
- Risk of data loss on browser close
- No recovery from crashes
- Poor UX for long editing sessions

**Recommendation:** Add:
- Autosave every 30 seconds
- Local storage backup
- Recovery prompt on reload

### 4. Destructive Media Update

**Problem:** All media deleted and re-inserted on save

**Impact:**
- Slow for projects with many images
- Risk of data loss on partial failure
- Unnecessary bandwidth usage

**Recommendation:** Add:
- Differential media update
- Only upload changed images
- Preserve unchanged media

### 5. No Draft Preview

**Problem:** Cannot preview project before publishing

**Impact:**
- Cannot verify appearance
- Risk of publishing errors
- No confidence in changes

**Recommendation:** Add:
- Preview button
- Opens project in new tab with draft status
- Live preview mode

---

## Performance Issues

### Bundle Size

**Current:** Editor component is 471 lines with full form

**Issues:**
- No code splitting
- All form fields loaded at once
- No lazy loading of rich text editors

**Recommendation:**
- Split into field sections
- Lazy load rich text editor
- Virtualize long lists

### Database Queries

**Current:** 3 sequential queries on load
1. Get user
2. Get project
3. Get media

**Optimization:** Use Promise.all for concurrent queries

### Image Uploads

**Current:** Sequential uploads, no compression

**Issues:**
- Slow for multiple images
- No client-side compression
- No progress indication

**Recommendation:**
- Add client-side compression
- Parallel uploads
- Upload progress bars

---

## Recommendations

### High Priority

1. **Add rich content fields to editor** - overview, problem_statement, architecture, lessons_learned
2. **Replace JSON text areas** - Use proper UI for technologies and tools
3. **Add contributor management UI** - Allow adding/removing collaborators
4. **Add tag management UI** - Allow editing tags
5. **Add autosave** - Prevent data loss

### Medium Priority

6. **Add draft preview** - Allow previewing before publishing
7. **Add change detection** - Show what changed before save
8. **Fix destructive media update** - Use differential updates
9. **Add slug auto-generation** - Generate from title
10. **Add image optimization** - Compress and validate uploads

### Low Priority

11. **Add revision history** - Track changes over time
12. **Add field templates** - Pre-defined content templates
13. **Add bulk operations** - Edit multiple fields at once
14. **Add keyboard shortcuts** - Improve power user experience
15. **Add offline support** - Edit without network

---

## Maturity Score

**Current Score:** 5/10

**Breakdown:**
- Field Coverage: 3/10 ✗ (critical gap - missing 7 displayed fields)
- UX Quality: 5/10 ✗ (JSON text areas, no autosave)
- Data Integrity: 6/10 ✗ (destructive media updates)
- Performance: 6/10 ✗ (no optimization)
- Contributor Support: 0/10 ✗ (completely missing)

**Primary Blocker:** Editor does not support fields displayed on public page (overview, problem_statement, architecture, lessons_learned, tech_stack, screenshots, tags).
