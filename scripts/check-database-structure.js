// Script to check current database structure
// Run with: node scripts/check-database-structure.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 Checking Database Structure');
  console.log('===========================================');

  try {
    // Check if engineering_domains table exists
    console.log('\n1. Checking engineering_domains table...');
    const { data: domainsCheck, error: domainsError } = await supabase
      .from('engineering_domains')
      .select('id')
      .limit(1);

    if (domainsError) {
      console.log('❌ engineering_domains table does not exist:', domainsError.message);
    } else {
      console.log('✅ engineering_domains table exists');
      const { data: domains, error: listError } = await supabase
        .from('engineering_domains')
        .select('*');
      if (!listError) {
        console.log('   Domains:', domains.map(d => d.name).join(', '));
      }
    }

    // Check if projects table exists and its structure
    console.log('\n2. Checking projects table structure...');
    const { data: projectsCheck, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);

    if (projectsError) {
      console.log('❌ projects table does not exist:', projectsError.message);
    } else {
      console.log('✅ projects table exists');
      console.log('   Sample columns:', Object.keys(projectsCheck[0] || {}).join(', '));
      
      // Check for domain-related columns
      const sampleProject = projectsCheck[0];
      if (sampleProject) {
        console.log('\n   Domain-related columns:');
        console.log('   - domain_id:', sampleProject.domain_id ? '✅' : '❌');
        console.log('   - subdomain_id:', sampleProject.subdomain_id ? '✅' : '❌');
        console.log('   - domain:', sampleProject.domain ? '✅' : '❌');
        console.log('   - category:', sampleProject.category ? '✅' : '❌');
      }
    }

    // Count existing projects
    console.log('\n3. Counting existing projects...');
    const { count: projectCount, error: countError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Could not count projects:', countError.message);
    } else {
      console.log(`✅ Total projects: ${projectCount}`);
    }

  } catch (error) {
    console.error('Error checking database structure:', error);
  }
}

checkDatabaseStructure();
