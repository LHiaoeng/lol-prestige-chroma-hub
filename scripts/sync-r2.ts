import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

export function planR2Sync(local: Record<string, string>, remote: Record<string, string>) {
  const upload = Object.keys(local).filter((key) => local[key] !== remote[key]).sort();
  const skip = Object.keys(local).filter((key) => local[key] === remote[key]).sort();
  const remove = Object.keys(remote).filter((key) => !(key in local)).sort();
  return { upload, skip, remove };
}

async function filesUnder(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? filesUnder(join(root, entry.name)) : [join(root, entry.name)]))).flat();
}

export async function hashAssets(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!existsSync(root)) return result;
  for (const file of await filesUnder(root)) result[relative(root, file).replaceAll('\\', '/')] = createHash('sha256').update(await readFile(file)).digest('hex');
  return result;
}

async function cli(): Promise<void> {
  const bucket = process.env.R2_BUCKET || 'lol-prestige-chroma-hub-images';
  const assetRoot = resolve('assets');
  const local = await hashAssets(assetRoot);
  const temp = await mkdtemp(join(tmpdir(), 'r2-sync-'));
  let remote: Record<string, string> = {};
  try {
    const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    for (const key of Object.keys(local)) {
      const remoteFile = join(temp, createHash('sha256').update(key).digest('hex'));
      try {
        execFileSync(pnpm, ['exec','wrangler','r2','object','get',`${bucket}/${key}`,'--file',remoteFile], { stdio: 'ignore' });
        remote[key] = createHash('sha256').update(await readFile(remoteFile)).digest('hex');
      } catch {}
    }
    const plan = planR2Sync(local, remote);
    for (const key of plan.upload) {
      const type = extname(key) === '.png' ? 'image/png' : 'image/jpeg';
      execFileSync(pnpm, ['exec','wrangler','r2','object','put',`${bucket}/${key}`,'--file',join(assetRoot, key),'--content-type',type,'--cache-control','public, max-age=31536000, immutable'], { stdio: 'inherit' });
    }
    console.log(JSON.stringify(plan));
  } finally { await rm(temp, { recursive: true, force: true }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) cli().catch((error) => { console.error(error); process.exitCode = 1; });
