# Creator Flow Audit

**Project:** Arpit Labs  
**Phase:** P4 - Creator Experience Optimization  
**Date:** 2026-06-09  
**Auditor:** Cascade

---

## Executive Summary

The creator flow consists of three main entry points for project management: manual creation, GitHub import, and project editing. The flow is functional but has gaps in field coverage between the editor and public display, missing contributor management UI, and no bulk operations.

---

## 1. /creator/projects/new

**Purpose:** Manual project creation from scratch

**Location:** `/src/app/creator/projects/new/page.tsx`

### Data Flow

```
User Input → Form Validation (react-hook-form + zod) → Supabase Insert → Redirect to /profile/projects
```

### API Dependencies

- `supabaseClient.auth.getUser()` - Authentication check
- `supabaseClient.from('projects').insert()` - Project creation
- `supabaseClient.storage.from('project-images').upload()` - Image uploads
- `supabaseClient.from('project_media').insert()` - Gallery images

### Supported Fields

**Basic Information:**
- title ✓
- slug ✓
- description ✓
- project_type ✓ (software, hardware, research, opensource, hackathon, hybrid)
- branch ✓
- domain ✓
- category ✓

**Technical Stack:**
- languages ✓ (array, tag-based input)
- frameworks ✓ (array, tag-based input)
- technologies ✓ (JSON object)
- tools ✓ (JSON object)

**Links:**
- github_url ✓
- demo_url ✓
- documentation_url ✓
- video_url ✓

**Media:**
- cover_image ✓ (upload to Supabase storage)
- gallery_images ✓ (multiple uploads to project_media table)

**Status:**
- status ✓ (default: draft)
- featured ✓ (checkbox)

### Missing Functionality

1. **No contributor management** - Cannot add collaborators during creation
2. **No tag management** - Tags field exists in schema but not in UI
3. **No legacy field support** - overview, problem_statement, architecture, lessons_learned not editable
4. **No slug auto-generation** - Manual slug entry required
5. **No draft preview** - Cannot preview before publishing
6. **No validation for duplicate slugs** - Could cause conflicts

### UX Blockers

1. **JSON text areas** - technologies and tools require manual JSON editing (error-prone)
2. **No image optimization** - No size limits or compression warnings
3. **No save progress** - Must complete form in one session
4. **No template system** - Cannot start from project templates
5. **No auto-save** - Risk of data loss on browser close

---

## 2. /creator/projects/import

**Purpose:** Import project from GitHub repository

**Location:** `/src/app/creator/projects/import/page.tsx`

### Data Flow

```
GitHub URL → GitHubService.parseRepositoryUrl() → GitHubService.fetchRepository() → 
GitHubService.fetchReadme() → Map to Project Schema → Supabase Insert → Redirect to Edit
```

### API Dependencies

- `GitHubService.importRepository()` - GitHub API calls
- `supabaseClient.from('projects').insert()` - Project creation
- `supabaseClient.from('projects').select().eq('github_url')` - Duplicate check

### GitHub Metadata Imported

**Repository Info:**
- name ✓ (converted to title)
- description ✓
- html_url ✓ (github_url)
- homepage ✓ (demo_url)
- default_branch ✓ (branch)
- owner.login ✓ (for cover placeholder)
- stargazers_count ✓ (not stored)
- forks_count ✓ (not stored)

**Topics & Languages:**
- topics ✓ (mapped to tags and taxonomy)
- language ✓ (primary language)
- languages ✓ (all languages with bytes)

**License:**
- license ✓ (not stored in project)

### Missing Metadata

1. **README content** - Fetched but not stored in any field
2. **License information** - Fetched but not stored
3. **Contributors** - Not fetched from GitHub
4. **Issues count** - Not fetched
5. **Release info** - Not fetched
6. **Last commit date** - Not fetched
7. **Repository size** - Not fetched

### Error Handling

**Implemented:**
- Invalid URL format ✓
- Repository not found (404) ✓
- Rate limit exceeded (403) ✓
- Duplicate import prevention ✓

**Gaps:**
- No retry mechanism for rate limits
- No partial import on API failure
- No private repository support
- No organization repository handling

### UX Blockers

1. **No preview before import** - Must import to see mapped data
2. **No field editing before import** - Cannot adjust mappings
3. **No bulk import** - One repository at a time
4. **No import history** - Cannot see previously imported repos
5. **No manual field override** - All fields auto-populated

---

## 3. /creator/projects/[slug]/edit

**Purpose:** Edit existing project details

**Location:** `/src/app/creator/projects/[slug]/edit/page.tsx`

### Data Flow

```
Load Project → Populate Form → User Edits → Validation → 
Supabase Update → Delete Old Media → Insert New Media → Redirect
```

### API Dependencies

- `supabaseClient.from('projects').select().eq('slug')` - Load project
- `supabaseClient.from('project_media').select().eq('project_id')` - Load media
- `supabaseClient.from('projects').update()` - Update project
- `supabaseClient.from('project_media').delete()` - Remove old media
- `supabaseClient.from('project_media').insert()` - Add new media

### Supported Fields

**Basic Information:**
- title ✓
- slug ✓
- description ✓
- project_type ✓
- branch ✓
- domain ✓
- category ✓

**Technical Stack:**
- languages ✓
- frameworks ✓
- technologies ✓ (JSON)
- tools ✓ (JSON)

**Links:**
- github_url ✓
- demo_url ✓
- documentation_url ✓
- video_url ✓

**Media:**
- cover_image ✓
- gallery_images ✓ (via project_media)

**Status:**
- status ✓
- featured ✓

### Missing Functionality

1. **No overview editing** - Field exists in schema but not in UI
2. **No problem_statement editing** - Field exists but not in UI
3. **No architecture editing** - Field exists but not in UI
4. **No lessons_learned editing** - Field exists but not in UI
5. **No tag management UI** - Tags field exists but not editable
6. **No contributor management** - Cannot add/remove collaborators
7. **No tech_stack editing** - Legacy field not in UI
8. **No screenshot management** - Legacy field not in UI

### Critical Gap: Editor vs Public Display Mismatch

**Public Project Page Uses:**
- overview ✓ (not editable in editor)
- problem_statement ✓ (not editable in editor)
- architecture ✓ (not editable in editor)
- lessons_learned ✓ (not editable in editor)
- tech_stack ✓ (not editable in editor)
- screenshots ✓ (not editable in editor)
- tags ✓ (not editable in editor)

**Editor Provides:**
- description ✓ (used as fallback)
- technologies ✓ (not used in public display)
- languages ✓ (used as fallback for tech_stack)
- frameworks ✓ (not used in public display)
- gallery_images ✓ (not used in public display)

**Impact:** Creators cannot edit content that appears on the public project page. The public page falls back to description and languages, but the rich content sections (overview, problem_statement, architecture, lessons_learned) are not editable.

### UX Blockers

1. **No change detection** - Cannot see what changed before saving
2. **No revision history** - Cannot revert to previous versions
3. **No draft vs published view** - Cannot see live version while editing
4. **Media deletion is destructive** - All media deleted and re-added on save
5. **No autosave** - Risk of data loss
6. **No validation for slug changes** - Could break URLs

---

## Data Flow Diagram

```
┌─────────────────┐
│  User Auth      │
└────────┬────────┘
         │
         ├─────────────────────────────────────────┐
         │                                         │
┌────────▼────────┐                    ┌──────────▼──────────┐
│  Manual Create  │                    │  GitHub Import      │
│  /creator/      │                    │  /creator/         │
│  projects/new   │                    │  projects/import   │
└────────┬────────┘                    └──────────┬──────────┘
         │                                         │
         │ Form Validation                        │ GitHub API
         │                                         │
         ▼                                         ▼
┌─────────────────┐                    ┌────────────────────┐
│  Supabase       │                    │  GitHubService     │
│  projects.insert│                    │  importRepository  │
└────────┬────────┘                    └──────────┬─────────┘
         │                                         │
         │                                         │
         └────────────────┬────────────────────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │  Edit Project  │
                 │  /creator/     │
                 │  projects/[slug]│
                 │  /edit         │
                 └────────┬───────┘
                          │
                          │ Update
                          ▼
                 ┌────────────────┐
                 │  Supabase       │
                 │  projects.update│
                 └────────────────┘
```

---

## API Dependencies Summary

| Endpoint | Purpose | Authentication |
|----------|---------|----------------|
| `GET /api/projects` | List projects | Required |
| `POST /api/projects` | Create project | Required |
| `GET /api/projects/[slug]` | Get project | None (public) |
| `PUT /api/projects/[slug]` | Update project | Owner/Admin |
| `PATCH /api/projects/[slug]` | Partial update | Owner/Admin |
| `DELETE /api/projects/[slug]` | Delete project | Owner/Admin |
| `POST /api/projects/[slug]/analytics` | Track views/likes | Optional |
| `GET /api/projects/[slug]/analytics` | Get analytics | Optional |
| `GET /api/projects/[slug]/media` | List media | None |
| `POST /api/projects/[slug]/media` | Add media | Owner/Admin |
| `GET /api/projects/[slug]/contributors` | List contributors | None |
| `POST /api/projects/[slug]/contributors` | Add contributor | Owner/Admin |
| `GET /api/projects/[slug]/tags` | List tags | None |
| `POST /api/projects/[slug]/tags` | Add tags | Owner/Admin |

---

## Recommendations

### High Priority

1. **Fix editor-display mismatch** - Add missing fields (overview, problem_statement, architecture, lessons_learned) to editor
2. **Add contributor management UI** - Allow adding/removing collaborators in editor
3. **Replace JSON text areas** - Use proper UI components for technologies and tools
4. **Add autosave** - Prevent data loss during editing
5. **Add slug auto-generation** - Generate from title on creation

### Medium Priority

6. **Add tag management UI** - Replace array input with tag picker
7. **Add draft preview** - Allow previewing before publishing
8. **Add change detection** - Show diff before saving
9. **Add image optimization** - Compress and validate uploads
10. **Add bulk import** - Support multiple GitHub repositories

### Low Priority

11. **Add template system** - Pre-defined project templates
12. **Add revision history** - Version control for projects
13. **Add import history** - Track GitHub imports
14. **Add field mapping UI** - Customize GitHub import mappings
15. **Add private repo support** - GitHub token authentication

---

## Maturity Score

**Current Score:** 6/10

**Breakdown:**
- Basic CRUD: 9/10 ✓
- Field Coverage: 4/10 ✗ (critical gap)
- UX Quality: 5/10 ✗
- Error Handling: 7/10 ✓
- API Integration: 8/10 ✓

**Primary Blocker:** Editor does not support all fields displayed on public project page.
