// Script to apply engineering domain ecosystem migration using Supabase Management API
// Run with: node scripts/apply-engineering-migration-v2.js

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

// Extract project reference from URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

async function executeSQLViaManagementAPI(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey
    },
    body: JSON.stringify({ query: sql })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }
  
  return await response.json();
}

async function applyMigration() {
  logger.info('🚀 Applying Engineering Domain Ecosystem Migration via Management API');
  logger.info('===========================================');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260615_engineering_domain_ecosystem.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    logger.info('Executing migration SQL...');
    const result = await executeSQLViaManagementAPI(migrationSQL);
    logger.info('✅ Migration applied successfully:', result);

  } catch (error) {
    logger.error('Error applying migration:', error.message);
    logger.info('\n⚠️  Management API approach failed.');
    logger.info('Please apply the migration manually using:');
    logger.info('  1. Supabase Dashboard: SQL Editor');
    logger.info('  2. Navigate to: https://app.supabase.com/project/' + projectRef + '/sql/new');
    logger.info('  3. Paste the contents of: supabase/migrations/20260615_engineering_domain_ecosystem.sql');
    logger.info('  4. Click "Run" to execute');
    process.exit(1);
  }
}

applyMigration();
