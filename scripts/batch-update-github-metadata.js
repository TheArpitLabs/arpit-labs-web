require('dotenv').config({
  path: '.env.local'
});

const { Octokit } = require("@octokit/rest");
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Extract owner and repo from GitHub URL
function extractOwnerRepo(githubUrl) {
  const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

async function batchUpdateGitHubMetadata() {
  logger.info('='.repeat(80));
  logger.info('BATCH UPDATE GITHUB METADATA');
  logger.info('='.repeat(80));
  logger.info('');

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    userAgent: "Arpit-Labs-Batch-Update/1.0",
  });

  // Fetch all projects with GitHub URLs but no repository ID
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, title, github_url')
    .not('github_url', 'is', null)
    .is('github_repository_id', null);

  if (error) {
    logger.error('❌ Error fetching projects:', error);
    return;
  }

  logger.info(`Found ${projects.length} projects to update\n`);

  let successCount = 0;
  let failCount = 0;

  for (const project of projects) {
    try {
      logger.info(`Processing: ${project.title} (${project.github_url})`);
      
      const ownerRepo = extractOwnerRepo(project.github_url);
      if (!ownerRepo) {
        logger.info(`  ⚠️  Could not extract owner/repo from URL`);
        failCount++;
        continue;
      }

      // Fetch repository data from GitHub
      const { data: repo } = await octokit.repos.get(ownerRepo);
      
      // Fetch languages
      const { data: languages } = await octokit.repos.listLanguages(ownerRepo);
      const languageNames = Object.keys(languages);
      
      // Fetch contributors
      const { data: contributors } = await octokit.repos.listContributors({ 
        ...ownerRepo, 
        per_page: 100 
      }).catch(() => ({ data: [] }));

      // Update project with GitHub metadata
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          github_stars: repo.stargazers_count || 0,
          repository_topics: repo.topics || [],
          forks: repo.forks_count || 0,
          contributors_count: contributors.length,
          last_commit_at: repo.pushed_at,
          github_repository_id: repo.id,
          github_owner: repo.owner?.login || ownerRepo.owner,
          github_repo_name: repo.name,
        })
        .eq('id', project.id);

      if (updateError) {
        logger.info(`  ❌ Error updating: ${updateError.message}`);
        failCount++;
      } else {
        logger.info(`  ✓ Updated: stars=${repo.stargazers_count}, topics=${repo.topics?.length || 0}`);
        successCount++;
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      logger.info(`  ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  logger.info('');
  logger.info('='.repeat(80));
  logger.info('BATCH UPDATE COMPLETE');
  logger.info('='.repeat(80));
  logger.info(`Success: ${successCount}`);
  logger.info(`Failed: ${failCount}`);
  logger.info(`Total: ${projects.length}`);
}

batchUpdateGitHubMetadata().catch(console.error);
