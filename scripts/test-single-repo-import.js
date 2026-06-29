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

// Import the mapping function (simplified version for testing)
function createTestPayload(repo, languages, contributors) {
  const [owner, repoName] = repo.full_name.split("/");
  
  return {
    title: repo.name,
    slug: repo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    description: repo.description || "",
    github_url: repo.html_url,
    github_stars: repo.stargazers_count || 0,
    repository_topics: repo.topics || [],
    forks: repo.forks_count || 0,
    contributors_count: contributors.length,
    last_commit_at: repo.pushed_at,
    github_repository_id: repo.id,
    github_owner: repo.owner?.login || owner,
    github_repo_name: repo.name,
  };
}

async function testSingleRepoImport() {
  logger.info('='.repeat(80));
  logger.info('TESTING SINGLE REPOSITORY IMPORT');
  logger.info('='.repeat(80));
  logger.info(`Target: facebook/prophet`);
  logger.info('');

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    userAgent: "Arpit-Labs-Test-Script/1.0",
  });

  try {
    // Fetch repository data
    logger.info('1. Fetching repository data from GitHub...');
    const { data: repo } = await octokit.repos.get({ owner: 'facebook', repo: 'prophet' });
    logger.info('✓ Repository data fetched');
    logger.info(`  Stars: ${repo.stargazers_count}`);
    logger.info(`  Topics: ${repo.topics?.length || 0} topics`);
    logger.info(`  Owner: ${repo.owner?.login}`);
    logger.info('');

    // Fetch languages
    logger.info('2. Fetching languages...');
    const { data: languages } = await octokit.repos.listLanguages({ owner: 'facebook', repo: 'prophet' });
    const languageNames = Object.keys(languages);
    logger.info(`✓ Languages: ${languageNames.join(', ')}`);
    logger.info('');

    // Fetch contributors
    logger.info('3. Fetching contributors...');
    const { data: contributors } = await octokit.repos.listContributors({ owner: 'facebook', repo: 'prophet', per_page: 100 });
    logger.info(`✓ Contributors: ${contributors.length}`);
    logger.info('');

    // Create payload
    logger.info('4. Creating database payload...');
    const payload = createTestPayload(repo, languageNames, contributors);
    logger.info('✓ Payload created:');
    logger.info(JSON.stringify(payload, null, 2));
    logger.info('');

    // Check if repository already exists
    logger.info('5. Checking if repository exists in database...');
    const { data: existingRepo, error: checkError } = await supabase
      .from('projects')
      .select('id, title, github_stars, repository_topics')
      .eq('github_url', payload.github_url)
      .maybeSingle();

    if (checkError) {
      logger.error('❌ Error checking existing repository:', checkError);
      return;
    }

    if (existingRepo) {
      logger.info('⚠️  Repository already exists in database:');
      logger.info(`  ID: ${existingRepo.id}`);
      logger.info(`  Title: ${existingRepo.title}`);
      logger.info(`  Current stars: ${existingRepo.github_stars}`);
      logger.info(`  Current topics: ${existingRepo.repository_topics?.length || 0}`);
      
      // Update instead of insert
      logger.info('');
      logger.info('6. Updating existing repository...');
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          github_stars: payload.github_stars,
          repository_topics: payload.repository_topics,
          forks: payload.forks,
          contributors_count: payload.contributors_count,
          last_commit_at: payload.last_commit_at,
          github_repository_id: payload.github_repository_id,
          github_owner: payload.github_owner,
          github_repo_name: payload.github_repo_name,
        })
        .eq('github_url', payload.github_url);

      if (updateError) {
        logger.error('❌ Error updating repository:', updateError);
      } else {
        logger.info('✓ Repository updated successfully');
      }
    } else {
      logger.info('✓ Repository does not exist, will insert new record');
      
      // Insert new record
      logger.info('');
      logger.info('6. Inserting new repository...');
      const { error: insertError } = await supabase
        .from('projects')
        .insert(payload);

      if (insertError) {
        logger.error('❌ Error inserting repository:', insertError);
      } else {
        logger.info('✓ Repository inserted successfully');
      }
    }

    // Verify the data
    logger.info('');
    logger.info('7. Verifying data in database...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('projects')
      .select('*')
      .eq('github_url', payload.github_url)
      .single();

    if (verifyError) {
      logger.error('❌ Error verifying data:', verifyError);
    } else {
      logger.info('✓ Data verification:');
      logger.info(`  github_stars: ${verifyData.github_stars}`);
      logger.info(`  repository_topics: ${verifyData.repository_topics?.length || 0} topics`);
      logger.info(`  github_owner: ${verifyData.github_owner}`);
      logger.info(`  github_repo_name: ${verifyData.github_repo_name}`);
      logger.info(`  forks: ${verifyData.forks}`);
      logger.info(`  contributors_count: ${verifyData.contributors_count}`);
      logger.info(`  last_commit_at: ${verifyData.last_commit_at}`);
      logger.info(`  github_repository_id: ${verifyData.github_repository_id}`);
    }

  } catch (error) {
    logger.error('❌ Error during test import:', error);
  }

  logger.info('');
  logger.info('='.repeat(80));
  logger.info('TEST COMPLETE');
  logger.info('='.repeat(80));
}

testSingleRepoImport().catch(console.error);
