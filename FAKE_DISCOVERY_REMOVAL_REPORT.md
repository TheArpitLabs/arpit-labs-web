# Fake Discovery Removal Report

Date: 2026-06-18

## Removed Execution Path

`scripts/populate-domain-content.js` is deprecated and hard-disabled.

The script now exits immediately with code `1` before:

- loading Supabase credentials
- generating synthetic projects
- creating `github.com/example` URLs
- inserting records into `projects`

## What Was Fake

The legacy script generated:

- synthetic project titles
- synthetic descriptions
- fake GitHub URLs
- fake demo URLs
- random view counts
- random like counts
- bulk records based on target counts

## What Was Preserved

- Historical data was not deleted.
- Existing project pages were not modified.
- Authentication was not modified.
- Admin permissions were not modified.
- The old fake generator body was removed from the script.

## Verification

Command:

```bash
node scripts/populate-domain-content.js
```

Result:

```text
scripts/populate-domain-content.js is deprecated and disabled.
It generated fake projects and must not be used for production data.
Use the real GitHub discovery engine in /admin/discovery instead.
```
