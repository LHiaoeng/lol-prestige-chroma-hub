import { copyFile, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseCatalog, sourceImageUrl, type ChromaSource, type ImageKind } from '../src/domain/chroma';

type ImportRecord = Omit<ChromaSource, 'images'> & { images?: ChromaSource['images']; tagImageUrl?: string };
export interface ImportOptions {
  root: string;
  input: unknown;
  fetcher?: typeof fetch;
  refresh?: boolean;
  dryRun?: boolean;
}
export interface ImportResult { records: number; downloaded: number; skipped: number; dryRun: boolean; added: string[]; changed: string[]; unchanged: string[]; anomalies: string[] }

export function validateImage(bytes: Uint8Array, contentType: string | null, extension: 'jpg' | 'png'): void {
  const expected = extension === 'jpg' ? 'image/jpeg' : 'image/png';
  if (!contentType?.toLowerCase().split(';')[0].trim().startsWith(expected)) throw new Error(`Invalid Content-Type: expected ${expected}`);
  const valid = extension === 'jpg'
    ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (!valid) throw new Error(`Invalid ${extension.toUpperCase()} signature`);
  if (bytes.byteLength < 16 || bytes.byteLength > 20 * 1024 * 1024) throw new Error('Invalid image size');
}

function tagRepositoryPath(item: ImportRecord): string {
  if (item.images?.tag) return item.images.tag;
  const sourceUrl = item.tagImageUrl?.trim();
  if (!sourceUrl) return `assets/tags/x-${item.tagId}.png`;
  const filename = new URL(sourceUrl.startsWith('//') ? `https:${sourceUrl}` : sourceUrl).pathname.split('/').pop();
  if (!filename || !/^[A-Za-z0-9_-]{1,128}\.png$/.test(filename)) throw new Error('Tag image URL must end with a safe PNG filename');
  return `assets/tags/${filename}`;
}

function normalizedRecord(item: ImportRecord): ChromaSource {
  return {
    ...item,
    images: {
      large: `assets/chromas/${item.instanceId}/site3.jpg`,
      small: `assets/chromas/${item.instanceId}/site4.jpg`,
      medium: `assets/chromas/${item.instanceId}/site5.jpg`,
      tag: tagRepositoryPath(item),
    },
  };
}

async function download(fetcher: typeof fetch, url: string, extension: 'jpg' | 'png'): Promise<Uint8Array> {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Image download failed (${response.status}): ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  validateImage(bytes, response.headers.get('content-type'), extension);
  return bytes;
}

async function validExisting(path: string, extension: 'jpg' | 'png'): Promise<boolean> {
  try {
    const bytes = new Uint8Array(await readFile(path));
    validateImage(bytes, extension === 'jpg' ? 'image/jpeg' : 'image/png', extension);
    return true;
  } catch { return false; }
}

async function installStage(root: string, stage: string): Promise<void> {
  const assetTarget = join(root, 'assets');
  const dataTarget = join(root, 'data', 'prestige-chromas.json');
  const backup = join(root, '.tmp', `backup-${Date.now()}`);
  await mkdir(backup, { recursive: true });
  const hadAssets = existsSync(assetTarget);
  const hadData = existsSync(dataTarget);
  let assetsBackedUp = false;
  let dataBackedUp = false;
  let assetsInstalled = false;
  let dataInstalled = false;
  try {
    if (hadAssets) { await rename(assetTarget, join(backup, 'assets')); assetsBackedUp = true; }
    if (hadData) { await rename(dataTarget, join(backup, 'prestige-chromas.json')); dataBackedUp = true; }
    await mkdir(dirname(dataTarget), { recursive: true });
    await rename(join(stage, 'assets'), assetTarget); assetsInstalled = true;
    await rename(join(stage, 'prestige-chromas.json'), dataTarget); dataInstalled = true;
    await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (assetsInstalled) await rm(assetTarget, { recursive: true, force: true });
    if (dataInstalled) await rm(dataTarget, { force: true });
    if (assetsBackedUp) await rename(join(backup, 'assets'), assetTarget);
    if (dataBackedUp) await rename(join(backup, 'prestige-chromas.json'), dataTarget);
    throw error;
  }
}

export async function importData(options: ImportOptions): Promise<ImportResult> {
  if (!Array.isArray(options.input)) throw new Error('Input JSON must be an array');
  const items = options.input.map((item) => item as ImportRecord);
  const catalog = parseCatalog(items.map(normalizedRecord));
  const root = resolve(options.root);
  let previous: ChromaSource[] = [];
  try { previous = parseCatalog(JSON.parse(await readFile(join(root, 'data', 'prestige-chromas.json'), 'utf8'))); } catch {}
  const byId = new Map(previous.map((item) => [item.instanceId, item]));
  const added = catalog.filter((item) => !byId.has(item.instanceId)).map((item) => item.instanceId);
  const changed = catalog.filter((item) => byId.has(item.instanceId) && JSON.stringify(byId.get(item.instanceId)) !== JSON.stringify(item)).map((item) => item.instanceId);
  const unchanged = catalog.filter((item) => byId.has(item.instanceId) && !changed.includes(item.instanceId)).map((item) => item.instanceId);
  if (options.dryRun) return { records: catalog.length, downloaded: 0, skipped: 0, dryRun: true, added, changed, unchanged, anomalies: [] };
  const stage = join(root, '.tmp', `import-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const fetcher = options.fetcher ?? fetch;
  let downloaded = 0;
  let skipped = 0;
  await mkdir(join(stage, 'assets'), { recursive: true });
  const jobs: Array<{ path: string; existing: string; url: string; ext: 'jpg' | 'png' }> = [];
  for (const item of items) {
    const kinds: Array<[ImageKind, string, 'jpg']> = [['large', 'site3.jpg', 'jpg'], ['small', 'site4.jpg', 'jpg'], ['medium', 'site5.jpg', 'jpg']];
    for (const [kind, filename, ext] of kinds) jobs.push({ path: join(stage, 'assets', 'chromas', item.instanceId, filename), existing: join(root, 'assets', 'chromas', item.instanceId, filename), url: sourceImageUrl(kind, item.instanceId), ext });
  }
  const tags = new Map<string, string>();
  for (const item of items) {
    const path = tagRepositoryPath(item);
    const url = item.tagImageUrl || sourceImageUrl('tag', item.tagId);
    const existingUrl = tags.get(path);
    if (existingUrl && existingUrl !== url) throw new Error(`Different tag image URLs resolve to ${path}`);
    tags.set(path, url);
  }
  for (const [path, url] of tags) jobs.push({ path: join(stage, path), existing: join(root, path), url, ext: 'png' });
  try {
    for (const job of jobs) {
      await mkdir(dirname(job.path), { recursive: true });
      if (!options.refresh && await validExisting(job.existing, job.ext)) { await copyFile(job.existing, job.path); skipped++; continue; }
      await writeFile(job.path, await download(fetcher, job.url, job.ext));
      downloaded++;
    }
    await writeFile(join(stage, 'prestige-chromas.json'), `${JSON.stringify(catalog.map(({ slug: _slug, ...item }) => item), null, 2)}\n`);
    await installStage(root, stage);
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
  return { records: catalog.length, downloaded, skipped, dryRun: false, added, changed, unchanged, anomalies: [] };
}

async function cli(): Promise<void> {
  const args = process.argv.slice(2);
  const value = (name: string) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
  const inputPath = value('--input');
  if (!inputPath) throw new Error('Usage: pnpm data:import --input <file> [--refresh] [--dry-run]');
  const input = JSON.parse(await readFile(resolve(inputPath), 'utf8'));
  const result = await importData({ root: process.cwd(), input, refresh: args.includes('--refresh'), dryRun: args.includes('--dry-run') });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) cli().catch((error) => { console.error(error); process.exitCode = 1; });
