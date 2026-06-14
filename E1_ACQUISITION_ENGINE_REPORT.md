# E1 Acquisition Engine Report

## Phase E1 — Real Acquisition Engine

**Objective:** Convert the existing acquisition foundation into a fully functional acquisition engine with GitHub repository import, metadata extraction, approval queue, duplicate detection, and manual publish workflow.

**Status:** ✅ COMPLETE

---

## Implementation Summary

### 1. GitHub Repository Import ✅

**Location:** `src/app/api/admin/acquisition/route.ts`

**Implementation:**
- Added `github_import` action to API endpoint
- Integrates with existing `GitHubService.importRepository()`
- Fetches complete repository metadata from GitHub API
- Extracts README content automatically
- Generates cover image placeholder using GitHub's social preview

**Features:**
- Validates GitHub URL format
- Handles API rate limits gracefully
- Provides detailed error messages
- Returns both queue item and raw GitHub data

### 2. GitHub Metadata Extraction ✅

**Location:** `src/lib/github.service.ts` (existing, enhanced integration)

**Extracted Metadata:**
- Repository name and full name
- Description and homepage URL
- Topics and tags
- Primary language and all languages
- License information
- Stars and forks count
- Owner information (login, avatar, type)
- Default branch
- Creation and update timestamps
- README content

**Integration:**
- Metadata is stored in `content_acquisition_queue.metadata` JSONB field
- Languages extracted as array for project tech_stack
- Topics mapped to project tags
- Cover image generated from GitHub social preview

### 3. GitHub README Extraction ✅

**Location:** `src/lib/github.service.ts` (existing)

**Implementation:**
- Uses GitHub API to fetch README content
- Handles base64 encoding automatically
- Falls back gracefully if README unavailable
- README stored in `raw_content` field for project overview

### 4. Approval Queue ✅

**Location:** `src/lib/knowledge-ecosystem/acquisition.ts` (existing, enhanced)

**Queue States:**
- `queued` - Initial state after import
- `analyzing` - Content analysis in progress
- `approved` - Ready for publishing
- `rejected` - Declined by admin
- `imported` - Successfully published
- `duplicate` - Detected as duplicate
- `failed` - Import/processing failed

**Queue Management:**
- `queueAcquisition()` - Add new candidate to queue
- `listAcquisitionQueue()` - List with filters (provider, status)
- `updateAcquisitionStatus()` - Change status with reviewer tracking
- `bulkQueueAcquisition()` - Batch import support

### 5. Duplicate Detection ✅

**Location:** `src/lib/knowledge-ecosystem/duplicate-detection.ts` (existing)

**Detection Layers:**
1. **Repository URL Match** - Exact URL comparison
2. **Repository ID Match** - Provider-specific ID comparison
3. **Content Hash Match** - Normalized content fingerprinting
4. **Text Similarity** - Jaccard similarity on title/description/content
5. **Screenshot Match** - Image URL comparison

**Thresholds:**
- 86% confidence threshold for duplicate flagging
- Multiple signals combined for robust detection
- Confidence scores stored for review

**Integration:**
- Automatically runs on every import
- Blocks duplicate items from approval
- Provides detailed signals for admin review

### 6. Manual Publish Workflow ✅

**Location:** `src/lib/knowledge-ecosystem/acquisition.ts`

**New Function:** `publishApprovedItem(queueItemId, reviewerId)`

**Publish Process:**
1. Validates item is in `approved` status
2. Checks item hasn't been published already
3. Maps queue data to project schema:
   - title → project title
   - description → project description
   - raw_content → project overview (truncated to 2000 chars)
   - repository_url → github_url
   - metadata.languages → tech_stack
   - metadata.topics → tags
   - screenshot_url/metadata.cover_image → cover_image
4. Creates new project in `projects` table
5. Updates queue item with:
   - status: `imported`
   - imported_entity_type: `project`
   - imported_entity_id: new project UUID
   - reviewed_by: admin user ID
   - reviewed_at: timestamp
6. Returns both queue item and created project

**Safety Features:**
- Only approved items can be published
- Prevents duplicate publishing
- Full audit trail with reviewer tracking
- Atomic operation (project creation + queue update)

### 7. Feature Flag ✅

**Location:** `src/lib/knowledge-ecosystem/feature-flags.ts` (existing)

**Flag:** `NEXT_PUBLIC_FEATURE_ACQUISITION_ENGINE`

**Implementation:**
- Server-side validation in API routes via `assertKnowledgeFeature()`
- Client-side validation in UI components
- Graceful degradation when disabled
- Clear messaging when feature is off

**Components Protected:**
- API endpoints (github_import, publish, etc.)
- GitHubImportForm component
- Admin acquisition page

### 8. Admin UI Components ✅

#### GitHubImportForm Component
**Location:** `src/components/admin/GitHubImportForm.tsx`

**Features:**
- URL input with validation
- Loading states during import
- Success/error feedback
- Feature flag check with disabled state
- Import process documentation
- Auto-refresh on success

#### AcquisitionActions Component
**Location:** `src/components/admin/AcquisitionActions.tsx`

**Features:**
- Approve button (queued items only)
- Reject button (queued or approved items)
- Publish button (approved items only)
- Status indicators (published, duplicate)
- Loading states per action
- Action-specific tooltips

#### Admin Page Enhancement
**Location:** `src/app/admin/(dashboard)/acquisition/page.tsx`

**Enhancements:**
- Integrated GitHubImportForm at top of page
- Added Actions column to review queue table
- Feature flag passed to child components
- Updated empty state message
- Metrics display (queued, approved, duplicates, providers)

---

## Database Schema

**Table:** `content_acquisition_queue` (existing in migration 20260613_phase_x_knowledge_ecosystem.sql)

**Key Fields Used:**
- `id` - UUID primary key
- `provider` - 'github', 'gitlab', etc.
- `external_id` - Provider-specific ID (e.g., "owner/repo")
- `source_url` - Original URL
- `repository_url` - Repository URL (if applicable)
- `screenshot_url` - Cover image URL
- `title` - Repository/project name
- `description` - Short description
- `author` - Repository owner
- `raw_content` - README or full content
- `content_hash` - For duplicate detection
- `status` - Queue state
- `duplicate_signals` - JSONB array of detection results
- `analysis` - JSONB analysis results
- `quality_score` - 0-100 quality rating
- `trust_score` - 0-100 trust rating
- `imported_entity_type` - 'project' after publishing
- `imported_entity_id` - UUID of created project
- `reviewed_by` - Admin user UUID
- `reviewed_at` - Review timestamp
- `metadata` - JSONB for languages, topics, stars, etc.

**Indexes:**
- `idx_acquisition_provider_status` - For filtering
- `idx_acquisition_repository_url` - For duplicate detection
- `idx_acquisition_external_id` - For duplicate detection
- `idx_acquisition_content_hash` - For duplicate detection
- `idx_acquisition_created_at` - For sorting

---

## API Endpoints

### GET /api/admin/acquisition
**Purpose:** List acquisition queue with filters

**Query Parameters:**
- `provider` - Filter by provider (optional)
- `status` - Filter by status (optional)

**Response:**
```json
{
  "success": true,
  "queue": [...]
}
```

### POST /api/admin/acquisition
**Purpose:** Perform acquisition actions

**Actions:**

#### github_import
**Body:**
```json
{
  "action": "github_import",
  "url": "https://github.com/owner/repo"
}
```

**Response:**
```json
{
  "success": true,
  "item": {...},
  "githubData": {...}
}
```

#### approve
**Body:**
```json
{
  "action": "approve",
  "id": "queue-item-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "item": {...}
}
```

#### reject
**Body:**
```json
{
  "action": "reject",
  "id": "queue-item-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "item": {...}
}
```

#### publish
**Body:**
```json
{
  "action": "publish",
  "id": "queue-item-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "queueItem": {...},
    "project": {...}
  }
}
```

#### bulk_import
**Body:**
```json
{
  "action": "bulk_import",
  "provider": "github",
  "urls": ["url1", "url2", ...]
}
```

**Response:**
```json
{
  "success": true,
  "queued": [...]
}
```

---

## Success Criteria Verification

✅ **Admin can paste a GitHub repository URL and import a project draft**
- GitHubImportForm component provides URL input
- API endpoint processes GitHub import
- Full metadata extracted automatically
- README content fetched and stored
- Item added to approval queue

✅ **Full metadata extraction**
- Repository name, description, homepage
- Topics, languages, license
- Stars, forks, owner info
- Creation/update timestamps
- Cover image placeholder generated

✅ **Duplicate protection**
- 5-layer duplicate detection system
- Automatic detection on import
- Confidence scoring
- Blocks duplicate items from approval
- Detailed signals for admin review

✅ **No automatic publishing**
- All imports go to queue first
- Status remains `queued` until admin action
- Publish requires explicit admin approval
- Manual publish workflow implemented

✅ **Admin approval required**
- Approve button for queued items
- Reject button for queued/approved items
- Publish button only for approved items
- Reviewer tracking on all actions
- Audit trail in database

✅ **Feature flagged**
- NEXT_PUBLIC_FEATURE_ACQUISITION_ENGINE flag
- Server-side validation in API
- Client-side validation in UI
- Graceful degradation when disabled
- Clear messaging for disabled state

✅ **Production ready**
- Build succeeds without errors
- TypeScript types validated
- Error handling throughout
- Loading states in UI
- Atomic database operations
- Indexes for performance
- RLS policies in place

---

## Files Modified/Created

### Modified Files
1. `src/app/api/admin/acquisition/route.ts` - Added github_import and publish actions
2. `src/lib/knowledge-ecosystem/acquisition.ts` - Added publishApprovedItem function
3. `src/app/admin/(dashboard)/acquisition/page.tsx` - Integrated GitHubImportForm and AcquisitionActions

### Created Files
1. `src/components/admin/GitHubImportForm.tsx` - GitHub URL import form component
2. `src/components/admin/AcquisitionActions.tsx` - Approve/reject/publish actions component

### Existing Files Used
1. `src/lib/github.service.ts` - GitHub API integration (unchanged)
2. `src/lib/knowledge-ecosystem/duplicate-detection.ts` - Duplicate detection (unchanged)
3. `src/lib/knowledge-ecosystem/feature-flags.ts` - Feature flags (unchanged)
4. `supabase/migrations/20260613_phase_x_knowledge_ecosystem.sql` - Database schema (unchanged)

---

## Usage Instructions

### For Admin Users

1. **Navigate to Acquisition Engine**
   - Go to `/admin/acquisition`
   - Ensure feature flag is enabled

2. **Import a GitHub Repository**
   - Paste GitHub repository URL (e.g., `https://github.com/owner/repo`)
   - Click "Import Repository"
   - Wait for import to complete
   - Item appears in review queue

3. **Review Queue Items**
   - Check duplicate signals
   - Review quality and trust scores
   - Examine extracted metadata

4. **Approve or Reject**
   - Click "Approve" to move to publishable state
   - Click "Reject" to decline the item
   - Actions are tracked with your user ID

5. **Publish Approved Items**
   - Click "Publish" on approved items
   - System creates project in projects table
   - Queue item status changes to "imported"
   - Project is now live on the platform

### For Developers

**Environment Variables:**
```env
NEXT_PUBLIC_FEATURE_ACQUISITION_ENGINE=true
```

**API Usage Example:**
```typescript
// Import GitHub repository
const response = await fetch('/api/admin/acquisition', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'github_import',
    url: 'https://github.com/owner/repo'
  })
});

const data = await response.json();
console.log(data.item); // Queue item
console.log(data.githubData); // Raw GitHub data
```

---

## Testing Checklist

- [x] Build succeeds without errors
- [x] TypeScript compilation passes
- [x] Feature flag validation works
- [x] GitHub import processes valid URLs
- [x] GitHub import handles invalid URLs gracefully
- [x] Duplicate detection triggers on duplicates
- [x] Duplicate detection allows unique items
- [x] Approve action changes status to approved
- [x] Reject action changes status to rejected
- [x] Publish action creates project
- [x] Publish action updates queue item
- [x] Publish action prevents duplicate publishing
- [x] UI loading states display correctly
- [x] Error messages display correctly
- [x] Success messages display correctly
- [x] Metrics calculate correctly
- [x] Queue filters work correctly

---

## Production Deployment Notes

### Prerequisites
1. Ensure `content_acquisition_queue` table exists (migration 20260613_phase_x_knowledge_ecosystem.sql)
2. Set `NEXT_PUBLIC_FEATURE_ACQUISITION_ENGINE=true` in environment
3. Verify admin authentication is working
4. Confirm GitHub API access (no token required for public repos)

### Rate Limiting
- GitHub API has rate limits (60 requests/hour for unauthenticated)
- Consider adding GitHub token for higher limits if needed
- Current implementation uses unauthenticated requests

### Performance Considerations
- Duplicate detection queries 30 recent items for text similarity
- Consider pagination for large queues
- Indexes are in place for common queries
- README content truncated to 2000 chars for project overview

### Security
- All endpoints require admin authentication
- RLS policies enabled on database tables
- No automatic publishing - requires explicit admin action
- Audit trail tracks all reviewer actions

### Monitoring
- Monitor queue size and processing time
- Track duplicate detection rates
- Monitor GitHub API rate limit usage
- Log failed imports for investigation

---

## Future Enhancements

### Potential Improvements
1. **GitHub Authentication** - Add token support for higher rate limits
2. **Bulk Import UI** - Add interface for batch URL imports
3. **Queue Pagination** - Handle large queues efficiently
4. **Advanced Filters** - Filter by quality score, trust score, date range
5. **Queue Export** - Export queue data for analysis
6. **Auto-Refresh** - Periodic queue refresh in admin UI
7. **Edit Before Publish** - Allow editing queue data before publishing
8. **Multi-Provider Support** - Extend to GitLab, Devpost, etc.
9. **Webhook Integration** - GitHub webhook for automatic updates
10. **Analytics Dashboard** - Track acquisition metrics over time

### Known Limitations
- GitHub API rate limits (unauthenticated)
- Text similarity uses Jaccard instead of embeddings
- No retry logic for failed GitHub API calls
- Queue items not editable before publish
- No bulk publish action

---

## Conclusion

Phase E1 successfully converts the existing acquisition foundation into a fully functional acquisition engine. All requirements have been met:

✅ GitHub Repository Import - Working with full metadata extraction
✅ GitHub Metadata Extraction - Comprehensive metadata captured
✅ GitHub README Extraction - Automatic README fetching
✅ Approval Queue - Full queue management with status tracking
✅ Duplicate Detection - 5-layer detection system with 86% threshold
✅ Manual Publish Workflow - Admin-controlled publishing with audit trail
✅ Feature Flagged - NEXT_PUBLIC_FEATURE_ACQUISISITION_ENGINE controls access
✅ Production Ready - Build succeeds, error handling complete, RLS in place

**Success Criteria Met:** Admin can paste a GitHub repository URL and import a project draft into Arpit Labs with full metadata and duplicate protection.

**Status:** ✅ COMPLETE AND PRODUCTION READY
