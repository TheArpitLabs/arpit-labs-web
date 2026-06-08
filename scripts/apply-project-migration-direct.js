// Script to apply Universal Project System migration directly
// Run with: node scripts/apply-project-migration-direct.js

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql) {
  // Use the PostgreSQL client directly via Supabase
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    // If exec_sql doesn't exist, we'll need to handle this differently
    console.log('Note: exec_sql function not available, skipping direct execution');
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

async function applyMigration() {
  console.log('Applying Universal Project System migration...');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260708_phase2b_universal_project_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('Migration SQL loaded. Attempting to apply...');
  console.log('');
  
  // Since we can't execute arbitrary SQL easily via the client,
  // we'll verify the current state and provide instructions
  console.log('Checking current database state...');
  
  // Check if new columns exist
  const { data: projectColumns, error: columnError } = await supabase
    .from('projects')
    .select('project_type, branch, domain, category, technologies, languages, frameworks, tools, owner_id, organization_id, status, featured, views_count, likes_count')
    .limit(1);
  
  if (columnError) {
    console.log('✗ New columns not found in projects table');
    console.log('  Error:', columnError.message);
    console.log('');
    console.log('Migration needs to be applied manually.');
    console.log('');
    console.log('Steps to apply migration:');
    console.log('1. Go to your Supabase project dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Paste the contents of: ' + migrationPath);
    console.log('5. Run the query');
    console.log('');
    console.log('The migration will:');
    console.log('- Add new columns to projects table');
    console.log('- Create project_media, project_contributors, project_tags tables');
    console.log('- Create indexes for performance');
    console.log('- Set up RLS policies');
    console.log('- Create storage buckets');
  } else {
    console.log('✓ New columns already exist in projects table');
    console.log('✓ Migration appears to be applied');
  }
  
  // Check if new tables exist
  const tables = ['project_media', 'project_contributors', 'project_tags'];
  
  for (const table of tables) {
    const { error: tableError } = await supabase.from(table).select('*').limit(1);
    if (tableError) {
      console.log(`✗ Table ${table} does not exist or is not accessible`);
    } else {
      console.log(`✓ Table ${table} exists`);
    }
  }
}

applyMigration().catch(console.error);
