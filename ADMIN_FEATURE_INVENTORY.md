# ADMIN FEATURE INVENTORY

**Generated:** June 9, 2026  
**Scope:** All routes under `/admin` and `/admin/(dashboard)/*`

---

## ROUTE STRUCTURE

### Root Admin Routes

| Route | Purpose | Data Source | Components Used | Access Control |
|-------|---------|-------------|-----------------|----------------|
| `/admin/login` | Admin authentication page | Supabase auth | Custom form | Public (redirects if authenticated) |
| `/admin/ai` | AI automation dashboard | AIAutomationDashboard component | AIAutomationDashboard | `requireAdmin()` |
| `/admin` | Command center overview | Multiple repositories | MetricCard, AdminSection, AdminTopbar | `requireAdmin()` via layout |

### Dashboard Routes (`/admin/(dashboard)/*`)

| Route | Purpose | Data Source | Components Used | Access Control |
|-------|---------|-------------|-----------------|----------------|
| `/admin/(dashboard)/page.tsx` | Command center - operational overview | projectsRepository, labNotesRepository, experimentsRepository, newsletterRepository, contactsRepository, productsRepository | MetricCard, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/blog` | Blog CMS (lab notes) | labNotesRepository | BlogForm, AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/community` | Community chapters and events | ecosystemRepository | CommunityChapterForm, CommunityEventForm, AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/courses` | Courses CMS | coursesRepository | CourseForm, AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/experiments` | Experiments CMS | experimentsRepository | ExperimentForm, AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/hackathons` | Hackathon events management | hackathonsRepository | AdminSection, AdminTable | `requireAdmin()` via layout |
| `/admin/(dashboard)/innovation` | Startup incubation hub | ecosystemRepository (startups) | StartupForm, AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/journey` | Journey timeline CMS | journeyRepository | JourneyForm, SortableJourneyList, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/labs` | Labs CMS | labsRepository | LabForm, AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/marketplace` | Marketplace items management | marketplaceRepository | MarketplaceItemForm, AdminTable, AdminSection, Badge | `requireAdmin()` via layout |
| `/admin/(dashboard)/memberships` | Membership plans management | **DISABLED** | AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/messages` | Contact messages inbox | contactsRepository | AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/newsletter` | Newsletter subscribers | newsletterRepository | AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/newsletter/export` | CSV export for subscribers | newsletterRepository | N/A (API route) | `requireAdmin()` |
| `/admin/(dashboard)/payments` | Payment transactions | **DISABLED** | AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/products` | Products CMS | productsRepository | ProductForm, AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/projects` | Projects CMS | projectsRepository | ProjectForm, AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/research` | Research papers management | ecosystemRepository (research papers) | ResearchPaperForm, AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/revenue` | Revenue dashboard | **DISABLED** | AdminSection | `requireAdmin()` via layout |
| `/admin/(dashboard)/roadmaps` | Roadmaps CMS | roadmapsRepository | RoadmapForm, AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/saas` | SaaS infrastructure/organizations | saasRepository | MetricCard, AdminTable, AdminSection, AdminTopbar, Badge | `requireAdmin()` via layout |
| `/admin/(dashboard)/university` | Certifications management | ecosystemRepository (certifications) | CertificationForm, AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |
| `/admin/(dashboard)/venture` | Venture studio/funding rounds | Supabase direct (funding_rounds table) | AdminTable, AdminSection, AdminTopbar | `requireAdmin()` via layout |

### API Routes (`/api/admin/*`)

| Route | Purpose | Data Source | Access Control |
|-------|---------|-------------|----------------|
| `/api/admin/journey/reorder` | Journey timeline reordering | journeyRepository | `requireAdmin()` |
| `/api/admin/memberships` | Membership plan updates | **DISABLED** (501 response) | `getAdminUserFromRequest()` |

---

## DATA SOURCES BY REPOSITORY

| Repository | Tables Accessed | Used By Routes |
|------------|-----------------|----------------|
| `projectsRepository` | projects | dashboard, projects |
| `labNotesRepository` | lab_notes | dashboard, blog |
| `experimentsRepository` | experiments | dashboard, experiments |
| `newsletterRepository` | newsletter_subscribers | dashboard, newsletter, newsletter/export |
| `contactsRepository` | contact_messages | dashboard, messages |
| `productsRepository` | products | dashboard, products |
| `coursesRepository` | courses | courses |
| `labsRepository` | labs | labs |
| `roadmapsRepository` | roadmaps | roadmaps |
| `hackathonsRepository` | hackathons | hackathons |
| `journeyRepository` | journey_timeline | journey, api/admin/journey/reorder |
| `ecosystemRepository` | community_chapters, community_events, startups, research_papers, certifications | community, innovation, research, university |
| `marketplaceRepository` | marketplace_items, marketplace_categories | marketplace |
| `saasRepository` | organizations, workspaces | saas |
| `membershipRepository` | **DISABLED** | memberships (commented out) |
| `paymentRepository` | **DISABLED** | payments, revenue (commented out) |
| Supabase direct | funding_rounds | venture |

---

## SHARED COMPONENTS

### Admin UI Components
- `AdminChrome` - Layout wrapper for dashboard
- `AdminSection` - Section container
- `AdminTable` - Data table
- `AdminTopbar` - Page header
- `AdminEmptyState` - Empty state display
- `MetricCard` - Metric display card
- `AdminSubmitButton` - Form submit button

### Form Components
- `BlogForm` - Lab note editor
- `CommunityChapterForm` - Chapter editor
- `CommunityEventForm` - Event editor
- `CourseForm` - Course editor
- `ExperimentForm` - Experiment editor
- `StartupForm` - Startup editor
- `JourneyForm` - Journey entry editor
- `LabForm` - Lab editor
- `MarketplaceItemForm` - Marketplace item editor
- `ProductForm` - Product editor
- `ProjectForm` - Project editor
- `ResearchPaperForm` - Research paper editor
- `RoadmapForm` - Roadmap editor
- `CertificationForm` - Certification editor

### Specialized Components
- `SortableJourneyList` - Drag-and-drop journey reordering
- `AIAutomationDashboard` - AI features dashboard

---

## ACCESS CONTROL SUMMARY

### Middleware Protection
- **Location:** `src/middleware.ts`
- **Scope:** All `/admin/*` routes except `/admin/login`
- **Mechanism:** Cookie-based (`adminAccessCookieName`)
- **Behavior:** Redirects to `/admin/login?redirectTo=...` if no cookie

### Server-Side Protection
- **Function:** `requireAdmin()` in `src/lib/auth.ts`
- **Used by:** All dashboard routes via layout, API routes
- **Validation:** 
  - Checks admin session cookies
  - Validates admin role via `hasAdminRole()`
  - Checks email against `ADMIN_EMAILS` env var
- **Fallback:** Redirects to `/admin/login`

### Role Checks
- **Function:** `hasAdminRole()` in `src/lib/auth.ts`
- **Criteria:** 
  - `app_metadata.role === "admin"`
  - `user_metadata.role === "admin"`
  - Email in `ADMIN_EMAILS` environment variable

---

## DISABLED FEATURES

| Route | Reason | Status |
|-------|--------|--------|
| `/admin/(dashboard)/memberships` | Payments temporarily disabled | Commented out implementation |
| `/admin/(dashboard)/payments` | Payments temporarily disabled | Commented out implementation |
| `/admin/(dashboard)/revenue` | Payments temporarily disabled | Commented out implementation |
| `/api/admin/memberships` | Payments temporarily disabled | Returns 501 |

---

## SUMMARY STATISTICS

- **Total Admin Routes:** 24
- **Active Routes:** 21
- **Disabled Routes:** 3
- **API Routes:** 2 (1 active, 1 disabled)
- **Content Management Systems:** 10 (blog, courses, experiments, labs, products, projects, roadmaps, research, journey, marketplace)
- **Ecosystem Management:** 5 (community, innovation, university, venture, saas)
- **Communication:** 2 (messages, newsletter)
- **Analytics/Overview:** 3 (dashboard, ai, revenue - revenue disabled)
- **Payment/Billing:** 3 (all disabled)
