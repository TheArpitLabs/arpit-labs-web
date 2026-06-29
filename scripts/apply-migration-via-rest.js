// Script to apply Universal Project System migration via REST API
// Run with: node scripts/apply-migration-via-rest.js

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Error: Missing Supabase credentials in .env.local');
  logger.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function applyMigrationViaREST() {
  logger.info('Applying Universal Project System migration via REST API...');
  logger.info(`Supabase URL: ${supabaseUrl}`);
  logger.info('');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260708_phase2b_universal_project_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  logger.info('Migration SQL loaded. Executing via REST API...');
  logger.info('');

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ sql: migrationSQL }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.info('Note: exec_sql function may not be available');
      logger.info('Error:', error);
      logger.info('');
      logger.info('Please apply the migration manually in the Supabase SQL Editor:');
      logger.info('1. Go to https://supabase.com/dashboard');
      logger.info('2. Select your project');
      logger.info('3. Navigate to SQL Editor');
      logger.info('4. Create a new query');
      logger.info('5. Paste the contents of: ' + migrationPath);
      logger.info('6. Run the query');
      return;
    }

    const result = await response.json();
    logger.info('✓ Migration applied successfully');
    logger.info('Result:', result);
  } catch (error) {
    logger.error('Error applying migration:', error.message);
    logger.info('');
    logger.info('Please apply the migration manually in the Supabase SQL Editor:');
    logger.info('1. Go to https://supabase.com/dashboard');
    logger.info('2. Select your project');
    logger.info('3. Navigate to SQL Editor');
    logger.info('4. Create a new query');
    logger.info('5. Paste the contents of: ' + migrationPath);
    logger.info('6. Run the query');
  }
}

applyMigrationViaREST().catch(console.error);
