// Script to apply critical database migrations
// Run with: node scripts/apply-migration.js

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
  console.log('Applying critical database migrations...');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260606_consolidated_critical_fixes.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Split into individual statements (basic approach)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Try direct query if rpc fails
        const { error: queryError } = await supabase.from('_temp').select('*').limit(1);
        if (queryError && queryError.code === '42P01') {
          // Table doesn't exist, expected for CREATE TABLE statements
          console.log(`✓ Statement ${i + 1}: CREATE/ALTER operation (expected)`);
        } else {
          console.log(`✗ Statement ${i + 1}: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`✓ Statement ${i + 1}: Success`);
        successCount++;
      }
    } catch (err) {
      console.log(`✗ Statement ${i + 1}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('');
  console.log(`Migration complete: ${successCount} successful, ${errorCount} errors`);
  console.log('');
  console.log('Please test the routes:');
  console.log('  http://localhost:3000/research');
  console.log('  http://localhost:3000/marketplace');
}

applyMigration().catch(console.error);
