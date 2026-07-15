import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseCatalog } from '../src/domain/chroma';

export function validateCatalogFile(path: string): { records: number; imageReferences: number } {
  const catalog = parseCatalog(JSON.parse(readFileSync(path, 'utf8')));
  const imageReferences = new Set(catalog.flatMap((item) => Object.values(item.images)));
  return { records: catalog.length, imageReferences: imageReferences.size };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = validateCatalogFile(resolve(process.cwd(), 'data/prestige-chromas.json'));
  console.log(`Validated ${result.records} chromas and ${result.imageReferences} remote image references.`);
}
