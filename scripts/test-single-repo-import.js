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
  console.log('='.repeat(80));
  console.log('TESTING SINGLE REPOSITORY IMPORT');
  console.log('='.repeat(80));
  console.log(`Target: facebook/prophet`);
  console.log('');

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    userAgent: "Arpit-Labs-Test-Script/1.0",
  });

  try {
    // Fetch repository data
    console.log('1. Fetching repository data from GitHub...');
    const { data: repo } = await octokit.repos.get({ owner: 'facebook', repo: 'prophet' });
    console.log('✓ Repository data fetched');
    console.log(`  Stars: ${repo.stargazers_count}`);
    console.log(`  Topics: ${repo.topics?.length || 0} topics`);
    console.log(`  Owner: ${repo.owner?.login}`);
    console.log('');

    // Fetch languages
    console.log('2. Fetching languages...');
    const { data: languages } = await octokit.repos.listLanguages({ owner: 'facebook', repo: 'prophet' });
    const languageNames = Object.keys(languages);
    console.log(`✓ Languages: ${languageNames.join(', ')}`);
    console.log('');

    // Fetch contributors
    console.log('3. Fetching contributors...');
    const { data: contributors } = await octokit.repos.listContributors({ owner: 'facebook', repo: 'prophet', per_page: 100 });
    console.log(`✓ Contributors: ${contributors.length}`);
    console.log('');

    // Create payload
    console.log('4. Creating database payload...');
    const payload = createTestPayload(repo, languageNames, contributors);
    console.log('✓ Payload created:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    // Check if repository already exists
    console.log('5. Checking if repository exists in database...');
    const { data: existingRepo, error: checkError } = await supabase
      .from('projects')
      .select('id, title, github_stars, repository_topics')
      .eq('github_url', payload.github_url)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing repository:', checkError);
      return;
    }

    if (existingRepo) {
      console.log('⚠️  Repository already exists in database:');
      console.log(`  ID: ${existingRepo.id}`);
      console.log(`  Title: ${existingRepo.title}`);
      console.log(`  Current stars: ${existingRepo.github_stars}`);
      console.log(`  Current topics: ${existingRepo.repository_topics?.length || 0}`);
      
      // Update instead of insert
      console.log('');
      console.log('6. Updating existing repository...');
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
        console.error('❌ Error updating repository:', updateError);
      } else {
        console.log('✓ Repository updated successfully');
      }
    } else {
      console.log('✓ Repository does not exist, will insert new record');
      
      // Insert new record
      console.log('');
      console.log('6. Inserting new repository...');
      const { error: insertError } = await supabase
        .from('projects')
        .insert(payload);

      if (insertError) {
        console.error('❌ Error inserting repository:', insertError);
      } else {
        console.log('✓ Repository inserted successfully');
      }
    }

    // Verify the data
    console.log('');
    console.log('7. Verifying data in database...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('projects')
      .select('*')
      .eq('github_url', payload.github_url)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError);
    } else {
      console.log('✓ Data verification:');
      console.log(`  github_stars: ${verifyData.github_stars}`);
      console.log(`  repository_topics: ${verifyData.repository_topics?.length || 0} topics`);
      console.log(`  github_owner: ${verifyData.github_owner}`);
      console.log(`  github_repo_name: ${verifyData.github_repo_name}`);
      console.log(`  forks: ${verifyData.forks}`);
      console.log(`  contributors_count: ${verifyData.contributors_count}`);
      console.log(`  last_commit_at: ${verifyData.last_commit_at}`);
      console.log(`  github_repository_id: ${verifyData.github_repository_id}`);
    }

  } catch (error) {
    console.error('❌ Error during test import:', error);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
}

testSingleRepoImport().catch(console.error);
