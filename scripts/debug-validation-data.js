require('dotenv').config({
  path: '.env.local'
});

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugValidationData() {
  logger.info('🔍 Debugging validation data mapping...\n');

  // Fetch first 10 GitHub repositories
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      title,
      github_stars,
      repository_topics,
      github_owner,
      github_url,
      stars,
      forks,
      contributors_count,
      last_commit_at,
      github_repository_id
    `)
    .not('github_url', 'is', null)
    .limit(10);

  // Also check if any repositories have stars > 0
  const { data: starredRepos, error: starError } = await supabase
    .from('projects')
    .select('title, github_stars, github_url')
    .gt('github_stars', 0)
    .limit(5);

  if (!starError && starredRepos && starredRepos.length > 0) {
    logger.info('🌟 Repositories with stars > 0:\n');
    for (const repo of starredRepos) {
      logger.info(`   - ${repo.title}: ${repo.github_stars} stars`);
      logger.info(`     URL: ${repo.github_url}`);
    }
    logger.info('\n───────────────────────────────────────────────────────────────\n');
  } else {
    logger.info('⚠️  No repositories found with github_stars > 0\n');
    logger.info('───────────────────────────────────────────────────────────────\n');
  }

  logger.info('📊 First 10 GitHub repositories:\n');
  for (const project of projects) {
    logger.info(`   - ${project.title}`);
    logger.info(`     Stars: ${project.github_stars} (also stars field: ${project.stars})`);
    logger.info(`     Topics: ${project.repository_topics?.length || 0} topics`);
    logger.info(`     Owner: ${project.github_owner}`);
    logger.info(`     Forks: ${project.forks}`);
    logger.info(`     Contributors: ${project.contributors_count}`);
    logger.info(`     Last commit: ${project.last_commit_at}`);
    logger.info(`     GitHub URL: ${project.github_url}`);
    logger.info(`     Repo ID: ${project.github_repository_id}`);
    logger.info('');
  }

  logger.info('───────────────────────────────────────────────────────────────\n');

  if (error) {
    logger.error('❌ Error fetching projects:', error);
    process.exit(1);
  }

  logger.info(`📊 Found ${projects.length} GitHub repositories\n`);
  logger.info('═══════════════════════════════════════════════════════════════════\n');

  for (const project of projects) {
    logger.info(`📦 Repository: ${project.title}`);
    logger.info(`   GitHub URL: ${project.github_url}`);
    logger.info(`   ⭐ Stars: ${project.github_stars || 0}`);
    logger.info(`   🏷️  Topics: ${project.repository_topics ? project.repository_topics.length : 0} topics`);
    logger.info(`   👤 Owner: ${project.github_owner || 'missing'}`);
    
    if (project.repository_topics && project.repository_topics.length > 0) {
      logger.info(`   📋 Topic List: ${project.repository_topics.slice(0, 5).join(', ')}${project.repository_topics.length > 5 ? '...' : ''}`);
    }
    
    logger.info('');
    logger.info('───────────────────────────────────────────────────────────────\n');
  }

  // Summary
  const withStars = projects.filter(p => p.github_stars > 0).length;
  const withTopics = projects.filter(p => p.repository_topics && p.repository_topics.length > 0).length;
  const withOwner = projects.filter(p => p.github_owner).length;

  logger.info('📈 Summary:');
  logger.info(`   Repositories with stars > 0: ${withStars}/${projects.length}`);
  logger.info(`   Repositories with topics: ${withTopics}/${projects.length}`);
  logger.info(`   Repositories with owner: ${withOwner}/${projects.length}`);
  logger.info('');
  
  // Search for specific repositories mentioned in the bug report
  logger.info('🎯 Searching for specific repositories from bug report...\n');
  const searchTerms = ['Grafana', 'Home Assistant', 'Transformers', 'Excalidraw', 'Prophet'];
  
  for (const searchTerm of searchTerms) {
    const { data: searchResults, error: searchError } = await supabase
      .from('projects')
      .select('title, github_stars, repository_topics, github_owner, github_url')
      .ilike('title', `%${searchTerm}%`)
      .limit(3);
    
    if (!searchError && searchResults && searchResults.length > 0) {
      logger.info(`🔍 "${searchTerm}" search results:`);
      for (const result of searchResults) {
        logger.info(`   - ${result.title}`);
        logger.info(`     ⭐ Stars: ${result.github_stars || 0}`);
        logger.info(`     🏷️  Topics: ${result.repository_topics ? result.repository_topics.length : 0}`);
        logger.info(`     👤 Owner: ${result.github_owner || 'missing'}`);
      }
      logger.info('');
    } else {
      logger.info(`⚠️  "${searchTerm}": Not found in database`);
      logger.info('');
    }
  }
}

debugValidationData()
  .then(() => {
    logger.info('\n✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('\n❌ Error:', error);
    process.exit(1);
  });