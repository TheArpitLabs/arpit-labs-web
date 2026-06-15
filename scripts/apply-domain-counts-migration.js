// Script to add missing count columns to engineering_domains table
// Run with: node scripts/apply-domain-counts-migration.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

async function executeSQLViaManagementAPI(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey
    },
    body: JSON.stringify({ query: sql })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }
  
  return await response.json();
}

async function applyMigration() {
  console.log('🚀 Adding count columns to engineering_domains table');
  console.log('===========================================');

  try {
    // First, add the columns using Management API
    const alterSQL = `
      ALTER TABLE engineering_domains 
      ADD COLUMN IF NOT EXISTS total_projects integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_research_papers integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_datasets integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_contributors integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_learning_resources integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_hackathons integer DEFAULT 0
    `;

    console.log('Adding count columns via Management API...');
    await executeSQLViaManagementAPI(alterSQL);
    console.log('✓ Added count columns to engineering_domains table');

    // Get all domains
    const { data: domains, error: domainsError } = await supabase
      .from('engineering_domains')
      .select('id, name, slug');

    if (domainsError) throw domainsError;

    console.log(`Found ${domains.length} domains`);

    // Update counts for each domain
    for (const domain of domains) {
      const { count: projectCount, error: projectError } = await supabase
        .from('content_domain_mapping')
        .select('*', { count: 'exact', head: true })
        .eq('content_type', 'project')
        .eq('domain_id', domain.id);

      if (projectError) {
        console.error('Error counting projects for', domain.slug, ':', projectError);
      } else {
        const { error: updateError } = await supabase
          .from('engineering_domains')
          .update({ total_projects: projectCount || 0 })
          .eq('id', domain.id);

        if (updateError) {
          console.error('Error updating project count for', domain.slug, ':', updateError);
        } else {
          console.log(`✓ Updated ${domain.name} with ${projectCount || 0} projects`);
        }
      }
    }

    console.log('✅ Migration applied successfully');
    console.log('');
    console.log('Domain counts have been updated. Projects should now be visible.');

  } catch (error) {
    console.error('Error applying migration:', error.message);
    console.log('\n⚠️  Migration failed.');
    console.log('Please apply the migration manually using:');
    console.log('  1. Supabase Dashboard: SQL Editor');
    console.log('  2. Navigate to: https://app.supabase.com/project/' + projectRef + '/sql/new');
    console.log('  3. Paste the contents of: supabase/migrations/20260615_add_domain_counts_columns.sql');
    console.log('  4. Click "Run" to execute');
    process.exit(1);
  }
}

applyMigration();
