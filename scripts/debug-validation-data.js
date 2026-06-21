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
  console.log('🔍 Debugging validation data mapping...\n');

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
    console.log('🌟 Repositories with stars > 0:\n');
    for (const repo of starredRepos) {
      console.log(`   - ${repo.title}: ${repo.github_stars} stars`);
      console.log(`     URL: ${repo.github_url}`);
    }
    console.log('\n───────────────────────────────────────────────────────────────\n');
  } else {
    console.log('⚠️  No repositories found with github_stars > 0\n');
    console.log('───────────────────────────────────────────────────────────────\n');
  }

  console.log('📊 First 10 GitHub repositories:\n');
  for (const project of projects) {
    console.log(`   - ${project.title}`);
    console.log(`     Stars: ${project.github_stars} (also stars field: ${project.stars})`);
    console.log(`     Topics: ${project.repository_topics?.length || 0} topics`);
    console.log(`     Owner: ${project.github_owner}`);
    console.log(`     Forks: ${project.forks}`);
    console.log(`     Contributors: ${project.contributors_count}`);
    console.log(`     Last commit: ${project.last_commit_at}`);
    console.log(`     GitHub URL: ${project.github_url}`);
    console.log(`     Repo ID: ${project.github_repository_id}`);
    console.log('');
  }

  console.log('───────────────────────────────────────────────────────────────\n');

  if (error) {
    console.error('❌ Error fetching projects:', error);
    process.exit(1);
  }

  console.log(`📊 Found ${projects.length} GitHub repositories\n`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  for (const project of projects) {
    console.log(`📦 Repository: ${project.title}`);
    console.log(`   GitHub URL: ${project.github_url}`);
    console.log(`   ⭐ Stars: ${project.github_stars || 0}`);
    console.log(`   🏷️  Topics: ${project.repository_topics ? project.repository_topics.length : 0} topics`);
    console.log(`   👤 Owner: ${project.github_owner || 'missing'}`);
    
    if (project.repository_topics && project.repository_topics.length > 0) {
      console.log(`   📋 Topic List: ${project.repository_topics.slice(0, 5).join(', ')}${project.repository_topics.length > 5 ? '...' : ''}`);
    }
    
    console.log('');
    console.log('───────────────────────────────────────────────────────────────\n');
  }

  // Summary
  const withStars = projects.filter(p => p.github_stars > 0).length;
  const withTopics = projects.filter(p => p.repository_topics && p.repository_topics.length > 0).length;
  const withOwner = projects.filter(p => p.github_owner).length;

  console.log('📈 Summary:');
  console.log(`   Repositories with stars > 0: ${withStars}/${projects.length}`);
  console.log(`   Repositories with topics: ${withTopics}/${projects.length}`);
  console.log(`   Repositories with owner: ${withOwner}/${projects.length}`);
  console.log('');
  
  // Search for specific repositories mentioned in the bug report
  console.log('🎯 Searching for specific repositories from bug report...\n');
  const searchTerms = ['Grafana', 'Home Assistant', 'Transformers', 'Excalidraw', 'Prophet'];
  
  for (const searchTerm of searchTerms) {
    const { data: searchResults, error: searchError } = await supabase
      .from('projects')
      .select('title, github_stars, repository_topics, github_owner, github_url')
      .ilike('title', `%${searchTerm}%`)
      .limit(3);
    
    if (!searchError && searchResults && searchResults.length > 0) {
      console.log(`🔍 "${searchTerm}" search results:`);
      for (const result of searchResults) {
        console.log(`   - ${result.title}`);
        console.log(`     ⭐ Stars: ${result.github_stars || 0}`);
        console.log(`     🏷️  Topics: ${result.repository_topics ? result.repository_topics.length : 0}`);
        console.log(`     👤 Owner: ${result.github_owner || 'missing'}`);
      }
      console.log('');
    } else {
      console.log(`⚠️  "${searchTerm}": Not found in database`);
      console.log('');
    }
  }
}

debugValidationData()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });