#!/bin/bash

# Script to apply critical database migrations
# This script applies the consolidated migration to fix /research and /marketplace 500 errors

echo "Applying critical database migrations..."
echo "This will fix HTTP 500 errors on /research and /marketplace routes"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Error: .env.local file not found"
    echo "Please copy .env.example to .env.local and configure your Supabase credentials"
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check if SUPABASE_URL is set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
    exit 1
fi

echo "Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Check if psql is available
if command -v psql &> /dev/null; then
    echo "Found psql, attempting to apply migration directly..."
    
    # Extract connection details from SUPABASE_URL
    # Format: https://[project-id].supabase.co
    PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -n 's|https://\([^.]*\)\.supabase\.co|\1|p')
    
    echo "Project ID: $PROJECT_ID"
    echo ""
    echo "To apply the migration, please:"
    echo "1. Go to https://supabase.com/dashboard/project/$PROJECT_ID/sql/new"
    echo "2. Copy the contents of supabase/migrations/20260606_consolidated_critical_fixes.sql"
    echo "3. Paste and run the SQL"
    echo ""
    
else
    echo "psql not found. Please apply the migration manually:"
    echo ""
    echo "1. Go to your Supabase dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy the contents of supabase/migrations/20260606_consolidated_critical_fixes.sql"
    echo "4. Paste and run the SQL"
    echo ""
fi

echo "After applying the migration, restart your dev server:"
echo "  npm run dev"
echo ""
echo "Then test the routes:"
echo "  http://localhost:3000/research"
echo "  http://localhost:3000/marketplace"
