import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateCatalogFile } from './validate-data';

const roots: string[] = [];
const record = {
  id: 1,
  skinId: 101,
  instanceId: 'abc',
  nameZh: '至臻赛娜',
  nameEn: 'Prestige Senna',
  heroId: 'senna',
  heroNameZh: '赛娜',
  heroNameEn: 'Senna',
  sourceSkinId: 1001,
  skinSets: [],
  universes: [],
  skinNameZh: '赛娜',
  skinNameEn: 'Senna',
  categoryId: 'prestige',
  categoryName: '至臻',
  tagId: 'mythic',
  gameVer: '26.13',
  isNew: true,
  rank: 1,
  images: {
    large: 'assets/chromas/abc/site3.jpg',
    small: 'assets/chromas/abc/site4.jpg',
    medium: 'assets/chromas/abc/site5.jpg',
    tag: 'assets/tags/x-mythic.png',
  },
};

afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

function writeCatalog(value: unknown): string {
  const root = mkdtempSync(join(tmpdir(), 'chroma-validate-'));
  roots.push(root);
  const path = join(root, 'catalog.json');
  writeFileSync(path, JSON.stringify(value));
  return path;
}

describe('catalog validator', () => {
  it('validates a catalog without requiring a local assets directory', () => {
    expect(validateCatalogFile(writeCatalog([record]))).toEqual({
      records: 1,
      imageReferences: 4,
    });
  });

  it('rejects invalid JSON', () => {
    const path = writeCatalog([]);
    writeFileSync(path, '{invalid');
    expect(() => validateCatalogFile(path)).toThrow();
  });

  it('rejects invalid schema and duplicate catalog identities', () => {
    expect(() => validateCatalogFile(writeCatalog([{ ...record, skinId: 0 }]))).toThrow(/skinId/i);
    expect(() => validateCatalogFile(writeCatalog([record, { ...record, id: 2 }]))).toThrow(/instanceId/i);
  });
});
