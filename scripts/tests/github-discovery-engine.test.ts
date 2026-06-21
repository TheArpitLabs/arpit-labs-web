import assert from "node:assert/strict";
import {
  buildGitHubProjectTags,
  classifyGitHubRepository,
  createGitHubProjectInsertPayload,
  createGitHubRepositorySearchQuery,
  getGitHubProjectDuplicateKeys,
  getGitHubRepositoryRejectionReason,
  normalizeGitHubDiscoveryConfig,
  type DiscoveredProject,
} from "../../src/lib/project-discovery/github-discovery-core";

const config = normalizeGitHubDiscoveryConfig({
  categories: ["Artificial Intelligence"],
  maxResultsPerCategory: 250,
  minStars: 1,
  minForks: 0,
  page: 0,
  limit: 500,
  enabled: true,
});

assert.equal(config.minStars, 50, "normalization enforces the production 50-star floor");
assert.equal(config.limit, 100, "normalization caps GitHub per-page queries at 100");
assert.equal(config.page, 1, "normalization clamps page to one or greater");

const searchQuery = createGitHubRepositorySearchQuery("computer vision", config);
assert.match(searchQuery, /computer vision/);
assert.match(searchQuery, /stars:>50/);
assert.match(searchQuery, /is:public/);
assert.match(searchQuery, /archived:false/);
assert.match(searchQuery, /fork:false/);

assert.equal(
  getGitHubRepositoryRejectionReason({
    private: false,
    archived: false,
    disabled: false,
    description: "Real repository",
    stargazers_count: 51,
    html_url: "https://github.com/tensorflow/tensorflow",
  }, 50),
  null,
  "valid repositories pass validation"
);

assert.equal(
  getGitHubRepositoryRejectionReason({
    private: false,
    archived: false,
    disabled: false,
    description: "Real repository",
    stargazers_count: 50,
    html_url: "https://github.com/octocat/Hello-World",
  }, 50),
  "stars <= 50",
  "repositories must have more than 50 stars"
);

assert.equal(
  getGitHubRepositoryRejectionReason({
    private: false,
    archived: true,
    disabled: false,
    description: "Archived repository",
    stargazers_count: 999,
    html_url: "https://github.com/ros/ros",
  }, 50),
  "repository is archived",
  "archived repositories are rejected"
);

assert.equal(
  classifyGitHubRepository({
    name: "yolo-opencv-tracker",
    full_name: "vision/yolo-opencv-tracker",
    description: "Computer vision object detection with YOLO and OpenCV",
    language: "Python",
    topics: ["computer-vision", "object-detection", "opencv"],
  }, ["Python"], "Artificial Intelligence"),
  "Computer Vision",
  "classification uses repository text, topics, and language"
);

const tags = buildGitHubProjectTags("Machine Learning", ["mlops", "python"], ["Python", "python"]);
assert.deepEqual(tags, ["Machine Learning", "mlops", "python", "Python"], "tags are deduplicated without fake values");

const discovered: DiscoveredProject = {
  title: "real-repo",
  slug: "real-repo",
  description: "A real GitHub repository",
  category: "Machine Learning",
  tags: ["Machine Learning", "Python"],
  github_url: "https://github.com/owner/real-repo",
  homepage: "https://real-repo.dev",
  stars: 1234,
  forks: 321,
  language: "Python",
  languages: ["Python", "TypeScript"],
  topics: ["machine-learning", "mlops"],
  owner: "owner",
  owner_avatar_url: "https://avatars.githubusercontent.com/u/1",
  full_name: "owner/real-repo",
  repo_created_at: "2024-01-01T00:00:00Z",
  repo_updated_at: "2026-01-01T00:00:00Z",
  license: "MIT",
};

assert.deepEqual(
  getGitHubProjectDuplicateKeys(discovered),
  { github_url: "https://github.com/owner/real-repo", slug: "real-repo" },
  "duplicate detection uses github_url and slug"
);

const payload = createGitHubProjectInsertPayload(discovered);
assert.equal(payload.title, "real-repo");
assert.equal(payload.description, "A real GitHub repository");
assert.equal(payload.github_url, "https://github.com/owner/real-repo");
assert.equal(payload.language, "Python");
assert.equal(payload.github_stars, 1234);
assert.equal(payload.forks, 321);
assert.deepEqual(payload.tags, ["Machine Learning", "Python"]);
assert.equal(payload.published, false, "discovered projects are not auto-published");
assert.equal(payload.featured, false, "discovered projects are not auto-featured");
assert.equal(payload.owner_id, null, "discovered projects are not assigned to a user account");

console.log("GitHub discovery engine tests passed");
