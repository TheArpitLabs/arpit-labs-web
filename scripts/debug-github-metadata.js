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
    console.error("GITHUB_TOKEN environment variable is not set");
    process.exit(1);
  }

  console.log("=".repeat(80));
  console.log("GITHUB METADATA DEBUG SCRIPT");
  console.log("=".repeat(80));
  console.log(`Token: ${token ? "Loaded" : "Missing"}`);
  console.log("");

  const octokit = new Octokit({
    auth: token,
    userAgent: "Arpit-Labs-Debug-Script/1.0",
  });

  for (const { owner, repo } of TEST_REPOS) {
    console.log("-".repeat(80));
    console.log(`Testing: ${owner}/${repo}`);
    console.log("-".repeat(80));

    try {
      // Test 1: Get repository details (standard REST API)
      console.log("\n1. Standard REST API (octokit.repos.get):");
      const { data: repoData } = await octokit.repos.get({ owner, repo });
      
      console.log({
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
      console.log("\n2. Languages:");
      const { data: languages } = await octokit.repos.listLanguages({ owner, repo });
      const languageNames = Object.keys(languages);
      console.log({ languages: languageNames, count: languageNames.length });

      // Test 3: Get contributors
      console.log("\n3. Contributors:");
      const { data: contributors } = await octokit.repos.listContributors({ owner, repo, per_page: 100 });
      console.log({ count: contributors.length });

      // Test 4: Simulate the mapped payload (as createGitHubProjectInsertPayload would create)
      console.log("\n4. Simulated Database Payload:");
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
      
      console.log(simulatedPayload);

      // Test 5: Check if topics array is empty
      console.log("\n5. Topics Analysis:");
      if (!repoData.topics || repoData.topics.length === 0) {
        console.warn("⚠️  WARNING: topics array is empty or undefined!");
        console.warn("   This suggests the GitHub API is not returning topics.");
        console.warn("   The REST API may require special accept headers for topics.");
      } else {
        console.log(`✓ Topics found: ${repoData.topics.join(", ")}`);
      }

      // Test 6: Check if stars are zero
      console.log("\n6. Stars Analysis:");
      if (repoData.stargazers_count === 0) {
        console.warn("⚠️  WARNING: stargazers_count is 0!");
        console.warn("   This repository should have many stars.");
      } else {
        console.log(`✓ Stars: ${repoData.stargazers_count.toLocaleString()}`);
      }

    } catch (error) {
      console.error(`Error fetching ${owner}/${repo}:`, error.message);
    }

    console.log("\n");
  }

  console.log("=".repeat(80));
  console.log("DEBUG COMPLETE");
  console.log("=".repeat(80));
}

debugGitHubMetadata().catch(console.error);
