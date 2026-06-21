require('dotenv').config({
  path: '.env.local'
});

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDiscoveryLogs() {
  console.log('🔍 Checking discovery logs and GitHub imported projects...\n');

  // Check discovery_runs table
  const { data: discoveryRuns, error: runsError } = await supabase
    .from('discovery_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (runsError) {
    console.error('❌ Error fetching discovery runs:', runsError);
  } else if (discoveryRuns && discoveryRuns.length > 0) {
    console.log('📊 Recent Discovery Runs:\n');
    for (const run of discoveryRuns) {
      console.log(`   - Run ID: ${run.id}`);
      console.log(`     Status: ${run.status}`);
      console.log(`     Categories: ${run.categories_processed?.join(', ') || 'None'}`);
      console.log(`     Fetched: ${run.total_fetched}`);
      console.log(`     Inserted: ${run.total_inserted}`);
      console.log(`     Skipped: ${run.total_skipped}`);
      console.log(`     Failed: ${run.total_failed}`);
      console.log(`     Created: ${run.created_at}`);
      console.log('');
    }
  } else {
    console.log('⚠️  No discovery runs found\n');
  }

  console.log('───────────────────────────────────────────────────────────────\n');

  // Check for projects that have GitHub repository ID (indicates GitHub import)
  const { data: githubProjects, error: githubError } = await supabase
    .from('projects')
    .select('title, github_url, github_stars, repository_topics, github_repository_id, github_owner, forks, contributors_count, last_commit_at')
    .not('github_repository_id', 'is', null)
    .limit(10);

  if (githubError) {
    console.error('❌ Error fetching GitHub projects:', githubError);
  } else if (githubProjects && githubProjects.length > 0) {
    console.log('📊 Projects with GitHub Repository ID (likely imported via discovery):\n');
    for (const project of githubProjects) {
      console.log(`   - ${project.title}`);
      console.log(`     URL: ${project.github_url}`);
      console.log(`     Stars: ${project.github_stars}`);
      console.log(`     Topics: ${project.repository_topics?.length || 0} topics`);
      console.log(`     Owner: ${project.github_owner}`);
      console.log(`     Forks: ${project.forks}`);
      console.log(`     Contributors: ${project.contributors_count}`);
      console.log(`     Last commit: ${project.last_commit_at}`);
      console.log(`     Repo ID: ${project.github_repository_id}`);
      console.log('');
    }
  } else {
    console.log('⚠️  No projects found with GitHub repository ID\n');
  }

  console.log('───────────────────────────────────────────────────────────────\n');

  // Count total projects
  const { count: totalProjects, error: countError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`📈 Total projects in database: ${totalProjects}`);
  }

  // Count projects with GitHub metadata
  const { count: projectsWithMetadata, error: metadataError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .not('github_repository_id', 'is', null);

  if (!metadataError) {
    console.log(`📈 Projects with GitHub metadata: ${projectsWithMetadata}`);
  }

  // Count projects without GitHub metadata but with GitHub URL
  const { count: projectsWithoutMetadata, error: noMetadataError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .not('github_url', 'is', null)
    .is('github_repository_id', null);

  if (!noMetadataError) {
    console.log(`📈 Projects with GitHub URL but no metadata: ${projectsWithoutMetadata}`);
  }
}

checkDiscoveryLogs().catch(console.error);
