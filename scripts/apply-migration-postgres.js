// Script to apply Universal Project System migration using PostgreSQL
// Run with: node scripts/apply-migration-postgres.js

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

// Parse Supabase connection string
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Extract connection details from Supabase URL
// Format: https://lxbtuwltzljmnwxbygcl.supabase.co
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

// The service role key contains the database password
// We need to extract it and use it with the PostgreSQL connection string
// Connection string format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

// Try to extract password from service role key (it's base64 encoded JWT)
// For now, we'll use a different approach - use the connection string from environment if available

const connectionString = process.env.DATABASE_URL || 
  `postgresql://postgres.${projectRef}:${supabaseKey}@db.${projectRef}.supabase.co:5432/postgres`;

async function applyMigration() {
  console.log('Applying Universal Project System migration using PostgreSQL...');
  console.log('');

  const migrationPath = path.join(__dirname, '../supabase/migrations/20260708_phase2b_universal_project_system.sql');

  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Migration SQL loaded. Executing...');
    console.log('');

    const client = await pool.connect();
    
    try {
      await client.query(migrationSQL);
      console.log('✓ Migration applied successfully');
    } finally {
      client.release();
    }
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
  } finally {
    await pool.end();
  }
}

applyMigration().catch(console.error);
