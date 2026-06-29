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
  logger.error('Error: Missing Supabase credentials in .env.local');
  logger.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql) {
  // Use the PostgreSQL client directly via Supabase
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    // If exec_sql doesn't exist, we'll need to handle this differently
    logger.info('Note: exec_sql function not available, skipping direct execution');
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

async function applyMigration() {
  logger.info('Applying Universal Project System migration...');
  logger.info(`Supabase URL: ${supabaseUrl}`);
  logger.info('');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260708_phase2b_universal_project_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  logger.info('Migration SQL loaded. Attempting to apply...');
  logger.info('');
  
  // Since we can't execute arbitrary SQL easily via the client,
  // we'll verify the current state and provide instructions
  logger.info('Checking current database state...');
  
  // Check if new columns exist
  const { data: projectColumns, error: columnError } = await supabase
    .from('projects')
    .select('project_type, branch, domain, category, technologies, languages, frameworks, tools, owner_id, organization_id, status, featured, views_count, likes_count')
    .limit(1);
  
  if (columnError) {
    logger.info('✗ New columns not found in projects table');
    logger.info('  Error:', columnError.message);
    logger.info('');
    logger.info('Migration needs to be applied manually.');
    logger.info('');
    logger.info('Steps to apply migration:');
    logger.info('1. Go to your Supabase project dashboard: https://supabase.com/dashboard');
    logger.info('2. Navigate to SQL Editor');
    logger.info('3. Create a new query');
    logger.info('4. Paste the contents of: ' + migrationPath);
    logger.info('5. Run the query');
    logger.info('');
    logger.info('The migration will:');
    logger.info('- Add new columns to projects table');
    logger.info('- Create project_media, project_contributors, project_tags tables');
    logger.info('- Create indexes for performance');
    logger.info('- Set up RLS policies');
    logger.info('- Create storage buckets');
  } else {
    logger.info('✓ New columns already exist in projects table');
    logger.info('✓ Migration appears to be applied');
  }
  
  // Check if new tables exist
  const tables = ['project_media', 'project_contributors', 'project_tags'];
  
  for (const table of tables) {
    const { error: tableError } = await supabase.from(table).select('*').limit(1);
    if (tableError) {
      logger.info(`✗ Table ${table} does not exist or is not accessible`);
    } else {
      logger.info(`✓ Table ${table} exists`);
    }
  }
}

applyMigration().catch(console.error);
