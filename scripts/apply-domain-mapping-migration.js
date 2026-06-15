// Script to apply content domain mapping migration using Supabase Management API
// Run with: node scripts/apply-domain-mapping-migration.js

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env.local file.');
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
  console.log('🚀 Applying Content Domain Mapping Migration via Management API');
  console.log('===========================================');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260615_populate_content_domain_mapping.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration SQL...');
    const result = await executeSQLViaManagementAPI(migrationSQL);
    console.log('✅ Migration applied successfully:', result);
    console.log('');
    console.log('Projects should now be visible on engineering domain landing pages.');

  } catch (error) {
    console.error('Error applying migration:', error.message);
    console.log('\n⚠️  Management API approach failed.');
    console.log('Please apply the migration manually using:');
    console.log('  1. Supabase Dashboard: SQL Editor');
    console.log('  2. Navigate to: https://app.supabase.com/project/' + projectRef + '/sql/new');
    console.log('  3. Paste the contents of: supabase/migrations/20260615_populate_content_domain_mapping.sql');
    console.log('  4. Click "Run" to execute');
    process.exit(1);
  }
}

applyMigration();
