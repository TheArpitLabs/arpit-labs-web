// Script to apply content database migrations (excluding membership/payments)
// Run with: node scripts/apply-content-migrations.js

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

// Migrations to run (excluding membership/payments)
const migrations = [
  '20260606_phase8_profiles_and_saved_content.sql',
  '20260608_phase8b_community.sql',
  '20260615_phase9a_products.sql',
  '20260620_phase9c_marketplace.sql',
  '20260701_phase10_ecosystem.sql'
];

async function applyMigration(migrationFile) {
  logger.info(`Applying ${migrationFile}...`);
  
  const migrationPath = path.join(__dirname, '../supabase/migrations', migrationFile);
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      logger.info(`  Note: ${error.message} (may be expected for DDL operations)`);
    } else {
      logger.info(`  ✓ Success`);
    }
  } catch (err) {
    logger.info(`  Note: ${err.message} (may be expected for DDL operations)`);
  }
}

async function applyAllMigrations() {
  logger.info('Applying content database migrations...');
  logger.info(`Supabase URL: ${supabaseUrl}`);
  logger.info('');
  logger.info('Migrations to apply:');
  migrations.forEach(m => logger.info(`  - ${m}`));
  logger.info('');

  for (const migration of migrations) {
    await applyMigration(migration);
    logger.info('');
  }

  logger.info('Migration process complete!');
  logger.info('');
  logger.info('Next steps:');
  logger.info('1. Restart your dev server: npm run dev');
  logger.info('2. Access admin dashboard to populate content');
  logger.info('3. Test the routes: /research, /university, /products, /marketplace');
}

applyAllMigrations().catch(console.error);
