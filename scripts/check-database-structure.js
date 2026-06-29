// Script to check current database structure
// Run with: node scripts/check-database-structure.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  logger.info('🔍 Checking Database Structure');
  logger.info('===========================================');

  try {
    // Check if engineering_domains table exists
    logger.info('\n1. Checking engineering_domains table...');
    const { data: domainsCheck, error: domainsError } = await supabase
      .from('engineering_domains')
      .select('id')
      .limit(1);

    if (domainsError) {
      logger.info('❌ engineering_domains table does not exist:', domainsError.message);
    } else {
      logger.info('✅ engineering_domains table exists');
      const { data: domains, error: listError } = await supabase
        .from('engineering_domains')
        .select('*');
      if (!listError) {
        logger.info('   Domains:', domains.map(d => d.name).join(', '));
      }
    }

    // Check if projects table exists and its structure
    logger.info('\n2. Checking projects table structure...');
    const { data: projectsCheck, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);

    if (projectsError) {
      logger.info('❌ projects table does not exist:', projectsError.message);
    } else {
      logger.info('✅ projects table exists');
      logger.info('   Sample columns:', Object.keys(projectsCheck[0] || {}).join(', '));
      
      // Check for domain-related columns
      const sampleProject = projectsCheck[0];
      if (sampleProject) {
        logger.info('\n   Domain-related columns:');
        logger.info('   - domain_id:', sampleProject.domain_id ? '✅' : '❌');
        logger.info('   - subdomain_id:', sampleProject.subdomain_id ? '✅' : '❌');
        logger.info('   - domain:', sampleProject.domain ? '✅' : '❌');
        logger.info('   - category:', sampleProject.category ? '✅' : '❌');
      }
    }

    // Count existing projects
    logger.info('\n3. Counting existing projects...');
    const { count: projectCount, error: countError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      logger.info('❌ Could not count projects:', countError.message);
    } else {
      logger.info(`✅ Total projects: ${projectCount}`);
    }

  } catch (error) {
    logger.error('Error checking database structure:', error);
  }
}

checkDatabaseStructure();
