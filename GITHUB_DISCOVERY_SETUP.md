# GitHub Discovery Engine Setup Guide

## Purpose

Enable authenticated GitHub API access for the Arpit Labs Discovery Engine and avoid GitHub rate-limit errors.

## Token Configuration

### Generate GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Configure the token:

**Token Name:** `Arpit Labs Discovery Engine`

**Expiration:** `1 Year` (or No expiration for long-term use)

**Required Scopes** - Select ONLY:
- ✅ `public_repo`
- ✅ `read:user`
- ✅ `read:org`

**Do NOT select:**
- ❌ `repo` (full control)
- ❌ `delete_repo`
- ❌ `admin:org`
- ❌ `workflow`
- ❌ `packages`
- ❌ `enterprise permissions`
- ❌ `billing permissions`
- ❌ `audit_log`
- ❌ `codespaces`

4. Click "Generate token"
5. **Copy the token immediately** - it won't be shown again

## Environment Variables

### Local Development

Create or update `.env.local` in your project root:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxx
```

Replace `ghp_xxxxxxxxxxxxxxxxxxxxxxxxx` with your actual token.

### Vercel Deployment

1. Go to Vercel Project Settings → Environment Variables
2. Add new variable:
   - **Key:** `GITHUB_TOKEN`
   - **Value:** Your GitHub token
3. Redeploy after saving.

## Verify Token Configuration

### Check Token is Loaded

When the application starts, you should see in the console:
```
GitHub Auth: Loaded
```

If you see `GitHub Auth: Missing`, the environment variable is not set correctly.

### Verify GitHub API Rate Limit

Run this command to verify your token is working:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
https://api.github.com/rate_limit
```

**Expected response with authenticated token:**
```json
{
  "rate": {
    "limit": 5000,
    "used": 0,
    "remaining": 5000,
    "reset": 1234567890
  }
}
```

**If limit shows 60**, the application is not loading the token correctly - unauthenticated requests only get 60 requests/hour.

## Database Setup

### Run Migrations

The following tables are required for the discovery engine:

1. `discovery_runs` - Tracks individual discovery runs
2. `discovery_logs` - Stores detailed logs from discovery operations

Run the migrations:

```bash
# Apply the discovery runs table migration
supabase db push

# Or apply specific migration
supabase migration up
```

## Testing the Discovery Engine

### Test Run with Small Dataset

1. Start the application
2. Navigate to the Discovery Engine admin panel
3. Configure with small limits for testing:
   - Categories: 1-2 categories
   - Max results per category: 5-10
   - Min stars: 100
4. Run discovery
5. Check the console for `GitHub Auth: Loaded`
6. Monitor the discovery runs table for results

### Monitor Rate Limit Usage

After running discovery, check your remaining rate limit:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
https://api.github.com/rate_limit
```

## Troubleshooting

### "GitHub Auth: Missing" in console

- Check that `.env.local` exists in the project root
- Verify the variable name is exactly `GITHUB_TOKEN`
- Restart the application after adding the variable
- For Vercel, check environment variables are set and redeploy

### Rate limit still shows 60

- Verify the token has the correct scopes
- Check the token hasn't expired
- Ensure the application is reading the environment variable
- Check for typos in the token value

### Discovery fails with API errors

- Check the GitHub API status page
- Verify your token hasn't been revoked
- Check the discovery logs table for detailed error messages
- Ensure the token has the required scopes

## Security Notes

- **Never commit** your GitHub token to version control
- Add `.env.local` to `.gitignore` (already done)
- Rotate tokens periodically for security
- Use the minimum required scopes
- Monitor token usage in GitHub settings

## Next Steps After Setup

1. ✅ Generate GitHub PAT with correct scopes
2. ✅ Add GITHUB_TOKEN to environment variables
3. ✅ Verify 5000 request limit
4. ✅ Run database migrations
5. ✅ Run test discovery (20 repositories)
6. ⏳ Audit existing 7036 projects
7. ⏳ Remove placeholder/example repositories
8. ⏳ Enable production discovery jobs

## Current Status

- ✅ Environment variable configured in `.env.example`
- ✅ Octokit configured to use `GITHUB_TOKEN`
- ✅ Startup verification logging added
- ✅ Database tables created (discovery_runs, discovery_logs)
- ⏳ Awaiting user to generate and add actual token
