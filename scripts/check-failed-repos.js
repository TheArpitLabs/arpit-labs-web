const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const repos = [
  ["youssefHosni", "Customer-Churn-Prediction"],
  ["Resilient-Space-Systems", "snake-robot"],
  ["elastic", "suricata"],
  ["TheThingsNetwork", "lorawan-app-server"],
  ["khursheed8", "Smart-Agriculture-IoT"],
  ["prowler", "prowler"],
  ["Stability-AI", "stablediffusion"],
  ["aws-samples", "aws-iot-predictive-maintenance"],
];

(async () => {
  for (const [owner, repo] of repos) {
    try {
      const { data } = await octokit.repos.get({ owner, repo });

      console.log({
        repo: `${owner}/${repo}`,
        stars: data.stargazers_count,
        topics: data.topics?.length || 0,
      });
    } catch (err) {
      console.log({
        repo: `${owner}/${repo}`,
        error: err.status,
      });
    }
  }
})();
