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
  logger.info('🔍 Checking discovery logs and GitHub imported projects...\n');

  // Check discovery_runs table
  const { data: discoveryRuns, error: runsError } = await supabase
    .from('discovery_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (runsError) {
    logger.error('❌ Error fetching discovery runs:', runsError);
  } else if (discoveryRuns && discoveryRuns.length > 0) {
    logger.info('📊 Recent Discovery Runs:\n');
    for (const run of discoveryRuns) {
      logger.info(`   - Run ID: ${run.id}`);
      logger.info(`     Status: ${run.status}`);
      logger.info(`     Categories: ${run.categories_processed?.join(', ') || 'None'}`);
      logger.info(`     Fetched: ${run.total_fetched}`);
      logger.info(`     Inserted: ${run.total_inserted}`);
      logger.info(`     Skipped: ${run.total_skipped}`);
      logger.info(`     Failed: ${run.total_failed}`);
      logger.info(`     Created: ${run.created_at}`);
      logger.info('');
    }
  } else {
    logger.info('⚠️  No discovery runs found\n');
  }

  logger.info('───────────────────────────────────────────────────────────────\n');

  // Check for projects that have GitHub repository ID (indicates GitHub import)
  const { data: githubProjects, error: githubError } = await supabase
    .from('projects')
    .select('title, github_url, github_stars, repository_topics, github_repository_id, github_owner, forks, contributors_count, last_commit_at')
    .not('github_repository_id', 'is', null)
    .limit(10);

  if (githubError) {
    logger.error('❌ Error fetching GitHub projects:', githubError);
  } else if (githubProjects && githubProjects.length > 0) {
    logger.info('📊 Projects with GitHub Repository ID (likely imported via discovery):\n');
    for (const project of githubProjects) {
      logger.info(`   - ${project.title}`);
      logger.info(`     URL: ${project.github_url}`);
      logger.info(`     Stars: ${project.github_stars}`);
      logger.info(`     Topics: ${project.repository_topics?.length || 0} topics`);
      logger.info(`     Owner: ${project.github_owner}`);
      logger.info(`     Forks: ${project.forks}`);
      logger.info(`     Contributors: ${project.contributors_count}`);
      logger.info(`     Last commit: ${project.last_commit_at}`);
      logger.info(`     Repo ID: ${project.github_repository_id}`);
      logger.info('');
    }
  } else {
    logger.info('⚠️  No projects found with GitHub repository ID\n');
  }

  logger.info('───────────────────────────────────────────────────────────────\n');

  // Count total projects
  const { count: totalProjects, error: countError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    logger.info(`📈 Total projects in database: ${totalProjects}`);
  }

  // Count projects with GitHub metadata
  const { count: projectsWithMetadata, error: metadataError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .not('github_repository_id', 'is', null);

  if (!metadataError) {
    logger.info(`📈 Projects with GitHub metadata: ${projectsWithMetadata}`);
  }

  // Count projects without GitHub metadata but with GitHub URL
  const { count: projectsWithoutMetadata, error: noMetadataError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .not('github_url', 'is', null)
    .is('github_repository_id', null);

  if (!noMetadataError) {
    logger.info(`📈 Projects with GitHub URL but no metadata: ${projectsWithoutMetadata}`);
  }
}

checkDiscoveryLogs().catch(console.error);
