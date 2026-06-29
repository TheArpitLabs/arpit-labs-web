// Script to check projects table schema
// Run with: node scripts/check-projects-schema.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectsSchema() {
  logger.info('🔍 Checking Projects Table Schema');
  logger.info('===========================================');

  try {
    // Get a sample project to see the columns
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1);

    if (error) {
      logger.error('Error fetching projects:', error);
      return;
    }

    if (projects && projects.length > 0) {
      logger.info('✅ Projects table exists');
      logger.info('\nAvailable columns:');
      const columns = Object.keys(projects[0]);
      columns.forEach(col => logger.info(`  - ${col}`));
      
      logger.info('\nSample data:');
      logger.info(JSON.stringify(projects[0], null, 2));
    } else {
      logger.info('⚠️  No projects found, table might be empty');
    }

  } catch (error) {
    logger.error('Error checking schema:', error);
  }
}

checkProjectsSchema();
