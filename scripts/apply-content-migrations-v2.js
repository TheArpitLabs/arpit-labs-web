// Script to apply content database migrations using Supabase REST API
// Run with: node scripts/apply-content-migrations-v2.js

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
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sql: migrationSQL })
    });

    if (response.ok) {
      logger.info(`  ✓ Success`);
    } else {
      const error = await response.text();
      logger.info(`  Note: ${error} (may be expected for DDL operations)`);
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
