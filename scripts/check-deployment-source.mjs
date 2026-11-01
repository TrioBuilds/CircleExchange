import { execFileSync } from 'node:child_process';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
try {
  if (git('branch', '--show-current') !== 'main') throw new Error('Deploy only from main after the pull request is merged.');
  if (git('status', '--porcelain')) throw new Error('Deployment requires a clean working tree.');
  if (process.env.GITHUB_ACTIONS === 'true' && git('rev-parse', 'HEAD') !== process.env.GITHUB_SHA) throw new Error('Main advanced since this workflow was tested. A newer run will deploy it.');
  git('fetch', 'origin', 'main');
  if (git('rev-parse', 'HEAD') !== git('rev-parse', 'origin/main')) throw new Error('Local main must match origin/main. Run git pull --ff-only.');
  console.log('Deployment source verified: clean main matches origin/main.');
} catch (error) {
  console.error(`Deployment blocked: ${error.message}`);
  process.exit(1);
}
