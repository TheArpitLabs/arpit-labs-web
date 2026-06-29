// Script to apply Universal Project System migration
// Run with: node scripts/apply-project-system-migration.js

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

async function applyMigration() {
  logger.info('Applying Universal Project System migration...');
  logger.info(`Supabase URL: ${supabaseUrl}`);
  logger.info('');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260708_phase2b_universal_project_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  logger.info('Migration SQL loaded successfully');
  logger.info('Please apply this migration manually in the Supabase SQL Editor:');
  logger.info('');
  logger.info('1. Go to your Supabase project dashboard');
  logger.info('2. Navigate to SQL Editor');
  logger.info('3. Create a new query');
  logger.info('4. Paste the contents of:');
  logger.info(`   ${migrationPath}`);
  logger.info('5. Run the query');
  logger.info('');
  logger.info('Alternatively, use the Supabase CLI:');
  logger.info('  supabase db push');
  logger.info('');
  
  // For now, let's just verify the connection
  const { data, error } = await supabase.from('projects').select('count').single();
  
  if (error) {
    logger.error('Error connecting to database:', error.message);
  } else {
    logger.info('✓ Database connection successful');
    logger.info('✓ Projects table exists');
  }
}

applyMigration().catch(console.error);
