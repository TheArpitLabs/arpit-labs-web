# Arpit Labs - API Documentation

**Version**: 1.0  
**Base URL**: `https://arpitlabs.com/api`  
**Last Updated**: June 22, 2026

This document provides comprehensive API documentation for the Arpit Labs platform.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Common Headers](#common-headers)
3. [Error Responses](#error-responses)
4. [Rate Limiting](#rate-limiting)
5. [API Endpoints](#api-endpoints)
6. [Webhooks](#webhooks)

---

## Authentication

### API Key Authentication

Most endpoints require authentication using an API key.

```http
Authorization: Bearer YOUR_API_KEY
```

### Session Authentication

For user-specific endpoints, use session authentication:

```http
Cookie: session_id=YOUR_SESSION_ID
```

### CSRF Protection

All state-changing requests (POST, PUT, DELETE, PATCH) must include a CSRF token:

```http
X-CSRF-Token: YOUR_CSRF_TOKEN
```

Get CSRF token from: `GET /api/csrf/token`

---

## Common Headers

### Required Headers

```http
Content-Type: application/json
Accept: application/json
User-Agent: YourApp/1.0
```

### Optional Headers

```http
X-Request-ID: unique-request-id
X-Client-Version: 1.0.0
X-Client-Platform: web
```

---

## Error Responses

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "status": 400,
  "timestamp": 1719086400000,
  "requestId": "req_123456789"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED_ERROR` | 401 | Authentication required |
| `FORBIDDEN_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND_ERROR` | 404 | Resource not found |
| `RATE_LIMIT_ERROR` | 429 | Rate limit exceeded |
| `SERVER_ERROR` | 500 | Internal server error |
| `CSRF_ERROR` | 403 | Invalid CSRF token |
| `NETWORK_ERROR` | 503 | Network or service unavailable |

---

## Rate Limiting

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1719087000
```

### Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| Public endpoints | 100/hour | 1 hour |
| Authenticated | 1000/hour | 1 hour |
| Admin endpoints | 500/hour | 1 hour |
| Webhooks | 10/minute | 1 minute |

---

## API Endpoints

### Authentication

#### Get CSRF Token

```http
GET /api/csrf/token
```

**Response:**

```json
{
  "token": "csrf_token_string",
  "expiresAt": 1719087000000
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json
X-CSRF-Token: YOUR_CSRF_TOKEN

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "token": "session_token",
    "expiresAt": 1719090000000
  }
}
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer YOUR_SESSION_TOKEN
X-CSRF-Token: YOUR_CSRF_TOKEN
```

**Response:**

```json
{
  "success": true
}
```

#### Register

```http
POST /api/auth/register
Content-Type: application/json
X-CSRF-Token: YOUR_CSRF_TOKEN

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

### User Management

#### Get Current User

```http
GET /api/user/me
Authorization: Bearer YOUR_SESSION_TOKEN
```

**Response:**

```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "preferences": {
    "theme": "dark",
    "language": "en",
    "notifications": true
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-06-22T00:00:00Z"
}
```

#### Update User Profile

```http
PATCH /api/user/me
Authorization: Bearer YOUR_SESSION_TOKEN
X-CSRF-Token: YOUR_CSRF_TOKEN
Content-Type: application/json

{
  "name": "John Smith",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Smith",
    "avatar": "https://example.com/new-avatar.jpg"
  }
}
```

#### Update User Preferences

```http
PATCH /api/user/me/preferences
Authorization: Bearer YOUR_SESSION_TOKEN
X-CSRF-Token: YOUR_CSRF_TOKEN
Content-Type: application/json

{
  "theme": "light",
  "language": "es",
  "notifications": false
}
```

**Response:**

```json
{
  "success": true,
  "preferences": {
    "theme": "light",
    "language": "es",
    "notifications": false
  }
}
```

---

### Projects

#### List Projects

```http
GET /api/projects?page=1&pageSize=20&search=react&sort=stars
Authorization: Bearer YOUR_SESSION_TOKEN
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| pageSize | integer | Items per page (default: 20, max: 100) |
| search | string | Search query |
| sort | string | Sort field (stars, forks, updated) |
| order | string | Sort order (asc, desc) |
| category | string | Filter by category |
| language | string | Filter by programming language |

**Response:**

```json
{
  "data": [
    {
      "id": "proj_123",
      "name": "React App",
      "description": "A modern React application",
      "url": "https://github.com/user/react-app",
      "stars": 1234,
      "forks": 56,
      "language": "TypeScript",
      "category": "frontend",
      "updatedAt": "2024-06-22T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

#### Get Project Details

```http
GET /api/projects/:id
Authorization: Bearer YOUR_SESSION_TOKEN
```

**Response:**

```json
{
  "id": "proj_123",
  "name": "React App",
  "description": "A modern React application",
  "url": "https://github.com/user/react-app",
  "stars": 1234,
  "forks": 56,
  "language": "TypeScript",
  "category": "frontend",
  "tags": ["react", "typescript", "frontend"],
  "contributors": [
    {
      "id": "user_456",
      "name": "Jane Doe",
      "avatar": "https://example.com/avatar.jpg"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-06-22T00:00:00Z"
}
```

#### Create Project

```http
POST /api/projects
Authorization: Bearer YOUR_SESSION_TOKEN
X-CSRF-Token: YOUR_CSRF_TOKEN
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description",
  "url": "https://github.com/user/new-project",
  "category": "frontend",
  "language": "TypeScript",
  "tags": ["react", "typescript"]
}
```

**Response:**

```json
{
  "success": true,
  "project": {
    "id": "proj_456",
    "name": "New Project",
    "description": "Project description",
    "url": "https://github.com/user/new-project",
    "category": "frontend",
    "language": "TypeScript",
    "tags": ["react", "typescript"],
    "createdAt": "2024-06-22T00:00:00Z"
  }
}
```

#### Update Project

```http
PATCH /api/projects/:id
Authorization: Bearer YOUR_SESSION_TOKEN
X-CSRF-Token: YOUR_CSRF_TOKEN
Content-Type: application/json

{
  "description": "Updated description",
  "tags": ["react", "typescript", "v2"]
}
```

**Response:**

```json
{
  "success": true,
  "project": {
    "id": "proj_123",
    "description": "Updated description",
    "tags": ["react", "typescript", "v2"],
    "updatedAt": "2024-06-22T12:00:00Z"
  }
}
```

#### Delete Project

```http
DELETE /api/projects/:id
Authorization: Bearer YOUR_SESSION_TOKEN
X-CSRF-Token: YOUR_CSRF_TOKEN
```

**Response:**

```json
{
  "success": true
}
```

---

### Learning

#### Get Learning Paths

```http
GET /api/learning/paths
Authorization: Bearer YOUR_SESSION_TOKEN
```

**Response:**

```json
{
  "data": [
    {
      "id": "path_123",
      "name": "React Developer Path",
      "description": "Complete React development learning path",
      "level": "intermediate",
      "duration": 40,
      "skills": ["react", "typescript", "nextjs"],
      "progress": 25
    }
  ]
}
```

#### Get Learning Progress

```http
GET /api/learning/progress
Authorization: Bearer YOUR_SESSION_TOKEN
```

**Response:**

```json
{
  "currentPath": {
    "id": "path_123",
    "name": "React Developer Path",
    "progress": 25
  },
  "completedSkills": ["javascript", "html", "css"],
  "totalHours": 40,
  "completedHours": 10,
  "certificates": []
}
```

#### Update Learning Progress

```http
POST /api/learning/progress
Authorization: Bearer YOUR_SESSION_TOKEN
X-CSRF-Token: YOUR_CSRF_TOKEN
Content-Type: application/json

{
  "pathId": "path_123",
  "skillId": "skill_456",
  "completed": true
}
```

**Response:**

```json
{
  "success": true,
  "progress": {
    "pathId": "path_123",
    "skillId": "skill_456",
    "completedAt": "2024-06-22T00:00:00Z"
  }
}
```

---

### Admin

#### Get Admin Dashboard Stats

```http
GET /api/admin/stats
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response:**

```json
{
  "users": {
    "total": 1000,
    "active": 850,
    "newThisWeek": 50
  },
  "projects": {
    "total": 500,
    "pending": 20,
    "approved": 480
  },
  "learning": {
    "activePaths": 150,
    "completedPaths": 300,
    "totalHours": 5000
  },
  "system": {
    "uptime": 99.9,
    "responseTime": 150,
    "errors": 5
  }
}
```

#### Approve Project

```http
POST /api/admin/projects/:id/approve
Authorization: Bearer YOUR_ADMIN_TOKEN
X-CSRF-Token: YOUR_CSRF_TOKEN
```

**Response:**

```json
{
  "success": true,
  "project": {
    "id": "proj_123",
    "status": "approved",
    "approvedAt": "2024-06-22T00:00:00Z"
  }
}
```

#### Reject Project

```http
POST /api/admin/projects/:id/reject
Authorization: Bearer YOUR_ADMIN_TOKEN
X-CSRF-Token: YOUR_CSRF_TOKEN
Content-Type: application/json

{
  "reason": "Does not meet quality standards"
}
```

**Response:**

```json
{
  "success": true,
  "project": {
    "id": "proj_123",
    "status": "rejected",
    "rejectedAt": "2024-06-22T00:00:00Z",
    "reason": "Does not meet quality standards"
  }
}
```

---

### Search

#### Search

```http
GET /api/search?q=react&type=projects&page=1
Authorization: Bearer YOUR_SESSION_TOKEN
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (required) |
| type | string | Search type (projects, users, learning) |
| page | integer | Page number |
| filters | string | JSON encoded filters |

**Response:**

```json
{
  "results": [
    {
      "type": "project",
      "id": "proj_123",
      "name": "React App",
      "description": "A modern React application",
      "score": 0.95
    }
  ],
  "total": 25,
  "page": 1,
  "totalPages": 3
}
```

---

## Webhooks

### Webhook Events

| Event | Description |
|-------|-------------|
| `user.created` | New user registered |
| `user.updated` | User profile updated |
| `project.created` | New project created |
| `project.approved` | Project approved |
| `project.rejected` | Project rejected |
| `learning.completed` | Learning path completed |

### Webhook Payload

```json
{
  "event": "project.created",
  "timestamp": 1719086400000,
  "data": {
    "id": "proj_123",
    "name": "React App",
    "url": "https://github.com/user/react-app"
  },
  "signature": "sha256=..."
}
```

### Verify Webhook Signature

```typescript
import crypto from 'crypto';

const verifyWebhook = (payload: string, signature: string, secret: string): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
};
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { ArpitLabsAPI } from '@arpitlabs/sdk';

const api = new ArpitLabsAPI({
  apiKey: 'your-api-key',
  baseUrl: 'https://arpitlabs.com/api'
});

// Get projects
const projects = await api.projects.list({
  page: 1,
  pageSize: 20,
  search: 'react'
});

// Create project
const project = await api.projects.create({
  name: 'New Project',
  description: 'Description',
  url: 'https://github.com/user/project'
});
```

### Python

```python
from arpitlabs import ArpitLabsAPI

api = ArpitLabsAPI(api_key='your-api-key')

# Get projects
projects = api.projects.list(page=1, page_size=20, search='react')

# Create project
project = api.projects.create(
    name='New Project',
    description='Description',
    url='https://github.com/user/project'
)
```

### cURL

```bash
# Get projects
curl -X GET "https://arpitlabs.com/api/projects?page=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"

# Create project
curl -X POST "https://arpitlabs.com/api/projects" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "name": "New Project",
    "description": "Description",
    "url": "https://github.com/user/project"
  }'
```

---

## Testing

### Sandbox Environment

For testing, use the sandbox environment:

- **Base URL**: `https://sandbox.arpitlabs.com/api`
- **API Key**: Use your sandbox API key
- **Rate Limits**: Higher limits for testing

### Test Data

Use test data prefixes:
- Emails: `test+user@example.com`
- Project names: `Test Project`
- URLs: `https://github.com/test/project`

---

## Support

- **Documentation**: https://docs.arpitlabs.com
- **API Status**: https://status.arpitlabs.com
- **Support Email**: api-support@arpitlabs.com
- **GitHub Issues**: https://github.com/arpitlabs/api/issues

---

**Last Updated**: June 22, 2026  
**API Version**: 1.0  
**Maintained By**: Arpit Labs API Team
