import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseCatalog, imageUrl } from '../src/domain/chroma';

const base = (process.env.SMOKE_BASE_URL || 'https://chromaart.lol').replace(/\/$/, '');
const request = async (url: string) => { const response = await fetch(url, { redirect: 'follow' }); if (!response.ok) throw new Error(`Smoke request failed ${response.status}: ${url}`); return response; };
const catalog = parseCatalog(JSON.parse(await readFile(resolve('data/prestige-chromas.json'), 'utf8')));
if (!catalog.length) throw new Error('Production catalog is empty; refusing to approve a blank release');
await request(`${base}/`);
const newest = catalog.find((item) => item.isNew);
const existing = catalog.find((item) => !item.isNew);
if (!newest || !existing) throw new Error('Smoke checks require at least one new and one existing chroma');
await request(`${base}/chromas/${newest.slug}/`);
await request(`${base}/chromas/${existing.slug}/`);
for (const path of Object.values(newest.images)) await request(imageUrl(path));
for (const path of ['/api/chromas', '/data/prestige-chromas.json', '/api/export', '/chromas.json']) { const response = await fetch(`${base}${path}`); if (response.status !== 404) throw new Error(`Sensitive path must return 404: ${path} returned ${response.status}`); }
console.log('Production smoke checks passed.');
