import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { importData, validateImage } from './import-data';

const roots: string[] = [];
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(40).fill(0), 0xff, 0xd9]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(40).fill(0)]);
const input = [{ id: 1, skinId: 101, instanceId: 'abc', nameZh: '至臻赛娜', nameEn: 'Prestige Senna', heroId: 'senna', heroNameZh: '赛娜', heroNameEn: 'Senna', skinNameZh: '赛娜', skinNameEn: 'Senna', categoryId: 'prestige', categoryName: '至臻', tagId: 'mythic', gameVer: '26.13', isNew: true, rank: 2 }];

afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

describe('data importer', () => {
  it('validates content type and real image signatures', () => {
    expect(() => validateImage(jpeg, 'image/jpeg', 'jpg')).not.toThrow();
    expect(() => validateImage(png, 'image/png', 'png')).not.toThrow();
    expect(() => validateImage(new Uint8Array([1, 2, 3]), 'image/jpeg', 'jpg')).toThrow(/signature/i);
    expect(() => validateImage(jpeg, 'text/html', 'jpg')).toThrow(/content-type/i);
  });

  it('downloads three chroma sizes and one deduplicated tag, then writes normalized data', async () => {
    const root = mkdtempSync(join(tmpdir(), 'chroma-import-')); roots.push(root);
    const fetcher = vi.fn(async (url: string) => new Response(url.endsWith('.png') ? png : jpeg, { headers: { 'content-type': url.endsWith('.png') ? 'image/png' : 'image/jpeg' } }));
    const result = await importData({ root, input: [...input, { ...input[0], id: 2, skinId: 102, instanceId: 'def', nameEn: 'Prestige Senna II' }], fetcher: fetcher as never });
    expect(result.downloaded).toBe(7);
    expect(fetcher).toHaveBeenCalledTimes(7);
    const catalog = JSON.parse(readFileSync(join(root, 'data/prestige-chromas.json'), 'utf8'));
    expect(catalog[0].images.medium).toBe('assets/chromas/abc/site5.jpg');
  });

  it('does not mutate production files during dry-run or failed downloads', async () => {
    const root = mkdtempSync(join(tmpdir(), 'chroma-import-')); roots.push(root);
    mkdirSync(join(root, 'data'), { recursive: true });
    writeFileSync(join(root, 'data/prestige-chromas.json'), '["original"]');
    const good = vi.fn(async (url: string) => new Response(url.endsWith('.png') ? png : jpeg, { headers: { 'content-type': url.endsWith('.png') ? 'image/png' : 'image/jpeg' } }));
    await importData({ root, input, fetcher: good as never, dryRun: true });
    expect(readFileSync(join(root, 'data/prestige-chromas.json'), 'utf8')).toBe('["original"]');
    const bad = vi.fn(async () => new Response('no', { status: 500 }));
    await expect(importData({ root, input, fetcher: bad as never })).rejects.toThrow(/download/i);
    expect(readFileSync(join(root, 'data/prestige-chromas.json'), 'utf8')).toBe('["original"]');
  });

  it('supports an empty catalog import', async () => {
    const root = mkdtempSync(join(tmpdir(), 'chroma-import-')); roots.push(root);
    await expect(importData({ root, input: [], fetcher: vi.fn() as never })).resolves.toMatchObject({ records: 0, downloaded: 0 });
    expect(JSON.parse(readFileSync(join(root, 'data/prestige-chromas.json'), 'utf8'))).toEqual([]);
  });

  it('accepts the final generated catalog as dry-run input', async () => {
    const root = mkdtempSync(join(tmpdir(), 'chroma-import-')); roots.push(root);
    const finalCatalog = [{
      ...input[0],
      images: {
        large: 'assets/chromas/abc/site3.jpg',
        small: 'assets/chromas/abc/site4.jpg',
        medium: 'assets/chromas/abc/site5.jpg',
        tag: 'assets/tags/mythic.png',
      },
    }];
    const fetcher = vi.fn();
    const result = await importData({ root, input: finalCatalog, fetcher: fetcher as never, dryRun: true });
    expect(result).toMatchObject({ records: 1, downloaded: 0, dryRun: true });
    expect(fetcher).not.toHaveBeenCalled();
    expect(finalCatalog[0].images.medium).toBe('assets/chromas/abc/site5.jpg');
  });
});
