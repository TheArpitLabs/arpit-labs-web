require('dotenv').config({ path: '.env.local' });

const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const repos = [
  ['youssefHosni', 'Customer-Churn-Prediction'],
  ['Resilient-Space-Systems', 'snake-robot'],
  ['elastic', 'suricata'],
  ['TheThingsNetwork', 'lorawan-app-server'],
  ['khursheed8', 'Smart-Agriculture-IoT'],
  ['prowler', 'prowler'],
  ['Stability-AI', 'stablediffusion'],
  ['aws-samples', 'aws-iot-predictive-maintenance'],
];

(async () => {
  logger.info('\nChecking failed repositories...\n');

  for (const [owner, repo] of repos) {
    try {
      const { data } = await octokit.repos.get({
        owner,
        repo,
      });

      logger.info({
        repository: `${owner}/${repo}`,
        stars: data.stargazers_count,
        topics: data.topics?.length || 0,
        status: 'FOUND',
      });
    } catch (err) {
      logger.info({
        repository: `${owner}/${repo}`,
        status: 'ERROR',
        code: err.status,
      });
    }
  }
})();