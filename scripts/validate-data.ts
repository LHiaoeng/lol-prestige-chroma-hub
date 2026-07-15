import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseCatalog } from '../src/domain/chroma';

const root = process.cwd();
const catalog = parseCatalog(JSON.parse(readFileSync(resolve(root, 'data/prestige-chromas.json'), 'utf8')));
const referenced = new Set(catalog.flatMap((item) => Object.values(item.images)));
const missing = [...referenced].filter((file) => !existsSync(resolve(root, file)));
const assetsRoot = resolve(root, 'assets');
const actual: string[] = [];
const visit = (directory: string) => { if (!existsSync(directory)) return; for (const entry of readdirSync(directory)) { const path = join(directory, entry); if (statSync(path).isDirectory()) visit(path); else actual.push(relative(root, path).replaceAll('\\', '/')); } };
visit(assetsRoot);
const orphaned = actual.filter((file) => !referenced.has(file));
if (missing.length) throw new Error(`Missing referenced assets: ${missing.join(', ')}`);
if (orphaned.length) console.warn(`Orphaned assets (${orphaned.length}): ${orphaned.join(', ')}`);
console.log(`Validated ${catalog.length} chromas and ${referenced.size} referenced assets.`);
