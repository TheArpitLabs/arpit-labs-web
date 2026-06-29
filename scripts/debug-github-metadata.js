/**
 * Debug GitHub Metadata Script
 * 
 * Tests GitHub API responses to identify why stars and topics are not being populated.
 * Fetches raw GitHub API responses and compares them to mapped database payloads.
 */

require("dotenv").config({
  path: '.env.local'
});
const { Octokit } = require("@octokit/rest");

// Test repositories
const TEST_REPOS = [
  { owner: "facebook", repo: "prophet" },
  { owner: "vercel", repo: "next.js" },
  { owner: "tensorflow", repo: "tensorflow" },
  { owner: "microsoft", repo: "vscode" },
  { owner: "facebook", repo: "react" },
];

async function debugGitHubMetadata() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    logger.error("GITHUB_TOKEN environment variable is not set");
    process.exit(1);
  }

  logger.info("=".repeat(80));
  logger.info("GITHUB METADATA DEBUG SCRIPT");
  logger.info("=".repeat(80));
  logger.info(`Token: ${token ? "Loaded" : "Missing"}`);
  logger.info("");

  const octokit = new Octokit({
    auth: token,
    userAgent: "Arpit-Labs-Debug-Script/1.0",
  });

  for (const { owner, repo } of TEST_REPOS) {
    logger.info("-".repeat(80));
    logger.info(`Testing: ${owner}/${repo}`);
    logger.info("-".repeat(80));

    try {
      // Test 1: Get repository details (standard REST API)
      logger.info("\n1. Standard REST API (octokit.repos.get):");
      const { data: repoData } = await octokit.repos.get({ owner, repo });
      
      logger.info({
        name: repoData.name,
        full_name: repoData.full_name,
        stargazers_count: repoData.stargazers_count,
        forks_count: repoData.forks_count,
        topics: repoData.topics,
        topics_length: repoData.topics?.length || 0,
        owner: repoData.owner?.login,
        pushed_at: repoData.pushed_at,
        created_at: repoData.created_at,
        updated_at: repoData.updated_at,
      });

      // Test 2: Get languages
      logger.info("\n2. Languages:");
      const { data: languages } = await octokit.repos.listLanguages({ owner, repo });
      const languageNames = Object.keys(languages);
      logger.info({ languages: languageNames, count: languageNames.length });

      // Test 3: Get contributors
      logger.info("\n3. Contributors:");
      const { data: contributors } = await octokit.repos.listContributors({ owner, repo, per_page: 100 });
      logger.info({ count: contributors.length });

      // Test 4: Simulate the mapped payload (as createGitHubProjectInsertPayload would create)
      logger.info("\n4. Simulated Database Payload:");
      const simulatedPayload = {
        github_stars: repoData.stargazers_count || 0,
        repository_topics: repoData.topics || [],
        forks: repoData.forks_count || 0,
        contributors_count: contributors.length,
        last_commit_at: repoData.pushed_at,
        github_owner: repoData.owner?.login,
        github_repo_name: repoData.name,
        github_repository_id: repoData.id,
      };
      
      logger.info(simulatedPayload);

      // Test 5: Check if topics array is empty
      logger.info("\n5. Topics Analysis:");
      if (!repoData.topics || repoData.topics.length === 0) {
        logger.warn("⚠️  WARNING: topics array is empty or undefined!");
        logger.warn("   This suggests the GitHub API is not returning topics.");
        logger.warn("   The REST API may require special accept headers for topics.");
      } else {
        logger.info(`✓ Topics found: ${repoData.topics.join(", ")}`);
      }

      // Test 6: Check if stars are zero
      logger.info("\n6. Stars Analysis:");
      if (repoData.stargazers_count === 0) {
        logger.warn("⚠️  WARNING: stargazers_count is 0!");
        logger.warn("   This repository should have many stars.");
      } else {
        logger.info(`✓ Stars: ${repoData.stargazers_count.toLocaleString()}`);
      }

    } catch (error) {
      logger.error(`Error fetching ${owner}/${repo}:`, error.message);
    }

    logger.info("\n");
  }

  logger.info("=".repeat(80));
  logger.info("DEBUG COMPLETE");
  logger.info("=".repeat(80));
}

debugGitHubMetadata().catch(console.error);
