import { execFileSync } from 'node:child_process';
for (const args of [
  ['scripts/check-deployment-source.mjs'],
  ['scripts/check-production.mjs'],
  ['node_modules/typescript/bin/tsc', '-p', 'frontend/tsconfig.json'],
  ['node_modules/vite/bin/vite.js', 'build', '--config', 'frontend/vite.config.ts'],
]) {
  execFileSync(process.execPath, args, { stdio: 'inherit' });
}
