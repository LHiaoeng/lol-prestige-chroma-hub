import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { auditBuild } from './audit-build';
import { createReleaseId, createReleaseSql, sqlString } from './prepare-release';
import { planR2Sync } from './sync-r2';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

describe('release tooling', () => {
  it('creates deterministic content-addressed release IDs and escaped SQL', () => {
    expect(createReleaseId([{ b: 2, a: 1 }])).toBe(createReleaseId([{ a: 1, b: 2 }]));
    expect(sqlString("Kai'Sa")).toBe("'Kai''Sa'");
    const sql = createReleaseSql([{ slug: 'kai-sa', skinId: 1, instanceId: 'x', nameZh: "卡莎'", nameEn: 'KaiSa', heroId: 'kaisa', heroNameZh: '卡莎', heroNameEn: 'KaiSa', skinNameZh: '卡莎', skinNameEn: 'KaiSa', categoryId: 'p', categoryName: '至臻', gameVer: '26.13', isNew: true, rank: 1, images: { large: 'assets/chromas/x/site3.jpg', medium: 'assets/chromas/x/site5.jpg', small: 'assets/chromas/x/site4.jpg', tag: 'assets/tags/t.png' } }], 'r1');
    expect(sql).not.toContain('BEGIN TRANSACTION');
    expect(sql).toContain("'卡莎'''");
    expect(sql).toContain("'chromas/x/site3.jpg'");
    expect(sql).not.toContain("'releases/");
    expect(sql).not.toContain('COMMIT');
  });

  it('uploads new and changed hashes while skipping identical objects', () => {
    expect(planR2Sync(
      { 'chromas/a/site3.jpg': 'one', 'tags/b.png': 'two' },
      { 'chromas/a/site3.jpg': 'one', 'tags/b.png': 'old' },
    )).toEqual({ upload: ['tags/b.png'], skip: ['chromas/a/site3.jpg'], remove: [] });
  });

  it('rejects sensitive deployment artifacts', () => {
    const root = mkdtempSync(join(tmpdir(), 'audit-')); roots.push(root);
    mkdirSync(join(root, 'nested')); writeFileSync(join(root, 'index.html'), '<html></html>'); writeFileSync(join(root, '404.html'), '<html></html>');
    expect(() => auditBuild(root)).not.toThrow();
    writeFileSync(join(root, 'nested', 'prestige-chromas.json'), '[]');
    expect(() => auditBuild(root)).toThrow(/sensitive/i);
  });
});
