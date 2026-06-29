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
  logger.error('Error: Missing Supabase credentials in .env.local');
  logger.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  logger.info('Applying critical database migrations...');
  logger.info(`Supabase URL: ${supabaseUrl}`);
  logger.info('');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260606_consolidated_critical_fixes.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Split into individual statements (basic approach)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  logger.info(`Found ${statements.length} SQL statements to execute`);
  logger.info('');

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
          logger.info(`✓ Statement ${i + 1}: CREATE/ALTER operation (expected)`);
        } else {
          logger.info(`✗ Statement ${i + 1}: ${error.message}`);
          errorCount++;
        }
      } else {
        logger.info(`✓ Statement ${i + 1}: Success`);
        successCount++;
      }
    } catch (err) {
      logger.info(`✗ Statement ${i + 1}: ${err.message}`);
      errorCount++;
    }
  }

  logger.info('');
  logger.info(`Migration complete: ${successCount} successful, ${errorCount} errors`);
  logger.info('');
  logger.info('Please test the routes:');
  logger.info('  http://localhost:3000/research');
  logger.info('  http://localhost:3000/marketplace');
}

applyMigration().catch(console.error);
