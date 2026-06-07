# Phase 2A: Universal Project Data Model

## Executive Summary

This document defines the production-ready data model for a universal project management system supporting software, hardware, research, open source, hackathon, and hybrid projects.

---

## 1. Final Database Schema

### 1.1 Core Tables

#### `projects` (Main Entity)
```sql
CREATE TABLE projects (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Fields
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  overview TEXT,
  problem_statement TEXT,
  solution TEXT,
  architecture TEXT,
  
  -- Project Type Classification
  project_type TEXT NOT NULL CHECK (project_type IN ('software', 'hardware', 'research', 'opensource', 'hackathon', 'hybrid')),
  branch TEXT, -- main, develop, feature branches
  
  -- Classification
  domains TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Technical Stack
  technologies JSONB DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  frameworks TEXT[] DEFAULT '{}',
  tools JSONB DEFAULT '{}',
  
  -- Hardware Specific (nullable for non-hardware projects)
  components JSONB DEFAULT '{}',
  sensors JSONB DEFAULT '{}',
  microcontrollers JSONB DEFAULT '{}',
  boards JSONB DEFAULT '{}',
  
  -- Links
  github_url TEXT,
  demo_url TEXT,
  documentation_url TEXT,
  video_url TEXT,
  live_url TEXT,
  
  -- Media
  cover_image TEXT,
  gallery TEXT[] DEFAULT '{}',
  documents JSONB DEFAULT '{}',
  
  -- Ownership
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN DEFAULT FALSE,
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  fork_count INTEGER DEFAULT 0,
  star_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  
  -- Search & Discovery
  search_vector TSVECTOR,
  
  -- Constraints
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT valid_github_url CHECK (github_url IS NULL OR github_url ~ '^https?://github\.com/'),
  CONSTRAINT valid_demo_url CHECK (demo_url IS NULL OR demo_url ~ '^https?://')
);

-- Indexes
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_type ON projects(project_type);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_projects_tags ON projects USING GIN(tags);
CREATE INDEX idx_projects_domains ON projects USING GIN(domains);
CREATE INDEX idx_projects_categories ON projects USING GIN(categories);
CREATE INDEX idx_projects_search ON projects USING GIN(search_vector);
CREATE INDEX idx_projects_featured ON projects(featured, status) WHERE featured = TRUE AND status = 'published';
CREATE INDEX idx_projects_created ON projects(created_at DESC);
```

#### `project_contributors` (Many-to-Many Relationship)
```sql
CREATE TABLE project_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('owner', 'maintainer', 'contributor', 'collaborator')),
  contribution_type TEXT[] DEFAULT '{}',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_contributors_project ON project_contributors(project_id);
CREATE INDEX idx_contributors_user ON project_contributors(user_id);
```

#### `project_metrics` (Detailed Analytics)
```sql
CREATE TABLE project_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Daily Metrics
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  
  -- Engagement
  avg_time_on_page INTEGER DEFAULT 0, -- seconds
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Source Tracking
  sources JSONB DEFAULT '{}', -- {direct: 10, google: 5, twitter: 3}
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(project_id, date)
);

CREATE INDEX idx_metrics_project ON project_metrics(project_id);
CREATE INDEX idx_metrics_date ON project_metrics(date);
```

#### `project_likes` (User Interactions)
```sql
CREATE TABLE project_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_likes_project ON project_likes(project_id);
CREATE INDEX idx_likes_user ON project_likes(user_id);
```

#### `project_bookmarks` (User Bookmarks)
```sql
CREATE TABLE project_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder TEXT DEFAULT 'default',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_bookmarks_project ON project_bookmarks(project_id);
CREATE INDEX idx_bookmarks_user ON project_bookmarks(user_id);
```

#### `project_views` (View Tracking)
```sql
CREATE TABLE project_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  duration INTEGER DEFAULT 0, -- seconds
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_views_project ON project_views(project_id);
CREATE INDEX idx_views_user ON project_views(user_id);
CREATE INDEX idx_views_date ON project_views(created_at DESC);
```

### 1.2 Supporting Tables

#### `organizations` (Organizations)
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  github_url TEXT,
  twitter_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
```

#### `project_documents` (Document Management)
```sql
CREATE TABLE project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- pdf, doc, md, etc.
  file_size INTEGER, -- bytes
  document_type TEXT NOT NULL CHECK (document_type IN ('specification', 'manual', 'report', 'presentation', 'other')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_project ON project_documents(project_id);
```

#### `project_gallery` (Media Gallery)
```sql
CREATE TABLE project_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gallery_project ON project_gallery(project_id);
```

---

## 2. ER Diagram

```
┌─────────────────┐       ┌──────────────────────┐
│   profiles      │       │   organizations      │
├─────────────────┤       ├──────────────────────┤
│ id (PK)         │◄──────│ id (PK)              │
│ email           │       │ name                 │
│ full_name       │       │ slug                 │
│ avatar_url      │       │ description          │
│ github_url      │       │ logo_url             │
│ linkedin_url    │       │ website_url          │
│ website_url      │       │ github_url           │
│ bio             │       │ twitter_url          │
│ created_at      │       │ created_at           │
│ updated_at      │       │ updated_at           │
└─────────────────┘       └──────────────────────┘
         │
         │
         │
┌────────▼─────────────────────────────────────────────────────────┐
│                          projects                                 │
├───────────────────────────────────────────────────────────────────┤
│ id (PK)                                                          │
│ title                                                            │
│ slug (UNIQUE)                                                    │
│ description                                                      │
│ overview                                                         │
│ problem_statement                                                │
│ solution                                                         │
│ architecture                                                     │
│ project_type (software/hardware/research/opensource/hackathon/hybrid)│
│ branch                                                           │
│ domains[]                                                        │
│ categories[]                                                     │
│ tags[]                                                           │
│ technologies (JSONB)                                              │
│ languages[]                                                      │
│ frameworks[]                                                     │
│ tools (JSONB)                                                    │
│ components (JSONB)                                               │
│ sensors (JSONB)                                                  │
│ microcontrollers (JSONB)                                         │
│ boards (JSONB)                                                   │
│ github_url                                                       │
│ demo_url                                                         │
│ documentation_url                                                │
│ video_url                                                        │
│ live_url                                                         │
│ cover_image                                                      │
│ gallery[]                                                        │
│ documents (JSONB)                                                │
│ creator_id (FK → profiles)                                       │
│ organization_id (FK → organizations)                             │
│ status (draft/published/archived)                                │
│ featured                                                         │
│ view_count                                                       │
│ like_count                                                       │
│ bookmark_count                                                   │
│ download_count                                                   │
│ fork_count                                                       │
│ star_count                                                       │
│ created_at                                                       │
│ updated_at                                                       │
│ published_at                                                     │
│ search_vector (TSVECTOR)                                         │
└───────────────────────────────────────────────────────────────────┘
         │
         │
         ├──────────────────────────────────────────────────────────────┐
         │                              │                               │
         │                              │                               │
┌────────▼─────────┐         ┌─────────▼──────────┐         ┌──────────▼──────────┐
│project_contributors│       │  project_metrics    │         │  project_documents   │
├──────────────────┤       ├────────────────────┤       ├─────────────────────┤
│ id (PK)          │       │ id (PK)            │       │ id (PK)             │
│ project_id (FK)  │       │ project_id (FK)    │       │ project_id (FK)     │
│ user_id (FK)     │       │ date               │       │ title               │
│ role             │       │ views              │       │ description         │
│ contribution_type│       │ unique_visitors    │       │ file_url            │
│ joined_at        │       │ likes              │       │ file_type           │
│ UNIQUE(project_id,│       │ bookmarks          │       │ file_size           │
│  user_id)        │       │ downloads          │       │ document_type       │
└──────────────────┘       │ shares             │       │ order_index         │
                          │ avg_time_on_page   │       │ created_at          │
                          │ bounce_rate        │       │ updated_at          │
                          │ sources (JSONB)    │       └─────────────────────┘
                          │ created_at         │
                          │ UNIQUE(project_id, │
                          │  date)             │
                          └────────────────────┘
         │
         │
         ├──────────────────────────────────────────────────────────────┐
         │                              │                               │
         │                              │                               │
┌────────▼─────────┐         ┌─────────▼──────────┐         ┌──────────▼──────────┐
│  project_likes   │       │ project_bookmarks   │       │   project_gallery    │
├──────────────────┤       ├────────────────────┤       ├─────────────────────┤
│ id (PK)          │       │ id (PK)            │       │ id (PK)             │
│ project_id (FK)  │       │ project_id (FK)    │       │ project_id (FK)     │
│ user_id (FK)     │       │ user_id (FK)       │       │ image_url           │
│ created_at       │       │ folder             │       │ caption             │
│ UNIQUE(project_id,│       │ notes              │       │ alt_text            │
│  user_id)        │       │ created_at         │       │ order_index         │
└──────────────────┘       │ UNIQUE(project_id, │       │ created_at          │
                          │  user_id)           │       └─────────────────────┘
                          └────────────────────┘
         │
         │
         │
┌────────▼─────────┐
│  project_views   │
├──────────────────┤
│ id (PK)          │
│ project_id (FK)  │
│ user_id (FK)     │
│ session_id       │
│ ip_address       │
│ user_agent       │
│ referrer         │
│ duration         │
│ created_at       │
└──────────────────┘
```

---

## 3. Supabase Table Design

### 3.1 Table Specifications

| Table | Purpose | Row Level Security | Triggers |
|-------|---------|-------------------|----------|
| `projects` | Main project entity | Yes | Updated_at, search_vector |
| `project_contributors` | Project team members | Yes | - |
| `project_metrics` | Daily analytics | Yes | - |
| `project_likes` | User likes | Yes | Update like_count |
| `project_bookmarks` | User bookmarks | Yes | Update bookmark_count |
| `project_views` | View tracking | Yes | Update view_count |
| `project_documents` | Project documents | Yes | - |
| `project_gallery` | Media gallery | Yes | - |
| `organizations` | Organizations | Yes | Updated_at |
| `profiles` | User profiles | Yes | Updated_at |

### 3.2 JSONB Field Schemas

#### `technologies` JSONB Structure
```json
{
  "frontend": ["React", "Next.js", "TailwindCSS"],
  "backend": ["Node.js", "Express", "PostgreSQL"],
  "database": ["PostgreSQL", "Redis"],
  "devops": ["Docker", "Kubernetes", "CI/CD"],
  "other": ["GraphQL", "WebSocket"]
}
```

#### `tools` JSONB Structure
```json
{
  "development": ["VS Code", "Git"],
  "testing": ["Jest", "Cypress"],
  "deployment": ["Vercel", "Netlify"],
  "monitoring": ["Sentry", "Datadog"],
  "design": ["Figma", "Adobe XD"]
}
```

#### `components` JSONB Structure (Hardware)
```json
{
  "sensors": [
    {"name": "DHT11", "quantity": 2, "purpose": "Temperature sensing"},
    {"name": "Ultrasonic", "quantity": 1, "purpose": "Distance measurement"}
  ],
  "actuators": [
    {"name": "Servo Motor", "quantity": 4, "purpose": "Movement control"}
  ],
  "power": [
    {"name": "Li-ion Battery", "specification": "3.7V 2000mAh"}
  ],
  "communication": [
    {"name": "ESP8266", "purpose": "WiFi connectivity"}
  ]
}
```

#### `documents` JSONB Structure
```json
{
  "specifications": [
    {"title": "Technical Spec", "url": "https://...", "type": "pdf"}
  ],
  "manuals": [
    {"title": "User Manual", "url": "https://...", "type": "pdf"}
  ],
  "reports": [
    {"title": "Project Report", "url": "https://...", "type": "pdf"}
  ]
}
```

### 3.3 Triggers

#### Updated_at Trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Search Vector Trigger
```sql
CREATE OR REPLACE FUNCTION update_project_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.overview, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.domains, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.categories, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.languages, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.frameworks, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_search_vector_update
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_project_search_vector();
```

#### Count Triggers
```sql
-- Like count
CREATE OR REPLACE FUNCTION update_project_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET like_count = like_count + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET like_count = like_count - 1 WHERE id = OLD.project_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_likes_count_trigger
  AFTER INSERT OR DELETE ON project_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_like_count();

-- Bookmark count
CREATE OR REPLACE FUNCTION update_project_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET bookmark_count = bookmark_count + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET bookmark_count = bookmark_count - 1 WHERE id = OLD.project_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_bookmarks_count_trigger
  AFTER INSERT OR DELETE ON project_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_bookmark_count();

-- View count (increment on insert)
CREATE OR REPLACE FUNCTION update_project_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects SET view_count = view_count + 1 WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_views_count_trigger
  AFTER INSERT ON project_views
  FOR EACH ROW
  EXECUTE FUNCTION update_project_view_count();
```

---

## 4. Storage Bucket Design

### 4.1 Bucket Structure

```
arpit-labs-storage/
├── projects/
│   ├── {project_id}/
│   │   ├── cover/
│   │   │   └── {filename}
│   │   ├── gallery/
│   │   │   ├── image1.jpg
│   │   │   ├── image2.png
│   │   │   └── ...
│   │   ├── documents/
│   │   │   ├── specs/
│   │   │   ├── manuals/
│   │   │   ├── reports/
│   │   │   └── presentations/
│   │   └── thumbnails/
│   │       └── {filename}
├── organizations/
│   ├── {organization_id}/
│   │   ├── logo/
│   │   └── banner/
└── profiles/
    ├── {user_id}/
    │   ├── avatar/
    │   └── portfolio/
```

### 4.2 Bucket Policies

#### `projects-cover` Bucket
- **Public Read**: Yes (for published projects)
- **Authenticated Write**: Yes (project creators/admins)
- **File Types**: jpg, jpeg, png, webp, gif
- **Max Size**: 5MB
- **Auto-transform**: Yes (resize to 1200x630)

#### `projects-gallery` Bucket
- **Public Read**: Yes (for published projects)
- **Authenticated Write**: Yes (project creators/admins)
- **File Types**: jpg, jpeg, png, webp, gif
- **Max Size**: 10MB per image
- **Auto-transform**: Yes (create thumbnails 400x300)

#### `projects-documents` Bucket
- **Public Read**: Yes (for published projects)
- **Authenticated Write**: Yes (project creators/admins)
- **File Types**: pdf, doc, docx, md, txt
- **Max Size**: 25MB
- **Auto-transform**: No

#### `organizations-logo` Bucket
- **Public Read**: Yes
- **Authenticated Write**: Yes (organization admins)
- **File Types**: jpg, jpeg, png, webp, svg
- **Max Size**: 2MB
- **Auto-transform**: Yes (resize to 200x200)

### 4.3 Storage Functions

```sql
-- Function to generate storage path
CREATE OR REPLACE FUNCTION generate_project_storage_path(
  project_id UUID,
  file_type TEXT,
  filename TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN 'projects/' || project_id || '/' || file_type || '/' || filename;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. API Architecture

### 5.1 REST API Endpoints

#### Projects
```
GET    /api/projects                    - List all published projects
GET    /api/projects/:id                - Get single project by ID
GET    /api/projects/slug/:slug        - Get single project by slug
GET    /api/projects/featured          - Get featured projects
GET    /api/projects/trending          - Get trending projects
GET    /api/projects/recent            - Get recent projects
GET    /api/projects/type/:type        - Filter by project type
GET    /api/projects/domain/:domain    - Filter by domain
GET    /api/projects/search?q=:query   - Search projects
POST   /api/projects                   - Create new project (auth)
PUT    /api/projects/:id               - Update project (auth)
DELETE /api/projects/:id               - Delete project (auth)
PATCH  /api/projects/:id/publish       - Publish project (auth)
PATCH  /api/projects/:id/archive       - Archive project (auth)
```

#### Project Interactions
```
POST   /api/projects/:id/like          - Like project (auth)
DELETE /api/projects/:id/like          - Unlike project (auth)
POST   /api/projects/:id/bookmark      - Bookmark project (auth)
DELETE /api/projects/:id/bookmark      - Remove bookmark (auth)
GET    /api/projects/:id/likes         - Get project likes
GET    /api/projects/:id/bookmarks     - Get project bookmarks
```

#### Project Contributors
```
GET    /api/projects/:id/contributors  - Get project contributors
POST   /api/projects/:id/contributors  - Add contributor (auth)
PUT    /api/projects/:id/contributors/:userId - Update contributor role (auth)
DELETE /api/projects/:id/contributors/:userId - Remove contributor (auth)
```

#### Project Media
```
POST   /api/projects/:id/gallery       - Upload gallery image (auth)
DELETE /api/projects/:id/gallery/:imageId - Delete gallery image (auth)
PUT    /api/projects/:id/gallery/:imageId - Update gallery image (auth)
POST   /api/projects/:id/documents    - Upload document (auth)
DELETE /api/projects/:id/documents/:docId - Delete document (auth)
```

#### Project Analytics
```
GET    /api/projects/:id/metrics       - Get project metrics (auth)
GET    /api/projects/:id/metrics/daily - Get daily metrics (auth)
POST   /api/projects/:id/views         - Track view (public)
```

### 5.2 GraphQL Schema (Alternative)

```graphql
type Project {
  id: ID!
  title: String!
  slug: String!
  description: String!
  overview: String
  problemStatement: String
  solution: String
  architecture: String
  projectType: ProjectType!
  branch: String
  domains: [String!]!
  categories: [String!]!
  tags: [String!]!
  technologies: JSON!
  languages: [String!]!
  frameworks: [String!]!
  tools: JSON!
  components: JSON!
  sensors: JSON!
  microcontrollers: JSON!
  boards: JSON!
  githubUrl: String
  demoUrl: String
  documentationUrl: String
  videoUrl: String
  liveUrl: String
  coverImage: String
  gallery: [String!]!
  documents: JSON!
  creator: Profile
  organization: Organization
  contributors: [ProjectContributor!]!
  status: ProjectStatus!
  featured: Boolean!
  viewCount: Int!
  likeCount: Int!
  bookmarkCount: Int!
  downloadCount: Int!
  forkCount: Int!
  starCount: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
  publishedAt: DateTime
}

enum ProjectType {
  SOFTWARE
  HARDWARE
  RESEARCH
  OPENSOURCE
  HACKATHON
  HYBRID
}

enum ProjectStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

type Query {
  projects(
    limit: Int = 20
    offset: Int = 0
    type: ProjectType
    status: ProjectStatus = PUBLISHED
    domain: String
    category: String
    tag: String
    search: String
    featured: Boolean
  ): [Project!]!
  
  project(id: ID!): Project
  projectBySlug(slug: String!): Project
  
  projectMetrics(projectId: ID!, startDate: Date, endDate: Date): [ProjectMetric!]!
}

type Mutation {
  createProject(input: CreateProjectInput!): Project!
  updateProject(id: ID!, input: UpdateProjectInput!): Project!
  deleteProject(id: ID!): Boolean!
  
  likeProject(projectId: ID!): Project!
  unlikeProject(projectId: ID!): Project!
  bookmarkProject(projectId: ID!, folder: String): Project!
  unbookmarkProject(projectId: ID!): Project!
  
  addContributor(projectId: ID!, userId: ID!, role: String!): ProjectContributor!
  removeContributor(projectId: ID!, userId: ID!): Boolean!
}
```

### 5.3 Response Formats

#### Project List Response
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Project Title",
      "slug": "project-title",
      "description": "Brief description",
      "projectType": "software",
      "coverImage": "https://...",
      "domains": ["web", "mobile"],
      "categories": ["fullstack"],
      "tags": ["react", "nodejs"],
      "creator": {
        "id": "uuid",
        "fullName": "John Doe",
        "avatarUrl": "https://..."
      },
      "status": "published",
      "featured": false,
      "viewCount": 150,
      "likeCount": 25,
      "bookmarkCount": 10,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasNext": true
  }
}
```

#### Single Project Response
```json
{
  "data": {
    "id": "uuid",
    "title": "Project Title",
    "slug": "project-title",
    "description": "Full description",
    "overview": "Project overview",
    "problemStatement": "Problem statement",
    "solution": "Solution description",
    "architecture": "Architecture details",
    "projectType": "software",
    "branch": "main",
    "domains": ["web", "mobile"],
    "categories": ["fullstack"],
    "tags": ["react", "nodejs", "postgresql"],
    "technologies": {
      "frontend": ["React", "Next.js"],
      "backend": ["Node.js", "Express"],
      "database": ["PostgreSQL"]
    },
    "languages": ["JavaScript", "TypeScript"],
    "frameworks": ["Next.js", "Express"],
    "tools": {
      "development": ["VS Code", "Git"],
      "testing": ["Jest"]
    },
    "githubUrl": "https://github.com/...",
    "demoUrl": "https://demo.example.com",
    "documentationUrl": "https://docs.example.com",
    "videoUrl": "https://youtube.com/...",
    "liveUrl": "https://example.com",
    "coverImage": "https://...",
    "gallery": ["https://...", "https://..."],
    "documents": {
      "specifications": [{"title": "Spec", "url": "https://..."}]
    },
    "creator": {
      "id": "uuid",
      "fullName": "John Doe",
      "avatarUrl": "https://...",
      "githubUrl": "https://github.com/..."
    },
    "organization": {
      "id": "uuid",
      "name": "Organization Name",
      "slug": "organization-name",
      "logoUrl": "https://..."
    },
    "contributors": [
      {
        "user": {
          "id": "uuid",
          "fullName": "Jane Doe",
          "avatarUrl": "https://..."
        },
        "role": "maintainer",
        "contributionType": ["backend", "devops"],
        "joinedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "status": "published",
    "featured": true,
    "viewCount": 1500,
    "likeCount": 250,
    "bookmarkCount": 100,
    "downloadCount": 50,
    "forkCount": 30,
    "starCount": 75,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z",
    "publishedAt": "2024-01-10T00:00:00Z"
  }
}
```

---

## 6. Permissions Model

### 6.1 Row Level Security (RLS) Policies

#### Projects Table
```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Public: Read published projects
CREATE POLICY "Public can view published projects"
  ON projects FOR SELECT
  USING (status = 'published');

-- Public: Read featured projects
CREATE POLICY "Public can view featured projects"
  ON projects FOR SELECT
  USING (featured = true AND status = 'published');

-- Authenticated: Read own projects (including drafts)
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = creator_id);

-- Authenticated: Insert projects
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Authenticated: Update own projects
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = creator_id);

-- Authenticated: Delete own projects
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = creator_id);

-- Admin: Full access
CREATE POLICY "Admins have full access to projects"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

#### Project Contributors Table
```sql
ALTER TABLE project_contributors ENABLE ROW LEVEL SECURITY;

-- Public: Read contributors for published projects
CREATE POLICY "Public can view contributors of published projects"
  ON project_contributors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_contributors.project_id
      AND projects.status = 'published'
    )
  );

-- Authenticated: Read contributors of own projects
CREATE POLICY "Users can view contributors of their projects"
  ON project_contributors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_contributors.project_id
      AND projects.creator_id = auth.uid()
    )
  );

-- Authenticated: Add contributors to own projects
CREATE POLICY "Users can add contributors to their projects"
  ON project_contributors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_contributors.project_id
      AND projects.creator_id = auth.uid()
    )
  );

-- Authenticated: Update contributors of own projects
CREATE POLICY "Users can update contributors of their projects"
  ON project_contributors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_contributors.project_id
      AND projects.creator_id = auth.uid()
    )
  );

-- Authenticated: Remove contributors from own projects
CREATE POLICY "Users can remove contributors from their projects"
  ON project_contributors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_contributors.project_id
      AND projects.creator_id = auth.uid()
    )
  );
```

#### Project Likes Table
```sql
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;

-- Public: Read like counts (aggregated)
CREATE POLICY "Public can view project likes"
  ON project_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_likes.project_id
      AND projects.status = 'published'
    )
  );

-- Authenticated: Insert own likes
CREATE POLICY "Authenticated users can like projects"
  ON project_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Authenticated: Delete own likes
CREATE POLICY "Users can unlike projects"
  ON project_likes FOR DELETE
  USING (auth.uid() = user_id);
```

#### Project Bookmarks Table
```sql
ALTER TABLE project_bookmarks ENABLE ROW LEVEL SECURITY;

-- Authenticated: Read own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON project_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated: Insert own bookmarks
CREATE POLICY "Authenticated users can bookmark projects"
  ON project_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Authenticated: Delete own bookmarks
CREATE POLICY "Users can remove bookmarks"
  ON project_bookmarks FOR DELETE
  USING (auth.uid() = user_id);
```

#### Project Views Table
```sql
ALTER TABLE project_views ENABLE ROW LEVEL SECURITY;

-- Public: Insert views (no auth required)
CREATE POLICY "Anyone can track project views"
  ON project_views FOR INSERT
  WITH CHECK (true);

-- Authenticated: Read views of own projects
CREATE POLICY "Users can view analytics of their projects"
  ON project_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_views.project_id
      AND projects.creator_id = auth.uid()
    )
  );
```

### 6.2 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Anonymous** | View published projects, track views, search projects |
| **Authenticated** | All anonymous permissions + create projects, like, bookmark, manage own projects |
| **Contributor** | All authenticated permissions + edit assigned projects (if added as contributor) |
| **Maintainer** | All contributor permissions + manage project settings, add/remove contributors |
| **Admin** | Full access to all projects and settings |

### 6.3 Organization-Based Access

```sql
-- Add organization role to profiles
ALTER TABLE profiles ADD COLUMN organization_role TEXT;

-- Policy for organization members
CREATE POLICY "Organization members can view organization projects"
  ON projects FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );
```

---

## 7. Search Indexing Strategy

### 7.1 Full-Text Search

#### PostgreSQL Full-Text Search
```sql
-- Search function
CREATE OR REPLACE FUNCTION search_projects(
  search_query TEXT,
  project_type_filter TEXT DEFAULT NULL,
  domain_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  slug TEXT,
  project_type TEXT,
  cover_image TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.slug,
    p.project_type,
    p.cover_image,
    ts_rank(p.search_vector, plainto_tsquery('english', search_query)) AS rank
  FROM projects p
  WHERE 
    p.status = 'published'
    AND p.search_vector @@ plainto_tsquery('english', search_query)
    AND (project_type_filter IS NULL OR p.project_type = project_type_filter)
    AND (domain_filter IS NULL OR domain_filter = ANY(p.domains))
  ORDER BY rank DESC, p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
```

### 7.2 Search Indexes

```sql
-- GIN index for full-text search
CREATE INDEX idx_projects_search_gin ON projects USING GIN(search_vector);

-- Trigram index for partial matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_projects_title_trgm ON projects USING GIN(title gin_trgm_ops);
CREATE INDEX idx_projects_description_trgm ON projects USING GIN(description gin_trgm_ops);

-- Composite indexes for common filters
CREATE INDEX idx_projects_type_status ON projects(project_type, status) WHERE status = 'published';
CREATE INDEX idx_projects_domain_status ON projects USING GIN(domains) WHERE status = 'published';
CREATE INDEX idx_projects_category_status ON projects USING GIN(categories) WHERE status = 'published';
CREATE INDEX idx_projects_tag_status ON projects USING GIN(tags) WHERE status = 'published';
```

### 7.3 Search Features

#### Autocomplete/Suggestions
```sql
CREATE OR REPLACE FUNCTION get_project_suggestions(
  partial_query TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  title TEXT,
  slug TEXT,
  project_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.title,
    p.slug,
    p.project_type
  FROM projects p
  WHERE 
    p.status = 'published'
    AND (
      p.title ILIKE '%' || partial_query || '%'
      OR p.slug ILIKE '%' || partial_query || '%'
      OR partial_query = ANY(p.tags)
    )
  ORDER BY 
    CASE WHEN p.title ILIKE partial_query || '%' THEN 0 ELSE 1 END,
    p.title
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

#### Advanced Filters
```sql
CREATE OR REPLACE FUNCTION search_projects_advanced(
  search_query TEXT DEFAULT NULL,
  project_types TEXT[] DEFAULT NULL,
  domains TEXT[] DEFAULT NULL,
  categories TEXT[] DEFAULT NULL,
  tags TEXT[] DEFAULT NULL,
  languages TEXT[] DEFAULT NULL,
  frameworks TEXT[] DEFAULT NULL,
  featured_only BOOLEAN DEFAULT FALSE,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  slug TEXT,
  project_type TEXT,
  cover_image TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.slug,
    p.project_type,
    p.cover_image,
    COALESCE(
      ts_rank(p.search_vector, plainto_tsquery('english', search_query)),
      0
    ) AS rank
  FROM projects p
  WHERE 
    p.status = 'published'
    AND (search_query IS NULL OR p.search_vector @@ plainto_tsquery('english', search_query))
    AND (project_types IS NULL OR p.project_type = ANY(project_types))
    AND (domains IS NULL OR p.domains && domains)
    AND (categories IS NULL OR p.categories && categories)
    AND (tags IS NULL OR p.tags && tags)
    AND (languages IS NULL OR p.languages && languages)
    AND (frameworks IS NULL OR p.frameworks && frameworks)
    AND (NOT featured_only OR p.featured = true)
  ORDER BY 
    rank DESC,
    p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
```

### 7.4 Search Analytics

```sql
-- Track search queries
CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_queries_query ON search_queries(query);
CREATE INDEX idx_search_queries_created ON search_queries(created_at DESC);
```

---

## 8. Analytics Strategy

### 8.1 Metrics Collection

#### Real-time Metrics
- **View Count**: Incremented on every page view (with deduplication)
- **Unique Visitors**: Tracked via session ID or user ID
- **Engagement Time**: Time spent on project page
- **Bounce Rate**: Single-page session percentage

#### Aggregated Metrics
- **Daily Views**: Total views per day
- **Weekly Trends**: 7-day rolling averages
- **Monthly Reports**: Monthly summaries
- **Year-over-Year**: Yearly comparisons

### 8.2 Metrics Storage

#### Daily Aggregation
```sql
-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION aggregate_daily_metrics()
RETURNS VOID AS $$
DECLARE
  project_record RECORD;
  date_record DATE := CURRENT_DATE;
BEGIN
  FOR project_record IN 
    SELECT DISTINCT project_id FROM project_views
    WHERE DATE(created_at) = date_record
  LOOP
    INSERT INTO project_metrics (
      project_id,
      date,
      views,
      unique_visitors,
      sources
    )
    SELECT 
      project_record.project_id,
      date_record,
      COUNT(*),
      COUNT(DISTINCT COALESCE(user_id, session_id)),
      json_object_agg(
        COALESCE(referrer, 'direct'),
        COUNT(*)
      )
    FROM project_views
    WHERE 
      project_id = project_record.project_id
      AND DATE(created_at) = date_record
    GROUP BY project_id, date_record
    ON CONFLICT (project_id, date) 
    DO UPDATE SET
      views = EXCLUDED.views,
      unique_visitors = EXCLUDED.unique_visitors,
      sources = EXCLUDED.sources;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 8.3 Analytics Queries

#### Project Performance
```sql
CREATE OR REPLACE FUNCTION get_project_performance(
  project_id UUID,
  days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  views INTEGER,
  unique_visitors INTEGER,
  likes INTEGER,
  bookmarks INTEGER,
  downloads INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.date,
    m.views,
    m.unique_visitors,
    m.likes,
    m.bookmarks,
    m.downloads
  FROM project_metrics m
  WHERE 
    m.project_id = project_id
    AND m.date >= CURRENT_DATE - INTERVAL '1 day' * days
  ORDER BY m.date DESC;
END;
$$ LANGUAGE plpgsql;
```

#### Trending Projects
```sql
CREATE OR REPLACE FUNCTION get_trending_projects(
  days INTEGER DEFAULT 7,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  project_type TEXT,
  cover_image TEXT,
  view_count INTEGER,
  like_count INTEGER,
  trend_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.project_type,
    p.cover_image,
    p.view_count,
    p.like_count,
    (
      -- Trending score: weighted combination of recent views and likes
      (COALESCE(SUM(m.views), 0) * 1.0) +
      (COALESCE(SUM(m.likes), 0) * 2.0) +
      (COALESCE(SUM(m.bookmarks), 0) * 3.0)
    ) / NULLIF(days, 0) AS trend_score
  FROM projects p
  LEFT JOIN project_metrics m ON p.id = m.project_id 
    AND m.date >= CURRENT_DATE - INTERVAL '1 day' * days
  WHERE 
    p.status = 'published'
  GROUP BY p.id, p.title, p.slug, p.project_type, p.cover_image, p.view_count, p.like_count
  ORDER BY trend_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

### 8.4 Analytics Dashboard Data

#### Overview Stats
```sql
CREATE OR REPLACE FUNCTION get_analytics_overview()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_projects', (SELECT COUNT(*) FROM projects WHERE status = 'published'),
    'total_views', (SELECT SUM(view_count) FROM projects WHERE status = 'published'),
    'total_likes', (SELECT SUM(like_count) FROM projects WHERE status = 'published'),
    'total_bookmarks', (SELECT SUM(bookmark_count) FROM projects WHERE status = 'published'),
    'active_projects', (SELECT COUNT(*) FROM projects WHERE status = 'published' AND updated_at > NOW() - INTERVAL '30 days'),
    'featured_projects', (SELECT COUNT(*) FROM projects WHERE featured = true AND status = 'published'),
    'project_types', (
      SELECT json_object_agg(project_type, count)
      FROM (
        SELECT project_type, COUNT(*) as count
        FROM projects
        WHERE status = 'published'
        GROUP BY project_type
      ) t
    ),
    'top_domains', (
      SELECT json_object_agg(domain, count)
      FROM (
        SELECT unnest(domains) as domain, COUNT(*) as count
        FROM projects
        WHERE status = 'published'
        GROUP BY domain
        ORDER BY count DESC
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 8.5 Privacy & GDPR Compliance

#### Data Anonymization
```sql
-- Function to anonymize old view data
CREATE OR REPLACE FUNCTION anonymize_old_views(days_to_keep INTEGER DEFAULT 90)
RETURNS VOID AS $$
BEGIN
  UPDATE project_views
  SET 
    ip_address = NULL,
    user_agent = NULL,
    session_id = NULL
  WHERE 
    created_at < NOW() - INTERVAL '1 day' * days_to_keep;
END;
$$ LANGUAGE plpgsql;
```

#### User Data Export
```sql
CREATE OR REPLACE FUNCTION export_user_project_data(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'projects', (
      SELECT json_agg(json_build_object(
        'id', id,
        'title', title,
        'slug', slug,
        'created_at', created_at
      ))
      FROM projects
      WHERE creator_id = user_id
    ),
    'likes', (
      SELECT json_agg(json_build_object(
        'project_id', project_id,
        'created_at', created_at
      ))
      FROM project_likes
      WHERE user_id = user_id
    ),
    'bookmarks', (
      SELECT json_agg(json_build_object(
        'project_id', project_id,
        'folder', folder,
        'notes', notes,
        'created_at', created_at
      ))
      FROM project_bookmarks
      WHERE user_id = user_id
    ),
    'contributions', (
      SELECT json_agg(json_build_object(
        'project_id', project_id,
        'role', role,
        'joined_at', joined_at
      ))
      FROM project_contributors
      WHERE user_id = user_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Migration Strategy

### 9.1 Migration from Existing Projects Table

```sql
-- Migration script to upgrade existing projects table
BEGIN;

-- Add new columns
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS project_type TEXT NOT NULL DEFAULT 'software' CHECK (project_type IN ('software', 'hardware', 'research', 'opensource', 'hackathon', 'hybrid')),
  ADD COLUMN IF NOT EXISTS branch TEXT,
  ADD COLUMN IF NOT EXISTS domains TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS technologies JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS frameworks TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tools JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sensors JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS microcontrollers JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS boards JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS documentation_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS live_url TEXT,
  ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bookmark_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fork_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS star_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Migrate existing data
UPDATE projects 
SET 
  project_type = 'software',
  technologies = jsonb_build_object(
    'stack', tech_stack
  ),
  languages = tech_stack,
  view_count = 0,
  like_count = 0,
  bookmark_count = 0,
  download_count = 0,
  fork_count = 0,
  star_count = 0
WHERE project_type IS NULL;

-- Update search vectors
UPDATE projects 
SET search_vector = to_tsvector('english', 
  COALESCE(title, '') || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '')
);

COMMIT;
```

### 9.2 Rollback Strategy

```sql
-- Rollback script
BEGIN;

-- Remove new columns
ALTER TABLE projects 
  DROP COLUMN IF EXISTS project_type,
  DROP COLUMN IF EXISTS branch,
  DROP COLUMN IF EXISTS domains,
  DROP COLUMN IF EXISTS categories,
  DROP COLUMN IF EXISTS technologies,
  DROP COLUMN IF EXISTS languages,
  DROP COLUMN IF EXISTS frameworks,
  DROP COLUMN IF EXISTS tools,
  DROP COLUMN IF EXISTS components,
  DROP COLUMN IF EXISTS sensors,
  DROP COLUMN IF EXISTS microcontrollers,
  DROP COLUMN IF EXISTS boards,
  DROP COLUMN IF EXISTS documentation_url,
  DROP COLUMN IF EXISTS video_url,
  DROP COLUMN IF EXISTS live_url,
  DROP COLUMN IF EXISTS documents,
  DROP COLUMN IF EXISTS creator_id,
  DROP COLUMN IF EXISTS organization_id,
  DROP COLUMN IF EXISTS view_count,
  DROP COLUMN IF EXISTS like_count,
  DROP COLUMN IF EXISTS bookmark_count,
  DROP COLUMN IF EXISTS download_count,
  DROP COLUMN IF EXISTS fork_count,
  DROP COLUMN IF EXISTS star_count,
  DROP COLUMN IF EXISTS published_at,
  DROP COLUMN IF EXISTS search_vector;

COMMIT;
```

---

## 10. Performance Optimization

### 10.1 Database Indexes Summary

| Index | Type | Purpose |
|-------|------|---------|
| `idx_projects_slug` | B-tree | Unique slug lookups |
| `idx_projects_type` | B-tree | Project type filtering |
| `idx_projects_status` | B-tree | Status filtering |
| `idx_projects_creator` | B-tree | User's projects |
| `idx_projects_tags` | GIN | Tag array search |
| `idx_projects_domains` | GIN | Domain array search |
| `idx_projects_categories` | GIN | Category array search |
| `idx_projects_search` | GIN | Full-text search |
| `idx_projects_featured` | B-tree (partial) | Featured projects |
| `idx_projects_created` | B-tree | Recent projects |
| `idx_projects_title_trgm` | GIN (trigram) | Title autocomplete |
| `idx_projects_description_trgm` | GIN (trigram) | Description search |

### 10.2 Query Optimization

#### Connection Pooling
- Use Supabase connection pooling
- Configure pool size based on expected load
- Implement query timeout limits

#### Caching Strategy
- Cache frequently accessed projects
- Cache search results
- Cache analytics aggregations
- Use CDN for media assets

#### Materialized Views
```sql
-- Materialized view for trending projects
CREATE MATERIALIZED VIEW trending_projects_mv AS
SELECT 
  p.id,
  p.title,
  p.slug,
  p.project_type,
  p.cover_image,
  p.view_count,
  p.like_count,
  p.bookmark_count,
  (
    (p.view_count * 1.0) +
    (p.like_count * 2.0) +
    (p.bookmark_count * 3.0)
  ) / EXTRACT(DAY FROM NOW() - p.created_at) AS trend_score
FROM projects p
WHERE p.status = 'published'
ORDER BY trend_score DESC;

CREATE INDEX idx_trending_projects_score ON trending_projects_mv(trend_score DESC);

-- Refresh strategy
REFRESH MATERIALIZED VIEW CONCURRENTLY trending_projects_mv;
```

---

## 11. Security Considerations

### 11.1 Input Validation

```sql
-- Function to validate project data
CREATE OR REPLACE FUNCTION validate_project_data(project_data JSON)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate required fields
  IF NOT (project_data ? 'title' AND project_data ? 'description') THEN
    RETURN FALSE;
  END IF;
  
  -- Validate slug format
  IF project_data ? 'slug' AND NOT (project_data->>'slug' ~ '^[a-z0-9-]+$') THEN
    RETURN FALSE;
  END IF;
  
  -- Validate project type
  IF project_data ? 'project_type' AND 
     NOT (project_data->>'project_type' IN ('software', 'hardware', 'research', 'opensource', 'hackathon', 'hybrid')) THEN
    RETURN FALSE;
  END IF;
  
  -- Validate URLs
  IF project_data ? 'github_url' AND 
     NOT (project_data->>'github_url' ~ '^https?://github\.com/') THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Rate Limiting

```sql
-- Rate limiting table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- user_id or ip_address
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  identifier TEXT,
  endpoint TEXT,
  max_requests INTEGER DEFAULT 100,
  window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ := NOW() - INTERVAL '1 minute' * window_minutes;
BEGIN
  -- Clean old records
  DELETE FROM rate_limits WHERE window_start < window_start;
  
  -- Get or create rate limit record
  SELECT request_count INTO current_count
  FROM rate_limits
  WHERE identifier = rate_limits.identifier
    AND endpoint = rate_limits.endpoint
    AND window_start >= window_start;
  
  IF current_count IS NULL THEN
    INSERT INTO rate_limits (identifier, endpoint, window_start)
    VALUES (identifier, endpoint, NOW());
    RETURN TRUE;
  ELSIF current_count < max_requests THEN
    UPDATE rate_limits
    SET request_count = request_count + 1
    WHERE identifier = rate_limits.identifier
      AND endpoint = rate_limits.endpoint
      AND window_start >= window_start;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 12. Monitoring & Alerting

### 12.1 Health Checks

```sql
-- Health check function
CREATE OR REPLACE FUNCTION system_health_check()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'database', (SELECT COUNT(*) > 0 FROM projects),
    'projects_count', (SELECT COUNT(*) FROM projects),
    'published_projects', (SELECT COUNT(*) FROM projects WHERE status = 'published'),
    'recent_activity', (SELECT COUNT(*) FROM projects WHERE updated_at > NOW() - INTERVAL '24 hours'),
    'storage_healthy', true, -- Add storage check
    'search_healthy', true -- Add search check
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 12.2 Performance Metrics

```sql
-- Query performance monitoring
CREATE TABLE query_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_name TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  rows_affected INTEGER,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_query_performance_timestamp ON query_performance(timestamp DESC);
```

---

## 13. Summary

This Universal Project Data Model provides:

1. **Comprehensive Schema**: Supports all project types with extensible fields
2. **Robust Relationships**: Proper foreign keys and constraints
3. **Advanced Search**: Full-text search with filters and autocomplete
4. **Detailed Analytics**: Real-time and aggregated metrics
5. **Secure Permissions**: Role-based access with RLS policies
6. **Scalable Storage**: Organized bucket structure with policies
7. **Performance Optimized**: Strategic indexes and materialized views
8. **Production Ready**: Security, monitoring, and migration strategies

The model is designed to be:
- **Flexible**: JSONB fields for extensibility
- **Performant**: Strategic indexing and caching
- **Secure**: Comprehensive RLS policies
- **Scalable**: Materialized views and connection pooling
- **Maintainable**: Clear structure and documentation
