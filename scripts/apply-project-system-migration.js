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
  console.error('Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('Applying Universal Project System migration...');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260708_phase2b_universal_project_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('Migration SQL loaded successfully');
  console.log('Please apply this migration manually in the Supabase SQL Editor:');
  console.log('');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Create a new query');
  console.log('4. Paste the contents of:');
  console.log(`   ${migrationPath}`);
  console.log('5. Run the query');
  console.log('');
  console.log('Alternatively, use the Supabase CLI:');
  console.log('  supabase db push');
  console.log('');
  
  // For now, let's just verify the connection
  const { data, error } = await supabase.from('projects').select('count').single();
  
  if (error) {
    console.error('Error connecting to database:', error.message);
  } else {
    console.log('✓ Database connection successful');
    console.log('✓ Projects table exists');
  }
}

applyMigration().catch(console.error);
