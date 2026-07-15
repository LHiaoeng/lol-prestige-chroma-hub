import { execFileSync } from 'node:child_process';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const run = (args: string[]) => execFileSync(pnpm, ['exec', 'wrangler', ...args], { stdio: 'inherit' });

console.log('Creating Cloudflare resources when they do not already exist…');
try { run(['d1', 'create', 'lol-prestige-chroma-hub-db']); } catch { console.warn('D1 may already exist. Check `pnpm wrangler d1 list`.'); }
try { run(['r2', 'bucket', 'create', 'lol-prestige-chroma-hub-images']); } catch { console.warn('R2 bucket may already exist. Check `pnpm wrangler r2 bucket list`.'); }
console.log('Copy the D1 database_id into wrangler.jsonc, apply migrations, configure custom domains, and add GitHub Secrets as described in README.md.');
