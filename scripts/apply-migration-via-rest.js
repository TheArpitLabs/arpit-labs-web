// Script to apply Universal Project System migration via REST API
// Run with: node scripts/apply-migration-via-rest.js

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function applyMigrationViaREST() {
  console.log('Applying Universal Project System migration via REST API...');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260708_phase2b_universal_project_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('Migration SQL loaded. Executing via REST API...');
  console.log('');

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
      console.log('Note: exec_sql function may not be available');
      console.log('Error:', error);
      console.log('');
      console.log('Please apply the migration manually in the Supabase SQL Editor:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Navigate to SQL Editor');
      console.log('4. Create a new query');
      console.log('5. Paste the contents of: ' + migrationPath);
      console.log('6. Run the query');
      return;
    }

    const result = await response.json();
    console.log('✓ Migration applied successfully');
    console.log('Result:', result);
  } catch (error) {
    console.error('Error applying migration:', error.message);
    console.log('');
    console.log('Please apply the migration manually in the Supabase SQL Editor:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Create a new query');
    console.log('5. Paste the contents of: ' + migrationPath);
    console.log('6. Run the query');
  }
}

applyMigrationViaREST().catch(console.error);
