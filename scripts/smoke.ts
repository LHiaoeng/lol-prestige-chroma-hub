import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseCatalog, imageUrl } from '../src/domain/chroma';

const base = (process.env.SMOKE_BASE_URL || 'https://chromaart.lol').replace(/\/$/, '');

type SmokeRequestOptions = { fetcher?: typeof fetch; timeoutMs?: number };

export async function requestExpectedStatus(
  url: string,
  expectedStatus: number,
  { fetcher = fetch, timeoutMs = 10_000 }: SmokeRequestOptions = {},
): Promise<Response> {
  const response = await fetcher(url, { redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
  if (response.status !== expectedStatus) throw new Error(`Smoke request expected ${expectedStatus}, received ${response.status}: ${url}`);
  return response;
}

export async function main(): Promise<void> {
  const catalog = parseCatalog(JSON.parse(await readFile(resolve('data/prestige-chromas.json'), 'utf8')));
  if (!catalog.length) throw new Error('Production catalog is empty; refusing to approve a blank release');
  await requestExpectedStatus(`${base}/`, 200);
  const newest = catalog.find((item) => item.isNew);
  const existing = catalog.find((item) => !item.isNew);
  if (!newest || !existing) throw new Error('Smoke checks require at least one new and one existing chroma');
  await requestExpectedStatus(`${base}/chromas/${newest.slug}/`, 200);
  await requestExpectedStatus(`${base}/chromas/${existing.slug}/`, 200);
  for (const path of Object.values(newest.images)) await requestExpectedStatus(imageUrl(path), 200);
  for (const path of ['/api/chromas', '/data/prestige-chromas.json', '/api/export', '/chromas.json']) await requestExpectedStatus(`${base}${path}`, 404);
  console.log('Production smoke checks passed.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
